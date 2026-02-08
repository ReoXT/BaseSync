import { useAuth } from 'wasp/client/auth';
import { getUserUsage, getCustomerPortalUrl } from 'wasp/client/operations';
import { useQuery } from 'wasp/client/operations';
import { Link } from 'wasp/client/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../client/components/ui/card';
import { Button } from '../../client/components/ui/button';
import { Alert, AlertDescription } from '../../client/components/ui/alert';
import { Badge } from '../../client/components/ui/badge';
import { Separator } from '../../client/components/ui/separator';
import { Progress } from '../../client/components/ui/progress';
import { useToast } from '../../client/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle2, ExternalLink, Crown, Zap } from 'lucide-react';

// ============================================================================
// PLAN LIMITS
// ============================================================================

const PLAN_LIMITS = {
  starter: {
    name: 'Starter',
    syncs: 1,
    records: 1000,
    syncInterval: '15 minutes',
  },
  pro: {
    name: 'Pro',
    syncs: 3,
    records: 5000,
    syncInterval: '5 minutes',
  },
  business: {
    name: 'Business',
    syncs: 10,
    records: Infinity,
    syncInterval: '5 minutes',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function SubscriptionSection() {
  const { data: user } = useAuth();

  if (!user) return null;

  const typedUser = user as any;

  // Calculate trial info
  const isOnTrial = typedUser.trialEndsAt && new Date(typedUser.trialEndsAt) > new Date();
  const trialDaysRemaining = isOnTrial
    ? Math.ceil((new Date(typedUser.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subscription & Billing</h2>
        <p className="text-muted-foreground mt-1">
          Manage your subscription, view usage, and update billing details
        </p>
      </div>

      {isOnTrial && <TrialStatusAlert daysRemaining={trialDaysRemaining} />}

      <CurrentPlanCard user={typedUser} />
      <UsageStatsCard />

      {typedUser.subscriptionPlan !== 'business' && <UpgradeCTA currentPlan={typedUser.subscriptionPlan} />}
    </div>
  );
}

// ============================================================================
// TRIAL STATUS ALERT
// ============================================================================

function TrialStatusAlert({ daysRemaining }: { daysRemaining: number }) {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-foreground">
          <strong className="font-semibold">Free Trial:</strong> {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining.
          Upgrade to continue syncing after your trial ends.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// CURRENT PLAN CARD
// ============================================================================

function CurrentPlanCard({ user }: { user: any }) {
  const { toast } = useToast();

  const planName = user.subscriptionPlan
    ? PLAN_LIMITS[user.subscriptionPlan as keyof typeof PLAN_LIMITS]?.name || user.subscriptionPlan
    : 'Free Trial';

  const planLimits = user.subscriptionPlan
    ? PLAN_LIMITS[user.subscriptionPlan as keyof typeof PLAN_LIMITS]
    : PLAN_LIMITS.pro; // Trial gets Pro features

  const getStatusBadge = () => {
    if (!user.subscriptionStatus) {
      return <Badge variant="outline">Trial</Badge>;
    }

    switch (user.subscriptionStatus) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'cancel_at_period_end':
        return <Badge variant="destructive">Canceling</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>;
      default:
        return <Badge variant="outline">{user.subscriptionStatus}</Badge>;
    }
  };

  const handleManageBilling = async () => {
    try {
      // Pass current page as return URL so user comes back to account settings
      const result = await getCustomerPortalUrl({
        returnUrl: window.location.pathname,
      });
      // The result might be a string URL directly or an object with a url property
      const portalUrl = typeof result === 'string' ? result : (result as any)?.url;
      if (portalUrl) {
        window.location.href = portalUrl;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to open billing portal',
      });
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-cyan-500/20">
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-foreground">{planName}</h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground">Your current subscription plan</p>
          </div>
          {user.subscriptionStatus && (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <Crown className="h-6 w-6 text-amber-400" />
            </div>
          )}
        </div>

        {/* Plan Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-background/30 backdrop-blur-sm p-4">
            <p className="text-xs text-muted-foreground mb-2">Sync Configurations</p>
            <p className="text-3xl font-bold text-gradient-sync">{planLimits?.syncs || '—'}</p>
          </div>
          <div className="rounded-xl border border-border bg-background/30 backdrop-blur-sm p-4">
            <p className="text-xs text-muted-foreground mb-2">Records per Sync</p>
            <p className="text-3xl font-bold text-gradient-sync">
              {planLimits?.records === Infinity ? '∞' : planLimits?.records.toLocaleString() || '—'}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/30 backdrop-blur-sm p-4">
            <p className="text-xs text-muted-foreground mb-2">Sync Interval</p>
            <p className="text-3xl font-bold text-gradient-sync">{planLimits?.syncInterval || '—'}</p>
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Billing Management */}
        {user.subscriptionStatus && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">Billing & Payment Details</p>
              <p className="text-sm text-muted-foreground">
                Manage your subscription, payment methods, and invoices
              </p>
            </div>
            <Button
              onClick={handleManageBilling}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 whitespace-nowrap"
            >
              Manage Billing
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {!user.subscriptionStatus && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">Subscribe to continue</p>
              <p className="text-sm text-muted-foreground">
                Choose a plan to keep syncing after your trial ends
              </p>
            </div>
            <Link to="/pricing">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 whitespace-nowrap">
                View Plans
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// USAGE STATS CARD
// ============================================================================

function UsageStatsCard() {
  const { data: usage, isLoading } = useQuery(getUserUsage);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="p-6 md:p-8">
          <h3 className="text-xl font-bold text-foreground mb-6">Usage Statistics</h3>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        </div>
      </div>
    );
  }

  if (!usage) return null;

  const syncUsagePercent = (usage.syncConfigCount / usage.maxSyncConfigs) * 100;
  const recordUsagePercent = usage.maxRecordsPerSync === Infinity
    ? 0
    : (usage.recordsSyncedThisMonth / usage.maxRecordsPerSync) * 100;

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return 'bg-red-500';
    if (percent >= 50) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getWarningMessage = () => {
    if (syncUsagePercent >= 80) {
      return 'You\'re approaching your sync configuration limit. Consider upgrading to create more syncs.';
    }
    if (recordUsagePercent >= 80 && usage.maxRecordsPerSync !== Infinity) {
      return 'You\'ve synced a lot of records this month. Consider upgrading for higher limits.';
    }
    return null;
  };

  const warningMessage = getWarningMessage();

  return (
    <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-cyan-500/20">
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">Usage Statistics</h3>
          <p className="text-sm text-muted-foreground">
            Current month: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {warningMessage && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">{warningMessage}</p>
            </div>
          </div>
        )}

        {/* Sync Configurations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Sync Configurations</p>
            <p className="text-sm font-mono text-muted-foreground">
              {usage.syncConfigCount} / {usage.maxSyncConfigs}
            </p>
          </div>
          <div className="relative h-3 rounded-full bg-muted/30 backdrop-blur-sm overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${getProgressColor(syncUsagePercent)}`}
              style={{ width: `${Math.min(syncUsagePercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Records Synced */}
        {usage.maxRecordsPerSync !== Infinity && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Records Synced This Month</p>
              <p className="text-sm font-mono text-muted-foreground">
                {usage.recordsSyncedThisMonth.toLocaleString()} / {usage.maxRecordsPerSync.toLocaleString()}
              </p>
            </div>
            <div className="relative h-3 rounded-full bg-muted/30 backdrop-blur-sm overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${getProgressColor(recordUsagePercent)}`}
                style={{ width: `${Math.min(recordUsagePercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        {usage.maxRecordsPerSync === Infinity && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                <strong className="font-semibold">Unlimited Records:</strong> You have unlimited record syncing with your Business plan!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// UPGRADE CTA
// ============================================================================

function UpgradeCTA({ currentPlan }: { currentPlan?: string }) {
  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center">
            <Zap className="h-5 w-5 text-cyan-400" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Upgrade Your Plan</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Unlock more sync configurations, higher limits, and faster sync intervals
        </p>
        <Link to="/pricing">
          <Button className="w-full md:w-auto bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300">
            View Pricing Plans
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
