import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FileDropInput } from '@/components/common';
import { FieldError } from '@/components/ui/field';
import { AttachmentType } from '@/types/driver-registration.types';

export function AttachmentStep() {
  const { register, control, formState: { errors } } = useFormContext<any>();

  const attachmentErrors = errors.attachment as any;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Información del Planchón / Remolque</h2>
        <p className="text-xs text-slate-500 font-medium">Ingresa los datos correspondientes al remolque o planchón acoplado a la grúa.</p>
      </div>

      {/* Grid: Datos del planchón */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tipo de Acople *</label>
          <select
            {...register('attachment.type')}
            className="h-9 w-full rounded-md border border-input bg-white dark:bg-input/30 px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Seleccione un tipo...</option>
            <option value={AttachmentType.PLANCHON}>Planchón</option>
            <option value={AttachmentType.REMOLQUE}>Remolque</option>
            <option value={AttachmentType.CARROCERIA}>Carrocería</option>
          </select>
          {attachmentErrors?.type && <FieldError>{attachmentErrors.type.message}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Capacidad de Carga (Toneladas) *</label>
          <Input type="number" step="0.01" {...register('attachment.maxWeightTons')} placeholder="Ej. 3.5" />
          {attachmentErrors?.maxWeightTons && <FieldError>{attachmentErrors.maxWeightTons.message}</FieldError>}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Documentos del planchón */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Documentación Técnica del Planchón</h3>
          <p className="text-xs text-slate-500 font-medium">Adjunta la tarjeta de propiedad y foto del planchón.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            name="attachment.tarjetaPropiedad"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Tarjeta de Propiedad / Registro del Planchón *"
                value={field.value}
                onChange={field.onChange}
                error={attachmentErrors?.tarjetaPropiedad?.message}
              />
            )}
          />

          <Controller
            name="attachment.fotoPlanchon"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Foto del Planchón / Remolque *"
                value={field.value}
                onChange={field.onChange}
                error={attachmentErrors?.fotoPlanchon?.message}
                accept="image/*"
                helperText="Fotografía clara del remolque acoplado"
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
