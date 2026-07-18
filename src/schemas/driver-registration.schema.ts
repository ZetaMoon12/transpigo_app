import { z } from 'zod';
import { VehicleType, AttachmentType } from '../types/driver-registration.types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg', 'application/pdf'];

export const fileSchema = z
  .custom<File>((val) => val instanceof File, 'El archivo es requerido')
  .refine((file) => file.size <= MAX_FILE_SIZE, 'El archivo no debe superar los 5MB')
  .refine(
    (file) => ACCEPTED_FILE_TYPES.includes(file.type),
    'Solo se permiten imágenes (JPEG, PNG, GIF, WEBP) o documentos PDF'
  );

export const optionalFileSchema = z
  .custom<File | undefined>((val) => val === undefined || val instanceof File)
  .refine((file) => !file || file.size <= MAX_FILE_SIZE, 'El archivo no debe superar los 5MB')
  .refine(
    (file) => !file || ACCEPTED_FILE_TYPES.includes(file.type),
    'Solo se permiten imágenes o PDFs'
  );

export const driverSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  cedulaNumero: z.string().min(5, 'La cédula debe tener al menos 5 caracteres'),
  city: z.string().min(1, 'La ciudad es requerida'),
  neighborhood: z.string().min(1, 'El barrio es requerido'),
  address: z.string().min(1, 'La dirección es requerida'),
  phone: z.string().min(7, 'El teléfono debe tener al menos 7 dígitos').max(20, 'El teléfono no puede superar los 20 caracteres'),
  email: z.string().email('Ingrese un correo electrónico válido'),
  licenciaVencimiento: z.string().min(1, 'La fecha de vencimiento es requerida'),
  fotoDocumento: fileSchema,
  fotoCedulaFrente: fileSchema,
  fotoCedulaReverso: fileSchema,
  fotoLicenciaFrente: fileSchema,
  fotoLicenciaReverso: fileSchema,
  planillaSeguridadSocial: fileSchema,
  referenciasFamiliares: z.array(
    z.object({
      nombre: z.string().min(2, 'El nombre es requerido'),
      parentesco: z.string().min(1, 'El parentesco es requerido'),
      celular: z.string().min(7, 'El celular es requerido'),
    })
  ).length(2, 'Se requieren exactamente 2 referencias familiares'),
  referenciasLaborales: z.array(
    z.object({
      empresa: z.string().min(2, 'La empresa es requerida'),
      contacto: z.string().min(2, 'El nombre del contacto es requerido'),
      celular: z.string().min(7, 'El celular es requerido'),
    })
  ).length(2, 'Se requieren exactamente 2 referencias laborales'),
});

export const ownerSchema = z.object({
  fotoCedulaFrente: fileSchema,
  fotoCedulaReverso: fileSchema,
  municipality: z.string().min(1, 'El municipio es requerido'),
  neighborhood: z.string().min(1, 'El barrio es requerido'),
  address: z.string().min(1, 'La dirección es requerida'),
  phone: z.string().min(7, 'El teléfono es requerido'),
  email: z.string().email('Ingrese un correo electrónico válido'),
  rut: fileSchema,
  certificadoBancario: fileSchema,
});

export const vehicleSchema = z.object({
  type: z.nativeEnum(VehicleType, { message: 'El tipo de vehículo es requerido' }),
  plate: z.string().min(5, 'La placa debe tener al menos 5 caracteres').max(10, 'La placa no debe superar los 10 caracteres'),
  brand: z.string().min(2, 'La marca debe tener al menos 2 caracteres').max(60),
  model: z.string().min(2, 'El modelo debe tener al menos 2 caracteres').max(60),
  year: z.coerce.number({ message: 'El año debe ser un número' }).int().min(1990, 'El año debe ser 1990 o posterior').max(new Date().getFullYear() + 1, 'Año inválido'),
  maxWeightTons: z.coerce.number({ message: 'La capacidad debe ser un número' }).min(0, 'La capacidad no puede ser negativa').max(100, 'La capacidad no puede superar las 100 toneladas'),
  color: z.string().max(40).optional(),
  matriculaFrente: fileSchema,
  matriculaReverso: fileSchema,
  isPlateAnotherOwner: z.boolean().default(false),
  cartaAutorizacion: optionalFileSchema,
  seguroResponsabilidadCivil: optionalFileSchema,
  soat: fileSchema,
  tecnomecanica: fileSchema,
  empresaSatelital: z.object({
    nombre: z.string().optional(),
    usuario: z.string().optional(),
    contrasena: z.string().optional(),
  }).optional(),
  fotoLateralIzquierda: fileSchema,
  fotoLateralDerecha: fileSchema,
  fotoFrontal: fileSchema,
  fotoTrasera: fileSchema,
}).refine((data) => {
  if (data.isPlateAnotherOwner) {
    return data.cartaAutorizacion instanceof File;
  }
  return true;
}, {
  message: 'La carta de autorización es requerida si la matrícula está a nombre de otra persona',
  path: ['cartaAutorizacion'],
});

export const attachmentSchema = z.object({
  type: z.nativeEnum(AttachmentType, { message: 'El tipo de planchón es requerido' }),
  maxWeightTons: z.coerce.number({ message: 'La capacidad debe ser un número' }).min(0, 'La capacidad no puede ser negativa').max(100, 'La capacidad no puede superar las 100 toneladas'),
  tarjetaPropiedad: fileSchema,
  fotoPlanchon: fileSchema,
});

export const fullRegistrationSchema = z.object({
  driver: driverSchema,
  owner: ownerSchema,
  vehicle: vehicleSchema,
  attachment: attachmentSchema.optional().nullable(),
});
