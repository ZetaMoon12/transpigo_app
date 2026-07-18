/**
 * Utilidades de validación
 */

/** Validación de correo electrónico */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/** Verifica si un valor está vacío (null, undefined, texto vacío, arreglo u objeto vacío) */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/** Validación de la seguridad de la contraseña */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) errors.push('Debe tener al menos 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Debe contener al menos una letra mayúscula');
  if (!/[a-z]/.test(password)) errors.push('Debe contener al menos una letra minúscula');
  if (!/[0-9]/.test(password)) errors.push('Debe contener al menos un número');

  return { isValid: errors.length === 0, errors };
}
