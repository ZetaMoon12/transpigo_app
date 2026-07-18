import { MapPinIcon, TruckIcon, UserIcon } from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import { VEHICLE_TYPE_LABEL } from '../constants';
import type { GruaWizardState } from '../types';

interface QuoteStepProps {
  state: GruaWizardState;
}

const cop = (value: number) => formatCurrency(value, 'COP', 'es-CO');

export function QuoteStep({ state }: QuoteStepProps) {
  const { quote } = state;
  const vehicleType = state.selectedDriver?.vehicle.type ?? state.manualVehicleType;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Cotización</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Revisa el resumen del servicio antes de continuar con los datos del cliente.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col gap-3">
        <div className="flex items-start gap-2.5">
          <MapPinIcon className="h-4 w-4 mt-0.5 shrink-0 text-[#5AB507]" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Origen</p>
            <p className="text-sm text-slate-700 truncate">{state.origin.address}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <MapPinIcon className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Destino</p>
            <p className="text-sm text-slate-700 truncate">{state.destination.address}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          {state.selectedDriver ? (
            <UserIcon className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
          ) : (
            <TruckIcon className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {state.selectedDriver ? 'Conductor' : 'Vehículo'}
            </p>
            <p className="text-sm text-slate-700">
              {state.selectedDriver
                ? `${state.selectedDriver.name} · ${state.selectedDriver.vehicle.plate}`
                : vehicleType
                  ? VEHICLE_TYPE_LABEL[vehicleType]
                  : '—'}
            </p>
          </div>
        </div>
      </div>

      {quote ? (
        <div className="rounded-xl border border-[#5AB507]/30 bg-[#5AB507]/5 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {quote.tariffName}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide bg-white text-slate-500 border border-slate-200 rounded-full px-2 py-0.5">
              {quote.zoneType === 'CIUDAD' ? 'Dentro de la ciudad' : 'Fuera de la ciudad'}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Tarifa base</span>
              <span>{cop(quote.basePrice)}</span>
            </div>
            {quote.mode === 'fixed-additional' && (
              <div className="flex justify-between text-slate-600">
                <span>Recargo fuera de ciudad</span>
                <span>{cop(quote.additionalPrice)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-[#5AB507]/20 pt-3 flex justify-between items-baseline">
            <span className="text-sm font-bold text-slate-700">Total estimado</span>
            <span className="text-2xl font-extrabold text-[#0B1E36]">{cop(quote.total)}</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
          No fue posible calcular la cotización.
        </div>
      )}
    </div>
  );
}
