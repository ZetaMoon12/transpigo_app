/**
 * Servicio de Tarifas - Configuración de precios por tipo de servicio/vehículo/zona
 */
import { httpClient } from './http-client';
import type { ApiResponse } from '@/types';

export type ServiceType = 'GRUA_AUXILIO_VIAL' | 'TRANSPORTE_CARGA';
export type VehicleType =
  | 'TIPO_LIVIANO'
  | 'CAMION_SENCILLO'
  | 'DOBLE_TROQUE'
  | 'GRUA_PLATAFORMA'
  | 'GRUA_ELEVADOR'
  | 'GRUA_GANCHO_CADENA'
  | 'GRUA_PLUMA'
  | 'GRUA_CAMABAJA';
export type ZoneType = 'CIUDAD' | 'FUERA_CIUDAD';

export interface Tariff {
  id: number;
  tenantId: number;
  name: string;
  serviceType: ServiceType;
  vehicleType: VehicleType | null;
  zoneType: ZoneType;
  basePrice: string;
  additionalPrice: string | null;
  pricePerKm: string;
  kmLimit: string | null;
  overageKmStep: string | null;
  overagePricePerKm: string | null;
  pricePerTon: string;
  weightLimitTons: string | null;
  overageWeightStep: string | null;
  overagePricePerTon: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TariffInput {
  name: string;
  serviceType: ServiceType;
  vehicleType?: VehicleType;
  zoneType?: ZoneType;
  basePrice: number;
  additionalPrice?: number;
  pricePerKm?: number;
  kmLimit?: number;
  overageKmStep?: number;
  overagePricePerKm?: number;
  pricePerTon?: number;
  weightLimitTons?: number;
  overageWeightStep?: number;
  overagePricePerTon?: number;
}

/**
 * Modo de precio según servicio + zona:
 *   - GRUA_AUXILIO_VIAL + CIUDAD        → 'fixed': solo precio fijo.
 *   - GRUA_AUXILIO_VIAL + FUERA_CIUDAD  → 'fixed-additional': precio base + adicional
 *     (recargo fijo por tipo de vehículo, no depende de la ruta específica).
 *   - TRANSPORTE_CARGA + CIUDAD         → 'dynamic': base + KM/tonelada + excedentes.
 *   - TRANSPORTE_CARGA + FUERA_CIUDAD   → 'route-based': el precio se configura por
 *     completo en Zonas (por ruta + tipo de vehículo) — esta tarifa no usa precio propio.
 */
export type PricingMode = 'fixed' | 'fixed-additional' | 'dynamic' | 'route-based';

export function getPricingMode(serviceType: ServiceType, zoneType: ZoneType): PricingMode {
  if (serviceType === 'GRUA_AUXILIO_VIAL') {
    return zoneType === 'CIUDAD' ? 'fixed' : 'fixed-additional';
  }
  return zoneType === 'CIUDAD' ? 'dynamic' : 'route-based';
}

/** Qué tipos de vehículo aplican a cada tipo de servicio. */
export const VEHICLE_TYPES_BY_SERVICE: Record<ServiceType, VehicleType[]> = {
  GRUA_AUXILIO_VIAL: ['GRUA_PLATAFORMA', 'GRUA_ELEVADOR', 'GRUA_GANCHO_CADENA', 'GRUA_PLUMA', 'GRUA_CAMABAJA'],
  TRANSPORTE_CARGA: ['TIPO_LIVIANO', 'CAMION_SENCILLO', 'DOBLE_TROQUE'],
};

export const tariffsService = {
  list: () => httpClient.get<ApiResponse<Tariff[]>>('/tariffs'),

  getById: (id: number) => httpClient.get<ApiResponse<Tariff>>(`/tariffs/${id}`),

  create: (data: TariffInput) => httpClient.post<ApiResponse<Tariff>>('/tariffs', data),

  update: (id: number, data: Partial<TariffInput>) =>
    httpClient.patch<ApiResponse<Tariff>>(`/tariffs/${id}`, data),

  deactivate: (id: number) => httpClient.delete<ApiResponse<Tariff>>(`/tariffs/${id}`),
};
