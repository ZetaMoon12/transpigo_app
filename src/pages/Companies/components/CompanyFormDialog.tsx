import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { toast } from 'sonner';
import { companiesService, type Company, type CompanyPlan } from '@/services/companies.service';
import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { PriceInput } from '@/components/price-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PLAN_OPTIONS: { value: CompanyPlan; label: string }[] = [
  { value: 'BASICO', label: 'Básico' },
  { value: 'EMPRESARIAL', label: 'Empresarial' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
];

interface CompanyFormDialogProps {
  /** Modo no controlado: se renderiza como disparador del diálogo. */
  trigger?: ReactElement;
  /** Modo controlado: útil para abrir el diálogo desde un ítem de menú externo. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  company?: Company;
  onSaved: (company: Company) => void;
}

export function CompanyFormDialog({
  trigger,
  open: openProp,
  onOpenChange,
  company,
  onSaved,
}: CompanyFormDialogProps) {
  const isEdit = !!company;
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [nit, setNit] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [plan, setPlan] = useState<CompanyPlan>('BASICO');
  const [creditLimit, setCreditLimit] = useState('0');

  useEffect(() => {
    if (!open) return;
    setName(company?.name ?? '');
    setNit(company?.nit ?? '');
    setContactEmail(company?.contactEmail ?? '');
    setContactPhone(company?.contactPhone ?? '');
    setAddress(company?.address ?? '');
    setPlan(company?.plan ?? 'BASICO');
    setCreditLimit(company?.creditLimit ?? '0');
  }, [open, company]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const shared = {
        name,
        contactEmail,
        contactPhone: contactPhone || undefined,
        address: address || undefined,
        plan,
        creditLimit: Number(creditLimit) || 0,
      };

      const res = isEdit
        ? await companiesService.update(company!.id, shared)
        : await companiesService.create({ ...shared, nit });

      onSaved(res.data);
      toast.success(isEdit ? 'Empresa actualizada' : 'Empresa creada correctamente');
      setOpen(false);
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'No se pudo guardar la empresa';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar empresa' : 'Nueva empresa'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Actualiza los datos de contacto y el plan de esta empresa.'
                : 'Registra una nueva empresa B2B cliente de tu operación.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <FormField label="Nombre" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </FormField>
            <FormField label="NIT" required>
              <Input
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                required
                disabled={isEdit}
              />
            </FormField>
            <FormField label="Email de contacto" required>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Teléfono de contacto">
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </FormField>
            <FormField label="Dirección">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </FormField>
            <FormField label="Plan">
              <Select value={plan} onValueChange={(v) => setPlan(v as CompanyPlan)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{PLAN_OPTIONS.find((option) => option.value === plan)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Límite de crédito (COP)">
              <PriceInput value={creditLimit} onChange={setCreditLimit} />
            </FormField>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
