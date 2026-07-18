import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FileDropInput } from '@/components/common';
import { FieldError } from '@/components/ui/field';

export function DriverStep() {
  const { register, control, formState: { errors } } = useFormContext<any>();

  const driverErrors = errors.driver as any;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Información del Conductor</h2>
        <p className="text-xs text-slate-500 font-medium">Ingresa los datos personales, referencias y carga la documentación requerida.</p>
      </div>

      {/* Grid: Datos personales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nombre Completo *</label>
          <Input {...register('driver.name')} placeholder="Ej. Juan Pérez" />
          {driverErrors?.name && <FieldError>{driverErrors.name.message}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Número de Cédula *</label>
          <Input {...register('driver.cedulaNumero')} placeholder="Ej. 10203040" />
          {driverErrors?.cedulaNumero && <FieldError>{driverErrors.cedulaNumero.message}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Correo Electrónico *</label>
          <Input type="email" {...register('driver.email')} placeholder="Ej. juan.perez@example.com" />
          {driverErrors?.email && <FieldError>{driverErrors.email.message}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Teléfono de Contacto *</label>
          <Input {...register('driver.phone')} placeholder="Ej. 3001234567" />
          {driverErrors?.phone && <FieldError>{driverErrors.phone.message}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ciudad *</label>
          <Input {...register('driver.city')} placeholder="Ej. Bogotá" />
          {driverErrors?.city && <FieldError>{driverErrors.city.message}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Barrio *</label>
          <Input {...register('driver.neighborhood')} placeholder="Ej. Teusaquillo" />
          {driverErrors?.neighborhood && <FieldError>{driverErrors.neighborhood.message}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dirección de Residencia *</label>
          <Input {...register('driver.address')} placeholder="Ej. Calle 45 # 13-22 Apto 301" />
          {driverErrors?.address && <FieldError>{driverErrors.address.message}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Vencimiento de Licencia *</label>
          <Input type="date" {...register('driver.licenciaVencimiento')} />
          {driverErrors?.licenciaVencimiento && <FieldError>{driverErrors.licenciaVencimiento.message}</FieldError>}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Referencias Familiares */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Referencias Familiares (Mínimo 2)</h3>
          <p className="text-xs text-slate-500 font-medium">Especifica dos contactos familiares directos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1].map((index) => (
            <div key={index} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-[#0B1E36] uppercase tracking-wider">Familiar #{index + 1}</h4>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nombre Completo *</label>
                <Input {...register(`driver.referenciasFamiliares.${index}.nombre`)} placeholder="Nombre del familiar" />
                {driverErrors?.referenciasFamiliares?.[index]?.nombre && (
                  <FieldError>{driverErrors.referenciasFamiliares[index].nombre.message}</FieldError>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Parentesco *</label>
                  <Input {...register(`driver.referenciasFamiliares.${index}.parentesco`)} placeholder="Ej. Padre, Hermano" />
                  {driverErrors?.referenciasFamiliares?.[index]?.parentesco && (
                    <FieldError>{driverErrors.referenciasFamiliares[index].parentesco.message}</FieldError>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Celular *</label>
                  <Input {...register(`driver.referenciasFamiliares.${index}.celular`)} placeholder="Ej. 3001234567" />
                  {driverErrors?.referenciasFamiliares?.[index]?.celular && (
                    <FieldError>{driverErrors.referenciasFamiliares[index].celular.message}</FieldError>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Referencias Laborales */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Referencias Laborales (Mínimo 2)</h3>
          <p className="text-xs text-slate-500 font-medium">Especifica dos contactos de trabajos anteriores o referencias comerciales.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1].map((index) => (
            <div key={index} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-[#0B1E36] uppercase tracking-wider">Referencia #{index + 1}</h4>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nombre de Empresa *</label>
                <Input {...register(`driver.referenciasLaborales.${index}.empresa`)} placeholder="Nombre de la empresa" />
                {driverErrors?.referenciasLaborales?.[index]?.empresa && (
                  <FieldError>{driverErrors.referenciasLaborales[index].empresa.message}</FieldError>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Contacto *</label>
                  <Input {...register(`driver.referenciasLaborales.${index}.contacto`)} placeholder="Nombre de contacto" />
                  {driverErrors?.referenciasLaborales?.[index]?.contacto && (
                    <FieldError>{driverErrors.referenciasLaborales[index].contacto.message}</FieldError>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Celular *</label>
                  <Input {...register(`driver.referenciasLaborales.${index}.celular`)} placeholder="Ej. 3001234567" />
                  {driverErrors?.referenciasLaborales?.[index]?.celular && (
                    <FieldError>{driverErrors.referenciasLaborales[index].celular.message}</FieldError>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Documentos del Conductor */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Carga de Documentos</h3>
          <p className="text-xs text-slate-500 font-medium">Adjunta las imágenes o archivos PDF correspondientes. Cada archivo debe pesar menos de 5MB.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            name="driver.fotoDocumento"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Foto de Perfil (tipo documento) *"
                value={field.value}
                onChange={field.onChange}
                error={driverErrors?.fotoDocumento?.message}
                helperText="Solo formato de imagen (sin gorra ni gafas, fondo claro)"
                accept="image/*"
              />
            )}
          />

          <Controller
            name="driver.planillaSeguridadSocial"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Planilla de Seguridad Social *"
                value={field.value}
                onChange={field.onChange}
                error={driverErrors?.planillaSeguridadSocial?.message}
                helperText="Formato PDF o imagen"
              />
            )}
          />

          <Controller
            name="driver.fotoCedulaFrente"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Cédula de Ciudadanía (Frente) *"
                value={field.value}
                onChange={field.onChange}
                error={driverErrors?.fotoCedulaFrente?.message}
              />
            )}
          />

          <Controller
            name="driver.fotoCedulaReverso"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Cédula de Ciudadanía (Reverso) *"
                value={field.value}
                onChange={field.onChange}
                error={driverErrors?.fotoCedulaReverso?.message}
              />
            )}
          />

          <Controller
            name="driver.fotoLicenciaFrente"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Licencia de Conducción (Frente) *"
                value={field.value}
                onChange={field.onChange}
                error={driverErrors?.fotoLicenciaFrente?.message}
              />
            )}
          />

          <Controller
            name="driver.fotoLicenciaReverso"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Licencia de Conducción (Reverso) *"
                value={field.value}
                onChange={field.onChange}
                error={driverErrors?.fotoLicenciaReverso?.message}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
