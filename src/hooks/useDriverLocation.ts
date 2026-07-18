import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context';
import { driversService } from '@/services/drivers.service';

const MIN_DISTANCE_METERS = 50;
const MAX_INTERVAL_MS = 10000;

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Comparte la ubicación del conductor mientras está autenticado. Envía un ping al
 * backend cuando se movió más de 50m o cuando pasaron 10s desde el último envío
 * (lo que ocurra primero), para no dejar de reportar si el conductor está detenido.
 */
export function useDriverLocation() {
  const { user, isAuthenticated } = useAuth();
  const [permissionDenied, setPermissionDenied] = useState(false);
  const lastSentRef = useRef<{ lat: number; lng: number; at: number } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'DRIVER') return;
    if (!('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng, speed, heading } = position.coords;
        const now = Date.now();
        const last = lastSentRef.current;

        const shouldSend =
          !last || now - last.at >= MAX_INTERVAL_MS || haversineMeters(last, { lat, lng }) > MIN_DISTANCE_METERS;

        if (shouldSend) {
          lastSentRef.current = { lat, lng, at: now };
          driversService
            .updateLocation({
              lat,
              lng,
              speed: speed ?? undefined,
              heading: heading ?? undefined,
            })
            .catch(() => {
              // Un ping fallido no es crítico — el próximo watchPosition lo reintenta.
            });
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) setPermissionDenied(true);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isAuthenticated, user?.role]);

  return { permissionDenied };
}
