import type { ServicioActivo } from '@/services/drivers.service';

export interface PortalOutletContext {
  servicioActivo: ServicioActivo | null;
  loading: boolean;
  refetch: () => void;
}
