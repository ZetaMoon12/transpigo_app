import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UserIcon, StarIcon, TruckIcon, PhoneIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { serviciosService, type AvailableDriver } from '@/services/servicios.service';
import { VEHICLE_TYPE_LABEL } from '../constants';
import type { CargaWizardState } from '../types';

interface CargaDriverStepProps {
  state: CargaWizardState;
  onChange: (patch: Partial<CargaWizardState>) => void;
}

export function CargaDriverStep({ state, onChange }: CargaDriverStepProps) {
  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sin tipo de vehículo (no debería ocurrir tras validar el paso anterior) no hay nada que buscar.
    if (!state.vehicleType) return;

    serviciosService
      .availableDrivers({ vehicleType: state.vehicleType })
      .then((res) => setDrivers(res.data))
      .catch(() => toast.error('No se pudieron cargar los conductores disponibles'))
      .finally(() => setLoading(false));
  }, [state.vehicleType]);

  function selectDriver(driver: AvailableDriver) {
    onChange({ driverId: driver.id, selectedDriver: driver, quote: null });
  }

  function selectUnassigned() {
    onChange({ driverId: null, selectedDriver: null, quote: null });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Conductor</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Asigna un conductor con {state.vehicleType ? VEHICLE_TYPE_LABEL[state.vehicleType] : 'el vehículo requerido'}, o
          continúa sin asignar.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {drivers.map((driver) => {
            const isSelected = state.driverId === driver.id;
            return (
              <button
                key={driver.id}
                type="button"
                onClick={() => selectDriver(driver)}
                className={cn(
                  'text-left rounded-xl border p-4 transition-all',
                  isSelected
                    ? 'border-[#5AB507] bg-[#5AB507]/5 ring-1 ring-[#5AB507]/30'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B1E36] text-white text-xs font-bold uppercase">
                    {driver.name.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{driver.name}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <StarIcon className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>{driver.rating.toFixed(1)}</span>
                      <span>· {driver.totalServices} servicios</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <TruckIcon className="h-3 w-3" />
                      <span>
                        {VEHICLE_TYPE_LABEL[driver.vehicle.type]} · {driver.vehicle.plate}
                      </span>
                    </div>
                    {driver.phone && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <PhoneIcon className="h-3 w-3" />
                        <span>{driver.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={selectUnassigned}
            className={cn(
              'text-left rounded-xl border border-dashed p-4 transition-all flex items-center gap-3',
              state.driverId === null && !state.selectedDriver
                ? 'border-[#5AB507] bg-[#5AB507]/5 ring-1 ring-[#5AB507]/30'
                : 'border-slate-200 bg-white hover:border-slate-300',
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <UserIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Sin asignar</p>
              <p className="text-xs text-slate-500 mt-0.5">Asignar el conductor más adelante</p>
            </div>
          </button>
        </div>
      )}

      {!loading && drivers.length === 0 && (
        <p className="text-xs text-slate-400">
          No hay conductores disponibles con este tipo de vehículo en este momento. Puedes continuar sin asignar.
        </p>
      )}
    </div>
  );
}
