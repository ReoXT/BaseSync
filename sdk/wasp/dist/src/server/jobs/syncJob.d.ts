/**
 * Background Sync Job
 * Runs periodically to sync all active SyncConfigs
 * Executes every 5 minutes via cron schedule
 */
import type { SyncJob } from 'wasp/server/jobs';
/**
 * Performs sync for all active SyncConfigs
 * This function is called by the PgBoss scheduler every 5 minutes
 */
export declare const performSync: SyncJob<never, void>;
//# sourceMappingURL=syncJob.d.ts.map