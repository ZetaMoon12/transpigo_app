/**
 * Servicio de Companies - Empresas B2B clientes del tenant, sus sucursales y usuarios
 */
import { httpClient } from './http-client';
import type { ApiResponse } from '@/types';

export type CompanyPlan = 'BASICO' | 'EMPRESARIAL' | 'ENTERPRISE';
export type CompanyUserRole = 'COMPANY_ADMIN' | 'COMPANY_USER';

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface CompanyBranch {
  id: number;
  companyId: number;
  tenantId: number;
  name: string;
  city: string;
  address: string | null;
  active: boolean;
  createdAt: string;
}

export interface Company {
  id: number;
  tenantId: number;
  name: string;
  nit: string;
  contactEmail: string;
  contactPhone: string | null;
  address: string | null;
  plan: CompanyPlan;
  creditBalance: string;
  creditLimit: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  branches?: CompanyBranch[];
  _count?: { branches: number; users: number };
}

export interface CompanyUser {
  id: number;
  tenantId: number;
  companyId: number;
  name: string;
  email: string;
  role: CompanyUserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyInput {
  name: string;
  nit: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  plan?: CompanyPlan;
  creditLimit?: number;
}

export interface UpdateCompanyInput {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  plan?: CompanyPlan;
  creditLimit?: number;
}

export interface CreateBranchInput {
  name: string;
  city: string;
  address?: string;
}

export type UpdateBranchInput = Partial<CreateBranchInput>;

export interface InviteCompanyUserInput {
  name: string;
  email: string;
  role: CompanyUserRole;
}

interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginatedMeta;
}

async function unwrapPaginated<T>(promise: Promise<PaginatedApiResponse<T>>): Promise<PaginatedResult<T>> {
  const res = await promise;
  return { data: res.data, meta: res.meta };
}

export const companiesService = {
  list: (page = 1, limit = 20) =>
    unwrapPaginated<Company>(
      httpClient.get<PaginatedApiResponse<Company>>('/companies', { params: { page, limit } }),
    ),

  getById: (id: number) => httpClient.get<ApiResponse<Company>>(`/companies/${id}`),

  create: (data: CreateCompanyInput) =>
    httpClient.post<ApiResponse<Company>>('/companies', data),

  update: (id: number, data: UpdateCompanyInput) =>
    httpClient.patch<ApiResponse<Company>>(`/companies/${id}`, data),

  deactivate: (id: number) => httpClient.delete<ApiResponse<Company>>(`/companies/${id}`),

  listBranches: (companyId: number, page = 1, limit = 20) =>
    unwrapPaginated<CompanyBranch>(
      httpClient.get<PaginatedApiResponse<CompanyBranch>>(`/companies/${companyId}/branches`, {
        params: { page, limit },
      }),
    ),

  createBranch: (companyId: number, data: CreateBranchInput) =>
    httpClient.post<ApiResponse<CompanyBranch>>(`/companies/${companyId}/branches`, data),

  updateBranch: (companyId: number, branchId: number, data: UpdateBranchInput) =>
    httpClient.patch<ApiResponse<CompanyBranch>>(
      `/companies/${companyId}/branches/${branchId}`,
      data,
    ),

  listUsers: (companyId: number, page = 1, limit = 20) =>
    unwrapPaginated<CompanyUser>(
      httpClient.get<PaginatedApiResponse<CompanyUser>>(`/companies/${companyId}/users`, {
        params: { page, limit },
      }),
    ),

  inviteUser: (companyId: number, data: InviteCompanyUserInput) =>
    httpClient.post<ApiResponse<CompanyUser>>(`/companies/${companyId}/users/invite`, data),

  updateUserRole: (companyId: number, userId: number, role: CompanyUserRole) =>
    httpClient.patch<ApiResponse<CompanyUser>>(`/companies/${companyId}/users/${userId}/role`, {
      role,
    }),

  deactivateUser: (companyId: number, userId: number) =>
    httpClient.delete<ApiResponse<CompanyUser>>(`/companies/${companyId}/users/${userId}`),
};
