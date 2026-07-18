/**
 * Tipos base para respuestas de la API
 */

/** Respuesta exitosa estándar de la API */
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

/** Respuesta paginada de la API */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** Respuesta de error de la API */
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
