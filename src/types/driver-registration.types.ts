export const VehicleType = {
  TIPO_LIVIANO: 'TIPO_LIVIANO',
  CAMION_SENCILLO: 'CAMION_SENCILLO',
  DOBLE_TROQUE: 'DOBLE_TROQUE',
  GRUA_PLATAFORMA: 'GRUA_PLATAFORMA',
  GRUA_ELEVADOR: 'GRUA_ELEVADOR',
  GRUA_GANCHO_CADENA: 'GRUA_GANCHO_CADENA',
  GRUA_PLUMA: 'GRUA_PLUMA',
  GRUA_CAMABAJA: 'GRUA_CAMABAJA',
} as const;
export type VehicleType = typeof VehicleType[keyof typeof VehicleType];

export const AttachmentType = {
  PLANCHON: 'PLANCHON',
  REMOLQUE: 'REMOLQUE',
  CARROCERIA: 'CARROCERIA',
} as const;
export type AttachmentType = typeof AttachmentType[keyof typeof AttachmentType];


export interface FamiliarReference {
  nombre: string;
  parentesco: string;
  celular: string;
}

export interface LaboralReference {
  empresa: string;
  contacto: string;
  celular: string;
}

export interface DriverPayload {
  name: string;
  cedulaNumero: string;
  city: string;
  neighborhood: string;
  address: string;
  phone: string;
  email: string;
  licenciaVencimiento: string;
  fotoDocumento: File;
  fotoCedulaFrente: File;
  fotoCedulaReverso: File;
  fotoLicenciaFrente: File;
  fotoLicenciaReverso: File;
  planillaSeguridadSocial: File;
  referenciasFamiliares: FamiliarReference[];
  referenciasLaborales: LaboralReference[];
}

export interface OwnerPayload {
  fotoCedulaFrente: File;
  fotoCedulaReverso: File;
  municipality: string;
  neighborhood: string;
  address: string;
  phone: string;
  email: string;
  rut: File;
  certificadoBancario: File;
}

export interface VehiclePayload {
  type: VehicleType;
  plate: string;
  brand: string;
  model: string;
  year: number;
  maxWeightTons: number;
  color?: string;
  matriculaFrente: File;
  matriculaReverso: File;
  cartaAutorizacion?: File;
  seguroResponsabilidadCivil?: File;
  soat: File;
  tecnomecanica: File;
  empresaSatelital?: {
    nombre?: string;
    usuario?: string;
    contrasena?: string;
  };
  fotoLateralIzquierda: File;
  fotoLateralDerecha: File;
  fotoFrontal: File;
  fotoTrasera: File;
}

export interface AttachmentPayload {
  type: AttachmentType;
  maxWeightTons: number;
  tarjetaPropiedad: File;
  fotoPlanchon: File;
}

export interface FullRegistrationPayload {
  driver?: DriverPayload;
  owner?: OwnerPayload;
  vehicle?: VehiclePayload;
  attachment?: AttachmentPayload;
}
