/**
 * Utilidades para formateo de cadenas de texto (Strings)
 */

/** Pone en mayúscula la primera letra de un texto */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Recorta un texto agregando puntos suspensivos al final */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '…';
}

/** Convierte un texto a formato URL amigable (slug) */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Genera las iniciales a partir de un nombre */
export function getInitials(name: string, maxChars = 2): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, maxChars)
    .join('');
}
