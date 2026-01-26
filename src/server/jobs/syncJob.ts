/**
 * Background Sync Job
 * Runs periodically to sync all active SyncConfigs
 * Executes every 5 minutes via cron schedule
 */

import type { SyncJob } from 'wasp/server/jobs';
import type { User } from 'wasp/entities';
import { syncAirtableToSheets } from '../sync/airtableToSheets';
import { syncSheetsToAirtable } from '../sync/sheetsToAirtable';
import { syncBidirectional } from '../sync/bidirectionalSync';
import { getDecryptedConnection as getDecryptedAirtableConnection } from '../airtable/encryption';
import { getDecryptedConnection as getDecryptedGoogleConnection } from '../google/encryption';
import type { ConflictResolutionStrategy } from '../sync/conflictDetector';
import { shouldPauseSyncs, getSyncPauseReason, getSyncFrequency } from '../middleware/usageLimits';
import { sendSyncFailedEmail, checkAndSendUsageEmails } from '../emails/notificationSender';

// ============================================================================
// Types
// ============================================================================

interface SyncJobResult {
  /** Total sync configs processed */
  totalProcessed: number;
  /** Successful syncs */
  successful: number;
  /** Failed syncs */
  failed: number;
  /** Skipped syncs (missing connections, etc.) */
  skipped: number;
  /** Details per config */
  results: Array<{
    configId: string;
    configName: string;
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    message: string;
    duration?: number;
    error?: string;
  }>;
  /** Job execution time */
  duration: number;
}

// ============================================================================
// Main Job Function
// ============================================================================

/**
 * Performs sync for all active SyncConfigs
 * This function is called by the PgBoss scheduler every 5 minutes
 */
