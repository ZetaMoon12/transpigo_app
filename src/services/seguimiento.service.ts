/**
 * Servicio de Seguimiento público — vista anónima del cliente vía tracking token.
 * A propósito NO usa `httpClient`: esta vista debe funcionar de forma 100%
 * anónima y determinista, sin que una sesión admin/conductor activa en el mismo
 * navegador interfiera (httpClient adjunta automáticamente el Bearer de sesión).
 */
import { env } from '@/config';
import type { VehicleType } from './tariffs.service';
import type { ServiceRequestStatus } from './servicios.service';

export type SeguimientoStopStatus = 'PENDIENTE' | 'EN_CAMINO' | 'LLEGADA' | 'COMPLETADA';

export interface SeguimientoProof {
  type: 'FOTO_ENTREGA' | 'FIRMA';
  fileUrl: string;
  signerName: string | null;
}

export interface SeguimientoStop {
  stopOrder: number;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  status: SeguimientoStopStatus;
  arrivedAt: string | null;
  completedAt: string | null;
  proofs: SeguimientoProof[];
}

export interface SeguimientoDriver {
  name: string | null;
  phone: string | null;
  vehicleType: VehicleType | null;
  plate: string | null;
  rating: number;
  currentLat: number | null;
  currentLng: number | null;
  lastPing: string | null;
}

export interface SeguimientoTenant {
  brandName: string | null;
  logoUrl: string | null;
  primaryColor: string;
  supportPhone: string | null;
}

export interface SeguimientoData {
  serviceCode: string;
  serviceType: 'GRUA_AUXILIO_VIAL' | 'TRANSPORTE_CARGA';
  status: ServiceRequestStatus;
  serviceMode: 'INMEDIATO' | 'PROGRAMADO';
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  estimatedPrice: number | null;
  finalPrice: number | null;
  driver: SeguimientoDriver | null;
  stops: SeguimientoStop[];
  tenant: SeguimientoTenant;
}

export interface SeguimientoLocation {
  lat: number | null;
  lng: number | null;
  lastPing: string | null;
  status: ServiceRequestStatus;
}

export class SeguimientoError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(
    code: string,
    message: string,
    status: number,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'SeguimientoError';
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${env.API_BASE_URL}${path}`);
  } catch {
    throw new SeguimientoError('NETWORK_ERROR', 'No se pudo conectar con el servidor. Revisa tu conexión.', 0);
  }

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.success) {
    throw new SeguimientoError(
      body?.error ?? 'UNKNOWN',
      body?.message ?? 'Ocurrió un error inesperado.',
      res.status,
    );
  }

  return body.data as T;
}

export const seguimientoService = {
  get: (token: string) => fetchJson<SeguimientoData>(`/seguimiento/${token}`),
  getLocation: (token: string) => fetchJson<SeguimientoLocation | null>(`/seguimiento/${token}/location`),
};

/**
 * Decodifica el payload del JWT de tracking SIN verificar la firma — solo para
 * leer `requestId` en el cliente (p.ej. para unirse a la sala del chat). La
 * verificación real de firma/expiración/revocación siempre ocurre en el backend.
 */
export function decodeTrackingToken(token: string): { requestId: number; tenantId: number } | null {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) return null;

    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));

    if (!Number.isInteger(payload.requestId) || !Number.isInteger(payload.tenantId)) return null;
    return { requestId: payload.requestId, tenantId: payload.tenantId };
  } catch {
    return null;
  }
}
