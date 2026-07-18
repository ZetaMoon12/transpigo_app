/**
 * Servicio de Zonas - Tarifas fijas por ruta y tipo de vehículo
 */
import { httpClient } from './http-client';
import type { ApiResponse } from '@/types';
import type { ZoneType, VehicleType } from './tariffs.service';

export interface Zone {
  id: number;
  tenantId: number;
  name: string;
  type: ZoneType;
  vehicleType: VehicleType | null;
  originCity: string | null;
  destCity: string | null;
  fixedPrice: string;
  active: boolean;
  createdAt: string;
}

export interface ZoneInput {
  name: string;
  type?: ZoneType;
  vehicleType: VehicleType;
  originCity: string;
  destCity?: string;
  fixedPrice: number;
}

export const zonesService = {
  list: () => httpClient.get<ApiResponse<Zone[]>>('/zones'),

  create: (data: ZoneInput) => httpClient.post<ApiResponse<Zone>>('/zones', data),

  update: (id: number, data: Partial<ZoneInput>) =>
    httpClient.patch<ApiResponse<Zone>>(`/zones/${id}`, data),

  deactivate: (id: number) => httpClient.delete<ApiResponse<Zone>>(`/zones/${id}`),
};
