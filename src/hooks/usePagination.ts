import { useState, useCallback, useMemo } from 'react';
import type { QueryParams, SortDirection } from '@/types';
import { PAGINATION } from '@/config/constants';

/**
 * Hook para gestionar el estado de paginación, búsqueda y ordenamiento
 * Usar con endpoints de la API que admitan paginación
 */

interface UsePaginationReturn {
  queryParams: Required<QueryParams>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearch: (search: string) => void;
  setSort: (sortBy: string, direction?: SortDirection) => void;
  resetFilters: () => void;
}

export function usePagination(
  defaults?: Partial<QueryParams>,
): UsePaginationReturn {
  const [page, setPage] = useState(defaults?.page ?? PAGINATION.DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(
    defaults?.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE,
  );
  const [search, setSearch] = useState(defaults?.search ?? '');
  const [sortBy, setSortBy] = useState(defaults?.sortBy ?? 'createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaults?.sortDirection ?? 'desc',
  );

  const queryParams = useMemo(
    () => ({ page, pageSize, search, sortBy, sortDirection }),
    [page, pageSize, search, sortBy, sortDirection],
  );

  const handleSetSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(PAGINATION.DEFAULT_PAGE); // Reiniciar a la primera página en cada búsqueda
  }, []);

  const handleSetSort = useCallback(
    (field: string, direction?: SortDirection) => {
      setSortBy(field);
      setSortDirection(direction ?? 'asc');
      setPage(PAGINATION.DEFAULT_PAGE);
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setPage(PAGINATION.DEFAULT_PAGE);
    setPageSize(PAGINATION.DEFAULT_PAGE_SIZE);
    setSearch('');
    setSortBy('createdAt');
    setSortDirection('desc');
  }, []);

  return {
    queryParams,
    setPage,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(PAGINATION.DEFAULT_PAGE);
    },
    setSearch: handleSetSearch,
    setSort: handleSetSort,
    resetFilters,
  };
}
