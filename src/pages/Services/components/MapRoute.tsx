import { useEffect, useRef, useState } from 'react';

interface MapRouteProps {
  originLat: number | null;
  originLng: number | null;
  destLat: number | null;
  destLng: number | null;
  driverLat?: number | null;
  driverLng?: number | null;
  originAddress?: string;
  destAddress?: string;
  driverName?: string;
}

export function MapRoute({
  originLat,
  originLng,
  destLat,
  destLng,
  driverLat,
  driverLng,
  originAddress = 'Origen',
  destAddress = 'Destino',
  driverName = 'Conductor',
}: MapRouteProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Carga dinámica de Leaflet (JS y CSS) desde CDN público
  useEffect(() => {
    const linkId = 'leaflet-css';
    const scriptId = 'leaflet-js';

    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.body.appendChild(script);
    } else {
      if ((window as any).L) {
        setLeafletLoaded(true);
      } else {
        const script = document.getElementById(scriptId);
        if (script) {
          script.addEventListener('load', () => setLeafletLoaded(true));
        }
      }
    }
  }, []);

  // Limpieza del mapa al desmontar el componente
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Inicialización e hidratación del mapa y marcadores
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Crear el mapa si no existe
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Limpiar marcadores y polilíneas anteriores
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    const bounds: any[] = [];

    // Creador de íconos personalizados estilizados con HTML/CSS
    const createCustomDivIcon = (color: string, text: string, type: 'point' | 'driver') => {
      if (type === 'driver') {
        return L.divIcon({
          className: 'custom-leaflet-driver-icon',
          html: `
            <div style="
              background-color: ${color};
              color: white;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              border: 2.5px solid #5AB507;
              box-shadow: 0 4px 10px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.3s ease;
            ">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><polyline points="14 18 18 18 22 14 22 10 18 10 14 10"/><circle cx="7.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/></svg>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
      }

      return L.divIcon({
        className: 'custom-leaflet-point-icon',
        html: `
          <div style="
            background-color: ${color};
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 3px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 13px;
          ">
            ${text}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
    };

    // Añadir marcador de origen (Verde)
    const validOrigin = originLat !== null && originLng !== null && !isNaN(originLat) && !isNaN(originLng) && originLat !== 0 && originLng !== 0;
    if (validOrigin) {
      const originIcon = createCustomDivIcon('#5AB507', 'A', 'point');
      const originMarker = L.marker([originLat, originLng], { icon: originIcon })
        .addTo(map)
        .bindPopup(`<b>Origen:</b><br/>${originAddress}`);
      markersRef.current.push(originMarker);
      bounds.push([originLat, originLng]);
    }

    // Añadir marcador de destino (Rojo)
    const validDest = destLat !== null && destLng !== null && !isNaN(destLat) && !isNaN(destLng) && destLat !== 0 && destLng !== 0;
    if (validDest) {
      const destIcon = createCustomDivIcon('#EF4444', 'B', 'point');
      const destMarker = L.marker([destLat, destLng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>Destino:</b><br/>${destAddress}`);
      markersRef.current.push(destMarker);
      bounds.push([destLat, destLng]);
    }

    // Añadir marcador de conductor (Azul Marino con borde verde)
    const validDriver = driverLat !== null && driverLat !== undefined && driverLng !== null && driverLng !== undefined && !isNaN(driverLat) && !isNaN(driverLng) && driverLat !== 0 && driverLng !== 0;
    if (validDriver) {
      const driverIcon = createCustomDivIcon('#0B1E36', 'D', 'driver');
      const driverMarker = L.marker([driverLat, driverLng], { icon: driverIcon })
        .addTo(map)
        .bindPopup(`<b>Conductor Asignado:</b><br/>${driverName}`);
      markersRef.current.push(driverMarker);
      bounds.push([driverLat, driverLng]);
    }

    // Dibujar línea de la ruta
    if (validOrigin && validDest) {
      polylineRef.current = L.polyline([[originLat, originLng], [destLat, destLng]], {
        color: '#3B82F6',
        weight: 4,
        opacity: 0.8,
        dashArray: '6, 8',
      }).addTo(map);
    }

    // Ajustar zoom y encuadre a los límites
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else {
      // Coordenadas default de Bogotá
      map.setView([4.6097, -74.0817], 12);
    }

    // Invalidar tamaño después del renderizado para evitar fallos de visualización parcial (baldosas grises)
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => clearTimeout(timer);
  }, [leafletLoaded, originLat, originLng, destLat, destLng, driverLat, driverLng, originAddress, destAddress, driverName]);

  return (
    <div className="relative w-full h-full min-h-[340px] bg-slate-50 overflow-hidden border border-slate-100 rounded-2xl shadow-inner">
      {!leafletLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-xs z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0B1E36] border-t-transparent mb-3" />
          <span className="text-xs text-slate-500 font-semibold tracking-wide">Cargando mapa interactivo...</span>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full z-0" style={{ minHeight: '340px' }} />
    </div>
  );
}
