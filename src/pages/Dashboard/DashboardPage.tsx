import { useAuth } from '@/context';

export function DashboardPage() {
  const { user } = useAuth();
  const hour   = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-[#0B1E36] tracking-tight">
          {greeting}, <span className="text-[#5AB507]">{user?.name?.split(' ')[0] ?? 'Admin'}</span> 👋
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
}

