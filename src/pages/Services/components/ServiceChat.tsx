import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Send,
  ArrowLeft,
  Check,
  CheckCheck,
  X,
  Eye,
  Loader2,
  Image as ImageIcon,
  AlertTriangle,
  Paperclip,
  CornerUpLeft,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useServiceChat } from '@/hooks/useServiceChat';
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from '@/components/ui/message-scroller';
import { env } from '@/config';
import { toast } from 'sonner';

interface ServiceChatProps {
  requestId: number;
  serviceCode: string;
  onBack: () => void;
  /** JWT de tracking — permite usar el chat desde la vista pública de seguimiento sin sesión. */
  token?: string;
  /** Texto del botón de volver ("Detalle" en el panel admin, "Cerrar" en la vista pública). */
  backLabel?: string;
}

export function ServiceChat({ requestId, serviceCode, onBack, token, backLabel = 'Detalle' }: ServiceChatProps) {
  const {
    messages,
    isLoading,
    isConnected,
    canWrite,
    typingUsers,
    mySenderType,
    sendMessage,
    sendAttachments,
    sendTyping,
  } = useServiceChat({ requestId, token });

  const [inputText, setInputText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Decodificador de entidades HTML para limpiar comillas y caracteres especiales
  const decodeHtmlEntities = (str: string) => {
    return str
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&#34;/g, '"');
  };

  // Parser para mensajes tipo respuesta de WhatsApp
  const parseReplyMessage = (text: string | null) => {
    if (!text) return { isReply: false, actualMessage: '' };
    const decodedText = decodeHtmlEntities(text);
    const match = decodedText.match(/^\[Reply to ([^:]+): "([\s\S]*?)"\]\s*([\s\S]*)$/);
    if (match) {
      return {
        isReply: true,
        replySender: match[1],
        replyText: match[2],
        actualMessage: match[3],
      };
    }
    return { isReply: false, actualMessage: decodedText };
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Generar URLs de vista previa para las imágenes locales seleccionadas
  useEffect(() => {
    return () => {
      // Limpiar URLs creadas al desmontar
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter((f) => !validTypes.includes(f.type));

    if (invalidFiles.length > 0) {
      toast.error('Solo se permiten imágenes JPG, PNG o WebP');
      return;
    }

    // Validar tamaño (máximo CHAT_MAX_IMAGE_SIZE_MB por archivo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter((f) => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast.error('Cada imagen debe pesar máximo 5MB');
      return;
    }

    // Máximo 3 imágenes en total
    const totalCount = selectedFiles.length + files.length;
    if (totalCount > 3) {
      toast.error('Puedes seleccionar hasta 3 imágenes');
      return;
    }

    const newPreviews = files.map((f) => URL.createObjectURL(f));

    setSelectedFiles((prev) => [...prev, ...files]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeSelectedFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;

    const trimmedText = inputText.trim();

    if (selectedFiles.length > 0) {
      // Enviar archivos por REST (multipart)
      setIsUploading(true);
      try {
        let finalCaption = trimmedText;
        if (replyingTo) {
          const replyTextPreview = replyingTo.message
            ? replyingTo.message.substring(0, 60).replace(/"/g, "'")
            : (replyingTo.attachments && replyingTo.attachments.length > 0 ? '📷 Foto' : '');
          finalCaption = `[Reply to ${replyingTo.senderName}: "${replyTextPreview}"] ${trimmedText}`;
        }
        const success = await sendAttachments(selectedFiles, finalCaption || undefined);
        if (success) {
          setInputText('');
          setSelectedFiles([]);
          setFilePreviews([]);
          setReplyingTo(null);
          toast.success('Imágenes enviadas con éxito');
        }
      } catch (err) {
        console.error('Error uploading:', err);
      } finally {
        setIsUploading(false);
      }
    } else if (trimmedText) {
      // Enviar texto simple por WebSocket
      let messageToSend = trimmedText;
      if (replyingTo) {
        const replyTextPreview = replyingTo.message
          ? replyingTo.message.substring(0, 60).replace(/"/g, "'")
          : (replyingTo.attachments && replyingTo.attachments.length > 0 ? '📷 Foto' : '');
        messageToSend = `[Reply to ${replyingTo.senderName}: "${replyTextPreview}"] ${trimmedText}`;
      }
      const sent = sendMessage(messageToSend);
      if (sent) {
        setInputText('');
        setReplyingTo(null);
      }
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  // Formato de hora amigable (HH:MM)
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  // Formato de fecha para separadores de día
  const formatDateGroup = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return '';
    }
  };

  // Genera grupos de mensajes por fecha para renderizar separadores de día
  const getGroupedMessages = () => {
    const groups: { [key: string]: typeof messages } = {};
    messages.forEach((msg) => {
      const date = new Date(msg.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  // Renderiza el estado de las checkmarks para mensajes de soporte (ADMIN)
  const renderReadStatus = (msg: any) => {
    const isReadByDriver = msg.readByDriver;
    const isReadByClient = msg.readByClient;

    if (isReadByDriver && isReadByClient) {
      return (
        <span title="Leído por conductor y cliente">
          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
        </span>
      );
    }
    if (isReadByDriver) {
      return (
        <span title="Leído por conductor">
          <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
        </span>
      );
    }
    if (isReadByClient) {
      return (
        <span title="Leído por cliente">
          <CheckCheck className="w-3.5 h-3.5 text-[#5AB507]" />
        </span>
      );
    }
    return (
      <span title="Enviado">
        <Check className="w-3.5 h-3.5 text-slate-400" />
      </span>
    );
  };

  const groupedMessages = getGroupedMessages();

  // Asegura que las URLs de archivos locales tengan el host correcto del backend en desarrollo
  const getAttachmentUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const apiHost = env.API_BASE_URL.replace(/\/api$/, '');
    return `${apiHost}${url}`;
  };

  return (
    <MessageScrollerProvider>
      <div className="flex flex-col flex-1 h-full overflow-hidden bg-slate-50 relative bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header del Chat */}
      <div className="px-6 py-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0 shadow-2xs z-10">
        <div className="flex items-center gap-3.5">
          <Button
            size="sm"
            onClick={onBack}
            className="px-3.5 py-2 text-white bg-[#5AB507] hover:bg-[#4e9c06] border-none rounded-lg hover:shadow-xs active:scale-95 transition-all font-black gap-1.5 cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>{backLabel}</span>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-[#0B1E36] tracking-tight">
                Chat de Servicio: {serviceCode}
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected 
                    ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' 
                    : 'bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse'
                }`}
                title={isConnected ? 'Conectado al servidor' : 'Desconectado'}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-extrabold block leading-none mt-1.5 uppercase tracking-wide">
              RequestId: #{requestId} • {isConnected ? 'En tiempo real' : 'Reconectando...'}
            </span>
          </div>
        </div>

        {/* Estado Operativo */}
        <div className="flex items-center gap-2">
          {!canWrite && (
            <Badge variant="outline" className="bg-rose-50/90 text-rose-700 border-rose-200/65 font-black gap-1 uppercase px-2.5 py-1 rounded-lg">
              <AlertTriangle className="w-3 h-3 text-rose-600 animate-bounce" />
              <span>Finalizado</span>
            </Badge>
          )}
          {canWrite && isConnected && (
            <Badge variant="outline" className="bg-emerald-50/90 text-emerald-700 border-emerald-200/65 font-black uppercase px-2.5 py-1 rounded-lg shadow-3xs">
              Activo
            </Badge>
          )}
        </div>
      </div>

      {/* Visor de Mensajes */}
      <div className="flex-1 min-h-0 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/40 backdrop-blur-xs">
            <Loader2 className="w-8 h-8 text-[#0B1E36] animate-spin mb-2" />
            <span className="text-xs font-bold text-slate-400">Cargando mensajes del historial...</span>
          </div>
        ) : Object.keys(groupedMessages).length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs text-slate-350 mb-4 animate-in fade-in zoom-in-95 duration-300">
              <ImageIcon className="w-7 h-7 text-slate-450" />
            </div>
            <h4 className="text-sm font-bold text-[#0B1E36]">Sin mensajes aún</h4>
            <p className="text-xs text-slate-400 max-w-[280px] mt-1.5 leading-relaxed font-semibold">
              Comienza la conversación enviando un mensaje. El conductor y el cliente recibirán el historial.
            </p>
          </div>
        ) : (
          <MessageScroller className="h-full">
              <MessageScrollerViewport ref={viewportRef} className="p-4 sm:p-6 custom-scrollbar">
                <MessageScrollerContent className="space-y-6">
                  {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date} className="space-y-4">
                      {/* Separador de Día */}
                      <div className="flex items-center justify-center my-6">
                        <span className="px-4 py-1 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-200/60 backdrop-blur-xs border border-slate-300/10 rounded-full shadow-3xs select-none">
                          {formatDateGroup(msgs[0].createdAt)}
                        </span>
                      </div>

                      {msgs.map((msg) => {
                        const isMe = msg.senderType === mySenderType;
                        const isSystem = msg.messageType === 'SYSTEM';
                        const parsed = parseReplyMessage(msg.message);

                        if (isSystem) {
                          return (
                            <MessageScrollerItem key={msg.id} className="flex justify-center animate-in fade-in duration-300">
                              <div className="bg-slate-200/50 backdrop-blur-xs border border-slate-300/20 rounded-full px-5 py-1.5 max-w-[85%] text-center text-[10px] font-black text-slate-500 uppercase tracking-wider shadow-3xs">
                                {msg.message}
                              </div>
                            </MessageScrollerItem>
                          );
                        }

                        return (
                          <MessageScrollerItem
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                          >
                            <div className={`flex items-end gap-2.5 max-w-[75%] group relative ${isMe ? 'flex-row-reverse' : ''}`}>
                              {/* Avatar */}
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs uppercase shadow-2xs shrink-0 select-none border-2 border-white ring-2 ${
                                isMe ? 'bg-[#0B1E36] text-white ring-[#0B1E36]/10' : 
                                msg.senderType === 'DRIVER' ? 'bg-[#5AB507] text-white ring-[#5AB507]/10' : 'bg-slate-300 text-slate-700 ring-slate-250/50'
                              }`}>
                                {msg.senderName ? msg.senderName.split(' ').map((n) => n[0]).slice(0, 2).join('') : '?'}
                              </div>

                              {/* Burbuja del mensaje */}
                              <div className="flex flex-col gap-0.5">
                                {/* Nombre y Rol */}
                                <div className={`flex items-baseline gap-1.5 text-[10px] font-bold px-1.5 ${
                                  isMe ? 'justify-end' : 'justify-start'
                                }`}>
                                  <span className="text-slate-700">{msg.senderName}</span>
                                  <span className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded-md ${
                                    msg.senderType === 'ADMIN' ? 'bg-slate-200 text-slate-700' :
                                    msg.senderType === 'DRIVER' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {msg.senderType === 'ADMIN' ? 'Soporte' : 
                                     msg.senderType === 'DRIVER' ? 'Conductor' : 'Cliente'}
                                  </span>
                                </div>

                                <div className={`rounded-2xl p-3.5 shadow-3xs border transition-shadow hover:shadow-2xs ${
                                  isMe
                                    ? 'bg-gradient-to-br from-[#0B1E36] to-[#1E3B5E] text-white border-none rounded-tr-none'
                                    : msg.senderType === 'DRIVER'
                                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 text-slate-800 border-emerald-100/70 rounded-tl-none'
                                      : 'bg-gradient-to-br from-white to-slate-50 text-slate-800 border-slate-200/60 rounded-tl-none'
                                }`}>
                                  {/* Preview de mensaje respondido */}
                                  {parsed.isReply && (
                                    <div className={`border-l-4 rounded px-2.5 py-1.5 mb-2 text-[10px] text-left leading-snug select-none ${
                                      isMe 
                                        ? 'border-[#5AB507] bg-black/20 text-slate-300' 
                                        : 'border-[#0B1E36] bg-black/[0.04] text-slate-650'
                                    }`}>
                                      <p className={`font-black text-[9px] uppercase tracking-wider mb-0.5 ${
                                        isMe ? 'text-[#5AB507]' : 'text-[#0B1E36]'
                                      }`}>
                                        {parsed.replySender}
                                      </p>
                                      <p className="line-clamp-2 font-medium">
                                        {parsed.replyText}
                                      </p>
                                    </div>
                                  )}

                                  {/* Adjuntos si existen */}
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="grid grid-cols-1 gap-2 mb-2 max-w-xs">
                                      {msg.attachments.map((att) => {
                                        const fullUrl = getAttachmentUrl(att.fileUrl);
                                        return (
                                          <div
                                            key={att.id}
                                            className="relative rounded-xl overflow-hidden group cursor-pointer border border-black/5 aspect-video bg-black/10 shadow-3xs"
                                            onClick={() => setActiveZoomImage(fullUrl)}
                                          >
                                            <img
                                              src={fullUrl}
                                              alt="Adjunto"
                                              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                                              onError={(e) => {
                                                console.error('Image load error', e);
                                                (e.target as any).src = 'https://placehold.co/600x400?text=Error+al+cargar+imagen';
                                              }}
                                            />
                                            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                                              <Eye className="w-5 h-5 text-white" />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  <div className="flex flex-row items-end justify-between gap-3 flex-wrap min-w-[85px] mt-1">
                                    {/* Texto de mensaje */}
                                    {parsed.actualMessage && (
                                      <span className="text-xs leading-relaxed break-words font-medium whitespace-pre-wrap flex-1">
                                        {parsed.actualMessage}
                                      </span>
                                    )}

                                    {/* Pie de burbuja: Hora + Leídos */}
                                    <div className={`flex items-center gap-1 text-[9px] font-bold select-none shrink-0 ml-auto ${
                                      isMe ? 'text-slate-300' : 'text-slate-400'
                                    }`}>
                                      <span>{formatTime(msg.createdAt)}</span>
                                      {isMe && <span>{renderReadStatus(msg)}</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Botón de responder al hacer hover */}
                              {canWrite && (
                                <button
                                  type="button"
                                  onClick={() => setReplyingTo(msg)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-[#0B1E36] shadow-3xs active:scale-90 shrink-0 self-center cursor-pointer"
                                  title="Responder mensaje"
                                >
                                  <CornerUpLeft className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </MessageScrollerItem>
                        );
                      })}
                    </div>
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
        )}
      </div>

      {/* Indicadores de Escritura */}
      {typingUsers.length > 0 && (
        <div className="px-6 py-2 bg-slate-100/50 backdrop-blur-xs border-t border-slate-200/40 text-[10px] font-black text-slate-500 animate-pulse select-none shrink-0 flex items-center gap-1.5 shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5AB507] animate-bounce" />
          <span>
            {typingUsers.map((u) => `${u.name} (${u.senderType === 'DRIVER' ? 'Conductor' : 'Cliente'})`).join(', ')}{' '}
            {typingUsers.length === 1 ? 'está escribiendo...' : 'están escribiendo...'}
          </span>
        </div>
      )}

      {/* Input de Envío */}
      <div className="p-4 border-t border-slate-200/65 bg-white/90 backdrop-blur-md shrink-0 shadow-lg z-10 relative">
        {/* Menú de selección de tipo de archivo al estilo WhatsApp */}
        {showAttachMenu && (
          <div className="absolute bottom-[68px] left-4 bg-white border border-slate-200/80 rounded-2xl p-2 shadow-xl flex flex-col gap-1.5 animate-in slide-in-from-bottom-3 duration-200 z-30 min-w-[190px]">
            {/* Opción 1: Cámara */}
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                handleCameraClick();
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors w-full text-left font-bold text-xs text-slate-700 cursor-pointer"
            >
              <span className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-3xs shrink-0">
                <Camera className="w-4 h-4" />
              </span>
              <span>Cámara (Foto)</span>
            </button>

            {/* Opción 2: Imagen / Galería */}
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                handleFileClick();
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors w-full text-left font-bold text-xs text-slate-700 cursor-pointer"
            >
              <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-3xs shrink-0">
                <ImageIcon className="w-4 h-4" />
              </span>
              <span>Galería</span>
            </button>

            {/* Opción 3: Ubicación GPS */}
            <button
              type="button"
              onClick={async () => {
                setShowAttachMenu(false);
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const { latitude, longitude } = position.coords;
                      const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
                      sendMessage(`📍 Ubicación compartida: ${mapLink}`);
                      toast.success('Ubicación compartida con éxito');
                    },
                    () => {
                      toast.error('No se pudo acceder a tu ubicación');
                    }
                  );
                } else {
                  toast.error('La geolocalización no está disponible');
                }
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors w-full text-left font-bold text-xs text-slate-700 cursor-pointer"
            >
              <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-3xs shrink-0">
                <MapPin className="w-4 h-4" />
              </span>
              <span>Ubicación GPS</span>
            </button>
          </div>
        )}

        {/* Banner de mensaje al que se responde (estilo WhatsApp) */}
        {replyingTo && (
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2 mb-3 animate-in slide-in-from-bottom-2 duration-200">
            <div className="border-l-4 border-[#0B1E36] pl-3 py-0.5 text-left">
              <span className="text-[9px] text-[#0B1E36] uppercase font-black tracking-wider block">Respondiendo a {replyingTo.senderName}</span>
              <span className="text-[11px] text-slate-500 font-semibold truncate block max-w-[280px] sm:max-w-md">
                {replyingTo.message || (replyingTo.attachments && replyingTo.attachments.length > 0 ? '📷 Foto' : '')}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setReplyingTo(null)}
              className="text-slate-400 hover:text-slate-700 h-7 w-7 rounded-full hover:bg-slate-100 shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Previsualización de imágenes seleccionadas */}
        {filePreviews.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4 bg-slate-50/80 backdrop-blur-xs border border-slate-100 p-3.5 rounded-2xl shadow-3xs animate-in fade-in-50 duration-200">
            {filePreviews.map((previewUrl, index) => (
              <div key={index} className="relative w-18 h-18 rounded-xl overflow-hidden border border-slate-200/80 shadow-2xs group ring-2 ring-primary/10 transition-all hover:scale-102">
                <img src={previewUrl} alt="Vista previa" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeSelectedFile(index)}
                  className="absolute top-1 right-1 bg-black/75 hover:bg-black text-white p-1 rounded-full shadow-md transition-all hover:scale-110 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="flex flex-col justify-center pl-2 text-[10px] text-slate-400 font-bold leading-normal">
              <span className="text-[#0B1E36] font-extrabold flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                {selectedFiles.length} {selectedFiles.length === 1 ? 'imagen seleccionada' : 'imágenes seleccionadas'}
              </span>
              <span>Límite acumulado por servicio: 3 imágenes</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2.5 items-center">
          {/* Entradas ocultas para adjuntos */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {/* Botones de Adjuntos */}
          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              variant="default"
              size="icon"
              disabled={!canWrite || isUploading || selectedFiles.length >= 3}
              onClick={handleCameraClick}
              className="bg-rose-500 hover:bg-rose-600 text-white border-none h-11 w-11 rounded-xl cursor-pointer shadow-3xs active:scale-95 transition-all flex items-center justify-center shrink-0"
              title="Tomar foto con cámara"
            >
              <Camera className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              variant="default"
              size="icon"
              disabled={!canWrite || isUploading || selectedFiles.length >= 3}
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="bg-[#0B1E36] hover:bg-[#1E3B5E] text-white border-none h-11 w-11 rounded-xl cursor-pointer shadow-3xs active:scale-95 transition-all flex items-center justify-center shrink-0"
              title="Adjuntar archivos"
            >
              {showAttachMenu ? <X className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
            </Button>
          </div>

          {/* Campo de Texto */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              sendTyping();
            }}
            disabled={!canWrite || isUploading}
            placeholder={
              !canWrite
                ? 'El chat está cerrado (Servicio finalizado)'
                : isUploading
                  ? 'Subiendo archivos, por favor espera...'
                  : 'Escribe un mensaje...'
            }
            className="flex-1 bg-slate-50 hover:bg-slate-100/30 focus:bg-white border border-slate-200 focus:border-[#0B1E36] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B1E36]/5 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-3xs"
          />

          {/* Botón de Enviar */}
          <Button
            type="submit"
            disabled={(!inputText.trim() && selectedFiles.length === 0) || !canWrite || isUploading}
            className="bg-gradient-to-r from-[#0B1E36] to-[#1E3B5E] hover:from-[#1A2E44] hover:to-[#2B4B74] text-white font-extrabold h-11 px-5 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md rounded-xl active:scale-97 transition-all"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Enviar</span>
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Modal / Zoom de Imagen */}
      {activeZoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveZoomImage(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
            onClick={() => setActiveZoomImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={activeZoomImage}
            alt="Detalle"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // Prevenir cerrar al hacer click sobre la imagen
          />
        </div>
      )}
      </div>
    </MessageScrollerProvider>
  );
}
