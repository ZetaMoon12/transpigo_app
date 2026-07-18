import { useEffect, useState, type ReactElement } from 'react';
import { toast } from 'sonner';
import { UserRoundIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { serviciosService, type AvailableDriverForRequest } from '@/services/servicios.service';

interface AssignDriverDialogProps {
  serviceId: number;
  trigger: ReactElement;
  onAssigned: () => void;
}

export function AssignDriverDialog({ serviceId, trigger, onAssigned }: AssignDriverDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drivers, setDrivers] = useState<AvailableDriverForRequest[]>([]);
  const [driverId, setDriverId] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setDriverId('');
    serviciosService
      .availableDriversForRequest(serviceId)
      .then((res) => setDrivers(res.data))
      .catch(() => toast.error('No se pudieron cargar los conductores disponibles'))
      .finally(() => setLoading(false));
  }, [open, serviceId]);

  async function handleSubmit() {
    if (!driverId) return;
    setSaving(true);
    try {
      await serviciosService.assignDriver(serviceId, Number(driverId));
      toast.success('Conductor asignado correctamente');
      setOpen(false);
      onAssigned();
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'No se pudo asignar el conductor';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const selected = drivers.find((d) => String(d.id) === driverId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar conductor</DialogTitle>
          <DialogDescription>Selecciona un conductor disponible y compatible con este servicio.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <Skeleton className="h-10 w-full rounded-xl" />
          ) : drivers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-sm text-slate-500">
              No hay conductores disponibles con un vehículo compatible en este momento.
            </div>
          ) : (
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {selected ? `${selected.name} — ${selected.vehicle.plate}` : 'Selecciona un conductor'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={String(driver.id)}>
                    <div className="flex items-center gap-2">
                      <UserRoundIcon className="h-3.5 w-3.5 text-slate-400" />
                      <span>{driver.name}</span>
                      <span className="text-slate-400">· {driver.vehicle.plate}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!driverId || saving}
            className="bg-[#5AB507] hover:bg-[#5AB507]/90 text-white font-bold"
          >
            {saving ? 'Asignando...' : 'Asignar conductor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
