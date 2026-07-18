/**
 * Servicio de Servicios (grúa / carga) - Creación y consulta de solicitudes de servicio
 */
import { httpClient } from './http-client';
import type { ApiResponse, PaginatedResponse } from '@/types';
import type { VehicleType, ZoneType } from './tariffs.service';

export type ServiceRequestStatus =
  | 'PENDIENTE'
  | 'COTIZADA'
  | 'CONFIRMADA'
  | 'ASIGNADA'
  | 'EN_CAMINO'
  | 'EN_CARGUE'
  | 'EN_RUTA'
  | 'COMPLETADA'
  | 'CANCELADA'
  | 'FALLIDA';

export type PaymentType = 'PAYU' | 'CREDITO_EMPRESA' | 'EFECTIVO' | 'EMPRESA_INTERNA';

export const SERVICE_STATUS_LABEL: Record<ServiceRequestStatus, string> = {
  PENDIENTE: 'Pendiente',
  COTIZADA: 'Cotizada',
  CONFIRMADA: 'Confirmada',
  ASIGNADA: 'Asignada',
  EN_CAMINO: 'En camino',
  EN_CARGUE: 'En cargue',
  EN_RUTA: 'En ruta',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  FALLIDA: 'Fallida',
};

export interface StatusConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

/** Mismo diseño de estado (color + punto) del panel de administración — reusar en cualquier vista que muestre status de servicios. */
export const SERVICE_STATUS_STYLE: Record<ServiceRequestStatus, StatusConfig> = {
  PENDIENTE: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
  COTIZADA: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
  CONFIRMADA: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  ASIGNADA: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  EN_CAMINO: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  EN_CARGUE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  EN_RUTA: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  COMPLETADA: { bg: 'bg-emerald-50/70', text: 'text-emerald-700', border: 'border-emerald-250', dot: 'bg-[#5AB507]' },
  CANCELADA: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  FALLIDA: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
};

export interface AvailableDriver {
  id: number;
  name: string;
  phone: string | null;
  rating: number;
  totalServices: number;
  currentLat: number | null;
  currentLng: number | null;
  vehicle: {
    id: number;
    type: VehicleType;
    plate: string;
    brand: string;
    model: string;
  };
}

export interface GruaQuote {
  mode: 'fixed' | 'fixed-additional';
  zoneType: ZoneType;
  tariffId: number;
  tariffName: string;
  basePrice: number;
  additionalPrice: number;
  total: number;
}

export interface QuoteGruaInput {
  vehicleType: VehicleType;
  originCity: string;
  destCity: string;
}

export interface CreateGruaServiceInput {
  originAddress: string;
  originCity: string;
  originLat: number;
  originLng: number;
  destAddress: string;
  destCity: string;
  destLat: number;
  destLng: number;
  description?: string;
  driverId: number | null;
  vehicleType: VehicleType;
  estimatedKm: number;
  estimatedPrice: number;
  paymentType?: PaymentType;
  client: {
    name: string;
    phone: string;
    email: string;
    userId?: number;
  };
  consentAccepted: true;
}

export interface CargaTramoQuote {
  mode: 'dynamic' | 'route-based';
  zoneType: ZoneType;
  originCity: string;
  destCity: string;
  km: number;
  tariffId: number | null;
  zoneId: number | null;
  basePrice: number;
  kmCost: number;
  overageKm: number;
  weightCost: number;
  overageWeight: number;
  total: number;
}

export interface CargaQuote {
  tramos: CargaTramoQuote[];
  total: number;
}

export interface QuoteCargaInput {
  vehicleType: VehicleType;
  estimatedWeightTons: number | null;
  stops: Array<{ city: string; lat: number; lng: number }>;
}

export interface CreateCargaServiceInput {
  serviceMode: 'INMEDIATO' | 'PROGRAMADO';
  scheduledAt?: string;
  stops: Array<{ address: string; city: string; lat: number; lng: number }>;
  cargoDescription: string;
  estimatedWeightTons: number | null;
  vehicleType: VehicleType;
  driverId: number | null;
  estimatedKmTotal: number;
  estimatedPrice: number;
  paymentType?: PaymentType;
  clientType: 'PERSON' | 'COMPANY';
  client: {
    name: string;
    phone: string;
    email: string;
    userId?: number;
    companyId?: number;
  };
  consentAccepted: true;
}

