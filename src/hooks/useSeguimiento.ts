import { useCallback, useEffect, useRef, useState } from 'react';
import { seguimientoService, SeguimientoError, type SeguimientoData } from '@/services/seguimiento.service';

const POLL_INTERVAL = 10_000;
const FINAL_STATUSES = ['COMPLETADA', 'CANCELADA', 'FALLIDA'];

/**
 * Carga la vista pública de seguimiento y hace polling liviano de ubicación
 * cada 10s mientras el servicio no llegue a un estado final. Si el status
 * cambia entre pings, recarga los datos completos (nueva parada, evidencia, etc).
 */
export function useSeguimiento(token: string) {
  const [data, setData] = useState<SeguimientoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SeguimientoError | null>(null);
  const statusRef = useRef<string | null>(null);

  const fetchFull = useCallback(async () => {
    try {
      const result = await seguimientoService.get(token);
      setData(result);
      statusRef.current = result.status;
      setError(null);
    } catch (err) {
      setError(
        err instanceof SeguimientoError ? err : new SeguimientoError('UNKNOWN', 'Ocurrió un error inesperado.', 0),
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFull();
  }, [fetchFull]);

  useEffect(() => {
    if (!data || FINAL_STATUSES.includes(data.status)) return;

    const interval = setInterval(async () => {
      try {
        const loc = await seguimientoService.getLocation(token);
        if (!loc) return;

        if (loc.status !== statusRef.current) {
          fetchFull();
          return;
        }

        setData((prev) =>
          prev
            ? {
                ...prev,
                driver: prev.driver ? { ...prev.driver, currentLat: loc.lat, currentLng: loc.lng, lastPing: loc.lastPing } : null,
              }
            : prev,
        );
      } catch {
        // Un fallo puntual de polling no debe romper la vista — se reintenta en el próximo tick.
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [data?.status, token, fetchFull]);

  return { data, loading, error, refetch: fetchFull };
}
