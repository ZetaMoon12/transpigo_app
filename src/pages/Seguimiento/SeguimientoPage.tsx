import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  PhoneIcon,
  StarIcon,
  MapPinIcon,
  FlagIcon,
  CircleIcon,
  ExternalLinkIcon,
  MessageCircleIcon,
  ImageIcon,
  PenToolIcon,
  AlertTriangleIcon,
  ClockIcon,
  TruckIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SignaturePad } from '@/components/ui/signature-pad';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useSeguimiento } from '@/hooks/useSeguimiento';
import { decodeTrackingToken } from '@/services/seguimiento.service';
import { SERVICE_STATUS_LABEL, SERVICE_STATUS_STYLE } from '@/services/servicios.service';
import { ServiceChat } from '@/pages/Services/components/ServiceChat';
import { SeguimientoMap } from './components/SeguimientoMap';

const SERVICE_TYPE_LABEL: Record<string, string> = {
  GRUA_AUXILIO_VIAL: 'Servicio de grúa',
  TRANSPORTE_CARGA: 'Transporte de carga',
};

function getInitials(name?: string | null) {
  if (!name) return 'C';
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export function SeguimientoPage() {
  const { token = '' } = useParams<{ token: string }>();
  const { data, loading, error } = useSeguimiento(token);
  const [chatOpen, setChatOpen] = useState(false);
  const [signature, setSignature] = useState<File | null>(null);

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-4 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#0B1E36] border-t-transparent" />
        <p className="text-sm text-slate-500 font-semibold">Cargando tu servicio...</p>
      </div>
    );
  }

  if (error || !data) {
    const isExpired = error?.code === 'TOKEN_EXPIRED';
    return (
      <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs text-amber-500 mb-5">
          <AlertTriangleIcon className="w-8 h-8" />
        </div>
        <h1 className="text-lg font-extrabold text-[#0B1E36]">
          {isExpired ? 'Este enlace ha vencido' : 'No encontramos este servicio'}
        </h1>
        <p className="text-sm text-slate-500 max-w-sm mt-2 leading-relaxed">
          {error?.message ??
            'El enlace de seguimiento no es válido. Verifica el enlace que recibiste por correo o contacta al soporte.'}
        </p>
      </div>
    );
  }

  const accent = data.tenant.primaryColor || '#5AB507';
  const isFinal = ['COMPLETADA', 'CANCELADA', 'FALLIDA'].includes(data.status);
  const priceLabel = data.finalPrice !== null ? 'Total final' : 'Estimado';
  const price = data.finalPrice ?? data.estimatedPrice;
  const requestId = decodeTrackingToken(token)?.requestId ?? null;

  return (
    <div className="min-h-dvh bg-slate-50 pb-24">
      {/* Header con marca del tenant */}
      <header className="bg-[#0B1E36] text-white px-5 py-4 flex items-center gap-3">
        {data.tenant.logoUrl ? (
          <img src={data.tenant.logoUrl} alt={data.tenant.brandName ?? ''} className="h-9 w-9 rounded-lg object-cover shrink-0" />
        ) : (
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center font-black text-sm shrink-0"
            style={{ backgroundColor: accent }}
          >
            {getInitials(data.tenant.brandName)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold leading-none truncate">{data.tenant.brandName ?? 'Seguimiento de servicio'}</p>
          <p className="text-[10px] text-white/50 mt-1 font-semibold uppercase tracking-wide">
            {SERVICE_TYPE_LABEL[data.serviceType] ?? data.serviceType}
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto flex flex-col gap-4 p-4">
        {/* Estado del servicio */}
        <div className="rounded-2xl bg-white border border-slate-100 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{data.serviceCode}</span>
            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 w-fit',
                SERVICE_STATUS_STYLE[data.status].bg,
                SERVICE_STATUS_STYLE[data.status].text,
                SERVICE_STATUS_STYLE[data.status].border,
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', SERVICE_STATUS_STYLE[data.status].dot)} />
              <span>{SERVICE_STATUS_LABEL[data.status]}</span>
            </span>
          </div>

          {data.serviceMode === 'PROGRAMADO' && data.scheduledAt && !isFinal && (
            <div className="mt-2.5 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <ClockIcon className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="text-[11px] font-semibold text-amber-700">
                Programado para {formatDate(data.scheduledAt, 'es-CO', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {price !== null && (
            <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{priceLabel}</span>
              <span className="text-sm font-extrabold text-[#0B1E36]">{formatCurrency(price, 'COP', 'es-CO')}</span>
            </div>
          )}
        </div>

        {/* Mapa con todas las paradas */}
        <div className="h-[340px]">
          <SeguimientoMap
            stops={data.stops}
            driverLat={data.driver?.currentLat}
            driverLng={data.driver?.currentLng}
            driverName={data.driver?.name ?? undefined}
          />
        </div>

        {/* Conductor asignado */}
        {data.driver ? (
          <div className="rounded-2xl bg-white border border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-[#0B1E36] text-white flex items-center justify-center font-black text-sm uppercase shrink-0">
                {getInitials(data.driver.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-[#0B1E36] truncate">{data.driver.name ?? 'Conductor'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-0.5 text-amber-500 font-bold text-[11px]">
                    <StarIcon className="h-3 w-3 fill-amber-400" />
                    {data.driver.rating.toFixed(1)}
                  </span>
                  {data.driver.plate && <span className="text-[11px] text-slate-400 font-semibold">· {data.driver.plate}</span>}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-3.5">
              {data.driver.phone && (
                <Button
                  className="flex-1 text-white font-bold flex items-center justify-center gap-2"
                  style={{ backgroundColor: accent }}
                  onClick={() => window.open(`tel:${data.driver!.phone}`)}
                >
                  <PhoneIcon className="h-4 w-4" />
                  <span>Llamar</span>
                </Button>
              )}
              {requestId !== null && (
                <Button
                  variant="outline"
                  className="flex-1 font-bold flex items-center justify-center gap-2"
                  onClick={() => setChatOpen(true)}
                >
                  <MessageCircleIcon className="h-4 w-4" />
                  <span>Chat</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-3">
              <TruckIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Buscando un conductor disponible</p>
            <p className="text-xs text-slate-400 mt-1">Te avisaremos apenas se asigne uno a tu servicio.</p>
          </div>
        )}

        {/* Paradas y evidencia de entrega */}
        <div className="rounded-2xl bg-white border border-slate-100 p-4 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-800">Recorrido</h3>
          {data.stops.map((stop, index) => {
            const isFirst = index === 0;
            const isLast = index === data.stops.length - 1;
            const Icon = isFirst ? MapPinIcon : isLast ? FlagIcon : CircleIcon;

            return (
              <div key={stop.stopOrder} className="flex flex-col gap-2">
                <div className="flex items-start gap-2.5">
                  <Icon
                    className={cn(
                      'h-4 w-4 mt-0.5 shrink-0',
                      stop.status === 'COMPLETADA' ? 'text-[#5AB507]' : stop.status === 'LLEGADA' || stop.status === 'EN_CAMINO' ? 'text-amber-500' : 'text-slate-300',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 truncate">{stop.address}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400">{stop.city}</span>
                      {stop.completedAt && (
                        <span className="text-[10px] text-slate-400">· {formatDate(stop.completedAt, 'es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                      {stop.lat !== null && stop.lng !== null && (
                        <a
                          href={`https://maps.google.com/?q=${stop.lat},${stop.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold flex items-center gap-0.5"
                          style={{ color: accent }}
                        >
                          Ver en mapa <ExternalLinkIcon className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {stop.proofs.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-6.5">
                    {stop.proofs.map((proof, i) => (
                      <a
                        key={i}
                        href={proof.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center gap-1"
                        title={proof.type === 'FIRMA' ? `Firma${proof.signerName ? ` de ${proof.signerName}` : ''}` : 'Foto de entrega'}
                      >
                        <div className="h-16 w-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                          <img src={proof.fileUrl} alt={proof.type} className="h-full w-full object-cover" />
                        </div>
                        <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                          {proof.type === 'FIRMA' ? <PenToolIcon className="h-2.5 w-2.5" /> : <ImageIcon className="h-2.5 w-2.5" />}
                          {proof.type === 'FIRMA' ? 'Firma' : 'Foto'}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Confirmación de recepción — opcional, aún sin backend de guardado */}
        {data.status === 'COMPLETADA' && (
          <div className="rounded-2xl bg-white border border-slate-100 p-4 flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Confirma tu recepción (opcional)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Firma para confirmar que recibiste tu servicio conforme.</p>
            </div>
            <SignaturePad onChange={setSignature} />
            <Button
              type="button"
              variant="outline"
              disabled={!signature}
              onClick={() => toast.info('Gracias — esta función estará disponible próximamente.')}
              className="self-start"
            >
              Guardar firma
            </Button>
          </div>
        )}
      </div>

      {/* Chat flotante */}
      {data.driver && requestId !== null && (
        <Sheet open={chatOpen} onOpenChange={setChatOpen}>
          <SheetContent side="right" showCloseButton={false} className="p-0 gap-0 w-full sm:max-w-md">
            <ServiceChat
              requestId={requestId}
              serviceCode={data.serviceCode}
              onBack={() => setChatOpen(false)}
              token={token}
              backLabel="Cerrar"
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
