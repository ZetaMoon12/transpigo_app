import { httpClient } from './http-client';
import type { ApiResponse } from '@/types/api.types';

export interface InviteDriverBody {
  name: string;
  email: string;
  phone?: string;
  companyId?: number;
}

export interface ReviewDocumentBody {
  status: 'APROBADO' | 'RECHAZADO';
  rejectionReason?: string;
}

export interface UpdateLocationBody {
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
}

export type ServiceStopStatus = 'PENDIENTE' | 'EN_CAMINO' | 'LLEGADA' | 'COMPLETADA';

export interface ServicioActivoStop {
  id: number;
  stopOrder: number;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  status: ServiceStopStatus;
  arrivedAt: string | null;
  estimatedWeightTons: number | null;
}

export interface StopProofItem {
  id: number;
  stopId: number;
  type: 'FOTO_ENTREGA' | 'FOTO_CARGA' | 'FIRMA';
  fileUrl: string;
  signerName: string | null;
  uploadedAt: string;
}

export interface ServicioActivo {
  id: number;
  serviceCode: string;
  serviceType: 'GRUA_AUXILIO_VIAL' | 'TRANSPORTE_CARGA';
  status: 'ASIGNADA' | 'EN_CAMINO' | 'EN_CARGUE' | 'EN_RUTA';
  startedAt: string | null;
  estimatedPrice: number | null;
  client: { name: string; phone: string | null } | null;
  description: string | null;
  stops: ServicioActivoStop[];
  currentStop: { id: number; stopOrder: number; address: string } | null;
  proofs: StopProofItem[];
}

export interface HistorialItem {
  id: number;
  serviceCode: string;
  serviceType: 'GRUA_AUXILIO_VIAL' | 'TRANSPORTE_CARGA';
  status: 'COMPLETADA' | 'CANCELADA' | 'FALLIDA';
  completedAt: string | null;
  client: { name: string } | null;
  totalFinal: number | null;
  driverRating: number | null;
}

