import { Outlet, NavLink } from 'react-router-dom';
import { HomeIcon, TruckIcon, FileTextIcon, ClockIcon, AlertTriangleIcon, LogOutIcon } from 'lucide-react';
import { useAuth } from '@/context';
import { cn } from '@/lib/utils';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { useServicioActivo } from '@/hooks/useServicioActivo';

const NAV_ITEMS = [
  { title: 'Inicio', icon: HomeIcon, href: '/portal' },
  { title: 'Activo', icon: TruckIcon, href: '/portal/activo' },
  { title: 'Documentos', icon: FileTextIcon, href: '/portal/documentos' },
  { title: 'Historial', icon: ClockIcon, href: '/portal/historial' },
];

function getInitials(name?: string) {
  if (!name) return 'C';
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

/**
 * Shell responsive del portal del conductor: en móvil, header + bottom nav de 4
 * pantallas; desde `md` en adelante, sidebar fijo a la izquierda (mismo patrón
 * visual del `MainLayout` de administrador) y el bottom nav se oculta. Comparte
 * una sola instancia de `useServicioActivo` con las páginas hijas vía `Outlet
 * context` para no duplicar el polling.
 */
export function DriverLayout() {
  const { user, logout } = useAuth();
  const { permissionDenied } = useDriverLocation();
  const servicioActivoState = useServicioActivo();

  return (
    <div className="flex min-h-dvh bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col bg-[#0B1E36] text-white">
        <div className="px-4 py-5">
          <span className="text-sm font-bold truncate block">
            Transpi<span className="text-[#5AB507]">GO</span>
          </span>
          <span className="text-[11px] text-white/50 font-semibold uppercase tracking-wide">Portal conductor</span>
        </div>

        <nav className="flex flex-col gap-1 px-3 mt-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/portal'}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive ? 'bg-[#5AB507]/15 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
              {item.href === '/portal/activo' && servicioActivoState.servicioActivo && (
                <span className="ml-auto h-2 w-2 rounded-full bg-[#5AB507]" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 border-t border-white/10 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold uppercase">
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold leading-none truncate">{user?.name ?? 'Conductor'}</p>
            <p className="text-[10px] text-white/50 mt-1 font-semibold uppercase tracking-wide">
              {servicioActivoState.servicioActivo ? 'En servicio' : 'Disponible'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            title="Cerrar sesión"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
          >
            <LogOutIcon className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        {/* Header móvil */}
        <header className="sticky top-0 z-40 flex items-center justify-between bg-[#0B1E36] px-4 py-3 text-white shadow-sm md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold uppercase">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-none truncate">{user?.name ?? 'Conductor'}</p>
              <p className="text-[10px] text-white/60 mt-1 font-semibold uppercase tracking-wide">
                {servicioActivoState.servicioActivo ? 'En servicio' : 'Disponible'}
              </p>
            </div>
          </div>

          {permissionDenied && (
            <div
              className="flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-amber-300"
              title="Activa el GPS para recibir servicios"
            >
              <AlertTriangleIcon className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold">GPS</span>
            </div>
          )}
        </header>

        {/* Banner GPS desktop (el header móvil ya lo muestra en su propia barra) */}
        {permissionDenied && (
          <div className="hidden md:flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-8 py-2 text-amber-700">
            <AlertTriangleIcon className="h-4 w-4" />
            <span className="text-xs font-semibold">Activa el GPS para recibir servicios.</span>
          </div>
        )}

        <main className="flex-1 px-4 py-4 pb-24 md:mx-auto md:w-full md:max-w-5xl md:px-8 md:py-8 md:pb-8">
          <Outlet context={servicioActivoState} />
        </main>

        {/* Bottom nav móvil */}
        <nav className="fixed bottom-0 inset-x-0 z-40 flex items-stretch border-t border-slate-100 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/portal'}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-bold transition-colors',
                  isActive ? 'text-[#5AB507]' : 'text-slate-400',
                )
              }
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.href === '/portal/activo' && servicioActivoState.servicioActivo && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#5AB507] ring-2 ring-white" />
                )}
              </div>
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
