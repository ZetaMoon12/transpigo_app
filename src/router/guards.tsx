import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context';

/** A dónde debe caer cada usuario autenticado según su rol, al iniciar sesión o al cruzar de zona. */
function homeRouteFor(role?: string): string {
  return role === 'DRIVER' ? '/portal' : '/dashboard';
}

/**
 * ProtectedRoute - Redirecciona al login si el usuario no está autenticado
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // TODO: Reemplazar por un componente spinner de carga adecuado
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

/**
 * PublicRoute - Redirecciona al home correspondiente al rol si el usuario ya está autenticado
 * Se utiliza para las páginas públicas como la de login
 */
export function PublicRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to={homeRouteFor(user?.role)} replace />;
  }

  return <Outlet />;
}

/**
 * DriverOnlyRoute - Solo dentro de ProtectedRoute. Deja pasar a role=DRIVER,
 * redirige a cualquier otro rol de vuelta a su home (/dashboard).
 */
export function DriverOnlyRoute() {
  const { user } = useAuth();

  if (user?.role !== 'DRIVER') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

/**
 * AdminOnlyRoute - Solo dentro de ProtectedRoute. Bloquea el paso a role=DRIVER
 * (que debe usar el portal), redirigiéndolo a /portal. Deja pasar a cualquier otro rol.
 */
export function AdminOnlyRoute() {
  const { user } = useAuth();

  if (user?.role === 'DRIVER') {
    return <Navigate to="/portal" replace />;
  }

  return <Outlet />;
}
