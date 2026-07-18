import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { GruaWizardState } from '../types';

interface ClientStepProps {
  state: GruaWizardState;
  onChange: (patch: Partial<GruaWizardState>) => void;
  errors: Partial<Record<'name' | 'phone' | 'email' | 'consent', string>>;
}

export function ClientStep({ state, onChange, errors }: ClientStepProps) {
  function updateClient(patch: Partial<GruaWizardState['client']>) {
    onChange({ client: { ...state.client, ...patch } });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Datos del cliente</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Si el cliente ya existe en el sistema, se usará su registro; si no, se creará automáticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <FormField label="Nombre completo" required error={errors.name}>
            <Input
              value={state.client.name}
              onChange={(e) => updateClient({ name: e.target.value })}
              placeholder="Nombre y apellido"
            />
          </FormField>
        </div>
        <FormField label="Teléfono" required error={errors.phone}>
          <Input
            value={state.client.phone}
            onChange={(e) => updateClient({ phone: e.target.value })}
            placeholder="300 123 4567"
          />
        </FormField>
        <FormField label="Correo electrónico" required error={errors.email}>
          <Input
            type="email"
            value={state.client.email}
            onChange={(e) => updateClient({ email: e.target.value })}
            placeholder="cliente@correo.com"
          />
        </FormField>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={state.consentAccepted}
            onCheckedChange={(checked) => onChange({ consentAccepted: checked === true })}
            className="mt-0.5"
          />
          <span className="text-sm text-slate-600">
            El cliente acepta el tratamiento de sus datos personales conforme a la política de
            privacidad de Transpigo, para efectos de la prestación del servicio solicitado.
          </span>
        </label>
        {errors.consent && <p className="text-xs text-red-500 mt-2 ml-7">{errors.consent}</p>}
      </div>
    </div>
  );
}
