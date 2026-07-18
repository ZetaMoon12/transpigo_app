import { Outlet } from 'react-router-dom';

/**
 * AuthLayout - Layout para las páginas de autenticación (login, registro, recuperar contraseña)
 * Pantalla completa, sin elementos adicionales de navegación
 */
export function AuthLayout() {
  return <Outlet />;
}
