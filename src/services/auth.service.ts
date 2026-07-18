/**
 * Servicio de Autenticación - Servicio de dominio de ejemplo
 * Maneja todas las llamadas a la API relacionadas con autenticación
 */
import { httpClient } from './http-client';
import type { ApiResponse } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

export const authService = {
  login: (credentials: LoginRequest) =>
    httpClient.post<ApiResponse<AuthTokens & { user: User }>>('/auth/login', credentials),

  logout: () =>
    httpClient.post<ApiResponse<null>>('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    httpClient.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken }),

  getProfile: () =>
    httpClient.get<ApiResponse<User>>('/auth/me'),

  updateProfile: (data: Partial<User>) =>
    httpClient.patch<ApiResponse<User>>('/auth/me', data),
};
