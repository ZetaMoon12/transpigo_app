import type { VehicleType } from '@/services/tariffs.service';
import type { PaymentType } from '@/services/servicios.service';

export const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  TIPO_LIVIANO: 'Tipo liviano',
  CAMION_SENCILLO: 'Camión sencillo',
  DOBLE_TROQUE: 'Doble troque',
  GRUA_PLATAFORMA: 'Grúa plataforma',
  GRUA_ELEVADOR: 'Grúa elevador',
  GRUA_GANCHO_CADENA: 'Grúa gancho/cadena',
  GRUA_PLUMA: 'Grúa pluma',
  GRUA_CAMABAJA: 'Grúa cama baja',
};

export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  PAYU: 'Pago en línea (PayU)',
  CREDITO_EMPRESA: 'Crédito empresarial',
  EFECTIVO: 'Efectivo',
  EMPRESA_INTERNA: 'Flota propia de la empresa',
};
