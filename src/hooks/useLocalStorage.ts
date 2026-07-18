import { useState, useCallback } from 'react';
import { STORAGE_KEYS } from '@/config/constants';

/**
 * Hook para gestionar el almacenamiento en localStorage sincronizado con el estado de React
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    },
    [key],
  );

  const removeValue = useCallback(() => {
    localStorage.removeItem(key);
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook de conveniencia para la preferencia de tema (claro/oscuro)
 */
export function useTheme() {
  return useLocalStorage<'light' | 'dark' | 'system'>(
    STORAGE_KEYS.THEME,
    'system',
  );
}
