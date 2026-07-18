import { useCallback, useRef, useEffect } from 'react';

/**
 * Hook que retrasa (debounce) la ejecución de una función callback
 * Útil para campos de búsqueda, manejadores de cambio de tamaño (resize), etc.
 */
export function useDebounce<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number = 300,
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Mantener actualizada la referencia del callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay],
  );
}
