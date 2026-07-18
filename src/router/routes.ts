/**
 * Constantes para las rutas de la aplicación
 * Se deben usar estas claves en lugar de escribir las rutas en texto plano
 */
export const ROUTES = {
  // Autenticación
  LOGIN: '/login',

  // Aplicación interna
  DASHBOARD:     '/dashboard',
  SETTINGS:      '/settings',
  COMPANIES:     '/companies',
  COMPANY_DETAIL: '/companies/:id',
  TARIFFS:       '/tariffs',
  SERVICES:          '/servicios',
  SERVICES_GRUA_NEW: '/servicios/grua/nuevo',
  SERVICES_CARGA_NEW: '/servicios/carga/nuevo',
  DRIVERS:           '/conductores',
  DRIVERS_NEW:       '/conductores/nuevo',
  DRIVERS_ASSOCIATE: '/conductores/asociar',

  // Portal del conductor
  PORTAL:            '/portal',
  PORTAL_ACTIVO:     '/portal/activo',
  PORTAL_DOCUMENTOS: '/portal/documentos',
  PORTAL_HISTORIAL:  '/portal/historial',

  // Seguimiento público del servicio (sin sesión, acceso vía tracking token)
  SEGUIMIENTO: '/s/:token',

  // Comodín para error 404
  NOT_FOUND: '*',
} as const;
