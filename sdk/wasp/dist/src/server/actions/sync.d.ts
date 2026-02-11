/**
 * Manual Sync Actions
 * Provides on-demand sync triggers for user-initiated syncs
 */
interface TriggerManualSyncArgs {
    /** The sync configuration ID to execute */
    syncConfigId: string;
}
interface RunInitialSyncArgs {
    /** The sync configuration ID to execute initial sync for */
    syncConfigId: string;
    /** Whether to perform a dry run (report changes without applying) */
    dryRun?: boolean;
}
interface ManualSyncResult {
    /** Sync execution status */
    status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
    /** User-friendly message */
    message: string;
    /** Detailed sync statistics */
    details: {
        /** Records added */
        added: number;
        /** Records updated */
        updated: number;
        /** Records deleted */
        deleted: number;
        /** Total records processed */
        total: number;
        /** Number of errors */
        errorCount: number;
        /** Sync duration in milliseconds */
        duration: number;
        /** Sync direction used */
        direction: string;
        /** Timestamp when sync started */
        startedAt: string;
        /** Timestamp when sync completed */
        completedAt: string;
        [key: string]: any;
    };
    /** List of errors if any occurred */
    errors?: Array<{
        message: string;
        type?: string;
        recordId?: string;
        [key: string]: any;
    }>;
    /** Warnings (non-critical issues) */
    warnings?: string[];
    /** Conflict resolution details (for bidirectional sync) */
    conflicts?: {
        total: number;
        airtableWins: number;
        sheetsWins: number;
        deleted: number;
        skipped: number;
        [key: string]: any;
    };
    [key: string]: any;
}
/**
 * Triggers an immediate manual sync for a specific sync configuration
 *
 * Edge cases handled:
 * - User doesn't own the sync config (403 Forbidden)
 * - Sync config doesn't exist (404 Not Found)
 * - Sync config is inactive (400 Bad Request)
 * - Missing Airtable/Google connection (400 Bad Request)
 * - Token decryption failures (500 Internal Server Error)
 * - Expired tokens (automatic refresh attempted)
 * - Invalid field mappings (400 Bad Request)
 * - Rate limiting from external APIs (retries with exponential backoff)
 * - Network failures during sync (partial results captured)
 * - Invalid sync direction (500 Internal Server Error)
 * - Concurrent sync execution (409 Conflict)
 */
export declare const triggerManualSync: (args: TriggerManualSyncArgs, context: any) => Promise<ManualSyncResult>;
/**
 * Runs an initial bulk sync for first-time setup or resync
 *
 * This is designed for syncing existing data when:
 * - Setting up a new sync configuration
 * - Re-syncing after data corruption
 * - Performing a full refresh
 *
 * Edge cases handled:
 * - All the same edge cases as triggerManualSync
 * - Large datasets (chunked processing)
 * - Dry run mode for preview
 * - First-time sync with no prior state
 * - Existing data conflicts (uses conflict resolution strategy)
 */
export declare const runInitialSync: (args: RunInitialSyncArgs, context: any) => Promise<ManualSyncResult>;
export {};
//# sourceMappingURL=sync.d.ts.map