export const performSync: SyncJob<never, void> = async (_args, context) => {
  const startTime = Date.now();
  const result: SyncJobResult = {
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    results: [],
    duration: 0,
  };

  console.log('\n' + '='.repeat(80));
  console.log('[SyncJob] Starting scheduled sync job...');
  console.log('[SyncJob] Time:', new Date().toISOString());
  console.log('='.repeat(80) + '\n');

  try {
    // ========================================================================
    // STEP 1: Fetch all active SyncConfigs
    // ========================================================================
    console.log('[SyncJob] Fetching active sync configurations...');

    const activeSyncConfigs = await context.entities.SyncConfig.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: {
          include: {
            airtableConnections: true,
            googleSheetsConnections: true,
          },
        },
      },
      orderBy: {
        lastSyncAt: 'asc', // Prioritize configs that haven't synced recently
      },
    });

    console.log(`[SyncJob] Found ${activeSyncConfigs.length} active sync configuration(s)`);

    if (activeSyncConfigs.length === 0) {
      console.log('[SyncJob] No active sync configurations found. Job complete.');
      return;
    }

    // ========================================================================
    // STEP 2: Process each SyncConfig
    // ========================================================================
    for (const config of activeSyncConfigs) {
      result.totalProcessed++;
      const configStartTime = Date.now();

      console.log(`\n[SyncJob] [${'='.repeat(70)}]`);
      console.log(`[SyncJob] Processing config: ${config.name} (${config.id})`);
      console.log(`[SyncJob] Direction: ${config.syncDirection}`);
      console.log(`[SyncJob] User: ${config.user.email || config.user.username || config.userId}`);
      console.log(`[SyncJob] [${'='.repeat(70)}]\n`);

      try {
        // --------------------------------------------------------------------
        // 2.0: Check if user's subscription/trial is active
        // --------------------------------------------------------------------
        if (shouldPauseSyncs(config.user as User)) {
          const pauseReason = getSyncPauseReason(config.user as User);
          console.warn(`[SyncJob] ⏸️  Syncs paused for user: ${pauseReason}`);
          result.skipped++;
          result.results.push({
            configId: config.id,
            configName: config.name,
            status: 'SKIPPED',
            message: pauseReason || 'Trial expired or subscription inactive',
          });
          continue;
        }

        // --------------------------------------------------------------------
        // 2.1: Validate connections exist
        // --------------------------------------------------------------------
        const airtableConnection = config.user.airtableConnections?.[0];
        const googleConnection = config.user.googleSheetsConnections?.[0];

        if (!airtableConnection) {
          const message = 'User has no Airtable connection';
          console.warn(`[SyncJob] ⚠️  ${message}`);
          result.skipped++;
          result.results.push({
            configId: config.id,
            configName: config.name,
            status: 'SKIPPED',
            message,
          });

          // Update sync status
          await context.entities.SyncConfig.update({
            where: { id: config.id },
            data: { lastSyncStatus: 'failed' },
          });

          continue;
        }

        if (!googleConnection) {
          const message = 'User has no Google Sheets connection';
          console.warn(`[SyncJob] ⚠️  ${message}`);
          result.skipped++;
          result.results.push({
            configId: config.id,
            configName: config.name,
            status: 'SKIPPED',
            message,
          });

          // Update sync status
          await context.entities.SyncConfig.update({
            where: { id: config.id },
            data: { lastSyncStatus: 'failed' },
          });

          continue;
        }

        // --------------------------------------------------------------------
        // 2.2: Decrypt access tokens
        // --------------------------------------------------------------------
        console.log('[SyncJob] Decrypting access tokens...');

        const airtableAccessToken = await getDecryptedAirtableConnection(
          airtableConnection.accessToken
        );
        const sheetsAccessToken = await getDecryptedGoogleConnection(
          googleConnection.accessToken
        );

        // --------------------------------------------------------------------
        // 2.3: Execute sync based on direction
        // --------------------------------------------------------------------
        console.log(`[SyncJob] Executing ${config.syncDirection} sync...`);

        let syncResult: any;
        let syncStatus: 'success' | 'failed' | 'partial' = 'success';
        let errorMessage: string | undefined;

        try {
          switch (config.syncDirection) {
            case 'AIRTABLE_TO_SHEETS': {
              syncResult = await syncAirtableToSheets({
                airtableAccessToken,
                sheetsAccessToken,
                baseId: config.airtableBaseId,
                tableId: config.airtableTableId,
                spreadsheetId: config.googleSpreadsheetId,
                sheetId: config.googleSheetId,
                fieldMappings: config.fieldMappings
                  ? JSON.parse(config.fieldMappings)
                  : undefined,
                includeHeader: true,
                deleteExtraRows: false,
                resolveLinkedRecords: true,
                idColumnIndex: 0,
                maxRetries: 3,
                batchSize: 100,
              });

              syncStatus =
                syncResult.errors.length === 0
                  ? 'success'
                  : syncResult.added + syncResult.updated > 0
                    ? 'partial'
                    : 'failed';
              break;
            }

            case 'SHEETS_TO_AIRTABLE': {
              syncResult = await syncSheetsToAirtable({
                sheetsAccessToken,
                airtableAccessToken,
                spreadsheetId: config.googleSpreadsheetId,
                sheetId: config.googleSheetId,
                baseId: config.airtableBaseId,
                tableId: config.airtableTableId,
                fieldMappings: config.fieldMappings
                  ? JSON.parse(config.fieldMappings)
                  : undefined,
                idColumnIndex: 0,
                skipHeaderRow: true,
                deleteExtraRecords: false,
                resolveLinkedRecords: true,
                createMissingLinkedRecords: false,
                maxRetries: 3,
                batchSize: 10,
                validationMode: 'lenient',
              });

              syncStatus =
                syncResult.errors.length === 0
                  ? 'success'
                  : syncResult.added + syncResult.updated > 0
                    ? 'partial'
                    : 'failed';
              break;
            }

            case 'BIDIRECTIONAL': {
              syncResult = await syncBidirectional({
                syncConfigId: config.id,
                airtableAccessToken,
                sheetsAccessToken,
                baseId: config.airtableBaseId,
                tableId: config.airtableTableId,
                spreadsheetId: config.googleSpreadsheetId,
                sheetId: config.googleSheetId,
                conflictResolution: config.conflictResolution as ConflictResolutionStrategy,
                fieldMappings: config.fieldMappings
                  ? JSON.parse(config.fieldMappings)
                  : undefined,
                idColumnIndex: 0,
                includeHeader: true,
                resolveLinkedRecords: true,
                createMissingLinkedRecords: false,
                maxRetries: 3,
                batchSize: 10,
                dryRun: false,
              });

              syncStatus =
                syncResult.status === 'SUCCESS'
                  ? 'success'
                  : syncResult.status === 'PARTIAL'
                    ? 'partial'
                    : 'failed';
              break;
            }

            default:
              throw new Error(`Unknown sync direction: ${config.syncDirection}`);
          }

          // Log successful sync
          console.log(`[SyncJob] ✓ Sync completed successfully`);
          console.log(`[SyncJob]   Status: ${syncStatus}`);
          if (config.syncDirection === 'BIDIRECTIONAL') {
            console.log(
              `[SyncJob]   Airtable → Sheets: ${syncResult.summary.airtableToSheets.added} added, ${syncResult.summary.airtableToSheets.updated} updated`
            );
            console.log(
              `[SyncJob]   Sheets → Airtable: ${syncResult.summary.sheetsToAirtable.added} added, ${syncResult.summary.sheetsToAirtable.updated} updated`
            );
            console.log(`[SyncJob]   Conflicts: ${syncResult.summary.conflicts.total} resolved`);
          } else {
            console.log(
              `[SyncJob]   Records: ${syncResult.added} added, ${syncResult.updated} updated, ${syncResult.deleted} deleted`
            );
          }
          console.log(`[SyncJob]   Duration: ${syncResult.duration}ms`);

          if (syncResult.errors && syncResult.errors.length > 0) {
            console.warn(`[SyncJob]   ⚠️  ${syncResult.errors.length} error(s) occurred`);
            errorMessage = syncResult.errors
              .slice(0, 3)
              .map((e: any) => e.message)
              .join('; ');
          }

          // Check usage limits and send notification emails if approaching/reaching limits
          try {
            const recordCount = config.syncDirection === 'BIDIRECTIONAL'
              ? (syncResult?.summary?.airtableToSheets?.total || 0) + (syncResult?.summary?.sheetsToAirtable?.total || 0)
              : (syncResult?.total || 0);

            if (recordCount > 0) {
              await checkAndSendUsageEmails(config.user as User, recordCount);
            }
          } catch (usageEmailError) {
            console.error('[SyncJob] Failed to send usage notification email:', usageEmailError);
          }

          result.successful++;
        } catch (syncError) {
          // Sync execution failed
          syncStatus = 'failed';
          errorMessage =
            syncError instanceof Error ? syncError.message : String(syncError);
          console.error(`[SyncJob] ✗ Sync failed:`, errorMessage);
          console.error(`[SyncJob] Error stack:`, syncError instanceof Error ? syncError.stack : 'No stack');
          result.failed++;

          // Initialize syncResult with error info so it gets logged properly
          syncResult = {
            added: 0,
            updated: 0,
            deleted: 0,
            total: 0,
            errors: [{ message: errorMessage, type: 'SYNC_ERROR' }],
            warnings: [],
            duration: Date.now() - configStartTime,
          };

          // Send sync failed email notification
          try {
            await sendSyncFailedEmail(
              config.user as User,
              config.name,
              errorMessage
            );
          } catch (emailError) {
            console.error('[SyncJob] Failed to send sync failure email:', emailError);
          }
        }

        // --------------------------------------------------------------------
        // 2.4: Update SyncConfig and create SyncLog
        // --------------------------------------------------------------------
        console.log('[SyncJob] Updating sync metadata...');

        const configDuration = Date.now() - configStartTime;

        // Update SyncConfig
        await context.entities.SyncConfig.update({
          where: { id: config.id },
          data: {
            lastSyncAt: new Date(),
            lastSyncStatus: syncStatus,
          },
        });

        // Create SyncLog entry
        await context.entities.SyncLog.create({
          data: {
            syncConfigId: config.id,
            status:
              syncStatus === 'success'
                ? 'SUCCESS'
                : syncStatus === 'partial'
                  ? 'PARTIAL'
                  : 'FAILED',
            recordsSynced:
              config.syncDirection === 'BIDIRECTIONAL'
                ? (syncResult?.summary?.airtableToSheets?.added || 0) +
                  (syncResult?.summary?.airtableToSheets?.updated || 0) +
                  (syncResult?.summary?.sheetsToAirtable?.added || 0) +
                  (syncResult?.summary?.sheetsToAirtable?.updated || 0)
                : (syncResult?.added || 0) + (syncResult?.updated || 0),
            recordsFailed: syncResult?.errors?.length || 0,
            errors: errorMessage
              ? JSON.stringify([{ message: errorMessage }])
              : syncResult?.errors && syncResult.errors.length > 0
                ? JSON.stringify(
                    syncResult.errors.slice(0, 10).map((e: any) => ({
                      message: e.message,
                      recordId: e.recordId,
                      type: e.type,
                    }))
                  )
                : null,
            startedAt: new Date(configStartTime),
            completedAt: new Date(),
            triggeredBy: 'scheduled',
            direction: config.syncDirection,
          },
        });

        // Add to results
        result.results.push({
          configId: config.id,
          configName: config.name,
          status: syncStatus === 'failed' ? 'FAILED' : 'SUCCESS',
          message:
            syncStatus === 'failed'
              ? errorMessage || 'Sync failed'
              : `Synced successfully (${syncStatus})`,
          duration: configDuration,
          error: errorMessage,
        });

        console.log('[SyncJob] ✓ Sync metadata updated');
      } catch (error) {
        // Config processing failed catastrophically
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[SyncJob] ✗ Failed to process config:`, errorMessage);

        result.failed++;
        result.results.push({
          configId: config.id,
          configName: config.name,
          status: 'FAILED',
          message: 'Failed to process config',
          error: errorMessage,
        });

        // Try to log the failure
        try {
          await context.entities.SyncLog.create({
            data: {
              syncConfigId: config.id,
              status: 'FAILED',
              recordsSynced: 0,
              recordsFailed: 0,
              errors: JSON.stringify([
                { message: errorMessage, type: 'PROCESSING_ERROR' },
              ]),
              startedAt: new Date(configStartTime),
              completedAt: new Date(),
              triggeredBy: 'scheduled',
              direction: config.syncDirection,
            },
          });

          await context.entities.SyncConfig.update({
            where: { id: config.id },
            data: { lastSyncStatus: 'failed' },
          });
        } catch (logError) {
          console.error(
            '[SyncJob] Failed to log error:',
            logError instanceof Error ? logError.message : String(logError)
          );
        }
      }
    }

    // ========================================================================
    // STEP 3: Log job summary
    // ========================================================================
    result.duration = Date.now() - startTime;

    console.log('\n' + '='.repeat(80));
    console.log('[SyncJob] Job Summary:');
    console.log(`[SyncJob]   Total Processed: ${result.totalProcessed}`);
    console.log(`[SyncJob]   Successful: ${result.successful}`);
    console.log(`[SyncJob]   Failed: ${result.failed}`);
    console.log(`[SyncJob]   Skipped: ${result.skipped}`);
    console.log(`[SyncJob]   Duration: ${result.duration}ms`);
    console.log('[SyncJob]');
    console.log('[SyncJob] Detailed Results:');
    result.results.forEach((r, i) => {
      const icon = r.status === 'SUCCESS' ? '✓' : r.status === 'FAILED' ? '✗' : '⊘';
      console.log(
        `[SyncJob]   ${i + 1}. ${icon} ${r.configName} - ${r.message}${r.duration ? ` (${r.duration}ms)` : ''}`
      );
      if (r.error) {
        console.log(`[SyncJob]      Error: ${r.error}`);
      }
    });
    console.log('='.repeat(80) + '\n');
  } catch (error) {
    // Job-level error
    console.error(
      '\n[SyncJob] ✗ CRITICAL ERROR in sync job:',
      error instanceof Error ? error.message : String(error)
    );
    console.error('[SyncJob] Stack trace:', error);

    // Don't crash the job scheduler - log and return
    console.error('[SyncJob] Job will retry on next schedule\n');
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets a user-friendly description of the sync direction
 */
function getSyncDirectionDescription(direction: string): string {
  switch (direction) {
    case 'AIRTABLE_TO_SHEETS':
      return 'Airtable → Sheets';
    case 'SHEETS_TO_AIRTABLE':
      return 'Sheets → Airtable';
    case 'BIDIRECTIONAL':
      return 'Bidirectional';
    default:
      return direction;
  }
}

/**
 * Truncates error messages for logging
 */
function truncateError(error: string, maxLength: number = 200): string {
  if (error.length <= maxLength) return error;
  return error.substring(0, maxLength) + '...';
}
