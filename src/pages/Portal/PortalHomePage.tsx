import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { TruckIcon, StarIcon, MapPinIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { driversService } from '@/services/drivers.service';
import type { PortalOutletContext } from './types';

export function PortalHomePage() {
  const { servicioActivo, loading } = useOutletContext<PortalOutletContext>();
  const [profile, setProfile] = useState<{ rating: number; totalServices: number } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    driversService
      .getCurrentDriverProfile()
      .then((res) => setProfile(res.data))
      .catch(() => toast.error('No se pudo cargar tu perfil'))
      .finally(() => setLoadingProfile(false));
  }, []);

  if (loading) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }

  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-3 md:items-start md:gap-6">
      {servicioActivo ? (
        <Link
          to="/portal/activo"
          className="block rounded-2xl border border-[#5AB507]/30 bg-[#5AB507]/5 p-5 md:col-span-2 md:p-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-[#5AB507]">Servicio activo</span>
            <span className="text-[10px] font-bold text-slate-500">{servicioActivo.serviceCode}</span>
          </div>
          <p className="text-lg font-extrabold text-[#0B1E36] mt-2">{servicioActivo.client?.name ?? 'Cliente'}</p>
          <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5">
            <MapPinIcon className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="truncate">{servicioActivo.currentStop?.address ?? '—'}</span>
          </p>
          <Button className="mt-4 w-full bg-[#5AB507] hover:bg-[#5AB507]/90 text-white font-bold md:w-auto">
            Ver detalle
          </Button>
        </Link>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center md:col-span-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
            <TruckIcon className="h-7 w-7" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Esperando asignación…</h2>
          <p className="text-sm text-slate-500 mt-1">
            Tu ubicación se está compartiendo. Te avisaremos apenas tengas un nuevo servicio.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:col-span-1 md:grid-cols-1">
        <div className="rounded-2xl bg-white border border-slate-100 p-4 text-center">
          <p className="text-[10px] font-bold uppercase text-slate-400">Calificación</p>
          {loadingProfile ? (
            <Skeleton className="h-6 w-12 mx-auto mt-1" />
          ) : (
            <p className="text-xl font-extrabold text-[#0B1E36] mt-1 flex items-center justify-center gap-1">
              <StarIcon className="h-4 w-4 fill-amber-400 text-amber-400" />
              {profile ? Number(profile.rating).toFixed(1) : '5.0'}
            </p>
          )}
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 p-4 text-center">
          <p className="text-[10px] font-bold uppercase text-slate-400">Servicios totales</p>
          {loadingProfile ? (
            <Skeleton className="h-6 w-12 mx-auto mt-1" />
          ) : (
            <p className="text-xl font-extrabold text-[#0B1E36] mt-1">{profile?.totalServices ?? 0}</p>
          )}
        </div>
      </div>
    </div>
  );
}
