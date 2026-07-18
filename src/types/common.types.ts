/**
 * Tipos comunes compartidos utilizados en toda la aplicación
 */

/** Entidad genérica con identificador */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** Dirección de ordenamiento */
export type SortDirection = 'asc' | 'desc';

/** Parámetros de consulta genéricos para listados */
export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: SortDirection;
}

/** Opción de selección para dropdowns/selects */
export interface SelectOption<T = string> {
  label: string;
  value: T;
}

/** Tipos de estado para entidades genéricas */
export type Status = 'active' | 'inactive' | 'pending' | 'archived';
