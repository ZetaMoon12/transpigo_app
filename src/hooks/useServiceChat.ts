import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { env } from '@/config';
import { chatService, type ChatMessage } from '@/services/chat.service';
import type { ServiceRequestStatus } from '@/services/servicios.service';

interface UseServiceChatProps {
  requestId: number;
  /** JWT explícito (token de tracking) para la vista pública de seguimiento;
   * si se omite, usa la sesión de admin/conductor guardada en localStorage. */
  token?: string;
}

export interface TypingUser {
  name: string;
  senderType: 'CLIENT' | 'DRIVER' | 'ADMIN';
}

export function useServiceChat({ requestId, token: explicitToken }: UseServiceChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [canWrite, setCanWrite] = useState(true);
  const [serviceStatus, setServiceStatus] = useState<ServiceRequestStatus | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  // Rol propio del que ve el chat (ADMIN en el panel, CLIENT en la vista pública de
  // seguimiento) — decide qué burbujas se alinean a la derecha como "yo".
  const [mySenderType, setMySenderType] = useState<'CLIENT' | 'DRIVER' | 'ADMIN'>('ADMIN');

  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<{ [username: string]: ReturnType<typeof setTimeout> }>({});
  // Ref espejo de `mySenderType` para leer el valor vigente dentro de listeners
  // de socket registrados una sola vez (evita cierres obsoletos sin reconectar el socket).
  const mySenderTypeRef = useRef<'CLIENT' | 'DRIVER' | 'ADMIN'>('ADMIN');
  useEffect(() => {
    mySenderTypeRef.current = mySenderType;
  }, [mySenderType]);

  // Carga inicial del historial por REST
  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await chatService.getMessages(requestId, explicitToken);
      if (res.success && res.data) {
        setMessages(res.data.messages);
        setCanWrite(res.data.canWrite);
        setServiceStatus(res.data.serviceStatus);
        if (res.data.senderType) setMySenderType(res.data.senderType);

        // Marcar automáticamente como leídos los mensajes que falten por leer y que no sean propios
        const readFlag =
          res.data.senderType === 'DRIVER' ? 'readByDriver' : res.data.senderType === 'CLIENT' ? 'readByClient' : 'readByAdmin';
        const unreadIds = res.data.messages
          .filter((m) => !m[readFlag] && m.senderType !== res.data!.senderType)
          .map((m) => m.id);

        if (unreadIds.length > 0 && socketRef.current) {
          socketRef.current.emit('mark_read', { requestId, messageIds: unreadIds });
        }
      }
    } catch (error: any) {
      console.error('[ChatHook] Error loading history:', error);
      toast.error('No se pudo cargar el historial del chat');
    } finally {
      setIsLoading(false);
    }
  }, [requestId, explicitToken]);

  useEffect(() => {
    // 1. Obtener la URL del backend y remover /api si es necesario
    const wsUrl = env.API_BASE_URL.replace(/\/api$/, '');
    const token = explicitToken ?? localStorage.getItem('auth_token');

    if (!token) {
      toast.error('Sesión no válida para conectar al chat');
      setIsLoading(false);
      return;
    }

    // 2. Inicializar socket en el namespace /chat
    const socket = io(`${wsUrl}/chat`, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
    });

    socketRef.current = socket;

    // 3. Configurar listeners de eventos
    socket.on('connect', () => {
      setIsConnected(true);
      // Unirse a la sala del servicio
      socket.emit('join_service_chat', { requestId }, (ack: any) => {
        if (ack && ack.ok) {
          setCanWrite(ack.canWrite);
          if (ack.serviceStatus) {
            setServiceStatus(ack.serviceStatus);
          }
          if (ack.senderType) {
            setMySenderType(ack.senderType);
          }
          // Cargar historial una vez conectados para sincronizar
          loadHistory();
        }
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('new_message', (message: ChatMessage) => {
      setMessages((prev) => {
        // Evitar duplicados si por alguna razón llega dos veces
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });

      // Si el mensaje es recibido y no fuimos nosotros, marcar como leído
      if (message.senderType !== mySenderTypeRef.current) {
        socket.emit('mark_read', { requestId, messageIds: [message.id] });
      }

      // Remover al remitente de la lista de personas escribiendo
      if (message.senderName) {
        setTypingUsers((prev) => prev.filter((u) => u.name !== message.senderName));
        if (typingTimeoutRef.current[message.senderName]) {
          clearTimeout(typingTimeoutRef.current[message.senderName]);
          delete typingTimeoutRef.current[message.senderName];
        }
      }
    });

    socket.on('user_typing', (data: { senderType: any; name: string }) => {
      if (data.senderType === mySenderTypeRef.current) return; // Ignorar si somos nosotros

      setTypingUsers((prev) => {
        if (prev.some((u) => u.name === data.name)) return prev;
        return [...prev, { name: data.name, senderType: data.senderType }];
      });

      // Temporizador para quitar el "escribiendo" después de 4 segundos sin novedades
      if (typingTimeoutRef.current[data.name]) {
        clearTimeout(typingTimeoutRef.current[data.name]);
      }

      typingTimeoutRef.current[data.name] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.name !== data.name));
        delete typingTimeoutRef.current[data.name];
      }, 4000);
    });

    socket.on('messages_read', (data: { messageIds: string[]; readerType: string }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (data.messageIds.includes(msg.id)) {
            if (data.readerType === 'ADMIN') return { ...msg, readByAdmin: true };
            if (data.readerType === 'DRIVER') return { ...msg, readByDriver: true };
            if (data.readerType === 'CLIENT') return { ...msg, readByClient: true };
          }
          return msg;
        })
      );
    });

    socket.on('participant_joined', (data: { senderType: string; name: string }) => {
      // Opcional: mostrar notificación o log de presencia
      console.log(`[Chat] Se unió: ${data.name} (${data.senderType})`);
    });

    socket.on('participant_left', (data: { senderType: string; name: string }) => {
      console.log(`[Chat] Salió: ${data.name} (${data.senderType})`);
      setTypingUsers((prev) => prev.filter((u) => u.name !== data.name));
    });

    socket.on('chat_closed', (data: { requestId: number }) => {
      if (data.requestId === requestId) {
        setCanWrite(false);
        toast.info('El servicio ha finalizado y el chat ha sido cerrado para escritura.');
      }
    });

    socket.on('chat_error', (err: { code: string; message: string }) => {
      toast.error(err.message || 'Error en la comunicación del chat');
      if (err.code === 'RATE_LIMIT') {
        // Mensaje especial de spam
        console.warn('[Chat] Rate limit excedido');
      }
    });

    // 4. Limpieza al desmontar o cambiar de requestId
    return () => {
      socket.disconnect();
      // Limpiar timeouts de typing activos
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      typingTimeoutRef.current = {};
    };
  }, [requestId, explicitToken, loadHistory]);

  // Emitir evento de escritura (Throttled a 2 segundos)
  const lastTypingEmitRef = useRef<number>(0);
  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingEmitRef.current > 2000 && socketRef.current && isConnected) {
      socketRef.current.emit('typing', { requestId });
      lastTypingEmitRef.current = now;
    }
  }, [requestId, isConnected]);

  // Enviar mensaje de texto
  const sendMessage = useCallback(
    (messageText: string) => {
      if (!socketRef.current || !isConnected) {
        toast.error('No hay conexión activa con el servidor de chat');
        return false;
      }
      if (!messageText.trim()) return false;

      socketRef.current.emit('send_message', { requestId, message: messageText });
      return true;
    },
    [requestId, isConnected]
  );

  // Enviar imágenes/adjuntos por REST y notificar
  const sendAttachments = useCallback(
    async (files: File[], caption?: string) => {
      try {
        const res = await chatService.uploadAttachments(requestId, files, caption, explicitToken);
        return res.success;
      } catch (error: any) {
        toast.error(error.message || 'Error al enviar la(s) imagen(es)');
        return false;
      }
    },
    [requestId, explicitToken]
  );

  return {
    messages,
    isLoading,
    isConnected,
    canWrite,
    serviceStatus,
    typingUsers,
    mySenderType,
    sendMessage,
    sendAttachments,
    sendTyping,
  };
}
