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
  // Calculate progress: 0% at step 1, 100% at last step
  // This represents how far along we are between the first and last step
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full py-8 mb-8">
      <div className="relative max-w-4xl mx-auto px-4">
        {/* Steps Container */}
        <div className="flex justify-between relative">
          {/* Background Line - positioned absolutely to span from first to last step center */}
          <div
            className="absolute top-6 h-0.5 bg-gradient-to-r from-muted via-muted to-muted"
            style={{
              left: '24px', // Half of step circle width (w-12 = 48px / 2)
              right: '24px',
            }}
          >
            <div className="absolute inset-0 bg-muted/50" />
          </div>

          {/* Animated Progress Line */}
          <div
            className="absolute top-6 h-0.5 bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 transition-all duration-700 ease-out shadow-[0_0_20px_rgba(6,182,212,0.5)]"
            style={{
              left: '24px',
              width: `calc((100% - 48px) * ${progressPercentage / 100})`,
            }}
          >
            {/* Glowing tip */}
            {currentStep > 1 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] animate-pulse" />
            )}
          </div>

          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isPending = stepNumber > currentStep;

            return (
              <div
                key={step.id}
                className="relative flex flex-col items-center gap-3 z-10"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Step Circle */}
                <div
                  className={cn(
                    "relative flex items-center justify-center w-12 h-12 rounded-full font-bold text-sm transition-all duration-500 ease-out",
                    {
                      // Completed
                      "bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 scale-100":
                        isCompleted,
                      // Current
                      "bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-xl shadow-cyan-500/50 scale-110 ring-4 ring-cyan-500/20":
                        isCurrent,
                      // Pending
                      "bg-muted text-muted-foreground scale-95": isPending,
                    }
                  )}
                >
                  {/* Pulse animation for current step */}
                  {isCurrent && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-cyan-500/30 animate-ping" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500" />
                    </>
                  )}

                  {/* Content */}
                  <span className="relative z-10 flex items-center justify-center">
                    {isCompleted ? (
                      <Check className="w-5 h-5 animate-in zoom-in duration-300" />
                    ) : (
                      stepNumber
                    )}
                  </span>
                </div>

                {/* Step Label */}
                <span
                  className={cn("absolute top-16 text-xs font-semibold whitespace-nowrap transition-all duration-300", {
                    "text-cyan-400": isCurrent,
                    "text-foreground": isCompleted,
                    "text-muted-foreground": isPending,
                  })}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
