import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { zonesService, type Zone } from '@/services/zones.service';
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
import { ZoneFormDialog } from './ZoneFormDialog';
import { PlusIcon, MoreVerticalIcon, PencilIcon, PowerIcon } from 'lucide-react';

const ZONE_TYPE_LABEL: Record<string, string> = {
  CIUDAD: 'Ciudad',
  FUERA_CIUDAD: 'Fuera de ciudad',
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

export function ZonesTab() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [deactivatingZone, setDeactivatingZone] = useState<Zone | null>(null);

  function load() {
    setIsLoading(true);
    zonesService
      .list()
      .then((res) => setZones(res.data))
      .catch(() => toast.error('No se pudieron cargar las zonas'))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDeactivate() {
    if (!deactivatingZone) return;
    const zone = deactivatingZone;

    try {
      await zonesService.deactivate(zone.id);
      setZones((prev) => prev.map((z) => (z.id === zone.id ? { ...z, active: false } : z)));
      toast.success(`${zone.name} fue desactivada`);
    } catch {
      toast.error('No se pudo desactivar la zona');
    } finally {
      setDeactivatingZone(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ZoneFormDialog
          trigger={
            <Button>
              <PlusIcon /> Nueva zona
            </Button>
          }
          onSaved={(zone) => setZones((prev) => [zone, ...prev])}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : zones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
          Aún no tienes zonas configuradas.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Precio fijo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium text-slate-800">{zone.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ZONE_TYPE_LABEL[zone.type] ?? zone.type}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {zone.vehicleType ? VEHICLE_TYPE_LABEL[zone.vehicleType] ?? zone.vehicleType : '—'}
                  </TableCell>
                  <TableCell className="text-slate-500">{zone.originCity ?? '—'}</TableCell>
                  <TableCell className="text-slate-500">{zone.destCity ?? '—'}</TableCell>
                  <TableCell className="text-slate-500">
                    {formatCurrency(Number(zone.fixedPrice), 'COP', 'es-CO')}
                  </TableCell>
                  <TableCell>
                    <Badge className={zone.active ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-slate-500'}>
                      {zone.active ? 'Activa' : 'Inactiva'}
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
                        <DropdownMenuItem onClick={() => setEditingZone(zone)}>
                          <PencilIcon /> Editar
                        </DropdownMenuItem>
                        {zone.active && (
                          <DropdownMenuItem variant="destructive" onClick={() => setDeactivatingZone(zone)}>
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

      <ZoneFormDialog
        open={editingZone !== null}
        onOpenChange={(v) => !v && setEditingZone(null)}
        zone={editingZone ?? undefined}
        onSaved={(updated) => {
          setZones((prev) => prev.map((z) => (z.id === updated.id ? updated : z)));
          setEditingZone(null);
        }}
      />

      <AlertDialog open={deactivatingZone !== null} onOpenChange={(v) => !v && setDeactivatingZone(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar {deactivatingZone?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              La ruta dejará de tener tarifa fija y pasará a cotizarse con el cálculo dinámico si aplica.
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
