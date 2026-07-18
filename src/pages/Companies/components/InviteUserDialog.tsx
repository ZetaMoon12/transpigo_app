import { useState, type FormEvent, type ReactElement } from 'react';
import { toast } from 'sonner';
import { companiesService, type CompanyUser, type CompanyUserRole } from '@/services/companies.service';
import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
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

const ROLE_OPTIONS: { value: CompanyUserRole; label: string }[] = [
  { value: 'COMPANY_USER', label: 'Usuario — solo crea solicitudes' },
  { value: 'COMPANY_ADMIN', label: 'Administrador — gestiona la empresa' },
];

interface InviteUserDialogProps {
  companyId: number;
  trigger: ReactElement;
  onInvited: (user: CompanyUser) => void;
}

export function InviteUserDialog({ companyId, trigger, onInvited }: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CompanyUserRole>('COMPANY_USER');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await companiesService.inviteUser(companyId, { name, email, role });
      onInvited(res.data);
      toast.success(`Invitación enviada a ${email}`);
      setOpen(false);
      setName('');
      setEmail('');
      setRole('COMPANY_USER');
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'No se pudo enviar la invitación';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invitar usuario</DialogTitle>
            <DialogDescription>
              Se enviará un correo con una contraseña temporal para que pueda ingresar.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-4">
            <FormField label="Nombre completo" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </FormField>
            <FormField label="Correo electrónico" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Rol">
              <Select value={role} onValueChange={(v) => setRole(v as CompanyUserRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{ROLE_OPTIONS.find((option) => option.value === role)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enviando...' : 'Enviar invitación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
