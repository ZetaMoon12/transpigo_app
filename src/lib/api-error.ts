import type { ApiError } from '@/types';

/**
 * Extrae un mensaje legible de un error de la API. Si el backend envía
 * detalle por campo (`errors`), lo prioriza sobre el `message` genérico
 * (ej. "Datos inválidos") para que el usuario sepa qué corregir.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const apiErr = err as Partial<ApiError> | undefined;
  if (apiErr?.errors && Object.keys(apiErr.errors).length > 0) {
    return Object.values(apiErr.errors).flat().join(' ');
  }
  return apiErr?.message ?? fallback;
}
