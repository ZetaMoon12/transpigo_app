import { MapPinIcon, CircleIcon, FlagIcon, TruckIcon, UserIcon } from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import { VEHICLE_TYPE_LABEL } from '../constants';
import type { CargaWizardState } from '../types';

interface CargaQuoteStepProps {
  state: CargaWizardState;
}

const cop = (value: number) => formatCurrency(value, 'COP', 'es-CO');

export function CargaQuoteStep({ state }: CargaQuoteStepProps) {
  const { quote } = state;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Cotización</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Revisa el desglose por tramo antes de continuar con los datos del cliente.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col gap-3">
        {state.stops.map((stop, index) => {
          const isFirst = index === 0;
          const isLast = index === state.stops.length - 1;
          const Icon = isFirst ? MapPinIcon : isLast ? FlagIcon : CircleIcon;
          return (
            <div key={index} className="flex items-start gap-2.5">
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isFirst ? 'text-[#5AB507]' : isLast ? 'text-red-500' : 'text-slate-400'}`} />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isFirst ? 'Origen' : isLast ? 'Destino final' : `Parada ${index}`}
                </p>
                <p className="text-sm text-slate-700 truncate">{stop.address}</p>
              </div>
            </div>
          );
        })}

        <div className="flex items-start gap-2.5 pt-1 border-t border-slate-200">
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
                : state.vehicleType
                  ? VEHICLE_TYPE_LABEL[state.vehicleType]
                  : '—'}
            </p>
          </div>
        </div>
      </div>

      {quote ? (
        <div className="flex flex-col gap-3">
          {quote.tramos.map((tramo, index) => (
            <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  {tramo.originCity} → {tramo.destCity}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-50 text-slate-500 border border-slate-200 rounded-full px-2 py-0.5">
                  {tramo.mode === 'dynamic' ? `Dinámico · ${tramo.km} km` : 'Tarifa fija de ruta'}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tarifa base</span>
                  <span>{cop(tramo.basePrice)}</span>
                </div>
                {tramo.kmCost > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Costo por km</span>
                    <span>{cop(tramo.kmCost)}</span>
                  </div>
                )}
                {tramo.overageKm > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Excedente km</span>
                    <span>{cop(tramo.overageKm)}</span>
                  </div>
                )}
                {tramo.weightCost > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Costo por peso</span>
                    <span>{cop(tramo.weightCost)}</span>
                  </div>
                )}
                {tramo.overageWeight > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Excedente de peso</span>
                    <span>{cop(tramo.overageWeight)}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between text-sm font-bold text-slate-700">
                <span>Subtotal tramo</span>
                <span>{cop(tramo.total)}</span>
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-[#5AB507]/30 bg-[#5AB507]/5 p-5 flex justify-between items-baseline">
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
