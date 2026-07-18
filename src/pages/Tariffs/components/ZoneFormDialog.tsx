import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { toast } from 'sonner';
import { zonesService, type Zone } from '@/services/zones.service';
import { VEHICLE_TYPES_BY_SERVICE, type ZoneType, type VehicleType } from '@/services/tariffs.service';
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

const ZONE_TYPE_OPTIONS: { value: ZoneType; label: string }[] = [
  { value: 'FUERA_CIUDAD', label: 'Fuera de la ciudad (ruta entre ciudades)' },
  { value: 'CIUDAD', label: 'Dentro de la ciudad (tarifa plana)' },
];

const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  TIPO_LIVIANO: 'Tipo liviano',
  CAMION_SENCILLO: 'Camión sencillo',
  DOBLE_TROQUE: 'Doble troque',
  GRUA_PLATAFORMA: 'Grúa plataforma',
  GRUA_ELEVADOR: 'Grúa elevador',
  GRUA_GANCHO_CADENA: 'Grúa gancho/cadena',
  GRUA_PLUMA: 'Grúa pluma',
  GRUA_CAMABAJA: 'Grúa cama baja',
};

// Las zonas solo se usan hoy para transporte de carga entre ciudades (el precio de grúa
// fuera de ciudad es tarifa base + adicional, configurado directamente en Tarifas).
const VEHICLE_TYPE_OPTIONS = VEHICLE_TYPES_BY_SERVICE.TRANSPORTE_CARGA;

interface ZoneFormDialogProps {
  trigger?: ReactElement;
  zone?: Zone;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved: (zone: Zone) => void;
}

export function ZoneFormDialog({ trigger, zone, open: openProp, onOpenChange, onSaved }: ZoneFormDialogProps) {
  const isEdit = !!zone;
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<ZoneType>('FUERA_CIUDAD');
  const [vehicleType, setVehicleType] = useState<VehicleType>(VEHICLE_TYPE_OPTIONS[0]);
  const [originCity, setOriginCity] = useState('');
  const [destCity, setDestCity] = useState('');
  const [fixedPrice, setFixedPrice] = useState('0');

  useEffect(() => {
    if (!open) return;
    setName(zone?.name ?? '');
    setType(zone?.type ?? 'FUERA_CIUDAD');
    setVehicleType(zone?.vehicleType ?? VEHICLE_TYPE_OPTIONS[0]);
    setOriginCity(zone?.originCity ?? '');
    setDestCity(zone?.destCity ?? '');
    setFixedPrice(zone?.fixedPrice ?? '0');
  }, [open, zone]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (type === 'FUERA_CIUDAD' && !destCity.trim()) {
      toast.error('La ciudad de destino es requerida para zonas fuera de la ciudad');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        type,
        vehicleType,
        originCity,
        destCity: destCity.trim() || undefined,
        fixedPrice: Number(fixedPrice) || 0,
      };

      const res = isEdit
        ? await zonesService.update(zone!.id, payload)
        : await zonesService.create(payload);

      onSaved(res.data);
      toast.success(isEdit ? 'Zona actualizada' : 'Zona creada correctamente');
      setOpen(false);
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'No se pudo guardar la zona';
      toast.error(message);
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
            <DialogTitle>{isEdit ? 'Editar zona' : 'Nueva zona'}</DialogTitle>
            <DialogDescription>
              Precio fijo por ruta y tipo de vehículo para transporte de carga entre ciudades.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-4">
            <FormField label="Nombre" required>
              <Input
                placeholder="Ej. Bogotá → Medellín"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Tipo de zona">
                <Select value={type} onValueChange={(v) => setType(v as ZoneType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{ZONE_TYPE_OPTIONS.find((option) => option.value === type)?.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ZONE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Tipo de vehículo" required>
                <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{VEHICLE_TYPE_LABEL[vehicleType]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPE_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {VEHICLE_TYPE_LABEL[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Ciudad de origen" required>
                <Input value={originCity} onChange={(e) => setOriginCity(e.target.value)} required />
              </FormField>
              <FormField label="Ciudad de destino" required={type === 'FUERA_CIUDAD'}>
                <Input
                  value={destCity}
                  onChange={(e) => setDestCity(e.target.value)}
                  required={type === 'FUERA_CIUDAD'}
                />
              </FormField>
            </div>
            <FormField label="Precio fijo (COP)" required>
              <PriceInput value={fixedPrice} onChange={setFixedPrice} required />
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
