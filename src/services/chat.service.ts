/**
 * Servicio de Chat - Gestión de historial y adjuntos del chat de servicio
 */
import { httpClient } from './http-client';
import type { ApiResponse } from '@/types';
import type { ServiceRequestStatus } from './servicios.service';

export type ChatSenderType = 'CLIENT' | 'DRIVER' | 'ADMIN';
export type ChatMessageType = 'TEXT' | 'IMAGE' | 'SYSTEM';

export interface ChatAttachment {
  id: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
}

export interface ChatMessage {
  id: string;
  requestId: number;
  senderType: ChatSenderType;
  senderUserId: number | null;
  senderName: string;
  message: string | null;
  messageType: ChatMessageType;
  readByAdmin: boolean;
  readByDriver: boolean;
  readByClient: boolean;
  createdAt: string;
  attachments?: ChatAttachment[];
}

export interface ChatHistoryResponse {
  serviceStatus: ServiceRequestStatus;
  canWrite: boolean;
  senderType: ChatSenderType;
  messages: ChatMessage[];
}

// `token`: credencial explícita (JWT de tracking) para la vista pública de
// seguimiento — si se omite, el httpClient usa la sesión de admin/conductor.
function authHeaders(token?: string): Record<string, string> | undefined {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export const chatService = {
  /**
   * Obtiene el historial de mensajes de un servicio
   */
  getMessages(requestId: number, token?: string): Promise<ApiResponse<ChatHistoryResponse>> {
    return httpClient.get<ApiResponse<ChatHistoryResponse>>(`/chat/${requestId}/messages`, {
      headers: authHeaders(token),
    });
  },

  /**
   * Sube imágenes como adjuntos a un chat de servicio
   */
  uploadAttachments(
    requestId: number,
    files: File[],
    message?: string,
    token?: string,
  ): Promise<ApiResponse<ChatMessage>> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });
    if (message) {
      formData.append('message', message);
    }
    return httpClient.upload<ApiResponse<ChatMessage>>(`/chat/${requestId}/attachments`, formData, {
      headers: authHeaders(token),
    });
  },
};
