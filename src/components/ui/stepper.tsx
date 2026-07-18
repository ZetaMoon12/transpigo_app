import { CheckIcon, ArrowLeftIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface StepperProps {
  steps: string[];
  currentStep: number; // 1-based index
  onBack?: () => void;
}

export function Stepper({ steps, currentStep, onBack }: StepperProps) {
  return (
    <div className="w-full py-4 bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs no-print">
      <div className="max-w-4xl mx-auto px-4 flex items-center gap-6">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="text-slate-800 border-slate-350 bg-white hover:bg-slate-100 hover:text-slate-950 shadow-xs flex items-center justify-center h-9 w-9 p-0 shrink-0 cursor-pointer"
            title="Volver"
          >
            <ArrowLeftIcon className="w-5 h-5 stroke-[2.5]" />
          </Button>
        )}
        
        <div className="flex-1">
          {/* Mobile View */}
          <div className="flex items-center justify-between md:hidden">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Paso {currentStep} de {steps.length}
            </span>
            <span className="text-sm font-bold text-slate-800">
              {steps[currentStep - 1]}
            </span>
          </div>
          {/* Circular Progress Indicator for Mobile */}
          <div className="flex items-center gap-1.5 bg-[#5AB507]/10 text-[#5AB507] px-3 py-1.5 rounded-full text-xs font-bold">
            <span>{Math.round((currentStep / steps.length) * 100)}%</span>
            <span>Completado</span>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-between w-full relative">
          {/* Connector Line Behind Icons */}
          <div className="absolute top-[18px] left-[5%] right-[5%] h-0.5 bg-slate-100 -z-10" />
          <div
            className="absolute top-[18px] left-[5%] h-0.5 bg-[#5AB507] transition-all duration-300 ease-in-out -z-10"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 90}%`,
            }}
          />

          {steps.map((stepName, index) => {
            const stepNum = index + 1;
            const isCompleted = stepNum < currentStep;
            const isActive = stepNum === currentStep;

            return (
              <div
                key={stepName}
                className={cn(
                  "flex flex-col items-center flex-1 relative group cursor-default transition-all duration-200"
                )}
              >
                {/* Step Circle/Icon */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 shadow-sm",
                    isCompleted && "bg-[#5AB507] border-[#5AB507] text-white",
                    isActive && "bg-white border-[#5AB507] text-[#5AB507] ring-4 ring-[#5AB507]/10 scale-105",
                    !isActive && !isCompleted && "bg-white border-slate-200 text-slate-400"
                  )}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span>{stepNum}</span>
                  )}
                </div>

                {/* Step Text */}
                <span
                  className={cn(
                    "text-xs font-bold mt-2 uppercase tracking-wider text-center transition-colors duration-200",
                    isCompleted && "text-[#5AB507]/90",
                    isActive && "text-slate-800",
                    !isActive && !isCompleted && "text-slate-400"
                  )}
                >
                  {stepName}
                </span>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}
