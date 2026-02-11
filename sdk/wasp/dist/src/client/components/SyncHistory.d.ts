export interface SyncLog {
    id: string;
    status: "SUCCESS" | "FAILED" | "PARTIAL" | "RUNNING" | "PENDING";
    recordsSynced: number;
    recordsFailed: number;
    errors: string | null;
    startedAt: Date | string;
    completedAt: Date | string | null;
    triggeredBy?: string | null;
    direction?: string | null;
}
export interface SyncHistoryProps {
    /** Array of sync logs to display */
    syncLogs: SyncLog[];
    /** Whether the logs are loading */
    isLoading?: boolean;
    /** Maximum number of logs to display (default: 50) */
    limit?: number;
}
/**
 * SyncHistory Component
 *
 * Displays a timeline of recent sync attempts with light, modern aesthetic
 */
export declare function SyncHistory({ syncLogs, isLoading, limit, }: SyncHistoryProps): import("react").JSX.Element;
//# sourceMappingURL=SyncHistory.d.ts.map