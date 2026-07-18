import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import {
  PhoneIcon,
  MapPinIcon,
  FlagIcon,
  CircleIcon,
  ExternalLinkIcon,
  TruckIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { FormField } from '@/components/form-field';
import { Spinner } from '@/components/ui/spinner';
import { SignaturePad } from '@/components/ui/signature-pad';
import { PhotoUploadGrid } from '@/components/portal/PhotoUploadGrid';
import { cn } from '@/lib/utils';
import { driversService } from '@/services/drivers.service';
import { SERVICE_STATUS_LABEL, SERVICE_STATUS_STYLE } from '@/services/servicios.service';
import type { PortalOutletContext } from './types';

const MIN_FOTOS_CARGA = 2;

export function PortalActivoPage() {
  const { servicioActivo, loading, refetch } = useOutletContext<PortalOutletContext>();

  const [fotosCarga, setFotosCarga] = useState<File[]>([]);
  const [uploadingFotos, setUploadingFotos] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [marcandoLlegada, setMarcandoLlegada] = useState(false);

  const [fotosEntrega, setFotosEntrega] = useState<File[]>([]);
  const [firma, setFirma] = useState<File | null>(null);
  const [signerName, setSignerName] = useState('');
  const [actualWeightTons, setActualWeightTons] = useState('');
  const [completando, setCompletando] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!servicioActivo) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
          <TruckIcon className="h-7 w-7" />
        </div>
        <h2 className="text-base font-bold text-slate-800">No tienes un servicio activo</h2>
        <p className="text-sm text-slate-500 mt-1">Cuando te asignen uno, aparecerá aquí.</p>
      </div>
    );
  }

  const proofsFotoCargaCount = servicioActivo.proofs.filter((p) => p.type === 'FOTO_CARGA').length;

  async function handleUploadFotosCarga() {
    if (fotosCarga.length === 0) return;
    setUploadingFotos(true);
    try {
      const formData = new FormData();
      fotosCarga.forEach((file) => formData.append('fotos', file));
      await driversService.uploadServicioFotos(formData);
      setFotosCarga([]);
      toast.success('Fotos subidas correctamente');
      refetch();
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'No se pudieron subir las fotos';
      toast.error(message);
    } finally {
      setUploadingFotos(false);
    }
  }

  async function handleIniciar() {
    setIniciando(true);
    try {
      await driversService.updateServicioEstado('iniciar');
      toast.success('Ruta iniciada');
      refetch();
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'No se pudo iniciar la ruta';
      toast.error(message);
    } finally {
      setIniciando(false);
    }
  }

  async function handleLlegue() {
    setMarcandoLlegada(true);
    try {
      await driversService.updateServicioEstado('llegue');
      toast.success('Llegada registrada');
      refetch();
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'No se pudo registrar la llegada';
      toast.error(message);
    } finally {
      setMarcandoLlegada(false);
    }
  }

  async function handleCompletarParada() {
    if (!servicioActivo?.currentStop) return;
    if (fotosEntrega.length === 0) {
      toast.error('Debes adjuntar al menos una foto de entrega');
      return;
    }

    setCompletando(true);
    try {
      const formData = new FormData();
      fotosEntrega.forEach((file) => formData.append('fotos', file));
      if (firma) formData.append('firma', firma);
      if (signerName.trim()) formData.append('signerName', signerName.trim());
      if (servicioActivo.serviceType === 'TRANSPORTE_CARGA' && actualWeightTons) {
        formData.append('actualWeightTons', actualWeightTons);
      }

      const res = await driversService.completarParada(servicioActivo.currentStop.id, formData);
      setFotosEntrega([]);
      setFirma(null);
      setSignerName('');
      setActualWeightTons('');
      toast.success(res.data.isLast ? '¡Servicio completado!' : 'Parada completada');
      refetch();
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'No se pudo completar la parada';
      toast.error(message);
    } finally {
      setCompletando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:items-start md:gap-6">
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{servicioActivo.serviceCode}</span>
            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 w-fit',
                SERVICE_STATUS_STYLE[servicioActivo.status].bg,
                SERVICE_STATUS_STYLE[servicioActivo.status].text,
                SERVICE_STATUS_STYLE[servicioActivo.status].border,
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', SERVICE_STATUS_STYLE[servicioActivo.status].dot)} />
              <span>{SERVICE_STATUS_LABEL[servicioActivo.status]}</span>
            </span>
          </div>
          <p className="text-lg font-extrabold text-[#0B1E36] mt-1">{servicioActivo.client?.name ?? 'Cliente'}</p>
          {servicioActivo.client?.phone && (
            <a
              href={`tel:${servicioActivo.client.phone}`}
              className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-slate-600"
            >
              <PhoneIcon className="h-3.5 w-3.5 text-slate-400" />
              {servicioActivo.client.phone}
            </a>
          )}
          {servicioActivo.description && (
            <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5 italic">{servicioActivo.description}</p>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 p-4 flex flex-col gap-3">
          {servicioActivo.stops.map((stop, index) => {
            const isFirst = index === 0;
            const isLast = index === servicioActivo.stops.length - 1;
            const Icon = isFirst ? MapPinIcon : isLast ? FlagIcon : CircleIcon;
            const isCurrent = servicioActivo.currentStop?.id === stop.id;
            return (
              <div key={stop.id} className="flex items-start gap-2.5">
                <Icon
                  className={`h-4 w-4 mt-0.5 shrink-0 ${
                    stop.status === 'COMPLETADA' ? 'text-[#5AB507]' : isCurrent ? 'text-amber-500' : 'text-slate-300'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700 truncate">{stop.address}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-slate-400">{stop.status}</span>
                    {stop.lat !== null && stop.lng !== null && (
                      <a
                        href={`https://maps.google.com/?q=${stop.lat},${stop.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-[#5AB507] flex items-center gap-0.5"
                      >
                        Ver en mapa <ExternalLinkIcon className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {servicioActivo.status === 'ASIGNADA' && (
          <div className="rounded-2xl bg-white border border-slate-100 p-4 flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Fotos antes de iniciar</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sube mínimo {MIN_FOTOS_CARGA} fotos del estado del vehículo/carga ({proofsFotoCargaCount}/{MIN_FOTOS_CARGA} listas).
              </p>
            </div>
            <PhotoUploadGrid files={fotosCarga} onChange={setFotosCarga} />
            {fotosCarga.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleUploadFotosCarga}
                disabled={uploadingFotos}
                className="self-start flex items-center gap-2"
              >
                {uploadingFotos && <Spinner className="w-4 h-4" />}
                <span>Subir fotos</span>
              </Button>
            )}
            <Button
              type="button"
              onClick={handleIniciar}
              disabled={proofsFotoCargaCount < MIN_FOTOS_CARGA || iniciando}
              className="bg-[#5AB507] hover:bg-[#5AB507]/90 text-white font-bold flex items-center justify-center gap-2"
            >
              {iniciando && <Spinner className="w-4 h-4 text-white" />}
              <span>Iniciar ruta</span>
            </Button>
          </div>
        )}

        {(servicioActivo.status === 'EN_CAMINO' || servicioActivo.status === 'EN_RUTA') && (
          <Button
            type="button"
            onClick={handleLlegue}
            disabled={marcandoLlegada}
            className="bg-[#0B1E36] hover:bg-[#0B1E36]/90 text-white font-bold flex items-center justify-center gap-2"
          >
            {marcandoLlegada && <Spinner className="w-4 h-4 text-white" />}
            <span>Llegué</span>
          </Button>
        )}

        {servicioActivo.status === 'EN_CARGUE' && (
          <div className="rounded-2xl bg-white border border-slate-100 p-4 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800">Completar parada</h3>

            <FormField label="Fotos de entrega" required>
              <PhotoUploadGrid files={fotosEntrega} onChange={setFotosEntrega} />
            </FormField>

            <FormField label="Firma (opcional)">
              <SignaturePad onChange={setFirma} />
            </FormField>

            <FormField label="Nombre de quien firma (opcional)">
              <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Nombre completo" />
            </FormField>

            {servicioActivo.serviceType === 'TRANSPORTE_CARGA' && (
              <FormField label="Peso real en toneladas (opcional)">
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={actualWeightTons}
                  onChange={(e) => setActualWeightTons(e.target.value)}
                  placeholder="Ej: 2.5"
                />
              </FormField>
            )}

            <Button
              type="button"
              onClick={handleCompletarParada}
              disabled={completando}
              className="bg-[#5AB507] hover:bg-[#5AB507]/90 text-white font-bold flex items-center justify-center gap-2"
            >
              {completando && <Spinner className="w-4 h-4 text-white" />}
              <span>Completar parada</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
