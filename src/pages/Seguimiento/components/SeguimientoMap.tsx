import { useEffect, useRef } from 'react';
import { useLeaflet } from '@/hooks/useLeaflet';
import type { SeguimientoStop } from '@/services/seguimiento.service';

interface SeguimientoMapProps {
  stops: SeguimientoStop[];
  driverLat?: number | null;
  driverLng?: number | null;
  driverName?: string;
}

function stopColor(status: SeguimientoStop['status'], isLast: boolean): string {
  if (status === 'COMPLETADA') return '#5AB507';
  if (status === 'LLEGADA' || status === 'EN_CAMINO') return '#F59E0B';
  return isLast ? '#EF4444' : '#94A3B8';
}

function pointIcon(L: any, color: string, label: string) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};color:#fff;width:28px;height:28px;border-radius:9999px;border:2px solid white;box-shadow:0 3px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function driverIcon(L: any) {
  return L.divIcon({
    className: '',
    html: `<div style="background:#0B1E36;color:#fff;width:36px;height:36px;border-radius:9999px;border:2.5px solid #5AB507;box-shadow:0 4px 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><polyline points="14 18 18 18 22 14 22 10 18 10 14 10"/><circle cx="7.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/></svg></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

/**
 * Mapa de seguimiento multi-parada (Leaflet/OSM, sin Mapbox): dibuja TODAS las
 * paradas de la ruta (origen, intermedias, destino) para grúa (2) o carga (N),
 * con el tramo ya recorrido en verde sólido y el pendiente en azul punteado —
 * así se ve el progreso completo del viaje, no solo el tramo actual.
 */
export function SeguimientoMap({ stops, driverLat, driverLng, driverName = 'Conductor' }: SeguimientoMapProps) {
  const leafletLoaded = useLeaflet();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !containerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }
    const map = mapRef.current;

    layersRef.current.forEach((layer) => layer.remove());
    layersRef.current = [];

    const bounds: [number, number][] = [];
    const validStops = stops.filter(
      (s) => s.lat !== null && s.lng !== null && !isNaN(s.lat) && !isNaN(s.lng) && s.lat !== 0 && s.lng !== 0,
    ) as (SeguimientoStop & { lat: number; lng: number })[];

    validStops.forEach((stop, idx) => {
      const isLast = idx === validStops.length - 1;
      const color = stopColor(stop.status, isLast);
      const label = idx === 0 ? 'A' : isLast ? 'B' : String(idx + 1);
      const kind = idx === 0 ? ' (origen)' : isLast ? ' (destino)' : '';

      const marker = L.marker([stop.lat, stop.lng], { icon: pointIcon(L, color, label) })
        .addTo(map)
        .bindPopup(`<b>Parada ${stop.stopOrder}${kind}:</b><br/>${stop.address}<br/><span style="color:${color}">${stop.status}</span>`);

      layersRef.current.push(marker);
      bounds.push([stop.lat, stop.lng]);
    });

    for (let i = 0; i < validStops.length - 1; i++) {
      const a = validStops[i];
      const b = validStops[i + 1];
      const done = a.status === 'COMPLETADA' && b.status === 'COMPLETADA';
      const line = L.polyline(
        [
          [a.lat, a.lng],
          [b.lat, b.lng],
        ],
        done
          ? { color: '#5AB507', weight: 4, opacity: 0.85 }
          : { color: '#3B82F6', weight: 4, opacity: 0.8, dashArray: '6, 8' },
      ).addTo(map);
      layersRef.current.push(line);
    }

    const validDriver =
      driverLat !== null && driverLat !== undefined && driverLng !== null && driverLng !== undefined &&
      !isNaN(driverLat) && !isNaN(driverLng) && driverLat !== 0 && driverLng !== 0;

    if (validDriver) {
      const marker = L.marker([driverLat, driverLng], { icon: driverIcon(L) })
        .addTo(map)
        .bindPopup(`<b>${driverName}</b>`);
      layersRef.current.push(marker);
      bounds.push([driverLat as number, driverLng as number]);
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else {
      map.setView([4.6097, -74.0817], 12);
    }

    const timer = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(timer);
  }, [leafletLoaded, stops, driverLat, driverLng, driverName]);

  return (
    <div className="relative w-full h-full min-h-[320px] bg-slate-50 overflow-hidden border border-slate-100 rounded-2xl shadow-inner">
      {!leafletLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-xs z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0B1E36] border-t-transparent mb-3" />
          <span className="text-xs text-slate-500 font-semibold tracking-wide">Cargando mapa...</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full z-0" style={{ minHeight: '320px' }} />
    </div>
  );
}
