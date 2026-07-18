import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeftIcon, ArrowRightIcon, SendIcon } from 'lucide-react';

import { Stepper } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { isValidEmail } from '@/utils/validators';
import { serviciosService } from '@/services/servicios.service';

import { TypeStep } from './steps/TypeStep';
import { RouteAndCargoStep } from './steps/RouteAndCargoStep';
import { CargaDriverStep } from './steps/CargaDriverStep';
import { CargaQuoteStep } from './steps/CargaQuoteStep';
import { CargaClientStep } from './steps/CargaClientStep';
import { INITIAL_CARGA_STATE, estimateTotalKm, type CargaWizardState } from './types';

const STEPS = ['Tipo', 'Ruta y carga', 'Conductor', 'Cotización', 'Cliente'];

export function CargaServiceWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<CargaWizardState>(INITIAL_CARGA_STATE);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [typeError, setTypeError] = useState<string | undefined>();
  const [routeErrors, setRouteErrors] = useState<{
    stops?: Record<number, string>;
    cargoDescription?: string;
    vehicleType?: string;
  }>({});
  const [clientErrors, setClientErrors] = useState<
    Partial<Record<'name' | 'phone' | 'email' | 'consent' | 'company', string>>
  >({});

  function patch(update: Partial<CargaWizardState>) {
    setState((prev) => ({ ...prev, ...update }));
  }

  function validateType(): boolean {
    if (state.serviceMode === 'PROGRAMADO' && !state.scheduledAt) {
      setTypeError('Selecciona la fecha y hora del servicio');
      return false;
    }
    setTypeError(undefined);
    return true;
  }

  function validateRouteAndCargo(): boolean {
    const stopErrors: Record<number, string> = {};
    state.stops.forEach((stop, index) => {
      if (!stop.address.trim() || !stop.city.trim()) {
        stopErrors[index] = 'Selecciona una dirección válida';
      }
    });

    const errors: typeof routeErrors = {};
    if (Object.keys(stopErrors).length > 0) errors.stops = stopErrors;
    if (state.cargoDescription.trim().length < 5) {
      errors.cargoDescription = 'Describe la mercancía (mínimo 5 caracteres)';
    }
    if (!state.vehicleType) {
      errors.vehicleType = 'Selecciona el tipo de vehículo';
    }

    setRouteErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function fetchQuote(): Promise<boolean> {
    if (!state.vehicleType) return false;
    setQuoting(true);
    try {
      const res = await serviciosService.quoteCarga({
        vehicleType: state.vehicleType,
        estimatedWeightTons: state.estimatedWeightTons,
        stops: state.stops.map((s) => ({ city: s.city, lat: s.lat ?? 0, lng: s.lng ?? 0 })),
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
    if (state.clientType === 'COMPANY' && !state.companyId) errors.company = 'Selecciona una empresa';
    if (state.client.name.trim().length < 2) errors.name = 'Ingresa el nombre del cliente';
    if (state.client.phone.trim().length < 7) errors.phone = 'Ingresa un teléfono válido';
    if (!isValidEmail(state.client.email)) errors.email = 'Ingresa un correo válido';
    if (!state.consentAccepted) errors.consent = 'Debes aceptar el tratamiento de datos';
    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleNext() {
    if (step === 1) {
      if (!validateType()) return;
      setStep(2);
    } else if (step === 2) {
      if (!validateRouteAndCargo()) return;
      setStep(3);
    } else if (step === 3) {
      const ok = await fetchQuote();
      if (!ok) return;
      setStep(4);
    } else if (step === 4) {
      setStep(5);
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
    if (!validateClient() || !state.quote || !state.vehicleType) return;

    setSubmitting(true);
    try {
      const res = await serviciosService.createCarga({
        serviceMode: state.serviceMode,
        scheduledAt: state.serviceMode === 'PROGRAMADO' ? new Date(state.scheduledAt).toISOString() : undefined,
        stops: state.stops.map((s) => ({ address: s.address, city: s.city, lat: s.lat ?? 0, lng: s.lng ?? 0 })),
        cargoDescription: state.cargoDescription,
        estimatedWeightTons: state.estimatedWeightTons,
        vehicleType: state.vehicleType,
        driverId: state.driverId,
        estimatedKmTotal: estimateTotalKm(state),
        estimatedPrice: state.quote.total,
        paymentType: state.clientType === 'COMPANY' ? state.paymentType : undefined,
        clientType: state.clientType,
        client: {
          ...state.client,
          companyId: state.clientType === 'COMPANY' ? state.companyId ?? undefined : undefined,
        },
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
          {step === 1 && <TypeStep state={state} onChange={patch} error={typeError} />}
          {step === 2 && <RouteAndCargoStep state={state} onChange={patch} errors={routeErrors} />}
          {step === 3 && <CargaDriverStep state={state} onChange={patch} />}
          {step === 4 && <CargaQuoteStep state={state} />}
          {step === 5 && <CargaClientStep state={state} onChange={patch} errors={clientErrors} />}
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
