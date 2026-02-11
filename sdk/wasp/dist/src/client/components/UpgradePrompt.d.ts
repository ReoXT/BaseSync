/**
 * UpgradePrompt Component
 *
 * Shown when user hits usage limits or approaches them.
 * Encourages upgrade to higher tier plans.
 */
type LimitType = "syncs" | "records" | "frequency";
type Severity = "warning" | "blocking";
export interface UpgradePromptProps {
    /** Type of limit that was hit */
    limitType: LimitType;
    /** Severity: 'warning' for approaching limit (80%), 'blocking' for hard limit */
    severity: Severity;
    /** Current usage amount */
    current: number;
    /** Plan limit */
    limit: number;
    /** Current plan name */
    currentPlan: string;
    /** Required plan to proceed */
    requiredPlan: string;
    /** Price difference per month */
    priceDifference?: number;
    /** Custom message (optional) */
    message?: string;
    /** Callback when dismissed */
    onDismiss?: () => void;
    /** Display as inline alert, card, or modal dialog */
    variant?: "inline" | "card" | "modal";
    /** Control modal open state externally (for modal variant) */
    open?: boolean;
    /** Callback when modal open state changes (for modal variant) */
    onOpenChange?: (open: boolean) => void;
}
export declare function UpgradePrompt({ limitType, severity, current, limit, currentPlan, requiredPlan, priceDifference, message, onDismiss, variant, open, onOpenChange, }: UpgradePromptProps): import("react").JSX.Element | null;
/**
 * Sync Configuration Limit Prompt
 */
export declare function SyncLimitPrompt(props: Omit<UpgradePromptProps, "limitType">): import("react").JSX.Element;
/**
 * Record Limit Prompt
 */
export declare function RecordLimitPrompt(props: Omit<UpgradePromptProps, "limitType">): import("react").JSX.Element;
/**
 * Sync Frequency Limit Prompt
 */
export declare function FrequencyLimitPrompt(props: Omit<UpgradePromptProps, "limitType">): import("react").JSX.Element;
export {};
//# sourceMappingURL=UpgradePrompt.d.ts.map