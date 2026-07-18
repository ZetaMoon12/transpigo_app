/**
 * Funciones de ayuda (helpers) para operaciones comunes
 */

/** Retrasa la ejecución durante un tiempo determinado en milisegundos (útil para pruebas/desarrollo) */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Procesa de forma segura una cadena JSON con un valor de respaldo por defecto */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/** Genera un identificador único (UUID) */
export function generateId(): string {
  return crypto.randomUUID();
}

/** Limita un número entre un rango mínimo y máximo */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Formatea un número como moneda local */
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/** Formatea una fecha a una cadena con localización específica */
export function formatDate(
  date: string | Date,
  locale = 'es-MX',
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

/** Crea una cadena de nombres de clases a partir de condiciones lógicas */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Subdominios reservados que nunca representan el slug de un tenant */
const RESERVED_SUBDOMAINS = ['app', 'admin', 'api', 'www'];

/**
 * Extrae el slug del tenant a partir del hostname actual (wildcard DNS {slug}.transpigo.com).
 * Retorna null cuando el host es un dominio raíz/reservado o localhost sin override de desarrollo.
 */
export function getTenantSlugFromHostname(hostname: string): string | null {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return import.meta.env.VITE_DEV_TENANT_SLUG || null;
  }

  const parts = hostname.split('.');
  if (parts.length <= 2) {
    return null;
  }

  const [slug] = parts;
  return RESERVED_SUBDOMAINS.includes(slug) ? null : slug;
}
