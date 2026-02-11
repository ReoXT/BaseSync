interface Step {
    id: number;
    title: string;
    description: string;
}
interface ProgressStepperProps {
    steps: readonly Step[];
    currentStep: number;
}
export declare function ProgressStepper({ steps, currentStep }: ProgressStepperProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ProgressStepper.d.ts.map