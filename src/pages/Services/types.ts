import type { AddressValue } from './components/AddressSearchInput';
import type { VehicleType } from '@/services/tariffs.service';
import type { AvailableDriver, GruaQuote, CargaQuote, PaymentType } from '@/services/servicios.service';
import type { Company } from '@/services/companies.service';

export interface GruaWizardState {
  origin: AddressValue;
  destination: AddressValue;
  description: string;
  driverId: number | null;
  selectedDriver: AvailableDriver | null;
  manualVehicleType: VehicleType | null;
  quote: GruaQuote | null;
  client: { name: string; phone: string; email: string };
  consentAccepted: boolean;
}

export const EMPTY_ADDRESS: AddressValue = { address: '', city: '', lat: null, lng: null };

export const INITIAL_GRUA_STATE: GruaWizardState = {
  origin: { ...EMPTY_ADDRESS },
  destination: { ...EMPTY_ADDRESS },
  description: '',
  driverId: null,
  selectedDriver: null,
  manualVehicleType: null,
  quote: null,
  client: { name: '', phone: '', email: '' },
  consentAccepted: false,
};

/** Tipo de vehículo efectivo: el del conductor si hay uno asignado, o el elegido manualmente. */
export function resolveVehicleType(state: GruaWizardState): VehicleType | null {
  return state.selectedDriver?.vehicle.type ?? state.manualVehicleType;
}

/** Distancia en línea recta (km) entre origen y destino — no hay ruteo real, solo referencia. */
export function estimateStraightLineKm(state: GruaWizardState): number {
  const { origin, destination } = state;
  if (origin.lat === null || origin.lng === null || destination.lat === null || destination.lng === null) {
    return 0;
  }

  const R = 6371;
  const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
  const dLng = ((destination.lng - origin.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// ---------------------------------------------------------------------------
// Servicio de carga — multiparada, inmediato/programado, cliente persona/empresa
// ---------------------------------------------------------------------------

export interface CargaWizardState {
  serviceMode: 'INMEDIATO' | 'PROGRAMADO';
  scheduledAt: string; // valor de <input type="datetime-local">, '' si no aplica
  stops: AddressValue[]; // mínimo 2 (origen + destino)
  cargoDescription: string;
  estimatedWeightTons: number | null;
  vehicleType: VehicleType | null;
  driverId: number | null;
  selectedDriver: AvailableDriver | null;
  quote: CargaQuote | null;
  clientType: 'PERSON' | 'COMPANY';
  client: { name: string; phone: string; email: string };
  companyId: number | null;
  selectedCompany: Company | null;
  paymentType: PaymentType;
  consentAccepted: boolean;
}

export const INITIAL_CARGA_STATE: CargaWizardState = {
  serviceMode: 'INMEDIATO',
  scheduledAt: '',
  stops: [{ ...EMPTY_ADDRESS }, { ...EMPTY_ADDRESS }],
  cargoDescription: '',
  estimatedWeightTons: null,
  vehicleType: null,
  driverId: null,
  selectedDriver: null,
  quote: null,
  clientType: 'PERSON',
  client: { name: '', phone: '', email: '' },
  companyId: null,
  selectedCompany: null,
  paymentType: 'EFECTIVO',
  consentAccepted: false,
};

function haversineKm(a: AddressValue, b: AddressValue): number {
  if (a.lat === null || a.lng === null || b.lat === null || b.lng === null) return 0;

  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(R * c * 10) / 10;
}

/** Km en línea recta por cada tramo consecutivo — solo referencia, el backend siempre recalcula. */
export function estimateTramoKms(state: CargaWizardState): number[] {
  const kms: number[] = [];
  for (let i = 0; i < state.stops.length - 1; i++) {
    kms.push(haversineKm(state.stops[i], state.stops[i + 1]));
  }
  return kms;
}

export function estimateTotalKm(state: CargaWizardState): number {
  return Math.round(estimateTramoKms(state).reduce((sum, km) => sum + km, 0) * 10) / 10;
}