export const driversService = {
  // === Gestión de conductores (ADMIN) ===

  /** Obtiene la lista paginada de conductores */
  getDrivers: (params?: { page?: number; limit?: number }) => {
    return httpClient.get<ApiResponse<any[]> & { meta?: any }>('/drivers', { params });
  },

  /** Obtiene el detalle de un conductor con sus documentos y vehículo */
  getDriverById: (id: string | number) => {
    return httpClient.get<ApiResponse<any>>(`/drivers/${id}`);
  },

  /** Envía una invitación a un conductor (genera token) */
  inviteDriver: (body: InviteDriverBody) => {
    return httpClient.post<ApiResponse<any>>('/drivers/invite', body);
  },

  /** Actualiza los datos operativos de un conductor */
  updateDriver: (id: string | number, body: any) => {
    return httpClient.patch<ApiResponse<any>>(`/drivers/${id}`, body);
  },

  /** Cambia el estado del conductor manualmente */
  updateDriverStatus: (id: string | number, status: string) => {
    return httpClient.patch<ApiResponse<any>>(`/drivers/${id}/status`, { status });
  },

  /** Borrado lógico de un conductor (soft delete) */
  deleteDriver: (id: string | number) => {
    return httpClient.delete<ApiResponse<any>>(`/drivers/${id}`);
  },

  // === Documentos del conductor (ADMIN) ===

  /** Lista todos los documentos cargados por el conductor */
  getDriverDocuments: (id: string | number) => {
    return httpClient.get<ApiResponse<any[]>>(`/drivers/${id}/documents`);
  },

  /** Aprueba o rechaza un documento específico del conductor */
  reviewDriverDocument: (id: string | number, docId: string | number, body: ReviewDocumentBody) => {
    return httpClient.patch<ApiResponse<any>>(`/drivers/${id}/documents/${docId}`, body);
  },

  // === Vehículo (ADMIN) ===

  /** Obtiene la información del vehículo de un conductor */
  getVehicle: (id: string | number) => {
    return httpClient.get<ApiResponse<any>>(`/drivers/${id}/vehicle`);
  },

  /** Registra un vehículo para un conductor */
  registerVehicle: (id: string | number, body: any) => {
    return httpClient.post<ApiResponse<any>>(`/drivers/${id}/vehicle`, body);
  },

  /** Actualiza los datos de un vehículo */
  updateVehicle: (id: string | number, body: any) => {
    return httpClient.patch<ApiResponse<any>>(`/drivers/${id}/vehicle`, body);
  },

  /** Obtiene los documentos del vehículo de un conductor */
  getVehicleDocuments: (id: string | number) => {
    return httpClient.get<ApiResponse<any[]>>(`/drivers/${id}/vehicle/documents`);
  },

  /** Aprueba o rechaza un documento de vehículo */
  reviewVehicleDocument: (id: string | number, docId: string | number, body: ReviewDocumentBody) => {
    return httpClient.patch<ApiResponse<any>>(`/drivers/${id}/vehicle/documents/${docId}`, body);
  },

  // === Planchón (ADMIN — solo grúas) ===

  /** Obtiene la información del planchón acoplado */
  getAttachment: (id: string | number) => {
    return httpClient.get<ApiResponse<any>>(`/drivers/${id}/vehicle/attachment`);
  },

  /** Registra un planchón para el vehículo de un conductor */
  registerAttachment: (id: string | number, body: any) => {
    return httpClient.post<ApiResponse<any>>(`/drivers/${id}/vehicle/attachment`, body);
  },

  /** Actualiza los datos de un planchón */
  updateAttachment: (id: string | number, body: any) => {
    return httpClient.patch<ApiResponse<any>>(`/drivers/${id}/vehicle/attachment`, body);
  },

  /** Obtiene los documentos del planchón */
  getAttachmentDocuments: (id: string | number) => {
    return httpClient.get<ApiResponse<any[]>>(`/drivers/${id}/vehicle/attachment/documents`);
  },

  /** Aprueba o rechaza un documento del planchón */
  reviewAttachmentDocument: (id: string | number, docId: string | number, body: ReviewDocumentBody) => {
    return httpClient.patch<ApiResponse<any>>(`/drivers/${id}/vehicle/attachment/documents/${docId}`, body);
  },

  // === Onboarding del conductor (Público) ===

  /** Verifica si el token de invitación de onboarding es válido y está vigente */
  verifyOnboardingToken: (token: string) => {
    return httpClient.get<ApiResponse<any>>(`/drivers/onboarding/${token}`);
  },

  /** Completa el registro del conductor y sube su información y documentos iniciales */
  completeOnboarding: (token: string, formData: FormData) => {
    return httpClient.upload<ApiResponse<any>>(`/drivers/onboarding/${token}`, formData);
  },

  // === Portal del conductor (DRIVER autenticado) ===

  /** Obtiene el perfil y estado actual del conductor autenticado */
  getCurrentDriverProfile: () => {
    return httpClient.get<ApiResponse<any>>('/drivers/me');
  },

  /** Actualiza la posición GPS y velocidad del conductor activo */
  updateLocation: (body: UpdateLocationBody) => {
    return httpClient.patch<ApiResponse<any>>('/drivers/me/location', body);
  },

  /** Lista el estado de los documentos personales del conductor autenticado */
  getCurrentDriverDocuments: () => {
    return httpClient.get<ApiResponse<any[]>>('/drivers/me/documents');
  },

  /** Sube o resube un documento personal del conductor */
  uploadDriverDocument: (formData: FormData) => {
    return httpClient.upload<ApiResponse<any>>('/drivers/me/documents', formData);
  },

  /** Obtiene la información del vehículo asignado al conductor autenticado */
  getCurrentDriverVehicle: () => {
    return httpClient.get<ApiResponse<any>>('/drivers/me/vehicle');
  },

  /** Sube un documento del vehículo (SOAT, tecno, etc.) en sesión de conductor */
  uploadVehicleDocument: (formData: FormData) => {
    return httpClient.upload<ApiResponse<any>>('/drivers/me/vehicle/documents', formData);
  },

  /** Sube un documento de planchón en sesión de conductor */
  uploadAttachmentDocument: (formData: FormData) => {
    return httpClient.upload<ApiResponse<any>>('/drivers/me/vehicle/attachment/documents', formData);
  },

  /** Lista los documentos del vehículo asignado al conductor autenticado */
  getMeVehicleDocuments: () => {
    return httpClient.get<ApiResponse<any[]>>('/drivers/me/vehicle/documents');
  },

  /** Lista los documentos del planchón asignado al conductor autenticado */
  getMeAttachmentDocuments: () => {
    return httpClient.get<ApiResponse<any[]>>('/drivers/me/vehicle/attachment/documents');
  },

  // === Servicio activo del conductor ===

  /** Obtiene el servicio actualmente asignado al conductor, o null si no hay ninguno */
  getServicioActivo: () => {
    return httpClient.get<ApiResponse<ServicioActivo | null>>('/drivers/me/servicio-activo');
  },

  /** Inicia la ruta o marca la llegada al punto actual del servicio activo */
  updateServicioEstado: (action: 'iniciar' | 'llegue') => {
    return httpClient.patch<ApiResponse<{ success: true }>>('/drivers/me/servicio-activo/estado', { action });
  },

  /** Sube las fotos de carga previas a iniciar la ruta */
  uploadServicioFotos: (formData: FormData) => {
    return httpClient.upload<ApiResponse<{ uploaded: number; total: number }>>(
      '/drivers/me/servicio-activo/fotos',
      formData,
    );
  },

  /** Completa una parada con evidencia (fotos, firma, peso real si aplica) */
  completarParada: (stopId: string | number, formData: FormData) => {
    return httpClient.upload<ApiResponse<{ success: true; isLast: boolean }>>(
      `/drivers/me/paradas/${stopId}/completar`,
      formData,
    );
  },

  /** Historial paginado de servicios completados del conductor autenticado */
  getHistorial: (params?: { page?: number; limit?: number }) => {
    return httpClient.get<ApiResponse<HistorialItem[]> & { meta?: any }>('/drivers/me/historial', { params });
  },

  // === Asociación de Conductor y Vehículo ===

  /** Obtiene conductores sin vehículo asignado */
  getAvailableDrivers: () => {
    return httpClient.get<ApiResponse<any[]>>('/drivers/available');
  },

  /** Obtiene vehículos sin conductor asignado */
  getAvailableVehicles: () => {
    return httpClient.get<ApiResponse<any[]>>('/vehicles/available');
  },

  /** Obtiene la lista de asociaciones activas conductor-vehículo */
  getActiveAssociations: () => {
    return httpClient.get<ApiResponse<any[]>>('/drivers/associations');
  },

  /** Crea la asociación entre un conductor y un vehículo */
  associateDriverVehicle: (driverId: string | number, vehicleId: string | number) => {
    return httpClient.post<ApiResponse<any>>(`/drivers/${driverId}/associate-vehicle`, { vehicleId });
  },

  /** Elimina la asociación entre un conductor y su vehículo */
  disassociateDriverVehicle: (driverId: string | number, vehicleId: string | number) => {
    return httpClient.post<ApiResponse<any>>(`/drivers/${driverId}/disassociate-vehicle`, { vehicleId });
  },
};
