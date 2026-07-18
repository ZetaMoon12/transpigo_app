import { useCallback, useEffect, useRef, useState } from 'react';
import { driversService, type ServicioActivo } from '@/services/drivers.service';

const POLL_INTERVAL_MS = 15000;

/**
 * Servicio activo del conductor. Hace polling cada 15s SOLO mientras no hay
 * servicio activo (una vez asignado, las páginas deben llamar a refetch() tras
 * cada acción en vez de esperar el próximo tick de polling).
 */
export function useServicioActivo() {
  const [servicioActivo, setServicioActivo] = useState<ServicioActivo | null>(null);
  const [loading, setLoading] = useState(true);
  const hadServiceRef = useRef(false);

  const fetchServicio = useCallback(async () => {
    try {
      const res = await driversService.getServicioActivo();
      const next = res.data;

      if (next && !hadServiceRef.current) {
        // Transición de "sin servicio" a "con servicio": avisar al conductor.
        playNotificationSound();
        showBrowserNotification('Nuevo servicio asignado');
      }
      hadServiceRef.current = !!next;
      setServicioActivo(next);
    } catch {
      // Silencioso: el polling reintenta solo, no hace falta un toast por cada fallo de red.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServicio();

    if (Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [fetchServicio]);

  useEffect(() => {
    if (servicioActivo) return; // sin polling mientras hay un servicio activo

    const interval = setInterval(fetchServicio, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [servicioActivo, fetchServicio]);

  return { servicioActivo, loading, refetch: fetchServicio };
}

function playNotificationSound() {
  try {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {
      // El navegador puede bloquear el autoplay sin interacción previa del usuario — ignorar.
    });
  } catch {
    // Ignorar entornos sin soporte de Audio.
  }
}

function showBrowserNotification(title: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    new Notification(title);
  } catch {
    // Ignorar si el navegador rechaza la notificación.
  }
}
