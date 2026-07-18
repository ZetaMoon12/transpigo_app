/**
 * Configuración de variables de entorno
 * Acceso centralizado a todas las variables de entorno con tipado seguro
 */
export const env = {
  /** URL base para la API */
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string ?? 'http://localhost:3000/api',

  /** Nombre de la aplicación */
  APP_NAME: import.meta.env.VITE_APP_NAME as string ?? 'Transpigo Admin',

  /** Token público de Mapbox (geocoding) — sin él, la búsqueda de direcciones se degrada a entrada manual */
  MAPBOX_TOKEN: (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) ?? '',

  /** Entorno actual */
  NODE_ENV: import.meta.env.MODE,

  /** Indica si está en entorno de producción */
  IS_PROD: import.meta.env.PROD,

  /** Indica si está en entorno de desarrollo */
  IS_DEV: import.meta.env.DEV,
} as const;
