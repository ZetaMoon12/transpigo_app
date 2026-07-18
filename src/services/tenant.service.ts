/**
 * Servicio de Tenants - Resolución pública del tenant por subdominio y perfil propio del ADMIN
 */
import { httpClient } from './http-client';
import type { ApiResponse } from '@/types';

export interface TenantSettings {
  brandName: string | null;
  logoUrl: string | null;
  primaryColor: string;
  supportEmail: string | null;
  supportPhone: string | null;
  timezone: string;
  currency: string;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  plan: string;
  status: string;
  settings: TenantSettings | null;
}

export interface TenantProfileSettings extends TenantSettings {
  id: number;
  tenantId: number;
  maxDrivers: number;
  maxMonthlyServices: number;
  overagePricePerService: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSubscription {
  id: number;
  plan: string;
  priceMonthly: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  autoRenew: boolean;
  cancelledAt: string | null;
}

export interface TenantProfile {
  id: number;
  name: string;
  slug: string;
  domain: string | null;
  plan: string;
  status: string;
  billingEmail: string;
  billingNit: string | null;
  trialEndsAt: string | null;
  settings: TenantProfileSettings | null;
  subscription: TenantSubscription | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTenantProfileInput {
  name?: string;
  billingEmail?: string;
  billingNit?: string;
}

export interface UpdateTenantProfileSettingsInput {
  brandName?: string;
  logoUrl?: string;
  primaryColor?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export const tenantService = {
  getBySlug: (slug: string) =>
    httpClient.get<ApiResponse<Tenant>>('/tenant/me', { params: { slug } }),

  getProfile: () => httpClient.get<ApiResponse<TenantProfile>>('/tenant/profile'),

  updateProfile: (data: UpdateTenantProfileInput) =>
    httpClient.patch<ApiResponse<TenantProfile>>('/tenant/profile', data),

  updateProfileSettings: (data: UpdateTenantProfileSettingsInput) =>
    httpClient.patch<ApiResponse<TenantProfileSettings>>('/tenant/profile/settings', data),
};
