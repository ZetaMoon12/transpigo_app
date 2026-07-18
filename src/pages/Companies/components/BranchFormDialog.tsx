import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { toast } from 'sonner';
import { companiesService, type CompanyBranch } from '@/services/companies.service';
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

interface BranchFormDialogProps {
  companyId: number;
  trigger?: ReactElement;
  branch?: CompanyBranch;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved: (branch: CompanyBranch) => void;
}

export function BranchFormDialog({
  companyId,
  trigger,
  branch,
  open: openProp,
  onOpenChange,
  onSaved,
}: BranchFormDialogProps) {
  const isEdit = !!branch;
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(branch?.name ?? '');
    setCity(branch?.city ?? '');
    setAddress(branch?.address ?? '');
  }, [open, branch]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const input = { name, city, address: address || undefined };
      const res = isEdit
        ? await companiesService.updateBranch(companyId, branch!.id, input)
        : await companiesService.createBranch(companyId, input);

      onSaved(res.data);
      toast.success(isEdit ? 'Sucursal actualizada' : 'Sucursal creada correctamente');
      setOpen(false);
    } catch {
      toast.error('No se pudo guardar la sucursal');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar sucursal' : 'Nueva sucursal'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'Actualiza los datos de esta sede.' : 'Agrega una nueva sede para esta empresa.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-4">
            <FormField label="Nombre" required>
              <Input
                placeholder="Ej. Sede Bogotá"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Ciudad" required>
              <Input value={city} onChange={(e) => setCity(e.target.value)} required />
            </FormField>
            <FormField label="Dirección">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
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
