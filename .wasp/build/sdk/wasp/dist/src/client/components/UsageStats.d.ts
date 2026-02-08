/**
 * UsageStats Component
 *
 * Displays current usage vs plan limits on the dashboard with progress bars
 */
export interface UsageStat {
    label: string;
    current: number;
    limit: number;
    unit?: string;
    icon?: React.ReactNode;
}
export interface UsageStatsProps {
    /** Sync configurations usage */
    syncConfigs: UsageStat;
    /** Records usage (monthly or per-sync depending on context) */
    records: UsageStat;
    /** Additional stats (optional) */
    additionalStats?: UsageStat[];
    /** Current plan name */
    planName: string;
    /** Show warning threshold (default: 80%) */
    warningThreshold?: number;
    /** Compact mode (smaller display) */
    compact?: boolean;
}
export declare function UsageStats({ syncConfigs, records, additionalStats, planName, warningThreshold, compact, }: UsageStatsProps): import("react").JSX.Element;
export declare function CompactUsageStats(props: Omit<UsageStatsProps, "compact">): import("react").JSX.Element;
//# sourceMappingURL=UsageStats.d.ts.map