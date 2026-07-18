import { useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FileDropInput } from '@/components/common';
import { FieldError } from '@/components/ui/field';
import { VehicleType } from '@/types/driver-registration.types';
import { SearchIcon, XIcon } from 'lucide-react';

export function VehicleStep() {
  const { register, control, watch, formState: { errors } } = useFormContext<any>();

  const [typeSearch, setTypeSearch] = useState('');
  const [isTypeOpen, setIsTypeOpen] = useState(false);

  const vehicleErrors = errors.vehicle as any;
  const isPlateAnotherOwner = watch('vehicle.isPlateAnotherOwner');

  const vehicleOptions = [
    { value: VehicleType.TIPO_LIVIANO, label: 'Tipo Liviano' },
    { value: VehicleType.CAMION_SENCILLO, label: 'Camión Sencillo' },
    { value: VehicleType.DOBLE_TROQUE, label: 'Doble Troque' },
    { value: VehicleType.GRUA_PLATAFORMA, label: 'Grúa de plataforma' },
    { value: VehicleType.GRUA_ELEVADOR, label: 'Grúa con elevador' },
    { value: VehicleType.GRUA_GANCHO_CADENA, label: 'Grúa de gancho y cadena' },
    { value: VehicleType.GRUA_PLUMA, label: 'Grúa de pluma' },
    { value: VehicleType.GRUA_CAMABAJA, label: 'Grúa Camabaja' },
  ];

  const filteredOptions = vehicleOptions.filter((opt) =>
    opt.label.toLowerCase().includes(typeSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Información del Vehículo</h2>
        <p className="text-xs text-slate-500 font-medium">Ingresa los datos del vehículo y carga su documentación técnica e imágenes.</p>
      </div>

      {/* Grid: Datos del vehículo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Controller
          name="vehicle.type"
          control={control}
          render={({ field }) => {
            const selectedOpt = vehicleOptions.find((opt) => opt.value === field.value);
            
            return (
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tipo de Vehículo *
                </label>
                
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Buscar tipo de vehículo..."
                    value={selectedOpt ? selectedOpt.label : typeSearch}
                    onChange={(e) => {
                      if (field.value) {
                        field.onChange('');
                      }
                      setTypeSearch(e.target.value);
                      setIsTypeOpen(true);
                    }}
                    onFocus={() => setIsTypeOpen(true)}
                    className="h-9 w-full rounded-md border border-input bg-white px-2.5 pr-8 py-1 text-sm shadow-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 text-slate-800 animate-in"
                  />
                  {field.value ? (
                    <button
                      type="button"
                      onClick={() => {
                        field.onChange('');
                        setTypeSearch('');
                      }}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <XIcon className="w-4 h-4 stroke-[2]" />
                    </button>
                  ) : (
                    <span className="absolute right-2.5 text-slate-400 pointer-events-none">
                      <SearchIcon className="w-4 h-4" />
                    </span>
                  )}
                </div>

                {isTypeOpen && !field.value && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsTypeOpen(false)} />
                    <div className="absolute z-50 left-0 right-0 top-16 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredOptions.length === 0 ? (
                        <div className="p-3 text-xs text-slate-400 text-center font-medium">
                          No se encontraron resultados
                        </div>
                      ) : (
                        filteredOptions.map((opt) => (
                          <div
                            key={opt.value}
                            onClick={() => {
                              field.onChange(opt.value);
                              setTypeSearch('');
                              setIsTypeOpen(false);
                            }}
                            className="p-2.5 hover:bg-[#5AB507]/10 hover:text-slate-800 text-xs font-semibold text-slate-700 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                          >
                            {opt.label}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
                {vehicleErrors?.type && <FieldError>{vehicleErrors.type.message}</FieldError>}
              </div>
            );
          }}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Placa *</label>
          <Input
            {...register('vehicle.plate')}
            placeholder="Ej. AAA123"
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
          />
          {vehicleErrors?.plate && <FieldError>{vehicleErrors.plate.message}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Marca *</label>
          <Input {...register('vehicle.brand')} placeholder="Ej. Chevrolet, Hino" />
          {vehicleErrors?.brand && <FieldError>{vehicleErrors.brand.message}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Modelo *</label>
          <Input {...register('vehicle.model')} placeholder="Ej. NQR, Dutro" />
          {vehicleErrors?.model && <FieldError>{vehicleErrors.model.message}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Año de Fabricación *</label>
          <Input type="number" {...register('vehicle.year')} placeholder="Ej. 2018" />
          {vehicleErrors?.year && <FieldError>{vehicleErrors.year.message}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Capacidad de Carga (Toneladas) *</label>
          <Input type="number" step="0.01" {...register('vehicle.maxWeightTons')} placeholder="Ej. 4.5" />
          {vehicleErrors?.maxWeightTons && <FieldError>{vehicleErrors.maxWeightTons.message}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Color (Opcional)</label>
          <Input {...register('vehicle.color')} placeholder="Ej. Blanco" />
          {vehicleErrors?.color && <FieldError>{vehicleErrors.color.message}</FieldError>}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Empresa Satelital */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Credenciales de Empresa Satelital</h3>
          <p className="text-xs text-slate-500 font-medium">Información de rastreo GPS asignado al vehículo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Empresa Satelital (Opcional)</label>
            <Input {...register('vehicle.empresaSatelital.nombre')} placeholder="Ej. Satrack, Detektor" />
            {vehicleErrors?.empresaSatelital?.nombre && <FieldError>{vehicleErrors.empresaSatelital.nombre.message}</FieldError>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Usuario (Opcional)</label>
            <Input {...register('vehicle.empresaSatelital.usuario')} placeholder="Usuario GPS" />
            {vehicleErrors?.empresaSatelital?.usuario && <FieldError>{vehicleErrors.empresaSatelital.usuario.message}</FieldError>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Contraseña (Opcional)</label>
            <Input type="password" {...register('vehicle.empresaSatelital.contrasena')} placeholder="Contraseña GPS" />
            {vehicleErrors?.empresaSatelital?.contrasena && <FieldError>{vehicleErrors.empresaSatelital.contrasena.message}</FieldError>}
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Condicional de Propietario (Matrícula a nombre de otro) */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('vehicle.isPlateAnotherOwner')}
            className="w-4.5 h-4.5 text-[#5AB507] border-slate-300 rounded-sm focus:ring-[#5AB507]/20"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-700">¿La matrícula está a nombre de otra persona?</span>
            <span className="text-xs text-slate-500 font-medium">Marca esta opción si el propietario legal no coincide con el registrado en la tarjeta de propiedad.</span>
          </div>
        </label>

        {isPlateAnotherOwner && (
          <div className="pt-2 animate-in slide-in-from-top-2 duration-200">
            <Controller
              name="vehicle.cartaAutorizacion"
              control={control}
              render={({ field }) => (
                <FileDropInput
                  label="Carta de Autorización / Contrato de Arrendamiento *"
                  value={field.value}
                  onChange={field.onChange}
                  error={vehicleErrors?.cartaAutorizacion?.message}
                  helperText="Adjuntar la autorización firmada por el propietario en la matrícula"
                />
              )}
            />
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* Documentos Legales del Vehículo */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Documentos Técnicos y Obligatorios</h3>
          <p className="text-xs text-slate-500 font-medium">Adjunta las imágenes de las tarjetas y los seguros obligatorios vigentes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            name="vehicle.matriculaFrente"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Tarjeta de Propiedad / Matrícula (Frente) *"
                value={field.value}
                onChange={field.onChange}
                error={vehicleErrors?.matriculaFrente?.message}
              />
            )}
          />

          <Controller
            name="vehicle.matriculaReverso"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Tarjeta de Propiedad / Matrícula (Reverso) *"
                value={field.value}
                onChange={field.onChange}
                error={vehicleErrors?.matriculaReverso?.message}
              />
            )}
          />

          <Controller
            name="vehicle.soat"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="SOAT Vigente *"
                value={field.value}
                onChange={field.onChange}
                error={vehicleErrors?.soat?.message}
                helperText="Archivo PDF o imagen del SOAT"
              />
            )}
          />

          <Controller
            name="vehicle.tecnomecanica"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Revisión Tecnomecánica *"
                value={field.value}
                onChange={field.onChange}
                error={vehicleErrors?.tecnomecanica?.message}
              />
            )}
          />

          <Controller
            name="vehicle.seguroResponsabilidadCivil"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Seguro de Responsabilidad Civil Extracontractual (Opcional)"
                value={field.value}
                onChange={field.onChange}
                error={vehicleErrors?.seguroResponsabilidadCivil?.message}
                helperText="Póliza de seguros vigente"
              />
            )}
          />
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Fotos del Vehículo */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Registro Fotográfico del Vehículo</h3>
          <p className="text-xs text-slate-500 font-medium">Adjunta fotografías claras de los cuatro costados del vehículo (solo imágenes).</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            name="vehicle.fotoFrontal"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Foto Frontal *"
                value={field.value}
                onChange={field.onChange}
                error={vehicleErrors?.fotoFrontal?.message}
                accept="image/*"
                helperText="Fotografía del frente del camión/grúa"
              />
            )}
          />

          <Controller
            name="vehicle.fotoTrasera"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Foto Trasera *"
                value={field.value}
                onChange={field.onChange}
                error={vehicleErrors?.fotoTrasera?.message}
                accept="image/*"
                helperText="Fotografía de la parte trasera"
              />
            )}
          />

          <Controller
            name="vehicle.fotoLateralIzquierda"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Foto Lateral Izquierda *"
                value={field.value}
                onChange={field.onChange}
                error={vehicleErrors?.fotoLateralIzquierda?.message}
                accept="image/*"
              />
            )}
          />

          <Controller
            name="vehicle.fotoLateralDerecha"
            control={control}
            render={({ field }) => (
              <FileDropInput
                label="Foto Lateral Derecha *"
                value={field.value}
                onChange={field.onChange}
                error={vehicleErrors?.fotoLateralDerecha?.message}
                accept="image/*"
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
