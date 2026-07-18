import { useRef, useState } from 'react';
import { MapPinIcon, Loader2Icon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useMapboxSearch, getFeatureCity, type MapboxFeature } from '@/hooks/useMapboxSearch';

export interface AddressValue {
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
}

interface AddressSearchInputProps {
  placeholder?: string;
  value: AddressValue;
  onChange: (value: AddressValue) => void;
}

/**
 * Input de dirección con autocompletado de Mapbox. Al escribir se buscan
 * sugerencias (Colombia); al seleccionar una se completan ciudad y coordenadas.
 * Sin token de Mapbox funciona como input manual (sin sugerencias).
 */
export function AddressSearchInput({ placeholder, value, onChange }: AddressSearchInputProps) {
  const { hasToken, setQuery, results, loading, clearResults } = useMapboxSearch();
  const [focused, setFocused] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleType(text: string) {
    // Texto escrito a mano: invalida las coordenadas de la selección anterior
    onChange({ ...value, address: text, lat: null, lng: null });
    setQuery(text);
  }

  function handleSelect(feature: MapboxFeature) {
    onChange({
      address: feature.place_name,
      city: getFeatureCity(feature) || value.city,
      lat: feature.center[1],
      lng: feature.center[0],
    });
    clearResults();
    setQuery('');
  }

  const showDropdown = hasToken && focused && (loading || results.length > 0);

  return (
    <div className="relative">
      <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      <Input
        value={value.address}
        placeholder={placeholder ?? 'Escribe la dirección…'}
        className="pl-9"
        onChange={(e) => handleType(e.target.value)}
        onFocus={() => {
          if (blurTimeout.current) clearTimeout(blurTimeout.current);
          setFocused(true);
        }}
        onBlur={() => {
          // Retrasar el cierre para que el click en una sugerencia alcance a procesarse
          blurTimeout.current = setTimeout(() => setFocused(false), 150);
        }}
      />

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-400">
              <Loader2Icon className="h-4 w-4 animate-spin" /> Buscando…
            </div>
          )}
          {!loading &&
            results.map((feature) => (
              <button
                key={feature.id}
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(feature)}
              >
                <MapPinIcon className="h-4 w-4 mt-0.5 shrink-0 text-[#5AB507]" />
                <span className="text-slate-700">{feature.place_name}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
