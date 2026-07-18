import { useState, useCallback } from 'react';
import type { ApiError } from '@/types';

/**
 * Hook para gestionar operaciones asíncronas de la API
 * Maneja los estados de carga (loading), error y datos
 */

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
}

interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: (...args: unknown[]) => Promise<T | undefined>;
  reset: () => void;
  setData: (data: T | null) => void;
}

export function useAsync<T>(
  asyncFunction: (...args: unknown[]) => Promise<T>,
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: unknown[]) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const data = await asyncFunction(...args);
        setState({ data, isLoading: false, error: null });
        return data;
      } catch (error) {
        const apiError = error as ApiError;
        setState((prev) => ({ ...prev, isLoading: false, error: apiError }));
        return undefined;
      }
    },
    [asyncFunction],
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return { ...state, execute, reset, setData };
}
