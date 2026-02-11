/**
 * TrialBanner Component
 *
 * Displays trial status information to users:
 * - Active trial: Shows days remaining with optional upgrade CTA
 * - Expired trial: Shows prominent banner with upgrade CTA
 */
import { AlertCircle, ArrowRight, Clock, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { cn } from "../utils";
// ============================================================================
// Component
// ============================================================================
export function TrialBanner({ trialStatus, dismissible = true, onDismiss, variant = "banner", className, }) {
    const navigate = useNavigate();
    const [isDismissed, setIsDismissed] = useState(false);
    const handleUpgrade = () => {
        navigate("/pricing");
    };
    const handleDismiss = () => {
        setIsDismissed(true);
        onDismiss?.();
    };
    // Don't show for subscribed users
    if (trialStatus.type === "subscribed") {
        return null;
    }
    // Don't show if dismissed (only for active trial)
    if (isDismissed && trialStatus.type === "trial_active") {
        return null;
    }
    // Expired trial - always show, cannot dismiss
    if (trialStatus.type === "trial_expired") {
        return (<Alert variant="destructive" className={cn("border-2", variant === "banner" && "rounded-none border-x-0 border-t-0", className)}>
        <AlertCircle className="h-4 w-4"/>
        <AlertTitle>Your Free Trial Has Ended</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm">
            Your 14-day free trial has expired. Your syncs have been paused, but all your
            data and configurations are safe.
          </p>
          <p className="mt-2 text-sm">
            Upgrade now to resume syncing and keep your Airtable and Google Sheets in sync.
          </p>
          <div className="mt-4">
            <Button size="sm" variant="secondary" onClick={handleUpgrade}>
              Upgrade Now
              <ArrowRight className="ml-2 h-4 w-4"/>
            </Button>
          </div>
        </AlertDescription>
      </Alert>);
    }
    // Inactive subscription
    if (trialStatus.type === "subscription_inactive") {
        return (<Alert variant="destructive" className={cn("border-2", variant === "banner" && "rounded-none border-x-0 border-t-0", className)}>
        <AlertCircle className="h-4 w-4"/>
        <AlertTitle>Subscription Inactive</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm">
            Your subscription is no longer active. Your syncs have been paused, but all your
            data and configurations are safe.
          </p>
          <div className="mt-4">
            <Button size="sm" variant="secondary" onClick={handleUpgrade}>
              Reactivate Subscription
              <ArrowRight className="ml-2 h-4 w-4"/>
            </Button>
          </div>
        </AlertDescription>
      </Alert>);
    }
    // Active trial
    const { daysRemaining, trialEndsAt } = trialStatus;
    const isUrgent = daysRemaining <= 3;
    const formattedEndDate = new Date(trialEndsAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
    // For active trial, show a more subtle banner
    return (<Alert className={cn("relative border", isUrgent
            ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
            : "border-primary/20 bg-primary/5", variant === "banner" && "rounded-none border-x-0 border-t-0", className)}>
      {isUrgent ? (<Clock className="h-4 w-4 text-yellow-600"/>) : (<Sparkles className="h-4 w-4 text-primary"/>)}
      <AlertTitle className={cn(isUrgent && "text-yellow-800 dark:text-yellow-200")}>
        {isUrgent
            ? `Trial Ending Soon - ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`
            : `Free Trial - ${daysRemaining} days remaining`}
      </AlertTitle>
      <AlertDescription className="mt-1">
        <p className="text-muted-foreground text-sm">
          {isUrgent
            ? `Your trial ends on ${formattedEndDate}. Upgrade now to keep your syncs running.`
            : `You're enjoying full Pro features. Trial ends ${formattedEndDate}.`}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <Button size="sm" variant={isUrgent ? "default" : "outline"} onClick={handleUpgrade}>
            {isUrgent ? "Upgrade Now" : "View Plans"}
            <ArrowRight className="ml-2 h-4 w-4"/>
          </Button>
          {dismissible && !isUrgent && (<Button size="sm" variant="ghost" onClick={handleDismiss}>
              Dismiss
            </Button>)}
        </div>
      </AlertDescription>
      {dismissible && (<button onClick={handleDismiss} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
          <X className="h-4 w-4"/>
          <span className="sr-only">Dismiss</span>
        </button>)}
    </Alert>);
}
// ============================================================================
// Convenience Components
// ============================================================================
/**
 * Compact trial indicator for headers/nav
 */
export function TrialIndicator({ daysRemaining, onClick, className, }) {
    const isUrgent = daysRemaining <= 3;
    return (<button onClick={onClick} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors", isUrgent
            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200"
            : "bg-primary/10 text-primary hover:bg-primary/20", className)}>
      {isUrgent ? (<Clock className="h-3 w-3"/>) : (<Sparkles className="h-3 w-3"/>)}
      <span>
        {daysRemaining} day{daysRemaining === 1 ? "" : "s"} left
      </span>
    </button>);
}
/**
 * Trial expired overlay for blocking interactions
 */
export function TrialExpiredOverlay({ onUpgrade, className, }) {
    const navigate = useNavigate();
    const handleUpgrade = () => {
        if (onUpgrade) {
            onUpgrade();
        }
        else {
            navigate("/pricing");
        }
    };
    return (<div className={cn("bg-background/95 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm", className)}>
      <div className="mx-4 max-w-md text-center">
        <div className="bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertCircle className="text-destructive h-8 w-8"/>
        </div>
        <h2 className="text-xl font-semibold">Trial Expired</h2>
        <p className="text-muted-foreground mt-2">
          Your 14-day free trial has ended. Upgrade to a paid plan to resume syncing
          your data between Airtable and Google Sheets.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={handleUpgrade}>
            Upgrade Now
            <ArrowRight className="ml-2 h-4 w-4"/>
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            View Dashboard
          </Button>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=TrialBanner.jsx.map