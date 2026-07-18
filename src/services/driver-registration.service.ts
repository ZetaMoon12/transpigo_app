import { httpClient } from './http-client';
import type { FullRegistrationPayload } from '../types/driver-registration.types';
import type { ApiResponse } from '../types/api.types';


/**
 * Servicio para el registro completo de conductores (Apertura de Hoja de Vida)
 * NOTA: El endpoint '/drivers/full-registration' es propuesto y requiere
 * implementación en el backend.
 */
export const driverRegistrationService = {
  create: (payload: FullRegistrationPayload) => {
    const formData = new FormData();

    // 1. Driver Text & Files
    if (payload.driver) {
      const {
        fotoDocumento,
        fotoCedulaFrente: dCedulaFrente,
        fotoCedulaReverso: dCedulaReverso,
        fotoLicenciaFrente: dLicenciaFrente,
        fotoLicenciaReverso: dLicenciaReverso,
        planillaSeguridadSocial,
        ...driverText
      } = payload.driver;

      formData.append('driver', JSON.stringify(driverText));
      if (fotoDocumento) formData.append('driver.fotoDocumento', fotoDocumento);
      if (dCedulaFrente) formData.append('driver.fotoCedulaFrente', dCedulaFrente);
      if (dCedulaReverso) formData.append('driver.fotoCedulaReverso', dCedulaReverso);
      if (dLicenciaFrente) formData.append('driver.fotoLicenciaFrente', dLicenciaFrente);
      if (dLicenciaReverso) formData.append('driver.fotoLicenciaReverso', dLicenciaReverso);
      if (planillaSeguridadSocial) formData.append('driver.planillaSeguridadSocial', planillaSeguridadSocial);
    }

    // 2. Owner Text & Files
    if (payload.owner) {
      const {
        fotoCedulaFrente: oCedulaFrente,
        fotoCedulaReverso: oCedulaReverso,
        rut,
        certificadoBancario,
        ...ownerText
      } = payload.owner;

      formData.append('owner', JSON.stringify(ownerText));
      if (oCedulaFrente) formData.append('owner.fotoCedulaFrente', oCedulaFrente);
      if (oCedulaReverso) formData.append('owner.fotoCedulaReverso', oCedulaReverso);
      if (rut) formData.append('owner.rut', rut);
      if (certificadoBancario) formData.append('owner.certificadoBancario', certificadoBancario);
    }

    // 3. Vehicle Text & Files
    if (payload.vehicle) {
      const {
        matriculaFrente,
        matriculaReverso,
        cartaAutorizacion,
        seguroResponsabilidadCivil,
        soat: vSoat,
        tecnomecanica: vTecnomecanica,
        fotoLateralIzquierda,
        fotoLateralDerecha,
        fotoFrontal,
        fotoTrasera,
        ...vehicleText
      } = payload.vehicle;

      formData.append('vehicle', JSON.stringify(vehicleText));
      if (matriculaFrente) formData.append('vehicle.matriculaFrente', matriculaFrente);
      if (matriculaReverso) formData.append('vehicle.matriculaReverso', matriculaReverso);
      if (cartaAutorizacion) formData.append('vehicle.cartaAutorizacion', cartaAutorizacion);
      if (seguroResponsabilidadCivil) formData.append('vehicle.seguroResponsabilidadCivil', seguroResponsabilidadCivil);
      if (vSoat) formData.append('vehicle.soat', vSoat);
      if (vTecnomecanica) formData.append('vehicle.tecnomecanica', vTecnomecanica);
      if (fotoLateralIzquierda) formData.append('vehicle.fotoLateralIzquierda', fotoLateralIzquierda);
      if (fotoLateralDerecha) formData.append('vehicle.fotoLateralDerecha', fotoLateralDerecha);
      if (fotoFrontal) formData.append('vehicle.fotoFrontal', fotoFrontal);
      if (fotoTrasera) formData.append('vehicle.fotoTrasera', fotoTrasera);
    }

    if (payload.attachment) {
      const {
        tarjetaPropiedad,
        fotoPlanchon,
        ...attachmentText
      } = payload.attachment;

      formData.append('attachment', JSON.stringify(attachmentText));
      if (tarjetaPropiedad) formData.append('attachment.tarjetaPropiedad', tarjetaPropiedad);
      if (fotoPlanchon) formData.append('attachment.fotoPlanchon', fotoPlanchon);
    }

    return httpClient.upload<ApiResponse<{ id: string }>>('/drivers/full-registration', formData);
  },
};
