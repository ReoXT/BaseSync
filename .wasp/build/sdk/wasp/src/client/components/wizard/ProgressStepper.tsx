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
  const totalSteps = steps.length;
  const progressPercent =
    totalSteps > 1 ? ((currentStep - 1) / (totalSteps - 1)) * 100 : 0;
  const edgeInset = totalSteps > 0 ? 50 / totalSteps : 0;
  const mobileDotSize = 28;
  const desktopDotSize = 36;

  return (
    <div className="w-full mb-10 rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm p-5 md:p-6">
      {/* Mobile: Animated progress bar with dots */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-xs font-medium text-foreground">
            {steps[currentStep - 1]?.title}
          </span>
        </div>
        <div className="relative">
          <div
            className="absolute h-2 rounded-full bg-muted/60 overflow-hidden"
            style={{
              left: `${edgeInset}%`,
              right: `${edgeInset}%`,
              top: `${mobileDotSize / 2}px`,
            }}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div
            className="relative grid"
            style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` }}
          >
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;

              return (
                <div key={step.id} className="flex items-center justify-center translate-y-[3px]">
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full text-[11px] font-medium transition-all duration-300",
                      isCompleted && "bg-cyan-500 text-white",
                      isCurrent &&
                        "bg-gradient-to-r from-cyan-500 to-blue-500 text-white ring-4 ring-cyan-500/20 shadow-sm shadow-cyan-500/30 scale-105",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                    )}
                    style={{ width: mobileDotSize, height: mobileDotSize }}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : stepNumber}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop: Premium aligned stepper */}
      <div className="hidden md:block">
        <div className="relative w-full">
          <div
            className="absolute h-2 rounded-full bg-muted/60 overflow-hidden"
            style={{
              left: `${edgeInset}%`,
              right: `${edgeInset}%`,
              top: `${desktopDotSize / 2}px`,
            }}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div
            className="relative grid"
            style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` }}
          >
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;
              const isPending = stepNumber > currentStep;

              return (
                <div key={step.id} className="flex flex-col items-center text-center translate-y-[3px]">
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full text-sm font-medium transition-all duration-300",
                      isCompleted && "bg-cyan-500 text-white",
                      isCurrent &&
                        "bg-gradient-to-r from-cyan-500 to-blue-500 text-white ring-4 ring-cyan-500/20 shadow-sm shadow-cyan-500/30 scale-105",
                      isPending && "bg-muted text-muted-foreground"
                    )}
                    style={{ width: desktopDotSize, height: desktopDotSize }}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
                  </div>
                  <span
                    className={cn(
                      "mt-1 text-xs font-medium whitespace-nowrap",
                      isCurrent && "text-cyan-500",
                      isCompleted && "text-foreground",
                      isPending && "text-muted-foreground"
                    )}
                  >
                    {step.title}
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
