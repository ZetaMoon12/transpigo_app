import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UserIcon, Building2Icon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context';
import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { companiesService, type Company } from '@/services/companies.service';
import type { PaymentType } from '@/services/servicios.service';
import { PAYMENT_TYPE_LABEL } from '../constants';
import type { CargaWizardState } from '../types';

interface CargaClientStepProps {
  state: CargaWizardState;
  onChange: (patch: Partial<CargaWizardState>) => void;
  errors: Partial<Record<'name' | 'phone' | 'email' | 'consent' | 'company', string>>;
}

export function CargaClientStep({ state, onChange, errors }: CargaClientStepProps) {
  const { user } = useAuth();
  const canPickCompany = user?.role === 'ADMIN';

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  useEffect(() => {
    if (!canPickCompany || state.clientType !== 'COMPANY') return;

    companiesService
      .list(1, 100)
      .then((res) => setCompanies(res.data))
      .catch(() => toast.error('No se pudieron cargar las empresas'))
      .finally(() => setLoadingCompanies(false));
  }, [canPickCompany, state.clientType]);

  function updateClient(patch: Partial<CargaWizardState['client']>) {
    onChange({ client: { ...state.client, ...patch } });
  }

  function selectCompany(company: Company) {
    onChange({
      companyId: company.id,
      selectedCompany: company,
      client: {
        name: state.client.name || company.name,
        email: state.client.email || company.contactEmail,
        phone: state.client.phone || (company.contactPhone ?? ''),
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Datos del cliente</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Si el cliente ya existe en el sistema, se usará su registro; si no, se creará automáticamente.
        </p>
      </div>

      {canPickCompany && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChange({ clientType: 'PERSON', companyId: null, selectedCompany: null })}
            className={cn(
              'text-left rounded-xl border p-4 transition-all flex items-center gap-3',
              state.clientType === 'PERSON'
                ? 'border-[#5AB507] bg-[#5AB507]/5 ring-1 ring-[#5AB507]/30'
                : 'border-slate-200 bg-white hover:border-slate-300',
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <UserIcon className="h-4 w-4" />
            </div>
            <p className="text-sm font-bold text-slate-800">Persona natural</p>
          </button>

          <button
            type="button"
            onClick={() => onChange({ clientType: 'COMPANY' })}
            className={cn(
              'text-left rounded-xl border p-4 transition-all flex items-center gap-3',
              state.clientType === 'COMPANY'
                ? 'border-[#5AB507] bg-[#5AB507]/5 ring-1 ring-[#5AB507]/30'
                : 'border-slate-200 bg-white hover:border-slate-300',
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Building2Icon className="h-4 w-4" />
            </div>
            <p className="text-sm font-bold text-slate-800">Empresa</p>
          </button>
        </div>
      )}

      {canPickCompany && state.clientType === 'COMPANY' && (
        <FormField label="Empresa" required error={errors.company}>
          {loadingCompanies ? (
            <Skeleton className="h-9 w-full max-w-sm" />
          ) : (
            <Select
              value={state.companyId ? String(state.companyId) : ''}
              onValueChange={(v) => {
                const company = companies.find((c) => c.id === Number(v));
                if (company) selectCompany(company);
              }}
            >
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue>{state.selectedCompany?.name ?? 'Selecciona una empresa…'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={String(company.id)}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
      )}

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

      {canPickCompany && state.clientType === 'COMPANY' && (
        <FormField label="Forma de pago">
          <Select
            value={state.paymentType}
            onValueChange={(v) => onChange({ paymentType: v as PaymentType })}
          >
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue>{PAYMENT_TYPE_LABEL[state.paymentType]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PAYMENT_TYPE_LABEL) as PaymentType[])
                .filter((type) => type !== 'EMPRESA_INTERNA')
                .map((type) => (
                  <SelectItem key={type} value={type} disabled={type === 'CREDITO_EMPRESA' && !state.selectedCompany}>
                    {PAYMENT_TYPE_LABEL[type]}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </FormField>
      )}

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
