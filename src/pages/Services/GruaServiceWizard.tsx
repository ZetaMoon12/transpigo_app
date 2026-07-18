import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeftIcon, ArrowRightIcon, SendIcon } from 'lucide-react';

import { Stepper } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { isValidEmail } from '@/utils/validators';
import { serviciosService } from '@/services/servicios.service';

import { RouteStep } from './steps/RouteStep';
import { DriverStep } from './steps/DriverStep';
import { QuoteStep } from './steps/QuoteStep';
import { ClientStep } from './steps/ClientStep';
import { INITIAL_GRUA_STATE, resolveVehicleType, estimateStraightLineKm, type GruaWizardState } from './types';

const STEPS = ['Ruta', 'Conductor', 'Cotización', 'Cliente'];

export function GruaServiceWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<GruaWizardState>(INITIAL_GRUA_STATE);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [routeErrors, setRouteErrors] = useState<Partial<Record<'origin' | 'destination', string>>>({});
  const [driverError, setDriverError] = useState<string | undefined>();
  const [clientErrors, setClientErrors] = useState<Partial<Record<'name' | 'phone' | 'email' | 'consent', string>>>({});

  function patch(update: Partial<GruaWizardState>) {
    setState((prev) => ({ ...prev, ...update }));
  }

  function validateRoute(): boolean {
    const errors: typeof routeErrors = {};
    if (!state.origin.address.trim() || !state.origin.city.trim()) {
      errors.origin = 'Selecciona una dirección de origen válida';
    }
    if (!state.destination.address.trim() || !state.destination.city.trim()) {
      errors.destination = 'Selecciona una dirección de destino válida';
    }
    setRouteErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function fetchQuote(): Promise<boolean> {
    const vehicleType = resolveVehicleType(state);
    if (!vehicleType) {
      setDriverError('Selecciona un conductor o un tipo de vehículo para poder cotizar');
      return false;
    }
    setDriverError(undefined);
    setQuoting(true);
    try {
      const res = await serviciosService.quoteGrua({
        vehicleType,
        originCity: state.origin.city,
        destCity: state.destination.city,
      });
      patch({ quote: res.data });
      return true;
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'No se pudo calcular la cotización';
      toast.error(message);
      return false;
    } finally {
      setQuoting(false);
    }
  }

  function validateClient(): boolean {
    const errors: typeof clientErrors = {};
    if (state.client.name.trim().length < 2) errors.name = 'Ingresa el nombre del cliente';
    if (state.client.phone.trim().length < 7) errors.phone = 'Ingresa un teléfono válido';
    if (!isValidEmail(state.client.email)) errors.email = 'Ingresa un correo válido';
    if (!state.consentAccepted) errors.consent = 'Debes aceptar el tratamiento de datos';
    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleNext() {
    if (step === 1) {
      if (!validateRoute()) return;
      setStep(2);
    } else if (step === 2) {
      const ok = await fetchQuote();
      if (!ok) return;
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    if (step === 1) {
      navigate('/servicios');
      return;
    }
    setStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit() {
    if (!validateClient() || !state.quote) return;

    const vehicleType = resolveVehicleType(state);
    if (!vehicleType) {
      toast.error('Falta el tipo de vehículo para crear el servicio');
      return;
    }

    setSubmitting(true);
    try {
      const res = await serviciosService.createGrua({
        originAddress: state.origin.address,
        originCity: state.origin.city,
        originLat: state.origin.lat ?? 0,
        originLng: state.origin.lng ?? 0,
        destAddress: state.destination.address,
        destCity: state.destination.city,
        destLat: state.destination.lat ?? 0,
        destLng: state.destination.lng ?? 0,
        description: state.description || undefined,
        driverId: state.driverId,
        vehicleType,
        estimatedKm: estimateStraightLineKm(state),
        estimatedPrice: state.quote.total,
        client: { ...state.client },
        consentAccepted: true,
      });
      toast.success(res.message || `Servicio ${res.data.serviceCode} creado correctamente`);
      navigate('/servicios');
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : 'No se pudo crear el servicio';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const isLastStep = step === STEPS.length;
  const isBusy = quoting || submitting;

  return (
    <div className="flex flex-col min-h-full">
      <Stepper steps={STEPS} currentStep={step} onBack={handleBack} />

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-8">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-6 md:p-8">
          {step === 1 && <RouteStep state={state} onChange={patch} errors={routeErrors} />}
          {step === 2 && <DriverStep state={state} onChange={patch} error={driverError} />}
          {step === 3 && <QuoteStep state={state} />}
          {step === 4 && <ClientStep state={state} onChange={patch} errors={clientErrors} />}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isBusy}
            className="border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-1.5"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>{step === 1 ? 'Cancelar' : 'Anterior'}</span>
          </Button>

          {isLastStep ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isBusy}
              className="bg-[#0B1E36] hover:bg-[#0B1E36]/90 text-white font-semibold flex items-center gap-2 px-6"
            >
              {submitting ? <Spinner className="w-4 h-4 text-white" /> : <SendIcon className="w-4 h-4" />}
              <span>{submitting ? 'Creando servicio…' : 'Crear servicio'}</span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isBusy}
              className="bg-[#5AB507] hover:bg-[#5AB507]/90 text-white font-semibold flex items-center gap-1.5"
            >
              {quoting ? <Spinner className="w-4 h-4 text-white" /> : null}
              <span>{quoting ? 'Cotizando…' : 'Siguiente'}</span>
              {!quoting && <ArrowRightIcon className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
