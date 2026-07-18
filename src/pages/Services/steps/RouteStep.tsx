import { ArrowDownIcon } from 'lucide-react';
import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AddressSearchInput, type AddressValue } from '../components/AddressSearchInput';
import type { GruaWizardState } from '../types';

interface RouteStepProps {
  state: GruaWizardState;
  onChange: (patch: Partial<GruaWizardState>) => void;
  errors: Partial<Record<'origin' | 'destination', string>>;
}

// La ciudad se autocompleta al seleccionar una sugerencia de Mapbox, pero siempre queda
// editable a mano: sin token de Mapbox configurado (o si la sugerencia no trae ciudad),
// el usuario debe poder escribirla directamente para no quedar bloqueado en este paso.
function AddressBlock({
  label,
  placeholder,
  value,
  onChange,
  error,
}: {
  label: string;
  placeholder: string;
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  error?: string;
}) {
  return (
    <FormField label={label} required error={error}>
      <div className="flex flex-col gap-2">
        <AddressSearchInput placeholder={placeholder} value={value} onChange={onChange} />
        <Input
          placeholder="Ciudad"
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
          className="max-w-64"
        />
      </div>
    </FormField>
  );
}

export function RouteStep({ state, onChange, errors }: RouteStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Ruta del servicio</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Busca la dirección de origen y destino. Si el destino queda en otra ciudad, se aplica
          el recargo por salida de la ciudad.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <AddressBlock
          label="Origen"
          placeholder="Dirección donde está el vehículo…"
          value={state.origin}
          onChange={(origin) => onChange({ origin })}
          error={errors.origin}
        />

        <div className="flex items-center justify-center -my-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <ArrowDownIcon className="h-4 w-4" />
          </div>
        </div>

        <AddressBlock
          label="Destino"
          placeholder="Dirección a donde se lleva el vehículo…"
          value={state.destination}
          onChange={(destination) => onChange({ destination })}
          error={errors.destination}
        />
      </div>

      <FormField label="Descripción (opcional)">
        <Textarea
          placeholder="Ej: Vehículo varado por falla mecánica, no enciende…"
          maxLength={500}
          value={state.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </FormField>
    </div>
  );
}
