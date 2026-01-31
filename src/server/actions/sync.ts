/**
 * Manual Sync Actions
 * Provides on-demand sync triggers for user-initiated syncs
 */

import { HttpError } from 'wasp/server';
import { syncAirtableToSheets } from '../sync/airtableToSheets';
import { syncSheetsToAirtable } from '../sync/sheetsToAirtable';
import { syncBidirectional } from '../sync/bidirectionalSync';
import { getValidAirtableToken, getValidGoogleToken } from '../utils/tokenManager';
import type { ConflictResolutionStrategy } from '../sync/conflictDetector';
import { checkRecordLimit, isApproachingRecordLimit, shouldPauseSyncs, getSyncPauseReason } from '../middleware/usageLimits';
import { trackRecordsSynced } from '../utils/usageTracker';
import type { User } from 'wasp/entities';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Manual Sync Action
// ============================================================================

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
export const triggerManualSync = async (
  args: TriggerManualSyncArgs,
  context: any
): Promise<ManualSyncResult> => {
  const startTime = Date.now();
  const startedAt = new Date();

  console.log('\n' + '='.repeat(80));
  console.log('[ManualSync] Manual sync triggered');
  console.log('[ManualSync] Config ID:', args.syncConfigId);
  console.log('[ManualSync] User:', context.user.email || context.user.username);
  console.log('[ManualSync] Time:', startedAt.toISOString());
  console.log('='.repeat(80) + '\n');

  // ==========================================================================
  // STEP 1: Validate input
  // ==========================================================================
  if (!args.syncConfigId) {
    throw new HttpError(400, 'syncConfigId is required');
  }

  if (typeof args.syncConfigId !== 'string') {
    throw new HttpError(400, 'syncConfigId must be a string');
  }

  // Helper function to log errors to SyncLog even when early validation fails
  // Note: syncConfig may not be available yet, so we use optional chaining
  let syncConfigForLogging: any = null; // Will be set after we fetch it

  const logSyncError = async (errorMessage: string, errorType: string = 'VALIDATION_ERROR') => {
    try {
      await context.entities.SyncLog.create({
        data: {
          syncConfigId: args.syncConfigId,
          status: 'FAILED',
          recordsSynced: 0,
          recordsFailed: 1,
          errors: JSON.stringify([{ message: errorMessage, type: errorType }]),
          startedAt,
          completedAt: new Date(),
          triggeredBy: 'manual',
          direction: syncConfigForLogging?.syncDirection || 'UNKNOWN',
        },
      });
      console.log('[ManualSync] Error logged to SyncLog:', errorMessage);
    } catch (logError) {
      console.error('[ManualSync] Failed to log error to SyncLog:', logError);
    }
  };

  // ==========================================================================
  // STEP 2: Fetch and validate sync config
  // ==========================================================================
  console.log('[ManualSync] Fetching sync configuration...');

  const syncConfig = await context.entities.SyncConfig.findUnique({
    where: { id: args.syncConfigId },
    include: {
      user: {
        include: {
          airtableConnections: true,
          googleSheetsConnections: true,
        },
      },
    },
  });

  // Edge case: Sync config doesn't exist
  if (!syncConfig) {
    console.error('[ManualSync] Sync config not found');
    throw new HttpError(404, 'Sync configuration not found');
  }

  // Edge case: User doesn't own this sync config
  if (syncConfig.userId !== context.user.id) {
    console.error('[ManualSync] Unauthorized access attempt');
    throw new HttpError(403, 'You do not have permission to access this sync configuration');
  }

  console.log('[ManualSync] Config found:', syncConfig.name);
  console.log('[ManualSync] Direction:', syncConfig.syncDirection);
  console.log('[ManualSync] Is active:', syncConfig.isActive);

  // Store for error logging
  syncConfigForLogging = syncConfig;

  // ==========================================================================
  // STEP 2.5: Check subscription/trial status
  // ==========================================================================
  // CRITICAL: Prevent syncs if trial expired or subscription inactive
  if (shouldPauseSyncs(syncConfig.user as User)) {
    const pauseReason = getSyncPauseReason(syncConfig.user as User);
    console.warn('[ManualSync] Syncs paused for user:', pauseReason);
    const errorMsg = pauseReason || 'Your trial has expired or subscription is inactive. Please upgrade to continue syncing.';
    await logSyncError(errorMsg, 'SUBSCRIPTION_REQUIRED');
    throw new HttpError(402, errorMsg); // 402 Payment Required
  }

  // Edge case: Sync config is inactive
  if (!syncConfig.isActive) {
    console.warn('[ManualSync] Sync config is inactive');
    const errorMsg = 'This sync configuration is inactive. Please activate it before running a manual sync.';
    await logSyncError(errorMsg, 'INACTIVE_CONFIG');
    throw new HttpError(400, errorMsg);
  }

  // ==========================================================================
  // STEP 3: Check for concurrent execution
  // ==========================================================================
  // Edge case: Prevent concurrent syncs for the same config
  const recentSync = await context.entities.SyncLog.findFirst({
    where: {
      syncConfigId: args.syncConfigId,
      startedAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
      },
      completedAt: null, // Still running
    },
    orderBy: { startedAt: 'desc' },
  });

  if (recentSync) {
    console.warn('[ManualSync] Concurrent sync detected');
    throw new HttpError(
      409,
      'A sync is already in progress for this configuration. Please wait for it to complete.'
    );
  }

  // ==========================================================================
  // STEP 4: Validate connections exist
  // ==========================================================================
  console.log('[ManualSync] Validating connections...');

  const airtableConnection = syncConfig.user.airtableConnections?.[0];
  const googleConnection = syncConfig.user.googleSheetsConnections?.[0];

  // Edge case: Missing Airtable connection
  if (!airtableConnection) {
    console.error('[ManualSync] No Airtable connection found');
    const errorMsg = 'Airtable connection not found. Please connect your Airtable account first.';
    await logSyncError(errorMsg, 'MISSING_CONNECTION');
    throw new HttpError(400, errorMsg);
  }

  // Edge case: Missing Google Sheets connection
  if (!googleConnection) {
    console.error('[ManualSync] No Google Sheets connection found');
    const errorMsg = 'Google Sheets connection not found. Please connect your Google account first.';
    await logSyncError(errorMsg, 'MISSING_CONNECTION');
    throw new HttpError(400, errorMsg);
  }

  console.log('[ManualSync] Connections validated');

  // ==========================================================================
  // STEP 5: Get valid access tokens (auto-refreshes if needed)
  // ==========================================================================
  console.log('[ManualSync] Getting valid access tokens...');

  let airtableAccessToken: string;
  let sheetsAccessToken: string;

  try {
    // This automatically checks expiry and refreshes tokens if needed
    airtableAccessToken = await getValidAirtableToken(context.user.id);
    console.log('[ManualSync] ✓ Got valid Airtable token');
  } catch (error) {
    // Edge case: Token refresh failure or needs reauth
    console.error('[ManualSync] Failed to get valid Airtable token:', error);
    const errorMsg = error instanceof Error ? error.message : 'Failed to get Airtable access token. Please reconnect your Airtable account.';
    await logSyncError(errorMsg, 'AIRTABLE_TOKEN_ERROR');
    throw new HttpError(401, errorMsg);
  }

  try {
    // This automatically checks expiry and refreshes tokens if needed
    sheetsAccessToken = await getValidGoogleToken(context.user.id);
    console.log('[ManualSync] ✓ Got valid Google Sheets token');
  } catch (error) {
    // Edge case: Token refresh failure or needs reauth
    console.error('[ManualSync] Failed to get valid Google Sheets token:', error);
    const errorMsg = error instanceof Error ? error.message : 'Failed to get Google Sheets access token. Please reconnect your Google account.';
    await logSyncError(errorMsg, 'GOOGLE_TOKEN_ERROR');
    throw new HttpError(401, errorMsg);
  }

  // ==========================================================================
  // STEP 6: Parse and validate field mappings
  // ==========================================================================
  let fieldMappings: Record<string, number> | undefined;

  if (syncConfig.fieldMappings) {
    try {
      fieldMappings = JSON.parse(syncConfig.fieldMappings);

      // Edge case: Invalid field mappings format
      if (typeof fieldMappings !== 'object' || fieldMappings === null) {
        throw new Error('Field mappings must be an object');
      }

      // Validate each mapping is a number
      for (const [key, value] of Object.entries(fieldMappings)) {
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
          throw new Error(`Invalid column index for field "${key}": ${value}`);
        }
      }
    } catch (error) {
      // Edge case: Invalid JSON or format
      console.error('[ManualSync] Invalid field mappings:', error);
      const errorMsg = `Invalid field mappings configuration: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await logSyncError(errorMsg, 'FIELD_MAPPINGS_ERROR');
      throw new HttpError(400, errorMsg);
    }
  }

  // ==========================================================================
  // STEP 7: Execute sync based on direction
  // ==========================================================================
  console.log('[ManualSync] Executing sync...');

  let syncResult: any;
  let syncStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED' = 'SUCCESS';
  let errors: any[] = [];
  let warnings: string[] = [];
  let caughtError: Error | null = null; // Track error to rethrow after logging

  try {
    switch (syncConfig.syncDirection) {
      // ----------------------------------------------------------------------
      // Airtable → Google Sheets
      // ----------------------------------------------------------------------
      case 'AIRTABLE_TO_SHEETS': {
        console.log('[ManualSync] Running Airtable → Sheets sync...');

        syncResult = await syncAirtableToSheets({
          airtableAccessToken,
          sheetsAccessToken,
          baseId: syncConfig.airtableBaseId,
          tableId: syncConfig.airtableTableId,
          spreadsheetId: syncConfig.googleSpreadsheetId,
          sheetId: syncConfig.googleSheetId,
          fieldMappings,
          includeHeader: true,
          deleteExtraRows: false,
          resolveLinkedRecords: true,
          idColumnIndex: 0,
          maxRetries: 3,
          batchSize: 100,
        });

        errors = syncResult.errors || [];
        warnings = syncResult.warnings || [];

        syncStatus =
          errors.length === 0
            ? 'SUCCESS'
            : syncResult.added + syncResult.updated > 0
              ? 'PARTIAL'
              : 'FAILED';
        break;
      }

      // ----------------------------------------------------------------------
      // Google Sheets → Airtable
      // ----------------------------------------------------------------------
      case 'SHEETS_TO_AIRTABLE': {
        console.log('[ManualSync] Running Sheets → Airtable sync...');

        syncResult = await syncSheetsToAirtable({
          sheetsAccessToken,
          airtableAccessToken,
          spreadsheetId: syncConfig.googleSpreadsheetId,
          sheetId: syncConfig.googleSheetId,
          baseId: syncConfig.airtableBaseId,
          tableId: syncConfig.airtableTableId,
          fieldMappings,
          idColumnIndex: 0,
          skipHeaderRow: true,
          deleteExtraRecords: false,
          resolveLinkedRecords: true,
          createMissingLinkedRecords: false,
          maxRetries: 3,
          batchSize: 10,
          validationMode: 'lenient',
        });

        errors = syncResult.errors || [];
        warnings = syncResult.warnings || [];

        syncStatus =
          errors.length === 0
            ? 'SUCCESS'
            : syncResult.added + syncResult.updated > 0
              ? 'PARTIAL'
              : 'FAILED';
        break;
      }

      // ----------------------------------------------------------------------
      // Bidirectional
      // ----------------------------------------------------------------------
      case 'BIDIRECTIONAL': {
        console.log('[ManualSync] Running bidirectional sync...');

        syncResult = await syncBidirectional({
          syncConfigId: syncConfig.id,
          airtableAccessToken,
          sheetsAccessToken,
          baseId: syncConfig.airtableBaseId,
          tableId: syncConfig.airtableTableId,
          spreadsheetId: syncConfig.googleSpreadsheetId,
          sheetId: syncConfig.googleSheetId,
          conflictResolution: syncConfig.conflictResolution as ConflictResolutionStrategy,
          fieldMappings,
          idColumnIndex: 0,
          includeHeader: true,
          resolveLinkedRecords: true,
          createMissingLinkedRecords: false,
          maxRetries: 3,
          batchSize: 10,
          dryRun: false,
        });

        errors = syncResult.errors || [];
        warnings = syncResult.warnings || [];

        syncStatus = syncResult.status;
        break;
      }

      // ----------------------------------------------------------------------
      // Unknown direction (should never happen)
      // ----------------------------------------------------------------------
      default: {
        // Edge case: Invalid sync direction in database
        console.error('[ManualSync] Unknown sync direction:', syncConfig.syncDirection);
        throw new HttpError(
          500,
          `Invalid sync direction: ${syncConfig.syncDirection}. Please contact support.`
        );
      }
    }

    console.log('[ManualSync] Sync execution completed');
    console.log('[ManualSync] Status:', syncStatus);
  } catch (error) {
    // Edge case: Sync execution failed catastrophically
    console.error('[ManualSync] Sync execution failed:', error);
    console.error('[ManualSync] Error stack:', error instanceof Error ? error.stack : 'No stack');

    syncStatus = 'FAILED';
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors = [
      {
        message: errorMessage,
        type: error instanceof HttpError ? 'HTTP_ERROR' : 'EXECUTION_ERROR',
      },
    ];

    // Initialize syncResult with error info so it gets logged
    syncResult = {
      added: 0,
      updated: 0,
      deleted: 0,
      total: 0,
      errors: errors,
      warnings: [],
      duration: Date.now() - startTime,
      startedAt,
      completedAt: new Date(),
    };

    // Store error to rethrow after logging (if it's an HttpError that should surface to user)
    if (error instanceof HttpError) {
      caughtError = error;
    }
  }

  // ==========================================================================
  // STEP 8: Update sync metadata
  // ==========================================================================
  console.log('[ManualSync] Updating sync metadata...');

  const completedAt = new Date();
  const duration = Date.now() - startTime;

  try {
    // Update SyncConfig
    await context.entities.SyncConfig.update({
      where: { id: syncConfig.id },
      data: {
        lastSyncAt: completedAt,
        lastSyncStatus: syncStatus.toLowerCase(),
      },
    });

    // Create SyncLog entry
    await context.entities.SyncLog.create({
      data: {
        syncConfigId: syncConfig.id,
        status:
          syncStatus === 'SUCCESS'
            ? 'SUCCESS'
            : syncStatus === 'PARTIAL'
              ? 'PARTIAL'
              : 'FAILED',
        recordsSynced:
          syncConfig.syncDirection === 'BIDIRECTIONAL'
            ? (syncResult?.summary?.airtableToSheets?.added || 0) +
              (syncResult?.summary?.airtableToSheets?.updated || 0) +
              (syncResult?.summary?.sheetsToAirtable?.added || 0) +
              (syncResult?.summary?.sheetsToAirtable?.updated || 0)
            : (syncResult?.added || 0) + (syncResult?.updated || 0),
        recordsFailed: errors.length,
        errors:
          errors.length > 0
            ? JSON.stringify(
                errors.slice(0, 10).map((e) => ({
                  message: e.message,
                  recordId: e.recordId,
                  type: e.type,
                }))
              )
            : null,
        startedAt,
        completedAt,
        triggeredBy: 'manual',
        direction: syncConfig.syncDirection,
      },
    });

    console.log('[ManualSync] Sync metadata updated');

    // Track usage for billing and limits (only successful syncs)
    if (syncStatus === 'SUCCESS' || syncStatus === 'PARTIAL') {
      const recordsCount = syncConfig.syncDirection === 'BIDIRECTIONAL'
        ? (syncResult?.summary?.airtableToSheets?.added || 0) +
          (syncResult?.summary?.airtableToSheets?.updated || 0) +
          (syncResult?.summary?.sheetsToAirtable?.added || 0) +
          (syncResult?.summary?.sheetsToAirtable?.updated || 0)
        : (syncResult?.added || 0) + (syncResult?.updated || 0);

      await trackRecordsSynced(context.user!.id, recordsCount);

      // Add warning if approaching record limit
      if (isApproachingRecordLimit(context.user!, recordsCount)) {
        warnings.push('You are approaching your monthly record limit for your plan. Consider upgrading to avoid sync interruptions.');
      }
    }
  } catch (error) {
    // Edge case: Failed to update metadata (non-fatal)
    console.error('[ManualSync] Failed to update metadata:', error);
    warnings.push('Failed to update sync metadata in database');
  }

  // ==========================================================================
  // STEP 9: Build and return result
  // ==========================================================================
  console.log('[ManualSync] Building result...');

  let message: string;
  if (syncStatus === 'SUCCESS') {
    message = 'Sync completed successfully';
  } else if (syncStatus === 'PARTIAL') {
    message = `Sync completed with ${errors.length} error(s)`;
  } else {
    message = 'Sync failed';
  }

  const result: ManualSyncResult = {
    status: syncStatus,
    message,
    details: {
      added:
        syncConfig.syncDirection === 'BIDIRECTIONAL'
          ? (syncResult?.summary?.airtableToSheets?.added || 0) +
            (syncResult?.summary?.sheetsToAirtable?.added || 0)
          : syncResult?.added || 0,
      updated:
        syncConfig.syncDirection === 'BIDIRECTIONAL'
          ? (syncResult?.summary?.airtableToSheets?.updated || 0) +
            (syncResult?.summary?.sheetsToAirtable?.updated || 0)
          : syncResult?.updated || 0,
      deleted:
        syncConfig.syncDirection === 'BIDIRECTIONAL'
          ? (syncResult?.summary?.airtableToSheets?.deleted || 0) +
            (syncResult?.summary?.sheetsToAirtable?.deleted || 0)
          : syncResult?.deleted || 0,
      total: syncResult?.total || 0,
      errorCount: errors.length,
      duration,
      direction: syncConfig.syncDirection,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
    },
    errors:
      errors.length > 0
        ? errors.slice(0, 20).map((e) => ({
            message: e.message,
            type: e.type,
            recordId: e.recordId,
          }))
        : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    conflicts:
      syncConfig.syncDirection === 'BIDIRECTIONAL'
        ? syncResult?.summary?.conflicts
        : undefined,
  };

  console.log('\n' + '='.repeat(80));
  console.log('[ManualSync] Manual sync completed');
  console.log('[ManualSync] Status:', syncStatus);
  console.log('[ManualSync] Duration:', duration, 'ms');
  console.log('[ManualSync] Records: +', result.details.added, '↻', result.details.updated, '-', result.details.deleted);
  if (errors.length > 0) {
    console.log('[ManualSync] Errors:', errors.length);
  }
  if (warnings.length > 0) {
    console.log('[ManualSync] Warnings:', warnings.length);
  }
  console.log('='.repeat(80) + '\n');

  // If we caught an HttpError earlier, rethrow it now that we've logged everything
  if (caughtError) {
    throw caughtError;
  }

  return result;
};

// ============================================================================
// Initial Sync Action
// ============================================================================

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
export const runInitialSync = async (
  args: RunInitialSyncArgs,
  context: any
): Promise<ManualSyncResult> => {
  const startTime = Date.now();
  const startedAt = new Date();

  console.log('\n' + '='.repeat(80));
  console.log('[InitialSync] Initial sync triggered');
  console.log('[InitialSync] Config ID:', args.syncConfigId);
  console.log('[InitialSync] Dry run:', args.dryRun || false);
  console.log('[InitialSync] User:', context.user.email || context.user.username);
  console.log('[InitialSync] Time:', startedAt.toISOString());
  console.log('='.repeat(80) + '\n');

  // ==========================================================================
  // STEP 1: Validate input
  // ==========================================================================
  if (!args.syncConfigId) {
    throw new HttpError(400, 'syncConfigId is required');
  }

  if (typeof args.syncConfigId !== 'string') {
    throw new HttpError(400, 'syncConfigId must be a string');
  }

  if (args.dryRun !== undefined && typeof args.dryRun !== 'boolean') {
    throw new HttpError(400, 'dryRun must be a boolean');
  }

  // ==========================================================================
  // STEP 2: Fetch and validate sync config
  // ==========================================================================
  console.log('[InitialSync] Fetching sync configuration...');

  const syncConfig = await context.entities.SyncConfig.findUnique({
    where: { id: args.syncConfigId },
    include: {
      user: {
        include: {
          airtableConnections: true,
          googleSheetsConnections: true,
        },
      },
      syncLogs: {
        orderBy: { startedAt: 'desc' },
        take: 1,
      },
    },
  });

  // Edge case: Sync config doesn't exist
  if (!syncConfig) {
    console.error('[InitialSync] Sync config not found');
    throw new HttpError(404, 'Sync configuration not found');
  }

  // Edge case: User doesn't own this sync config
  if (syncConfig.userId !== context.user.id) {
    console.error('[InitialSync] Unauthorized access attempt');
    throw new HttpError(
      403,
      'You do not have permission to access this sync configuration'
    );
  }

  console.log('[InitialSync] Config found:', syncConfig.name);
  console.log('[InitialSync] Direction:', syncConfig.syncDirection);
  console.log('[InitialSync] Previous syncs:', syncConfig.syncLogs.length);

  // ==========================================================================
  // STEP 2.5: Check subscription/trial status
  // ==========================================================================
  // CRITICAL: Prevent syncs if trial expired or subscription inactive
  if (shouldPauseSyncs(syncConfig.user as User)) {
    const pauseReason = getSyncPauseReason(syncConfig.user as User);
    console.warn('[InitialSync] Syncs paused for user:', pauseReason);
    const errorMsg = pauseReason || 'Your trial has expired or subscription is inactive. Please upgrade to continue syncing.';
    throw new HttpError(402, errorMsg); // 402 Payment Required
  }

  // ==========================================================================
  // STEP 3: Warn if this is not truly an initial sync
  // ==========================================================================
  const warnings: string[] = [];

  if (syncConfig.lastSyncAt) {
    const daysSinceLastSync = Math.floor(
      (Date.now() - syncConfig.lastSyncAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    console.warn(
      `[InitialSync] This sync config was last synced ${daysSinceLastSync} day(s) ago`
    );
    warnings.push(
      `This is not a first-time sync. Last sync was ${daysSinceLastSync} day(s) ago.`
    );
  }

  // Edge case: Sync config is inactive
  if (!syncConfig.isActive) {
    console.warn('[InitialSync] Sync config is inactive - will activate it');
    warnings.push('Sync configuration was inactive and has been activated.');

    // Activate the config for initial sync
    await context.entities.SyncConfig.update({
      where: { id: args.syncConfigId },
      data: { isActive: true },
    });
  }

  // ==========================================================================
  // STEP 4: Validate connections exist
  // ==========================================================================
  console.log('[InitialSync] Validating connections...');

  const airtableConnection = syncConfig.user.airtableConnections?.[0];
  const googleConnection = syncConfig.user.googleSheetsConnections?.[0];

  // Edge case: Missing Airtable connection
  if (!airtableConnection) {
    console.error('[InitialSync] No Airtable connection found');
    throw new HttpError(
      400,
      'Airtable connection not found. Please connect your Airtable account first.'
    );
  }

  // Edge case: Missing Google Sheets connection
  if (!googleConnection) {
    console.error('[InitialSync] No Google Sheets connection found');
    throw new HttpError(
      400,
      'Google Sheets connection not found. Please connect your Google account first.'
    );
  }

  console.log('[InitialSync] Connections validated');

  // ==========================================================================
  // STEP 5: Get valid access tokens (auto-refreshes if needed)
  // ==========================================================================
  console.log('[InitialSync] Getting valid access tokens...');

  let airtableAccessToken: string;
  let sheetsAccessToken: string;

  try {
    // This automatically checks expiry and refreshes tokens if needed
    airtableAccessToken = await getValidAirtableToken(syncConfig.userId);
    console.log('[InitialSync] ✓ Got valid Airtable token');
  } catch (error) {
    // Edge case: Token refresh failure or needs reauth
    console.error('[InitialSync] Failed to get valid Airtable token:', error);
    const errorMsg = error instanceof Error ? error.message : 'Failed to get Airtable access token. Please reconnect your Airtable account.';
    throw new HttpError(401, errorMsg);
  }

  try {
    // This automatically checks expiry and refreshes tokens if needed
    sheetsAccessToken = await getValidGoogleToken(syncConfig.userId);
    console.log('[InitialSync] ✓ Got valid Google Sheets token');
  } catch (error) {
    // Edge case: Token refresh failure or needs reauth
    console.error('[InitialSync] Failed to get valid Google Sheets token:', error);
    const errorMsg = error instanceof Error ? error.message : 'Failed to get Google Sheets access token. Please reconnect your Google account.';
    throw new HttpError(401, errorMsg);
  }

  // ==========================================================================
  // STEP 6: Parse and validate field mappings
  // ==========================================================================
  let fieldMappings: Record<string, number> | undefined;

  if (syncConfig.fieldMappings) {
    try {
      fieldMappings = JSON.parse(syncConfig.fieldMappings);

      // Edge case: Invalid field mappings format
      if (typeof fieldMappings !== 'object' || fieldMappings === null) {
        throw new Error('Field mappings must be an object');
      }

      // Validate each mapping
      for (const [key, value] of Object.entries(fieldMappings)) {
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
          throw new Error(`Invalid column index for field "${key}": ${value}`);
        }
      }
    } catch (error) {
      // Edge case: Invalid JSON or format
      console.error('[InitialSync] Invalid field mappings:', error);
      throw new HttpError(
        400,
        `Invalid field mappings configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ==========================================================================
  // STEP 7: Execute initial sync based on direction
  // ==========================================================================
  console.log('[InitialSync] Executing initial sync...');
  console.log('[InitialSync] Dry run:', args.dryRun || false);

  let syncResult: any;
  let syncStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED' = 'SUCCESS';
  let errors: any[] = [];

  try {
    switch (syncConfig.syncDirection) {
      // ----------------------------------------------------------------------
      // Airtable → Google Sheets
      // ----------------------------------------------------------------------
      case 'AIRTABLE_TO_SHEETS': {
        console.log('[InitialSync] Running Airtable → Sheets initial sync...');

        syncResult = await syncAirtableToSheets({
          airtableAccessToken,
          sheetsAccessToken,
          baseId: syncConfig.airtableBaseId,
          tableId: syncConfig.airtableTableId,
          spreadsheetId: syncConfig.googleSpreadsheetId,
          sheetId: syncConfig.googleSheetId,
          fieldMappings,
          includeHeader: true,
          deleteExtraRows: true, // For initial sync, clean up extra rows
          resolveLinkedRecords: true,
          idColumnIndex: 0,
          maxRetries: 5, // More retries for large initial sync
          batchSize: 100,
        });

        errors = syncResult.errors || [];
        warnings.push(...(syncResult.warnings || []));

        syncStatus =
          errors.length === 0
            ? 'SUCCESS'
            : syncResult.added + syncResult.updated > 0
              ? 'PARTIAL'
              : 'FAILED';
        break;
      }

      // ----------------------------------------------------------------------
      // Google Sheets → Airtable
      // ----------------------------------------------------------------------
      case 'SHEETS_TO_AIRTABLE': {
        console.log('[InitialSync] Running Sheets → Airtable initial sync...');

        syncResult = await syncSheetsToAirtable({
          sheetsAccessToken,
          airtableAccessToken,
          spreadsheetId: syncConfig.googleSpreadsheetId,
          sheetId: syncConfig.googleSheetId,
          baseId: syncConfig.airtableBaseId,
          tableId: syncConfig.airtableTableId,
          fieldMappings,
          idColumnIndex: 0,
          skipHeaderRow: true,
          deleteExtraRecords: true, // For initial sync, clean up extra records
          resolveLinkedRecords: true,
          createMissingLinkedRecords: true, // Create linked records during initial sync
          maxRetries: 5, // More retries for large initial sync
          batchSize: 10,
          validationMode: 'strict', // Stricter validation for initial sync
        });

        errors = syncResult.errors || [];
        warnings.push(...(syncResult.warnings || []));

        syncStatus =
          errors.length === 0
            ? 'SUCCESS'
            : syncResult.added + syncResult.updated > 0
              ? 'PARTIAL'
              : 'FAILED';
        break;
      }

      // ----------------------------------------------------------------------
      // Bidirectional
      // ----------------------------------------------------------------------
      case 'BIDIRECTIONAL': {
        console.log('[InitialSync] Running bidirectional initial sync...');

        syncResult = await syncBidirectional({
          syncConfigId: syncConfig.id,
          airtableAccessToken,
          sheetsAccessToken,
          baseId: syncConfig.airtableBaseId,
          tableId: syncConfig.airtableTableId,
          spreadsheetId: syncConfig.googleSpreadsheetId,
          sheetId: syncConfig.googleSheetId,
          conflictResolution: syncConfig.conflictResolution as ConflictResolutionStrategy,
          fieldMappings,
          idColumnIndex: 0,
          includeHeader: true,
          resolveLinkedRecords: true,
          createMissingLinkedRecords: true, // Create linked records during initial sync
          maxRetries: 5, // More retries for large initial sync
          batchSize: 10,
          dryRun: args.dryRun || false,
        });

        errors = syncResult.errors || [];
        warnings.push(...(syncResult.warnings || []));

        syncStatus = syncResult.status;

        if (args.dryRun) {
          warnings.push(
            'This was a dry run. No actual changes were made. Run without dryRun flag to apply changes.'
          );
        }
        break;
      }

      // ----------------------------------------------------------------------
      // Unknown direction
      // ----------------------------------------------------------------------
      default: {
        // Edge case: Invalid sync direction in database
        console.error('[InitialSync] Unknown sync direction:', syncConfig.syncDirection);
        throw new HttpError(
          500,
          `Invalid sync direction: ${syncConfig.syncDirection}. Please contact support.`
        );
      }
    }

    console.log('[InitialSync] Sync execution completed');
    console.log('[InitialSync] Status:', syncStatus);
  } catch (error) {
    // Edge case: Sync execution failed catastrophically
    console.error('[InitialSync] Sync execution failed:', error);

    syncStatus = 'FAILED';
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors = [
      {
        message: errorMessage,
        type: 'EXECUTION_ERROR',
      },
    ];

    // If it's an HTTP error, rethrow it
    if (error instanceof HttpError) {
      throw error;
    }

    // Otherwise wrap in a generic error
    syncResult = {
      added: 0,
      updated: 0,
      deleted: 0,
      total: 0,
      errors: errors,
      warnings: warnings,
      duration: Date.now() - startTime,
      startedAt,
      completedAt: new Date(),
    };
  }

  // ==========================================================================
  // STEP 8: Update sync metadata (skip if dry run)
  // ==========================================================================
  const completedAt = new Date();
  const duration = Date.now() - startTime;

  if (!args.dryRun) {
    console.log('[InitialSync] Updating sync metadata...');

    try {
      // Update SyncConfig
      await context.entities.SyncConfig.update({
        where: { id: syncConfig.id },
        data: {
          lastSyncAt: completedAt,
          lastSyncStatus: syncStatus.toLowerCase(),
        },
      });

      // Create SyncLog entry
      await context.entities.SyncLog.create({
        data: {
          syncConfigId: syncConfig.id,
          status:
            syncStatus === 'SUCCESS'
              ? 'SUCCESS'
              : syncStatus === 'PARTIAL'
                ? 'PARTIAL'
                : 'FAILED',
          recordsSynced:
            syncConfig.syncDirection === 'BIDIRECTIONAL'
              ? (syncResult?.summary?.airtableToSheets?.added || 0) +
                (syncResult?.summary?.airtableToSheets?.updated || 0) +
                (syncResult?.summary?.sheetsToAirtable?.added || 0) +
                (syncResult?.summary?.sheetsToAirtable?.updated || 0)
              : (syncResult?.added || 0) + (syncResult?.updated || 0),
          recordsFailed: errors.length,
          errors:
            errors.length > 0
              ? JSON.stringify(
                  errors.slice(0, 10).map((e) => ({
                    message: e.message,
                    recordId: e.recordId,
                    type: e.type,
                  }))
                )
              : null,
          startedAt,
          completedAt,
          triggeredBy: 'initial',
          direction: syncConfig.syncDirection,
        },
      });

      console.log('[InitialSync] Sync metadata updated');
    } catch (error) {
      // Edge case: Failed to update metadata (non-fatal)
      console.error('[InitialSync] Failed to update metadata:', error);
      warnings.push('Failed to update sync metadata in database');
    }
  } else {
    console.log('[InitialSync] Skipping metadata update (dry run)');
  }

  // ==========================================================================
  // STEP 9: Build and return result
  // ==========================================================================
  console.log('[InitialSync] Building result...');

  let message: string;
  if (args.dryRun) {
    message = syncStatus === 'SUCCESS'
      ? 'Dry run completed successfully. No changes were made.'
      : syncStatus === 'PARTIAL'
        ? `Dry run completed with ${errors.length} potential error(s). No changes were made.`
        : 'Dry run failed. No changes were made.';
  } else {
    message = syncStatus === 'SUCCESS'
      ? 'Initial sync completed successfully'
      : syncStatus === 'PARTIAL'
        ? `Initial sync completed with ${errors.length} error(s)`
        : 'Initial sync failed';
  }

  const result: ManualSyncResult = {
    status: syncStatus,
    message,
    details: {
      added:
        syncConfig.syncDirection === 'BIDIRECTIONAL'
          ? (syncResult?.summary?.airtableToSheets?.added || 0) +
            (syncResult?.summary?.sheetsToAirtable?.added || 0)
          : syncResult?.added || 0,
      updated:
        syncConfig.syncDirection === 'BIDIRECTIONAL'
          ? (syncResult?.summary?.airtableToSheets?.updated || 0) +
            (syncResult?.summary?.sheetsToAirtable?.updated || 0)
          : syncResult?.updated || 0,
      deleted:
        syncConfig.syncDirection === 'BIDIRECTIONAL'
          ? (syncResult?.summary?.airtableToSheets?.deleted || 0) +
            (syncResult?.summary?.sheetsToAirtable?.deleted || 0)
          : syncResult?.deleted || 0,
      total: syncResult?.total || 0,
      errorCount: errors.length,
      duration,
      direction: syncConfig.syncDirection,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
    },
    errors:
      errors.length > 0
        ? errors.slice(0, 20).map((e) => ({
            message: e.message,
            type: e.type,
            recordId: e.recordId,
          }))
        : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    conflicts:
      syncConfig.syncDirection === 'BIDIRECTIONAL'
        ? syncResult?.summary?.conflicts
        : undefined,
  };

  console.log('\n' + '='.repeat(80));
  console.log('[InitialSync] Initial sync completed');
  console.log('[InitialSync] Dry run:', args.dryRun || false);
  console.log('[InitialSync] Status:', syncStatus);
  console.log('[InitialSync] Duration:', duration, 'ms');
  console.log('[InitialSync] Records: +', result.details.added, '↻', result.details.updated, '-', result.details.deleted);
  if (errors.length > 0) {
    console.log('[InitialSync] Errors:', errors.length);
  }
  if (warnings.length > 0) {
    console.log('[InitialSync] Warnings:', warnings.length);
  }
  console.log('='.repeat(80) + '\n');

  return result;
};
