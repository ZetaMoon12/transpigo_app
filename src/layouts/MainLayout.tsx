import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboardIcon,
  Building2Icon,
  BanknoteIcon,
  SettingsIcon,
  LogOutIcon,
  BellIcon,
  ChevronDownIcon,
  UsersIcon,
  TruckIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Navigation items ────────────────────────────────────────────────────────
const navMain = [
  { title: 'Dashboard', icon: LayoutDashboardIcon, href: '/dashboard' },
  { title: 'Servicios', icon: TruckIcon,           href: '/servicios' },
  { title: 'Empresas',  icon: Building2Icon,       href: '/companies' },
  { title: 'Tarifas',   icon: BanknoteIcon,        href: '/tariffs' },
  { title: 'Conductores', icon: UsersIcon,           href: '/conductores' },
];

const navSecondary = [
  { title: 'Perfil de la empresa', icon: SettingsIcon, href: '/settings' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInitials(name?: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

// ─── Nav item styling ────────────────────────────────────────────────────────
const NAV_ITEM_BASE =
  'h-9 gap-2.5 rounded-lg text-[13px] font-medium text-sidebar-foreground/65 transition-colors ' +
  'hover:!bg-white/[0.06] hover:!text-white ' +
  '[&_svg]:!size-4 [&_svg]:!text-sidebar-foreground/45 hover:[&_svg]:!text-white';
const NAV_ITEM_ACTIVE = '!bg-[#5AB507]/15 !text-white !font-semibold [&_svg]:!text-[#5AB507]';

// ─── AppSidebar ──────────────────────────────────────────────────────────────
function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-[4px_0_24px_-12px_rgba(0,0,0,0.35)]">

      {/* ── Logo ── */}
      <SidebarHeader className="px-3 py-4 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2 overflow-hidden group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center">
          {/* Compact SVG logo */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
            <svg viewBox="0 0 100 100" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 36C15 33.79 16.79 32 19 32H55C57.21 32 59 33.79 59 36V62H15V36Z" fill="#fff" />
              <path d="M59 38H72.5C74.32 38 75.99 38.996 76.85 40.6L84.35 54.6C84.77 55.39 85 56.28 85 57.18V62H59V38Z" fill="#fff" />
              <path d="M63 42H70L76 53H63V42Z" fill="#0B1E36" />
              <circle cx="30" cy="68" r="8" fill="#fff" stroke="#0B1E36" strokeWidth="2.5" />
              <circle cx="70" cy="68" r="8" fill="#fff" stroke="#0B1E36" strokeWidth="2.5" />
              <circle cx="30" cy="68" r="3" fill="#5AB507" />
              <circle cx="70" cy="68" r="3" fill="#5AB507" />
              <path d="M10 56C25 43 45 32 66 28L56 18L88 25L80 56L71 43C53 46 32 53 10 56Z" fill="#5AB507" />
            </svg>
          </div>
          <span className="text-sm font-bold text-sidebar-foreground truncate group-data-[collapsible=icon]:hidden">
            Transpi<span className="text-[#5AB507]">GO</span> Admin
          </span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      {/* ── Main nav ── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-wider font-semibold text-sidebar-foreground/50">Operaciones</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(NAV_ITEM_BASE, isActive && NAV_ITEM_ACTIVE)}
                      render={<NavLink to={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-wider font-semibold text-sidebar-foreground/50">Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(NAV_ITEM_BASE, isActive && NAV_ITEM_ACTIVE)}
                      render={<NavLink to={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

// ─── UserMenu ────────────────────────────────────────────────────────────────
function UserMenu() {
  const { user, logout } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-100 transition-colors">
        <Avatar className="h-7 w-7 rounded-lg shrink-0">
          <AvatarFallback className="rounded-lg bg-[#0B1E36] text-white text-xs font-bold">
            {getInitials(user?.name)}
          </AvatarFallback>
        </Avatar>
        <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <div className="flex flex-col gap-0.5 px-2 py-1.5">
          <span className="text-sm font-semibold text-slate-800 truncate">{user?.name ?? 'Usuario'}</span>
          <span className="text-xs font-normal text-slate-400 truncate">{user?.email ?? ''}</span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => logout()}>
          <LogOutIcon /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── MainLayout ───────────────────────────────────────────────────────────────
/**
 * MainLayout — Shell del administrador con sidebar colapsable y encabezado
 */
export function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* ── Top header bar ── */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-4">
          <SidebarTrigger className="-ml-1 text-slate-500 hover:text-slate-900" />
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex flex-1 items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 tracking-wide">Panel de Administración</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" className="text-slate-400 hover:text-slate-700 relative">
                <BellIcon className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#5AB507]" />
              </Button>
              <div className="h-5 w-px bg-slate-200" />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        {/* @container: permite que las páginas usen breakpoints relativos al ancho real disponible
            (descontando el sidebar), en vez del viewport completo — evita layouts apretados en portátil. */}
        <main className="flex-1 @container bg-slate-50/60 min-h-0 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
