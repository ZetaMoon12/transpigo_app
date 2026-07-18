import { env } from '@/config';
import { STORAGE_KEYS } from '@/config/constants';
import type { ApiError } from '@/types';

/**
 * Cliente HTTP - Manejador centralizado de peticiones HTTP
 * Todas las llamadas a la API deben pasar a través de este cliente
 */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Construye la URL completa con parámetros de consulta (query params)
   */
  private buildUrl(endpoint: string, params?: RequestOptions['params']): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Obtiene las cabeceras por defecto incluyendo el token de autorización
   */
  private getHeaders(customHeaders?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Un header explícito del caller (ej. un token de tracking público) siempre
    // gana sobre la sesión de localStorage — importante para vistas anónimas que
    // pueden abrirse en el mismo navegador donde hay una sesión admin activa.
    Object.assign(headers, customHeaders);

    return headers;
  }

  /**
   * Maneja las respuestas de la API y los errores
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: response.statusText || 'Ha ocurrido un error inesperado',
        statusCode: response.status,
      }));

      // Manejar error 401 - token expirado (excepto en login)
      if (response.status === 401 && !response.url.includes('/auth/login')) {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        window.location.href = '/login';
      }

      throw error;
    }

    // Manejar respuesta 204 Sin Contenido
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  /**
   * Método de petición genérico
   */
  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);

    const response = await fetch(url, {
      method,
      headers: this.getHeaders(options?.headers),
      body: body ? JSON.stringify(body) : undefined,
      signal: options?.signal,
    });

    return this.handleResponse<T>(response);
  }

  /** Petición GET */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  /** Petición POST */
  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  /** Petición PUT */
  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  /** Petición PATCH */
  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  /** Petición DELETE */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  /**
   * Sube un archivo con formato multipart/form-data
   */
  async upload<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);

    // No colocar Content-Type para FormData, el navegador lo pondrá con su respectivo boundary
    const headers: Record<string, string> = {};
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    Object.assign(headers, options?.headers);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      signal: options?.signal,
    });

    return this.handleResponse<T>(response);
  }
}

/** Instancia única (singleton) del cliente HTTP */
export const httpClient = new HttpClient(env.API_BASE_URL);
