/**
 * UpgradePrompt Component
 *
 * Shown when user hits usage limits or approaches them.
 * Encourages upgrade to higher tier plans.
 */

import { AlertCircle, ArrowRight, X, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { cn } from "../utils";

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Helper Functions
// ============================================================================

function getLimitTypeLabel(limitType: LimitType): string {
  switch (limitType) {
    case "syncs":
      return "sync configurations";
    case "records":
      return "records per sync";
    case "frequency":
      return "sync frequency";
    default:
      return "usage";
  }
}

function getDefaultMessage(
  limitType: LimitType,
  severity: Severity,
  current: number,
  limit: number,
  currentPlan: string,
  requiredPlan: string
): string {
  const percentage = Math.round((current / limit) * 100);

  if (severity === "warning") {
    return `You're using ${current.toLocaleString()} of your ${limit.toLocaleString()} ${getLimitTypeLabel(limitType)} (${percentage}%). Consider upgrading to ${requiredPlan} to avoid hitting your limit.`;
  } else {
    // blocking
    return `You've reached your ${currentPlan} plan limit of ${limit.toLocaleString()} ${getLimitTypeLabel(limitType)}. Upgrade to ${requiredPlan} to continue.`;
  }
}

function getValueProposition(
  limitType: LimitType,
  requiredPlan: string,
  priceDifference?: number
): string {
  const priceText = priceDifference
    ? ` for just $${priceDifference}/month more`
    : "";

  switch (limitType) {
    case "syncs":
      return `Upgrade to ${requiredPlan}${priceText} to create more sync configurations and scale your data workflows.`;
    case "records":
      return `Upgrade to ${requiredPlan}${priceText} to sync more records and handle larger datasets effortlessly.`;
    case "frequency":
      return `Upgrade to ${requiredPlan}${priceText} for faster sync intervals and keep your data more up-to-date.`;
    default:
      return `Upgrade to ${requiredPlan}${priceText} to unlock more features and grow your syncing capabilities.`;
  }
}

// ============================================================================
// Component
// ============================================================================

export function UpgradePrompt({
  limitType,
  severity,
  current,
  limit,
  currentPlan,
  requiredPlan,
  priceDifference,
  message,
  onDismiss,
  variant = "inline",
  open,
  onOpenChange,
}: UpgradePromptProps) {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  const handleUpgrade = () => {
    navigate("/pricing");
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onOpenChange?.(false);
    onDismiss?.();
  };

  if (isDismissed && variant !== "modal") {
    return null;
  }

  const displayMessage =
    message ||
    getDefaultMessage(limitType, severity, current, limit, currentPlan, requiredPlan);
  const valueProposition = getValueProposition(limitType, requiredPlan, priceDifference);

  // Inline Alert Variant (for dashboard warnings)
  if (variant === "inline") {
    return (
      <Alert
        variant={severity === "blocking" ? "destructive" : "default"}
        className={cn(
          "relative",
          severity === "warning" && "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
        )}
      >
        {severity === "warning" ? (
          <Zap className="h-4 w-4 text-yellow-600" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertTitle>
          {severity === "warning" ? "Approaching Limit" : "Limit Reached"}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm">{displayMessage}</p>
          <p className="text-muted-foreground mt-2 text-sm">{valueProposition}</p>
          <div className="mt-4 flex gap-3">
            <Button size="sm" onClick={handleUpgrade}>
              Upgrade to {requiredPlan}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {onDismiss && severity === "warning" && (
              <Button size="sm" variant="outline" onClick={handleDismiss}>
                Maybe Later
              </Button>
            )}
          </div>
        </AlertDescription>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </button>
        )}
      </Alert>
    );
  }

  // Modal Variant (for blocking interactions)
  if (variant === "modal") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            severity === "blocking" && "border-destructive border-2",
            severity === "warning" && "border-yellow-500 border-2"
          )}
        >
          <DialogHeader>
            <div className="flex items-center gap-2">
              {severity === "warning" ? (
                <Zap className="h-5 w-5 text-yellow-600" />
              ) : (
                <AlertCircle className="text-destructive h-5 w-5" />
              )}
              <DialogTitle>
                {severity === "warning" ? "Approaching Your Limit" : "Limit Reached"}
              </DialogTitle>
            </div>
            <DialogDescription className="pt-2">{displayMessage}</DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm font-medium">Why upgrade?</p>
            <p className="text-muted-foreground mt-1 text-sm">{valueProposition}</p>
          </div>
          <DialogFooter className="flex gap-3 sm:justify-start">
            <Button onClick={handleUpgrade}>
              Upgrade to {requiredPlan}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {severity === "warning" && (
              <Button variant="outline" onClick={handleDismiss}>
                Maybe Later
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Card Variant (for prominent inline display)
  return (
    <Card
      className={cn(
        "border-2",
        severity === "blocking" && "border-destructive",
        severity === "warning" && "border-yellow-500"
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {severity === "warning" ? (
              <Zap className="h-5 w-5 text-yellow-600" />
            ) : (
              <AlertCircle className="text-destructive h-5 w-5" />
            )}
            <CardTitle>
              {severity === "warning" ? "Approaching Your Limit" : "Limit Reached"}
            </CardTitle>
          </div>
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </button>
          )}
        </div>
        <CardDescription className="mt-2">{displayMessage}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm font-medium">Why upgrade?</p>
          <p className="text-muted-foreground mt-1 text-sm">{valueProposition}</p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-3">
        <Button onClick={handleUpgrade} className="flex-1">
          Upgrade to {requiredPlan}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        {onDismiss && severity === "warning" && (
          <Button variant="outline" onClick={handleDismiss}>
            Maybe Later
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// Convenience Variants
// ============================================================================

/**
 * Sync Configuration Limit Prompt
 */
export function SyncLimitPrompt(props: Omit<UpgradePromptProps, "limitType">) {
  return <UpgradePrompt {...props} limitType="syncs" />;
}

/**
 * Record Limit Prompt
 */
export function RecordLimitPrompt(props: Omit<UpgradePromptProps, "limitType">) {
  return <UpgradePrompt {...props} limitType="records" />;
}

/**
 * Sync Frequency Limit Prompt
 */
export function FrequencyLimitPrompt(props: Omit<UpgradePromptProps, "limitType">) {
  return <UpgradePrompt {...props} limitType="frequency" />;
}
