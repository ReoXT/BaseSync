/**
 * TrialBanner Component
 *
 * Displays trial status information to users:
 * - Active trial: Shows days remaining with optional upgrade CTA
 * - Expired trial: Shows prominent banner with upgrade CTA
 */
export interface TrialBannerProps {
    /** Trial status from server */
    trialStatus: {
        type: 'trial_active';
        daysRemaining: number;
        trialEndsAt: Date;
    } | {
        type: 'trial_expired';
    } | {
        type: 'subscribed';
    } | {
        type: 'subscription_inactive';
    };
    /** Whether the banner can be dismissed (only for active trial) */
    dismissible?: boolean;
    /** Callback when dismissed */
    onDismiss?: () => void;
    /** Display variant */
    variant?: "banner" | "inline";
    /** Additional class names */
    className?: string;
}
export declare function TrialBanner({ trialStatus, dismissible, onDismiss, variant, className, }: TrialBannerProps): import("react").JSX.Element | null;
/**
 * Compact trial indicator for headers/nav
 */
export declare function TrialIndicator({ daysRemaining, onClick, className, }: {
    daysRemaining: number;
    onClick?: () => void;
    className?: string;
}): import("react").JSX.Element;
/**
 * Trial expired overlay for blocking interactions
 */
export declare function TrialExpiredOverlay({ onUpgrade, className, }: {
    onUpgrade?: () => void;
    className?: string;
}): import("react").JSX.Element;
//# sourceMappingURL=TrialBanner.d.ts.map