export interface CreatedCargaService {
  id: number;
  serviceCode: string;
  serviceMode: 'INMEDIATO' | 'PROGRAMADO';
  scheduledAt: string | null;
  status: ServiceRequestStatus;
  estimatedPrice: number;
  quote: CargaQuote;
  trackingToken: string;
  trackingUrl: string;
  driver: {
    id: number;
    name: string | null;
    plate: string | null;
    vehicleType: VehicleType | null;
    currentLat: number | null;
    currentLng: number | null;
  } | null;
  client: {
    id: number;
    name: string;
    email: string;
    isNew: boolean;
  };
}

export interface CreatedGruaService {
  id: number;
  serviceCode: string;
  status: ServiceRequestStatus;
  estimatedPrice: number;
  quote: GruaQuote;
  trackingToken: string;
  trackingUrl: string;
  driver: {
    id: number;
    name: string | null;
    plate: string | null;
    vehicleType: VehicleType | null;
    currentLat: number | null;
    currentLng: number | null;
  } | null;
  client: {
    id: number;
    name: string;
    email: string;
    isNew: boolean;
  };
}

export interface StopProofSummary {
  id: number;
  type: 'FOTO_ENTREGA' | 'FOTO_CARGA' | 'FIRMA';
  fileUrl: string;
  signerName: string | null;
  uploadedAt: string;
}

export interface ServiceStopSummary {
  id: number;
  stopOrder: number;
  address: string;
  city: string;
  status: string;
  estimatedKm: number | null;
  tramoTotal: number | null;
  proofs: StopProofSummary[];
}

export interface AvailableDriverForRequest {
  id: number;
  name: string;
  phone: string | null;
  rating: number;
  totalServices: number;
  vehicle: { id: number; type: VehicleType; plate: string; brand: string; model: string };
}

export interface ServiceRequestSummary {
  id: number;
  serviceCode: string;
  serviceType: 'GRUA_AUXILIO_VIAL' | 'TRANSPORTE_CARGA';
  status: ServiceRequestStatus;
  paymentType: PaymentType;
  totalEstimated: number | null;
  totalFinal: number | null;
  notes: string | null;
  createdAt: string;
  scheduledAt: string | null;
  completedAt: string | null;
  client: { id: number; name: string; email: string; phone: string | null } | null;
  driver: {
    id: number;
    name: string | null;
    phone: string | null;
    rating: number;
    vehicle: { type: VehicleType; plate: string; brand: string; model: string } | null;
  } | null;
  origin: { address: string; city: string; lat: number | null; lng: number | null } | null;
  destination: {
    address: string;
    city: string;
    lat: number | null;
    lng: number | null;
    estimatedKm: number | null;
  } | null;
  stops: ServiceStopSummary[];
}

export const serviciosService = {
  availableDrivers: (params?: { vehicleType?: VehicleType }) =>
    httpClient.get<ApiResponse<AvailableDriver[]>>('/servicios/drivers-disponibles', { params }),

  quoteGrua: (data: QuoteGruaInput) =>
    httpClient.post<ApiResponse<GruaQuote>>('/servicios/grua/cotizar', data),

  createGrua: (data: CreateGruaServiceInput) =>
    httpClient.post<ApiResponse<CreatedGruaService> & { message?: string }>('/servicios/grua', data),

  quoteCarga: (data: QuoteCargaInput) =>
    httpClient.post<ApiResponse<CargaQuote>>('/servicios/carga/cotizar', data),

  createCarga: (data: CreateCargaServiceInput) =>
    httpClient.post<ApiResponse<CreatedCargaService> & { message?: string }>('/servicios/carga', data),

  list: (params?: { page?: number; limit?: number; status?: ServiceRequestStatus }) =>
    httpClient.get<PaginatedResponse<ServiceRequestSummary>>('/servicios', { params }),

  getById: (id: number) =>
    httpClient.get<ApiResponse<ServiceRequestSummary>>(`/servicios/${id}`),

  availableDriversForRequest: (id: number) =>
    httpClient.get<ApiResponse<AvailableDriverForRequest[]>>(`/servicios/${id}/conductores-disponibles`),

  assignDriver: (id: number, driverId: number) =>
    httpClient.patch<ApiResponse<ServiceRequestSummary> & { message?: string }>(`/servicios/${id}/asignar-conductor`, { driverId }),

  cancel: (id: number, reason?: string) =>
    httpClient.patch<ApiResponse<ServiceRequestSummary> & { message?: string }>(`/servicios/${id}/cancelar`, { reason }),
};
