import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { tariffsService, getPricingMode, type Tariff } from '@/services/tariffs.service';
import { formatCurrency } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { TariffFormDialog } from './TariffFormDialog';
import { PlusIcon, MoreVerticalIcon, PencilIcon, PowerIcon } from 'lucide-react';

const SERVICE_TYPE_LABEL: Record<string, string> = {
  GRUA_AUXILIO_VIAL: 'Grúa / auxilio vial',
  TRANSPORTE_CARGA: 'Transporte de carga',
};

const VEHICLE_TYPE_LABEL: Record<string, string> = {
  TIPO_LIVIANO: 'Tipo liviano',
  CAMION_SENCILLO: 'Camión sencillo',
  DOBLE_TROQUE: 'Doble troque',
  GRUA_PLATAFORMA: 'Grúa plataforma',
  GRUA_ELEVADOR: 'Grúa elevador',
  GRUA_GANCHO_CADENA: 'Grúa gancho/cadena',
  GRUA_PLUMA: 'Grúa pluma',
  GRUA_CAMABAJA: 'Grúa cama baja',
};

const ZONE_TYPE_LABEL: Record<string, string> = {
  CIUDAD: 'Ciudad',
  FUERA_CIUDAD: 'Fuera de ciudad',
};

function PriceCell({ tariff }: { tariff: Tariff }) {
  const mode = getPricingMode(tariff.serviceType, tariff.zoneType);
  const cop = (value: string | null) => formatCurrency(Number(value ?? 0), 'COP', 'es-CO');

  if (mode === 'route-based') {
    return <span className="text-slate-400">Ver en Zonas</span>;
  }

  if (mode === 'fixed-additional') {
    return (
      <span>
        {cop(tariff.basePrice)} <span className="text-slate-400">+</span> {cop(tariff.additionalPrice)}
      </span>
    );
  }

  return (
    <span>
      {cop(tariff.basePrice)}
      {mode === 'fixed' && (
        <span className="ml-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">fijo</span>
      )}
    </span>
  );
}

export function TariffsTab() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
  const [deactivatingTariff, setDeactivatingTariff] = useState<Tariff | null>(null);

  function load() {
    setIsLoading(true);
    tariffsService
      .list()
      .then((res) => setTariffs(res.data))
      .catch(() => toast.error('No se pudieron cargar las tarifas'))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDeactivate() {
    if (!deactivatingTariff) return;
    const tariff = deactivatingTariff;

    try {
      await tariffsService.deactivate(tariff.id);
      setTariffs((prev) => prev.map((t) => (t.id === tariff.id ? { ...t, active: false } : t)));
      toast.success(`${tariff.name} fue desactivada`);
    } catch {
      toast.error('No se pudo desactivar la tarifa');
    } finally {
      setDeactivatingTariff(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <TariffFormDialog
          trigger={
            <Button>
              <PlusIcon /> Nueva tarifa
            </Button>
          }
          onSaved={(tariff) => setTariffs((prev) => [tariff, ...prev])}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : tariffs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
          Aún no tienes tarifas configuradas.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Precio/km</TableHead>
                <TableHead>Precio/ton</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tariffs.map((tariff) => (
                <TableRow key={tariff.id}>
                  <TableCell className="font-medium text-slate-800">{tariff.name}</TableCell>
                  <TableCell className="text-slate-500">
                    {SERVICE_TYPE_LABEL[tariff.serviceType] ?? tariff.serviceType}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {tariff.vehicleType ? VEHICLE_TYPE_LABEL[tariff.vehicleType] ?? tariff.vehicleType : 'Todos'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ZONE_TYPE_LABEL[tariff.zoneType] ?? tariff.zoneType}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    <PriceCell tariff={tariff} />
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {getPricingMode(tariff.serviceType, tariff.zoneType) === 'dynamic'
                      ? formatCurrency(Number(tariff.pricePerKm), 'COP', 'es-CO')
                      : '—'}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {getPricingMode(tariff.serviceType, tariff.zoneType) === 'dynamic'
                      ? formatCurrency(Number(tariff.pricePerTon), 'COP', 'es-CO')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge className={tariff.active ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-slate-500'}>
                      {tariff.active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm">
                            <MoreVerticalIcon />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTariff(tariff)}>
                          <PencilIcon /> Editar
                        </DropdownMenuItem>
                        {tariff.active && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeactivatingTariff(tariff)}
                          >
                            <PowerIcon /> Desactivar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TariffFormDialog
        open={editingTariff !== null}
        onOpenChange={(v) => !v && setEditingTariff(null)}
        tariff={editingTariff ?? undefined}
        onSaved={(updated) => {
          setTariffs((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          setEditingTariff(null);
        }}
      />

      <AlertDialog open={deactivatingTariff !== null} onOpenChange={(v) => !v && setDeactivatingTariff(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar {deactivatingTariff?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Dejará de usarse para cotizar nuevos servicios. Puedes reactivarla creando una nueva tarifa
              equivalente más adelante.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate}>Desactivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
