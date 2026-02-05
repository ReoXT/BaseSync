import { Check } from "lucide-react";
import { cn } from "../../utils";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface ProgressStepperProps {
  steps: readonly Step[];
  currentStep: number;
}

export function ProgressStepper({ steps, currentStep }: ProgressStepperProps) {
  return (
    <div className="w-full mb-10">
      {/* Mobile: Simple progress indicator */}
      <div className="md:hidden flex items-center justify-center gap-2 mb-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={step.id}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                isCompleted && "bg-cyan-500",
                isCurrent && "bg-cyan-500 w-6",
                !isCompleted && !isCurrent && "bg-muted-foreground/30"
              )}
            />
          );
        })}
      </div>

      {/* Desktop: Full stepper */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isPending = stepNumber > currentStep;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                {/* Step indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-all duration-300",
                      isCompleted && "bg-cyan-500 text-white",
                      isCurrent && "bg-cyan-500 text-white ring-4 ring-cyan-500/20",
                      isPending && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium whitespace-nowrap",
                      isCurrent && "text-cyan-500",
                      isCompleted && "text-foreground",
                      isPending && "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 mx-3 h-px relative">
                    <div className="absolute inset-0 bg-muted" />
                    <div
                      className={cn(
                        "absolute top-0 left-0 h-full bg-cyan-500 transition-all duration-500",
                        isCompleted && "w-full",
                        isCurrent && "w-0"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
