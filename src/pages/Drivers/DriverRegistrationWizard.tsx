import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  SaveIcon,
  UserIcon,
  TruckIcon,
  LayersIcon,
  XIcon,
} from 'lucide-react';

import { Stepper } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { VehicleType } from '@/types/driver-registration.types';
import {
  fullRegistrationSchema,
  driverSchema,
  ownerSchema,
  vehicleSchema,
  attachmentSchema,
} from '@/schemas/driver-registration.schema';
import { driverRegistrationService } from '@/services/driver-registration.service';

// Steps components
import { DriverStep } from './steps/DriverStep';
import { OwnerStep } from './steps/OwnerStep';
import { VehicleStep } from './steps/VehicleStep';
import { AttachmentStep } from './steps/AttachmentStep';
import { ReviewStep } from './steps/ReviewStep';

type RegistrationMode = 'DRIVER_ONLY' | 'VEHICLE_ONLY' | 'BOTH';

export function DriverRegistrationWizard() {
  const [registrationMode, setRegistrationMode] = useState<RegistrationMode | null>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Dynamic schema resolver based on active mode
  const dynamicResolver = (values: any, context: any, options: any) => {
    let schemaToUse = fullRegistrationSchema;
    if (registrationMode === 'DRIVER_ONLY') {
      schemaToUse = z.object({ driver: driverSchema }) as any;
    } else if (registrationMode === 'VEHICLE_ONLY') {
      schemaToUse = z.object({
        owner: ownerSchema,
        vehicle: vehicleSchema,
        attachment: attachmentSchema.optional().nullable(),
      }) as any;
    }
    return zodResolver(schemaToUse)(values, context, options);
  };

  const methods = useForm({
    resolver: dynamicResolver,
    mode: 'onSubmit',
    defaultValues: {
      driver: {
        name: '',
        cedulaNumero: '',
        city: '',
        neighborhood: '',
        address: '',
        phone: '',
        email: '',
        licenciaVencimiento: '',
        referenciasFamiliares: [
          { nombre: '', parentesco: '', celular: '' },
          { nombre: '', parentesco: '', celular: '' },
        ],
        referenciasLaborales: [
          { empresa: '', contacto: '', celular: '' },
          { empresa: '', contacto: '', celular: '' },
        ],
      },
      owner: {
        municipality: '',
        neighborhood: '',
        address: '',
        phone: '',
        email: '',
      },
      vehicle: {
        type: '' as any,
        plate: '',
        brand: '',
        model: '',
        year: undefined as any,
        maxWeightTons: undefined as any,
        color: '',
        isPlateAnotherOwner: false,
        empresaSatelital: {
          nombre: '',
          usuario: '',
          contrasena: '',
        },
      },
      attachment: {
        type: '' as any,
        maxWeightTons: undefined as any,
      },
    },
  });

  const { watch, trigger, handleSubmit } = methods;

  // Watch vehicle type to decide if attachment step is required
  const vehicleType = watch('vehicle.type');
  const isCrane =
    vehicleType === VehicleType.GRUA_PLATAFORMA ||
    vehicleType === VehicleType.GRUA_ELEVADOR ||
    vehicleType === VehicleType.GRUA_GANCHO_CADENA ||
    vehicleType === VehicleType.GRUA_PLUMA ||
    vehicleType === VehicleType.GRUA_CAMABAJA;

  // Define steps list dynamically
  const steps = (() => {
    if (registrationMode === 'DRIVER_ONLY') {
      return ['Conductor', 'Revisión'];
    }
    if (registrationMode === 'VEHICLE_ONLY') {
      return isCrane
        ? ['Propietario', 'Vehículo', 'Planchón', 'Revisión']
        : ['Propietario', 'Vehículo', 'Revisión'];
    }
    // BOTH
    return isCrane
      ? ['Conductor', 'Propietario', 'Vehículo', 'Planchón', 'Revisión']
      : ['Conductor', 'Propietario', 'Vehículo', 'Revisión'];
  })();

  const totalSteps = steps.length;

  const handleNext = async () => {
    let isValid = false;

    if (registrationMode === 'DRIVER_ONLY') {
      if (step === 1) {
        isValid = await trigger('driver');
      }
    } else if (registrationMode === 'VEHICLE_ONLY') {
      if (step === 1) {
        isValid = await trigger('owner');
      } else if (step === 2) {
        isValid = await trigger('vehicle');
      } else if (step === 3 && isCrane) {
        isValid = await trigger('attachment');
      }
    } else { // BOTH
      if (step === 1) {
        isValid = await trigger('driver');
      } else if (step === 2) {
        isValid = await trigger('owner');
      } else if (step === 3) {
        isValid = await trigger('vehicle');
      } else if (step === 4 && isCrane) {
        isValid = await trigger('attachment');
      }
    }

    if (isValid) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error('Por favor corrige los errores del formulario antes de continuar');
    }
  };

  const handleBack = () => {
    if (step === 1) {
      setRegistrationMode(null);
    } else {
      setStep((prev) => Math.max(1, prev - 1));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Map review edit button clicks to corresponding step in the active mode
  const handleEditStep = (targetStep: number) => {
    if (registrationMode === 'DRIVER_ONLY') {
      if (targetStep === 1) setStep(1);
    } else if (registrationMode === 'VEHICLE_ONLY') {
      if (targetStep === 2) setStep(1); // Propietario
      else if (targetStep === 3) setStep(2); // Vehículo
      else if (targetStep === 4) setStep(3); // Planchón
    } else { // BOTH
      setStep(targetStep);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const finalPayload = { ...data };

      // Omit sections based on selection mode
      if (registrationMode === 'DRIVER_ONLY') {
        delete finalPayload.owner;
        delete finalPayload.vehicle;
        delete finalPayload.attachment;
      } else if (registrationMode === 'VEHICLE_ONLY') {
        delete finalPayload.driver;
        if (!isCrane) {
          finalPayload.attachment = null;
        }
      } else { // BOTH
        if (!isCrane) {
          finalPayload.attachment = null;
        }
      }

      const response = await driverRegistrationService.create(finalPayload);
      toast.success(response.message || 'Registro completado con éxito');
      navigate('/conductores');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error de red o servidor. Intente de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render correct step view
  const renderStepContent = () => {
    if (registrationMode === 'DRIVER_ONLY') {
      switch (step) {
        case 1:
          return <DriverStep />;
        case 2:
          return <ReviewStep onEditStep={handleEditStep} />;
        default:
          return null;
      }
    }
    if (registrationMode === 'VEHICLE_ONLY') {
      switch (step) {
        case 1:
          return <OwnerStep />;
        case 2:
          return <VehicleStep />;
        case 3:
          return isCrane ? <AttachmentStep /> : <ReviewStep onEditStep={handleEditStep} />;
        case 4:
          return isCrane ? <ReviewStep onEditStep={handleEditStep} /> : null;
        default:
          return null;
      }
    }
    // BOTH
    switch (step) {
      case 1:
        return <DriverStep />;
      case 2:
        return <OwnerStep />;
      case 3:
        return <VehicleStep />;
      case 4:
        return isCrane ? <AttachmentStep /> : <ReviewStep onEditStep={handleEditStep} />;
      case 5:
        return isCrane ? <ReviewStep onEditStep={handleEditStep} /> : null;
      default:
        return null;
    }
  };

  const isReviewStep = step === totalSteps;

  // Render registration mode selection page
  if (registrationMode === null) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in-50 duration-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0B1E36] tracking-tight">
              Apertura de Hoja de Vida
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Selecciona el tipo de registro que deseas realizar hoy en la plataforma.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/conductores')}
            className="text-slate-800 border-slate-300 bg-white hover:bg-slate-100 hover:text-slate-950 shadow-xs flex items-center justify-center h-9 w-9 p-0"
          >
            <XIcon className="w-5 h-5 stroke-[2.5]" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Card: Both */}
          <div
            onClick={() => {
              setRegistrationMode('BOTH');
              setStep(1);
            }}
            className="group cursor-pointer bg-white border border-slate-200 hover:border-[#5AB507] rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between min-h-[250px]"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#5AB507]/10 flex items-center justify-center text-[#5AB507] group-hover:scale-110 transition-transform">
                <LayersIcon className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#5AB507] transition-colors">
                  Conductor y Vehículo
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Flujo de apertura unificado completo. Registra los datos del conductor, propietario, camión/grúa e implementos en un solo envío.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#5AB507] uppercase tracking-wider group-hover:underline flex items-center gap-1 mt-4">
              <span>Iniciar registro</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Card: Driver Only */}
          <div
            onClick={() => {
              setRegistrationMode('DRIVER_ONLY');
              setStep(1);
            }}
            className="group cursor-pointer bg-white border border-slate-200 hover:border-[#5AB507] rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between min-h-[250px]"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#5AB507]/10 flex items-center justify-center text-[#5AB507] group-hover:scale-110 transition-transform">
                <UserIcon className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#5AB507] transition-colors">
                  Solo Conductor
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Registra únicamente la información personal, referencias y la planilla de seguridad social del conductor sin asignar un vehículo.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#5AB507] uppercase tracking-wider group-hover:underline flex items-center gap-1 mt-4">
              <span>Iniciar registro</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Card: Vehicle Only */}
          <div
            onClick={() => {
              setRegistrationMode('VEHICLE_ONLY');
              setStep(1);
            }}
            className="group cursor-pointer bg-white border border-slate-200 hover:border-[#5AB507] rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between min-h-[250px]"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#5AB507]/10 flex items-center justify-center text-[#5AB507] group-hover:scale-110 transition-transform">
                <TruckIcon className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#5AB507] transition-colors">
                  Solo Vehículo
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Registra los datos del propietario del vehículo, especificaciones del camión o grúa, planchón acoplado y sus seguros obligatorios.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#5AB507] uppercase tracking-wider group-hover:underline flex items-center gap-1 mt-4">
              <span>Iniciar registro</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col min-h-full">
        {/* Visual Stepper */}
        <Stepper steps={steps} currentStep={step} onBack={handleBack} />

        {/* Form Container */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-8"
        >
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-6 md:p-8">
            {renderStepContent()}
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-6 no-print">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>{step === 1 ? 'Cambiar Modo' : 'Anterior'}</span>
            </Button>

            {isReviewStep ? (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#0B1E36] hover:bg-[#0B1E36]/90 text-white font-semibold flex items-center gap-2 px-6"
              >
                {isSubmitting ? (
                  <Spinner className="w-4 h-4 text-white" />
                ) : (
                  <SaveIcon className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'Registrando...' : 'Completar Apertura'}</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="bg-[#5AB507] hover:bg-[#5AB507]/90 text-white font-semibold flex items-center gap-1.5"
              >
                <span>Siguiente</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
