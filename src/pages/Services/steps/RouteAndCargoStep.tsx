import { PlusIcon, Trash2Icon, ArrowDownIcon } from 'lucide-react';
import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AddressSearchInput, type AddressValue } from '../components/AddressSearchInput';
import { VEHICLE_TYPES_BY_SERVICE, type VehicleType } from '@/services/tariffs.service';
import { VEHICLE_TYPE_LABEL } from '../constants';
import { EMPTY_ADDRESS, type CargaWizardState } from '../types';

const CARGO_VEHICLE_TYPES = VEHICLE_TYPES_BY_SERVICE.TRANSPORTE_CARGA;
const MAX_STOPS = 8;

interface RouteAndCargoStepProps {
  state: CargaWizardState;
  onChange: (patch: Partial<CargaWizardState>) => void;
  errors: {
    stops?: Record<number, string>;
    cargoDescription?: string;
    vehicleType?: string;
  };
}

function stopLabel(index: number, total: number): string {
  if (index === 0) return 'Origen';
  if (index === total - 1) return 'Destino final';
  return `Parada intermedia ${index}`;
}

export function RouteAndCargoStep({ state, onChange, errors }: RouteAndCargoStepProps) {
  function updateStop(index: number, value: AddressValue) {
    const stops = [...state.stops];
    stops[index] = value;
    onChange({ stops });
  }

  function addStop() {
    if (state.stops.length >= MAX_STOPS) return;
    const stops = [...state.stops];
    stops.splice(stops.length - 1, 0, { ...EMPTY_ADDRESS });
    onChange({ stops });
  }

  function removeStop(index: number) {
    if (state.stops.length <= 2) return;
    onChange({ stops: state.stops.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Ruta y carga</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Agrega el origen, las paradas intermedias que necesites y el destino final, junto con los
          datos de la mercancía.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {state.stops.map((stop, index) => (
          <div key={index}>
            {index > 0 && (
              <div className="flex items-center justify-center -my-1 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <ArrowDownIcon className="h-4 w-4" />
                </div>
              </div>
            )}
            <FormField label={stopLabel(index, state.stops.length)} required error={errors.stops?.[index]}>
              <div className="flex items-start gap-2">
                <div className="flex-1 flex flex-col gap-2">
                  <AddressSearchInput
                    placeholder="Dirección…"
                    value={stop}
                    onChange={(value) => updateStop(index, value)}
                  />
                  <Input
                    placeholder="Ciudad"
                    value={stop.city}
                    onChange={(e) => updateStop(index, { ...stop, city: e.target.value })}
                    className="max-w-64"
                  />
                </div>
                {index > 0 && index < state.stops.length - 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeStop(index)}
                    className="h-9 w-9 p-0 border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 shrink-0"
                    title="Quitar parada"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </FormField>
          </div>
        ))}

        {state.stops.length < MAX_STOPS && (
          <Button
            type="button"
            variant="outline"
            onClick={addStop}
            className="self-start border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Agregar parada intermedia</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <FormField label="Descripción de la mercancía" required error={errors.cargoDescription}>
            <Textarea
              placeholder="Ej: 20 cajas de repuestos, paletizadas…"
              maxLength={1000}
              value={state.cargoDescription}
              onChange={(e) => onChange({ cargoDescription: e.target.value })}
            />
          </FormField>
        </div>

        <FormField label="Peso estimado en toneladas (opcional)">
          <Input
            type="number"
            min={0}
            step="0.1"
            placeholder="Ej: 2.5"
            value={state.estimatedWeightTons ?? ''}
            onChange={(e) =>
              onChange({ estimatedWeightTons: e.target.value === '' ? null : Number(e.target.value) })
            }
          />
        </FormField>

        <FormField label="Tipo de vehículo" required error={errors.vehicleType}>
          <Select
            value={state.vehicleType ?? ''}
            onValueChange={(v) =>
              // Cambiar el tipo de vehículo invalida al conductor ya elegido (paso siguiente).
              onChange({
                vehicleType: (v || null) as VehicleType | null,
                driverId: null,
                selectedDriver: null,
                quote: null,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {state.vehicleType ? VEHICLE_TYPE_LABEL[state.vehicleType] : 'Selecciona un tipo…'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CARGO_VEHICLE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {VEHICLE_TYPE_LABEL[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>
    </div>
  );
}
