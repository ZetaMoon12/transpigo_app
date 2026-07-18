import { useEffect, useRef, useState } from 'react';
import { env } from '@/config';

/**
 * Búsqueda de direcciones con Mapbox Geocoding, optimizada para costos:
 *   1. Mínimo 4 caracteres para disparar la búsqueda
 *   2. Debounce de 400ms
 *   3. Cache en sessionStorage — clave: `mapbox:${query}`
 *   4. Bbox limitado a Colombia
 *   5. Types: address,poi (excluye country, region)
 *   6. Language: es · Limit: 5 resultados
 *
 * Sin VITE_MAPBOX_TOKEN configurado, `hasToken` es false y el consumidor
 * debe degradar a entrada manual de dirección/ciudad.
 */

const BBOX_COLOMBIA = '-81.7,-4.2,-66.8,13.4';
const MIN_QUERY_LENGTH = 4;
const DEBOUNCE_MS = 400;

interface MapboxContextEntry {
  id: string;
  text: string;
}

export interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [lng, lat]
  context?: MapboxContextEntry[];
}

/** Extrae la ciudad (place/locality) del contexto del feature de Mapbox. */
export function getFeatureCity(feature: MapboxFeature): string {
  const byType = (prefix: string) =>
    feature.context?.find((c) => c.id.startsWith(`${prefix}.`))?.text;
  return byType('place') ?? byType('locality') ?? byType('district') ?? '';
}

async function searchPlaces(query: string): Promise<MapboxFeature[]> {
  const cacheKey = `mapbox:${query}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached) as MapboxFeature[];

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
  );
  url.searchParams.set('access_token', env.MAPBOX_TOKEN);
  url.searchParams.set('bbox', BBOX_COLOMBIA);
  url.searchParams.set('types', 'address,poi');
  url.searchParams.set('language', 'es');
  url.searchParams.set('limit', '5');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Mapbox geocoding falló (${res.status})`);
  const data = await res.json();
  const features: MapboxFeature[] = data.features ?? [];

  sessionStorage.setItem(cacheKey, JSON.stringify(features));
  return features;
}

export function useMapboxSearch() {
  const hasToken = !!env.MAPBOX_TOKEN;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MapboxFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef('');

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const trimmed = query.trim();
    lastQueryRef.current = trimmed;

    if (!hasToken || trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const features = await searchPlaces(trimmed);
        // Ignorar respuestas de queries viejos que llegan tarde
        if (lastQueryRef.current === trimmed) setResults(features);
      } catch {
        if (lastQueryRef.current === trimmed) setResults([]);
      } finally {
        if (lastQueryRef.current === trimmed) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query, hasToken]);

  return {
    hasToken,
    query,
    setQuery,
    results,
    loading,
    clearResults: () => setResults([]),
  };
}
