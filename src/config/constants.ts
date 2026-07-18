/**
 * Constantes globales de la aplicación
 */

/** Valores por defecto para paginación */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

/** Claves para almacenamiento local (localStorage) */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

/** Códigos de estado HTTP */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/** Patrones de formato de fechas */
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd MMMM yyyy',
  WITH_TIME: 'dd/MM/yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss",
} as const;
