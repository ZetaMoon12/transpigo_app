import { useEffect, useState } from 'react';

/** Carga Leaflet (JS+CSS) desde CDN una sola vez — sin Mapbox ni claves. */
export function useLeaflet() {
  const [loaded, setLoaded] = useState(() => typeof window !== 'undefined' && !!(window as any).L);

  useEffect(() => {
    if (loaded) return;

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
      script.onload = () => setLoaded(true);
      document.body.appendChild(script);
    } else if ((window as any).L) {
      setLoaded(true);
    } else {
      document.getElementById(scriptId)?.addEventListener('load', () => setLoaded(true));
    }
  }, [loaded]);

  return loaded;
}
