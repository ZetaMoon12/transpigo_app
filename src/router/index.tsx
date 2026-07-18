import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout, AuthLayout, DriverLayout } from '@/layouts';
import { ROUTES } from './routes';
import { ProtectedRoute, PublicRoute, AdminOnlyRoute, DriverOnlyRoute } from './guards';

// Páginas
import { DashboardPage } from '@/pages/Dashboard';
import { LoginPage } from '@/pages/Auth';
import { SettingsPage } from '@/pages/Settings';
import { CompaniesPage, CompanyDetailPage } from '@/pages/Companies';
import { TariffsPage } from '@/pages/Tariffs';
import { ServicesPage, GruaServiceWizard, CargaServiceWizard } from '@/pages/Services';
import { NotFoundPage } from '@/pages/NotFound';
import { DriversPage, DriverRegistrationWizard, AssociateDriverVehicle } from '@/pages/Drivers';
import {
  PortalHomePage,
  PortalActivoPage,
  PortalDocumentosPage,
  PortalHistorialPage,
} from '@/pages/Portal';
import { SeguimientoPage } from '@/pages/Seguimiento';

/**
 * Configuración del Enrutador (Router) de la aplicación
 *
 * Estructura:
 * ├── / (redirección → /dashboard)
 * ├── /login (AuthLayout protegida por PublicRoute)
 * ├── /dashboard (MainLayout protegida por ProtectedRoute)
 * └── * (404)
 */
export const router = createBrowserRouter([
  // Rutas de autenticación (públicas)
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTES.LOGIN, element: <LoginPage /> },
        ],
      },
    ],
  },

  // Rutas protegidas (usuarios autenticados)
  {
    element: <ProtectedRoute />,
    children: [
      // Panel de administración — bloqueado para role=DRIVER (redirige a /portal)
      {
        element: <AdminOnlyRoute />,
        children: [
          {
            element: <MainLayout />,
            children: [
              { path: ROUTES.DASHBOARD,      element: <DashboardPage />     },
              { path: ROUTES.SETTINGS,       element: <SettingsPage />      },
              { path: ROUTES.COMPANIES,      element: <CompaniesPage />     },
              { path: ROUTES.COMPANY_DETAIL, element: <CompanyDetailPage /> },
              { path: ROUTES.TARIFFS,        element: <TariffsPage />       },
              { path: ROUTES.SERVICES,           element: <ServicesPage />      },
              { path: ROUTES.SERVICES_GRUA_NEW,  element: <GruaServiceWizard /> },
              { path: ROUTES.SERVICES_CARGA_NEW, element: <CargaServiceWizard /> },
              { path: ROUTES.DRIVERS,           element: <DriversPage />      },
              { path: ROUTES.DRIVERS_NEW,       element: <DriverRegistrationWizard /> },
              { path: ROUTES.DRIVERS_ASSOCIATE, element: <AssociateDriverVehicle /> },
            ],
          },
        ],
      },

      // Portal del conductor — solo role=DRIVER (redirige a /dashboard para cualquier otro)
      {
        element: <DriverOnlyRoute />,
        children: [
          {
            element: <DriverLayout />,
            children: [
              { path: ROUTES.PORTAL,            element: <PortalHomePage />       },
              { path: ROUTES.PORTAL_ACTIVO,      element: <PortalActivoPage />     },
              { path: ROUTES.PORTAL_DOCUMENTOS,  element: <PortalDocumentosPage /> },
              { path: ROUTES.PORTAL_HISTORIAL,   element: <PortalHistorialPage />  },
            ],
          },
        ],
      },
    ],
  },

  // Seguimiento público del servicio — fuera de PublicRoute/ProtectedRoute: debe
  // funcionar igual haya o no una sesión activa en el mismo navegador.
  { path: ROUTES.SEGUIMIENTO, element: <SeguimientoPage /> },

  // Redirección de la raíz → dashboard (el guard redirigirá a /login si no hay sesión)
  { path: '/', element: <Navigate to={ROUTES.DASHBOARD} replace /> },

  // Error 404
  { path: ROUTES.NOT_FOUND, element: <NotFoundPage /> },
]);
