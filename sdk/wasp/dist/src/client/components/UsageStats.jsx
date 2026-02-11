/**
 * UsageStats Component
 *
 * Displays current usage vs plan limits on the dashboard with progress bars
 */
import { AlertCircle, Database, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { cn } from "../utils";
// ============================================================================
// Helper Functions
// ============================================================================
function getUsagePercentage(current, limit) {
    if (limit === Number.MAX_SAFE_INTEGER) {
        return 0; // Unlimited
    }
    return Math.min(Math.round((current / limit) * 100), 100);
}
function getProgressColor(percentage, warningThreshold) {
    if (percentage >= 100) {
        return "bg-destructive"; // Red - at limit
    }
    else if (percentage >= warningThreshold) {
        return "bg-yellow-500"; // Yellow - warning
    }
    else {
        return "bg-primary"; // Blue/primary - good
    }
}
function formatNumber(num) {
    if (num === Number.MAX_SAFE_INTEGER) {
        return "Unlimited";
    }
    return num.toLocaleString();
}
function StatRow({ stat, warningThreshold, compact = false }) {
    const percentage = getUsagePercentage(stat.current, stat.limit);
    const isUnlimited = stat.limit === Number.MAX_SAFE_INTEGER;
    const isWarning = percentage >= warningThreshold;
    const isAtLimit = percentage >= 100;
    return (<div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {stat.icon && <span className="text-muted-foreground">{stat.icon}</span>}
          <span className={cn("text-sm font-medium", compact && "text-xs")}>
            {stat.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm", compact && "text-xs")}>
            <span className={cn("font-semibold", isAtLimit && "text-destructive")}>
              {formatNumber(stat.current)}
            </span>
            {!isUnlimited && (<>
                {" "}
                <span className="text-muted-foreground">
                  of {formatNumber(stat.limit)}
                </span>
              </>)}
            {stat.unit && (<span className="text-muted-foreground ml-1">{stat.unit}</span>)}
          </span>
          {isAtLimit && <AlertCircle className="text-destructive h-4 w-4"/>}
        </div>
      </div>

      {!isUnlimited && (<>
          <Progress value={percentage} className={cn("h-2", compact && "h-1.5")} indicatorClassName={getProgressColor(percentage, warningThreshold)}/>
          <div className="flex justify-between">
            <span className={cn("text-xs", compact && "text-[10px]", isAtLimit
                ? "text-destructive font-medium"
                : isWarning
                    ? "text-yellow-600 font-medium"
                    : "text-muted-foreground")}>
              {percentage}% used
            </span>
            {isWarning && !isAtLimit && (<span className="text-xs font-medium text-yellow-600">
                {100 - percentage}% remaining
              </span>)}
          </div>
        </>)}

      {isUnlimited && (<p className="text-muted-foreground text-xs">No limit on your plan</p>)}
    </div>);
}
// ============================================================================
// Main Component
// ============================================================================
export function UsageStats({ syncConfigs, records, additionalStats = [], planName, warningThreshold = 80, compact = false, }) {
    const allStats = [syncConfigs, records, ...additionalStats];
    const hasWarning = allStats.some((stat) => getUsagePercentage(stat.current, stat.limit) >= warningThreshold);
    return (<Card className={cn(hasWarning && "border-yellow-500")}>
      <CardHeader className={cn(compact && "pb-3")}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={cn(compact && "text-base")}>Usage & Limits</CardTitle>
            <CardDescription className={cn(compact && "text-xs")}>
              Current usage on your {planName} plan
            </CardDescription>
          </div>
          {hasWarning && (<AlertCircle className="h-5 w-5 text-yellow-600"/>)}
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-6", compact && "space-y-4")}>
        <StatRow stat={{
            ...syncConfigs,
            icon: syncConfigs.icon || <Database className="h-4 w-4"/>,
        }} warningThreshold={warningThreshold} compact={compact}/>

        <StatRow stat={{
            ...records,
            icon: records.icon || <TrendingUp className="h-4 w-4"/>,
        }} warningThreshold={warningThreshold} compact={compact}/>

        {additionalStats.map((stat, index) => (<StatRow key={index} stat={{
                ...stat,
                icon: stat.icon || <Zap className="h-4 w-4"/>,
            }} warningThreshold={warningThreshold} compact={compact}/>))}
      </CardContent>
    </Card>);
}
// ============================================================================
// Compact Variant
// ============================================================================
export function CompactUsageStats(props) {
    return <UsageStats {...props} compact={true}/>;
}
//# sourceMappingURL=UsageStats.jsx.map