import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FileDropInput } from '@/components/common';
import { FieldError } from '@/components/ui/field';
import { CopyIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function OwnerStep() {
  const { register, control, getValues, setValue, formState: { errors } } = useFormContext<any>();

  const ownerErrors = errors.owner as any;

  const handleCopyFromDriver = () => {
    const driverData = getValues('driver');
    if (!driverData) {
      toast.error('No hay datos del conductor disponibles para copiar');
      return;
    }

    // Copiar campos correspondientes
    if (driverData.city) setValue('owner.municipality', driverData.city, { shouldValidate: true });
    if (driverData.neighborhood) setValue('owner.neighborhood', driverData.neighborhood, { shouldValidate: true });
    if (driverData.address) setValue('owner.address', driverData.address, { shouldValidate: true });
    if (driverData.phone) setValue('owner.phone', driverData.phone, { shouldValidate: true });
    if (driverData.email) setValue('owner.email', driverData.email, { shouldValidate: true });
    
    // Copiar archivos si existen
    if (driverData.fotoCedulaFrente) setValue('owner.fotoCedulaFrente', driverData.fotoCedulaFrente, { shouldValidate: true });
    if (driverData.fotoCedulaReverso) setValue('owner.fotoCedulaReverso', driverData.fotoCedulaReverso, { shouldValidate: true });

    toast.success('Datos copiados del conductor exitosamente');
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Información del Propietario</h2>
          <p className="text-xs text-slate-500 font-medium">Ingresa los datos del dueño legal del vehículo y su información de facturación.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyFromDriver}
          className="border-slate-200 text-slate-700 font-medium flex items-center gap-1.5 self-start sm:self-auto hover:bg-slate-50"
        >
          <CopyIcon className="w-3.5 h-3.5" />
          <span>Es el mismo Conductor</span>
        </Button>
      </div>

      {/* Grid: Datos del propietario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Municipio/Ciudad *</label>
          <Input {...register('owner.municipality')} placeholder="Ej. Medellín" />
          {ownerErrors?.municipality && <FieldError>{ownerErrors.municipality.message}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Barrio *</label>
          <Input {...register('owner.neighborhood')} placeholder="Ej. El Poblado" />
          {ownerErrors?.neighborhood && <FieldError>{ownerErrors.neighborhood.message}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dirección *</label>
          <Input {...register('owner.address')} placeholder="Ej. Carrera 43A # 1-50" />
          {ownerErrors?.address && <FieldError>{ownerErrors.address.message}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Teléfono de Contacto *</label>
          <Input {...register('owner.phone')} placeholder="Ej. 3109876543" />
          {ownerErrors?.phone && <FieldError>{ownerErrors.phone.message}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Correo Electrónico *</label>
          <Input type="email" {...register('owner.email')} placeholder="Ej. propietario@example.com" />
          {ownerErrors?.email && <FieldError>{ownerErrors.email.message}</FieldError>}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Documentos del Propietario */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Documentos del Propietario</h3>
          <p className="text-xs text-slate-500 font-medium">Adjunta los certificados y documentos de identidad. Todos los archivos son obligatorios.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            name="owner.fotoCedulaFrente"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Cédula del Propietario (Frente) *"
                value={field.value}
                onChange={field.onChange}
                error={ownerErrors?.fotoCedulaFrente?.message}
              />
            )}
          />

          <Controller
            name="owner.fotoCedulaReverso"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Cédula del Propietario (Reverso) *"
                value={field.value}
                onChange={field.onChange}
                error={ownerErrors?.fotoCedulaReverso?.message}
              />
            )}
          />

          <Controller
            name="owner.rut"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Registro Único Tributario (RUT) *"
                value={field.value}
                onChange={field.onChange}
                error={ownerErrors?.rut?.message}
                helperText="Cargar archivo PDF o Imagen de máximo 5MB"
              />
            )}
          />

          <Controller
            name="owner.certificadoBancario"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Certificación Bancaria *"
                value={field.value}
                onChange={field.onChange}
                error={ownerErrors?.certificadoBancario?.message}
                helperText="Cargar archivo PDF o Imagen de máximo 5MB"
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
