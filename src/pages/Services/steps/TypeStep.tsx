import { ZapIcon, CalendarClockIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormField } from '@/components/form-field';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import type { CargaWizardState } from '../types';

interface TypeStepProps {
  state: CargaWizardState;
  onChange: (patch: Partial<CargaWizardState>) => void;
  error?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// state.scheduledAt se guarda como string "YYYY-MM-DDTHH:mm" (mismo formato que
// un input datetime-local) para no cambiar el contrato que ya consume el wizard.
function parseScheduledAt(value: string): Date | undefined {
  return value ? new Date(value) : undefined;
}

function formatScheduledAt(date: Date | undefined): string {
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TypeStep({ state, onChange, error }: TypeStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Tipo de servicio</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Elige si el servicio se debe atender ahora o programarlo para una fecha específica.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange({ serviceMode: 'INMEDIATO', scheduledAt: '' })}
          className={cn(
            'text-left rounded-xl border p-4 transition-all flex items-start gap-3',
            state.serviceMode === 'INMEDIATO'
              ? 'border-[#5AB507] bg-[#5AB507]/5 ring-1 ring-[#5AB507]/30'
              : 'border-slate-200 bg-white hover:border-slate-300',
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B1E36] text-white">
            <ZapIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Inmediato</p>
            <p className="text-xs text-slate-500 mt-0.5">El servicio se atiende lo antes posible</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange({ serviceMode: 'PROGRAMADO' })}
          className={cn(
            'text-left rounded-xl border p-4 transition-all flex items-start gap-3',
            state.serviceMode === 'PROGRAMADO'
              ? 'border-[#5AB507] bg-[#5AB507]/5 ring-1 ring-[#5AB507]/30'
              : 'border-slate-200 bg-white hover:border-slate-300',
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <CalendarClockIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Programado</p>
            <p className="text-xs text-slate-500 mt-0.5">Agenda una fecha y hora específica</p>
          </div>
        </button>
      </div>

      {state.serviceMode === 'PROGRAMADO' && (
        <FormField label="Fecha y hora del servicio" required error={error}>
          <DateTimePicker
            value={parseScheduledAt(state.scheduledAt)}
            onChange={(date) => onChange({ scheduledAt: formatScheduledAt(date) })}
            minDate={new Date()}
          />
        </FormField>
      )}
    </div>
  );
}
