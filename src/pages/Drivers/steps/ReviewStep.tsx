import { useFormContext } from 'react-hook-form';
import { Edit2Icon, PrinterIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { VehicleType } from '@/types/driver-registration.types';

interface ReviewStepProps {
  onEditStep: (step: number) => void;
}

export function ReviewStep({ onEditStep }: ReviewStepProps) {
  const { getValues } = useFormContext<any>();
  const data = getValues();

  const isCrane =
    data.vehicle?.type === VehicleType.GRUA_PLATAFORMA ||
    data.vehicle?.type === VehicleType.GRUA_ELEVADOR ||
    data.vehicle?.type === VehicleType.GRUA_GANCHO_CADENA ||
    data.vehicle?.type === VehicleType.GRUA_PLUMA ||
    data.vehicle?.type === VehicleType.GRUA_CAMABAJA;

  const getVehicleTypeName = (type?: string) => {
    switch (type) {
      case VehicleType.TIPO_LIVIANO: return 'Tipo Liviano';
      case VehicleType.CAMION_SENCILLO: return 'Camión Sencillo';
      case VehicleType.DOBLE_TROQUE: return 'Doble Troque';
      case VehicleType.GRUA_PLATAFORMA: return 'Grúa de plataforma';
      case VehicleType.GRUA_ELEVADOR: return 'Grúa con elevador';
      case VehicleType.GRUA_GANCHO_CADENA: return 'Grúa de gancho y cadena';
      case VehicleType.GRUA_PLUMA: return 'Grúa de pluma';
      case VehicleType.GRUA_CAMABAJA: return 'Grúa Camabaja';
      default: return 'No especificado';
    }
  };

  const getAttachmentTypeName = (type?: string) => {
    switch (type) {
      case 'PLATAFORMA': return 'Plataforma Estándar';
      case 'CAMA_BAJA': return 'Cama Baja (Lowboy)';
      case 'CUELLO_CISNE': return 'Cuello de Cisne Desmontable';
      default: return 'No especificado';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200 print-container">
      <style>{`
        @media print {
          /* Ocultar barra superior, sidebar, botones de navegación y otros elementos innecesarios */
          nav, aside, header, footer, button, .no-print, [data-slot="sidebar-rail"], [data-slot="sidebar-trigger"], .border-t, svg {
            display: none !important;
          }
          body, main, html {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .bg-white {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Revisión de Información</h2>
          <p className="text-xs text-slate-500 font-medium">Valida detenidamente toda la información capturada antes de registrar el conductor en el sistema.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="border-slate-200 text-slate-700 font-medium flex items-center gap-1.5 self-start sm:self-auto hover:bg-slate-50"
        >
          <PrinterIcon className="w-4 h-4" />
          <span>Imprimir Reporte (PDF)</span>
        </Button>
      </div>

      {/* Encabezado visible únicamente en impresión */}
      <div className="hidden print:block border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-[#0B1E36]">TranspiGO — Reporte de Apertura de Hoja de Vida</h1>
        <p className="text-xs text-slate-500 mt-1">Fecha de generación: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      {/* Sección 1: Conductor */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
        <div className="bg-slate-50/75 border-b border-slate-100 px-5 py-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0B1E36] uppercase tracking-wider">1. Información del Conductor</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(1)}
            className="text-slate-600 hover:text-slate-900 flex items-center gap-1 h-7 text-xs font-semibold px-2"
          >
            <Edit2Icon className="w-3 h-3" />
            <span>Editar</span>
          </Button>
        </div>
        <div className="p-5 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <DetailRow label="Nombre Completo" value={data.driver?.name} />
            <DetailRow label="Número de Cédula" value={data.driver?.cedulaNumero} />
            <DetailRow label="Correo Electrónico" value={data.driver?.email} />
            <DetailRow label="Teléfono de Contacto" value={data.driver?.phone} />
            <DetailRow label="Ciudad" value={data.driver?.city} />
            <DetailRow label="Barrio" value={data.driver?.neighborhood} />
            <DetailRow label="Dirección" value={data.driver?.address} />
            <DetailRow label="Vencimiento Licencia" value={data.driver?.licenciaVencimiento} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-50">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Referencias Familiares</h4>
              <div className="space-y-2">
                {data.driver?.referenciasFamiliares?.map((ref: any, idx: number) => (
                  <div key={idx} className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-100/50">
                    <span className="font-bold text-slate-700 block">{ref.nombre}</span>
                    <span className="text-slate-500 font-medium">{ref.parentesco} • {ref.celular}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Referencias Laborales</h4>
              <div className="space-y-2">
                {data.driver?.referenciasLaborales?.map((ref: any, idx: number) => (
                  <div key={idx} className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-100/50">
                    <span className="font-bold text-slate-700 block">{ref.empresa}</span>
                    <span className="text-slate-500 font-medium">Contacto: {ref.contacto} • {ref.celular}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Documentos Adjuntos</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FileBadge label="Foto Perfil" file={data.driver?.fotoDocumento} />
              <FileBadge label="Seguridad Social" file={data.driver?.planillaSeguridadSocial} />
              <FileBadge label="Cédula Frente" file={data.driver?.fotoCedulaFrente} />
              <FileBadge label="Cédula Reverso" file={data.driver?.fotoCedulaReverso} />
              <FileBadge label="Licencia Frente" file={data.driver?.fotoLicenciaFrente} />
              <FileBadge label="Licencia Reverso" file={data.driver?.fotoLicenciaReverso} />
            </div>
          </div>
        </div>
      </div>

      {/* Sección 2: Propietario */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
        <div className="bg-slate-50/75 border-b border-slate-100 px-5 py-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0B1E36] uppercase tracking-wider">2. Información del Propietario</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(2)}
            className="text-slate-600 hover:text-slate-900 flex items-center gap-1 h-7 text-xs font-semibold px-2"
          >
            <Edit2Icon className="w-3 h-3" />
            <span>Editar</span>
          </Button>
        </div>
        <div className="p-5 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <DetailRow label="Municipio / Ciudad" value={data.owner?.municipality} />
            <DetailRow label="Barrio" value={data.owner?.neighborhood} />
            <DetailRow label="Dirección" value={data.owner?.address} />
            <DetailRow label="Teléfono de Contacto" value={data.owner?.phone} />
            <DetailRow label="Correo Electrónico" value={data.owner?.email} />
          </div>

          <div className="pt-3 border-t border-slate-50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Documentos Adjuntos</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FileBadge label="Cédula Frente" file={data.owner?.fotoCedulaFrente} />
              <FileBadge label="Cédula Reverso" file={data.owner?.fotoCedulaReverso} />
              <FileBadge label="RUT" file={data.owner?.rut} />
              <FileBadge label="Certificado Bancario" file={data.owner?.certificadoBancario} />
            </div>
          </div>
        </div>
      </div>

      {/* Sección 3: Vehículo */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden">
        <div className="bg-slate-50/75 border-b border-slate-100 px-5 py-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0B1E36] uppercase tracking-wider">3. Información del Vehículo</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(3)}
            className="text-slate-600 hover:text-slate-900 flex items-center gap-1 h-7 text-xs font-semibold px-2"
          >
            <Edit2Icon className="w-3 h-3" />
            <span>Editar</span>
          </Button>
        </div>
        <div className="p-5 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <DetailRow label="Tipo de Vehículo" value={getVehicleTypeName(data.vehicle?.type)} />
            <DetailRow label="Placa" value={data.vehicle?.plate} />
            <DetailRow label="Marca" value={data.vehicle?.brand} />
            <DetailRow label="Modelo" value={data.vehicle?.model} />
            <DetailRow label="Año" value={data.vehicle?.year} />
            <DetailRow label="Capacidad (Tons)" value={data.vehicle?.maxWeightTons ? `${data.vehicle.maxWeightTons} T` : undefined} />
            <DetailRow label="Color" value={data.vehicle?.color} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-slate-50">
            <DetailRow label="Empresa Satelital" value={data.vehicle?.empresaSatelital?.nombre} />
            <DetailRow label="Usuario GPS" value={data.vehicle?.empresaSatelital?.usuario} />
            <DetailRow label="Contraseña GPS" value={data.vehicle?.empresaSatelital?.contrasena ? '••••••••' : undefined} />
          </div>

          <div className="pt-3 border-t border-slate-50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Documentos Adjuntos</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FileBadge label="Matrícula Frente" file={data.vehicle?.matriculaFrente} />
              <FileBadge label="Matrícula Reverso" file={data.vehicle?.matriculaReverso} />
              <FileBadge label="SOAT" file={data.vehicle?.soat} />
              <FileBadge label="Tecnomecánica" file={data.vehicle?.tecnomecanica} />
              <FileBadge label="Seguro Responsabilidad" file={data.vehicle?.seguroResponsabilidadCivil} />
              {data.vehicle?.isPlateAnotherOwner && (
                <FileBadge label="Carta de Autorización" file={data.vehicle?.cartaAutorizacion} />
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Registro Fotográfico del Vehículo</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FileBadge label="Foto Frontal" file={data.vehicle?.fotoFrontal} />
              <FileBadge label="Foto Trasera" file={data.vehicle?.fotoTrasera} />
              <FileBadge label="Foto Lateral Izq." file={data.vehicle?.fotoLateralIzquierda} />
              <FileBadge label="Foto Lateral Der." file={data.vehicle?.fotoLateralDerecha} />
            </div>
          </div>
        </div>
      </div>

      {/* Sección 4: Planchón (solo grúas) */}
      {isCrane && (
        <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden animate-in fade-in duration-200">
          <div className="bg-slate-50/75 border-b border-slate-100 px-5 py-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0B1E36] uppercase tracking-wider">4. Información del Planchón</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEditStep(4)}
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1 h-7 text-xs font-semibold px-2"
            >
              <Edit2Icon className="w-3 h-3" />
              <span>Editar</span>
            </Button>
          </div>
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-5">
              <DetailRow label="Tipo de Acople" value={getAttachmentTypeName(data.attachment?.type)} />
              <DetailRow label="Capacidad (Tons)" value={data.attachment?.maxWeightTons ? `${data.attachment.maxWeightTons} T` : undefined} />
            </div>

            <div className="pt-3 border-t border-slate-50">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Documentos Adjuntos</h4>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                <FileBadge label="Tarjeta de Propiedad" file={data.attachment?.tarjetaPropiedad} />
                <FileBadge label="Foto Planchón" file={data.attachment?.fotoPlanchon} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components
function DetailRow({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="min-w-0">
      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{label}</span>
      <span className="text-xs text-slate-700 font-semibold truncate block mt-0.5" title={String(value || '')}>
        {value || 'No especificado'}
      </span>
    </div>
  );
}

function FileBadge({ label, file }: { label: string; file?: File }) {
  if (!file) return null;
  const isPdf = file.type === 'application/pdf';
  return (
    <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs min-w-0">
      <div className={cn(
        "w-7 h-7 rounded flex items-center justify-center shrink-0 text-[9px] font-extrabold select-none",
        isPdf ? "bg-red-50 text-red-600 border border-red-100/50" : "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
      )}>
        {isPdf ? 'PDF' : 'IMG'}
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-slate-400 text-[9px] font-bold block uppercase tracking-wider leading-none">{label}</span>
        <span className="text-slate-700 font-semibold block truncate mt-0.5 leading-tight" title={file.name}>
          {file.name}
        </span>
      </div>
    </div>
  );
}
