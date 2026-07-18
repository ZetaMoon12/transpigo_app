import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { toast } from 'sonner';
import {
  tariffsService,
  getPricingMode,
  VEHICLE_TYPES_BY_SERVICE,
  type Tariff,
  type ServiceType,
  type VehicleType,
  type ZoneType,
} from '@/services/tariffs.service';
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

const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'GRUA_AUXILIO_VIAL', label: 'Grúa / auxilio vial' },
  { value: 'TRANSPORTE_CARGA', label: 'Transporte de carga' },
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

const ZONE_TYPE_OPTIONS: { value: ZoneType; label: string }[] = [
  { value: 'CIUDAD', label: 'Dentro de la ciudad' },
  { value: 'FUERA_CIUDAD', label: 'Fuera de la ciudad' },
];

const ANY_VEHICLE = '__any__';

interface TariffFormDialogProps {
  trigger?: ReactElement;
  tariff?: Tariff;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved: (tariff: Tariff) => void;
}

export function TariffFormDialog({
  trigger,
  tariff,
  open: openProp,
  onOpenChange,
  onSaved,
}: TariffFormDialogProps) {
  const isEdit = !!tariff;
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('GRUA_AUXILIO_VIAL');
  const [vehicleType, setVehicleType] = useState<string>(ANY_VEHICLE);
  const [zoneType, setZoneType] = useState<ZoneType>('CIUDAD');
  const [basePrice, setBasePrice] = useState('0');
  const [additionalPrice, setAdditionalPrice] = useState('0');
  const [pricePerKm, setPricePerKm] = useState('0');
  const [pricePerTon, setPricePerTon] = useState('0');
  const [kmLimit, setKmLimit] = useState('');
  const [overageKmStep, setOverageKmStep] = useState('');
  const [overagePricePerKm, setOveragePricePerKm] = useState('');
  const [weightLimitTons, setWeightLimitTons] = useState('');
  const [overageWeightStep, setOverageWeightStep] = useState('');
  const [overagePricePerTon, setOveragePricePerTon] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(tariff?.name ?? '');
    setServiceType(tariff?.serviceType ?? 'GRUA_AUXILIO_VIAL');
    setVehicleType(tariff?.vehicleType ?? ANY_VEHICLE);
    setZoneType(tariff?.zoneType ?? 'CIUDAD');
    setBasePrice(tariff?.basePrice ?? '0');
    setAdditionalPrice(tariff?.additionalPrice ?? '0');
    setPricePerKm(tariff?.pricePerKm ?? '0');
    setPricePerTon(tariff?.pricePerTon ?? '0');
    setKmLimit(tariff?.kmLimit ?? '');
    setOverageKmStep(tariff?.overageKmStep ?? '');
    setOveragePricePerKm(tariff?.overagePricePerKm ?? '');
    setWeightLimitTons(tariff?.weightLimitTons ?? '');
    setOverageWeightStep(tariff?.overageWeightStep ?? '');
    setOveragePricePerTon(tariff?.overagePricePerTon ?? '');
  }, [open, tariff]);

  const availableVehicleTypes = VEHICLE_TYPES_BY_SERVICE[serviceType];

  function handleServiceTypeChange(value: ServiceType) {
    setServiceType(value);
    if (vehicleType !== ANY_VEHICLE && !VEHICLE_TYPES_BY_SERVICE[value].includes(vehicleType as VehicleType)) {
      setVehicleType(ANY_VEHICLE);
    }
  }

  const pricingMode = getPricingMode(serviceType, zoneType);
  const kmOverageIncomplete = pricingMode === 'dynamic' && !!kmLimit && (!overageKmStep || !overagePricePerKm);
  const weightOverageIncomplete =
    pricingMode === 'dynamic' && !!weightLimitTons && (!overageWeightStep || !overagePricePerTon);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (kmOverageIncomplete || weightOverageIncomplete) {
      toast.error('Si defines un límite de KM o de peso, también debes definir el step y el precio de excedente');
      return;
    }

    setSaving(true);
    try {
      const isDynamic = pricingMode === 'dynamic';
      const payload = {
        name,
        serviceType,
        vehicleType: vehicleType === ANY_VEHICLE ? undefined : (vehicleType as VehicleType),
        zoneType,
        basePrice: pricingMode === 'route-based' ? 0 : Number(basePrice) || 0,
        additionalPrice: pricingMode === 'fixed-additional' ? Number(additionalPrice) || 0 : undefined,
        pricePerKm: isDynamic ? Number(pricePerKm) || 0 : undefined,
        pricePerTon: isDynamic ? Number(pricePerTon) || 0 : undefined,
        kmLimit: isDynamic && kmLimit ? Number(kmLimit) : undefined,
        overageKmStep: isDynamic && overageKmStep ? Number(overageKmStep) : undefined,
        overagePricePerKm: isDynamic && overagePricePerKm ? Number(overagePricePerKm) : undefined,
        weightLimitTons: isDynamic && weightLimitTons ? Number(weightLimitTons) : undefined,
        overageWeightStep: isDynamic && overageWeightStep ? Number(overageWeightStep) : undefined,
        overagePricePerTon: isDynamic && overagePricePerTon ? Number(overagePricePerTon) : undefined,
      };

      const res = isEdit
        ? await tariffsService.update(tariff!.id, payload)
        : await tariffsService.create(payload);

      onSaved(res.data);
      toast.success(isEdit ? 'Tarifa actualizada' : 'Tarifa creada correctamente');
      setOpen(false);
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'No se pudo guardar la tarifa';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const DESCRIPTION_BY_MODE: Record<typeof pricingMode, string> = {
    fixed: 'Dentro de la ciudad el precio es fijo, sin cálculo por distancia ni peso.',
    'fixed-additional':
      'Para grúa entre ciudades el precio es una tarifa base más un adicional, ambos por tipo de vehículo.',
    dynamic: 'Configura el precio base y los excedentes por distancia y peso.',
    'route-based':
      'El precio para transporte de carga entre ciudades se define por ruta y tipo de vehículo en la pestaña Zonas.',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-2xl lg:max-w-3xl">
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar tarifa' : 'Nueva tarifa'}</DialogTitle>
            <DialogDescription>{DESCRIPTION_BY_MODE[pricingMode]}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Nombre" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </FormField>
              <FormField label="Tipo de servicio" required>
                <Select value={serviceType} onValueChange={(v) => handleServiceTypeChange(v as ServiceType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {SERVICE_TYPE_OPTIONS.find((option) => option.value === serviceType)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Tipo de vehículo">
                <Select value={vehicleType} onValueChange={(v) => setVehicleType(v ?? ANY_VEHICLE)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {vehicleType === ANY_VEHICLE ? 'Todos los tipos' : VEHICLE_TYPE_LABEL[vehicleType as VehicleType]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_VEHICLE}>Todos los tipos</SelectItem>
                    {availableVehicleTypes.map((value) => (
                      <SelectItem key={value} value={value}>
                        {VEHICLE_TYPE_LABEL[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Zona">
                <Select value={zoneType} onValueChange={(v) => setZoneType(v as ZoneType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {ZONE_TYPE_OPTIONS.find((option) => option.value === zoneType)?.label}
                    </SelectValue>
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
            </div>

            {pricingMode === 'fixed' && (
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Precio fijo
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="Precio fijo (COP)" required>
                    <PriceInput value={basePrice} onChange={setBasePrice} required />
                  </FormField>
                </div>
              </div>
            )}

            {pricingMode === 'fixed-additional' && (
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tarifa base + adicional
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="Precio base (COP)" required>
                    <PriceInput value={basePrice} onChange={setBasePrice} required />
                  </FormField>
                  <FormField label="Precio adicional (COP)" required>
                    <PriceInput value={additionalPrice} onChange={setAdditionalPrice} required />
                  </FormField>
                </div>
              </div>
            )}

            {pricingMode === 'route-based' && (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-500">
                Este vehículo no tiene precio propio aquí — configura el precio por ruta en la pestaña{' '}
                <span className="font-semibold text-slate-700">Zonas</span>.
              </div>
            )}

            {pricingMode === 'dynamic' && (
              <>
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Precio base
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Precio base (COP)" required>
                      <PriceInput value={basePrice} onChange={setBasePrice} required />
                    </FormField>
                    <FormField label="Precio por KM" required>
                      <PriceInput value={pricePerKm} onChange={setPricePerKm} required />
                    </FormField>
                    <FormField label="Precio por tonelada" required>
                      <PriceInput value={pricePerTon} onChange={setPricePerTon} required />
                    </FormField>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Excedente por distancia (opcional)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Límite KM incluidos">
                      <Input type="number" min={0} step="0.01" value={kmLimit} onChange={(e) => setKmLimit(e.target.value)} />
                    </FormField>
                    <FormField label="Cada cuántos KM" error={kmOverageIncomplete ? 'Requerido' : undefined}>
                      <Input type="number" min={0.1} step="0.01" value={overageKmStep} onChange={(e) => setOverageKmStep(e.target.value)} />
                    </FormField>
                    <FormField label="Precio por KM excedente" error={kmOverageIncomplete ? 'Requerido' : undefined}>
                      <PriceInput value={overagePricePerKm} onChange={setOveragePricePerKm} />
                    </FormField>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Excedente por peso (opcional)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Toneladas incluidas">
                      <Input type="number" min={0} step="0.01" value={weightLimitTons} onChange={(e) => setWeightLimitTons(e.target.value)} />
                    </FormField>
                    <FormField label="Cada cuántas toneladas" error={weightOverageIncomplete ? 'Requerido' : undefined}>
                      <Input type="number" min={0.1} step="0.01" value={overageWeightStep} onChange={(e) => setOverageWeightStep(e.target.value)} />
                    </FormField>
                    <FormField label="Precio por tonelada excedente" error={weightOverageIncomplete ? 'Requerido' : undefined}>
                      <PriceInput value={overagePricePerTon} onChange={setOveragePricePerTon} />
                    </FormField>
                  </div>
                </div>
              </>
            )}
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
