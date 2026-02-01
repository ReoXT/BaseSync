/**
 * Bidirectional Sync Orchestrator
 * Orchestrates two-way sync between Airtable and Google Sheets with conflict detection and resolution
 *
 * This is the most complex sync function - coordinates multiple sync operations,
 * detects conflicts, applies resolution strategies, and maintains sync state.
 */

import { prisma } from 'wasp/server';
import type { AirtableRecord, AirtableField } from '../airtable/client';
import { listRecords, getBaseSchema, updateRecords, createRecords } from '../airtable/client';
import {
  getSheetData,
  updateSheetData,
  appendRows,
  getSpreadsheet,
  detectLastColumnIndex,
  hideColumn,
  ensureColumnsExist,
  columnNumberToLetter,
  type SheetData,
} from '../google/client';
import { airtableRecordToSheetsRow, sheetsRowToAirtableFields } from './fieldMapper';
import { resolveAllLinkedRecords, preloadTableCache } from './linkedRecordResolver';
import {
  detectConflicts,
  resolveConflicts,
  updateSyncState,
  getSyncState,
  summarizeConflicts,
  type ConflictResolutionStrategy,
  type ConflictInfo,
  type ConflictResolution,
  type ConflictDetectionResult,
} from './conflictDetector';

// ============================================================================
// Types
// ============================================================================

export interface BidirectionalSyncOptions {
  /** Sync configuration ID (for state tracking) */
  syncConfigId: string;
  /** Airtable access token */
  airtableAccessToken: string;
  /** Google Sheets access token */
  sheetsAccessToken: string;
  /** Airtable base ID */
  baseId: string;
  /** Airtable table ID or name */
  tableId: string;
  /** Airtable view ID or name (optional, for exact row order) */
  viewId?: string;
  /** Google Sheets spreadsheet ID */
  spreadsheetId: string;
  /** Google Sheet ID (name or gid) */
  sheetId: string | number;
  /** Conflict resolution strategy */
  conflictResolution: ConflictResolutionStrategy;
  /** Field mappings: { airtableFieldId: columnIndex } */
  fieldMappings?: Record<string, number>;
  /** Column index for Airtable record IDs (default: 0) */
  idColumnIndex?: number;
  /** Column index for last sync timestamp marker (default: last column + 1) */
  syncTimestampColumnIndex?: number;
  /** Whether to include header row (default: true) */
  includeHeader?: boolean;
  /** Whether to resolve linked records (default: true) */
  resolveLinkedRecords?: boolean;
  /** Whether to create missing linked records (default: false) */
  createMissingLinkedRecords?: boolean;
  /** Maximum retries for rate limit errors (default: 3) */
  maxRetries?: number;
  /** Batch size for operations (default: 10 for Airtable, 100 for Sheets) */
  batchSize?: number;
  /** Whether to perform dry run (no writes, just report changes) */
  dryRun?: boolean;
}

export interface BidirectionalSyncResult {
  /** Overall sync status */
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  /** Summary of operations */
  summary: {
    /** Records synced from Airtable to Sheets */
    airtableToSheets: {
      added: number;
      updated: number;
      deleted: number;
    };
    /** Records synced from Sheets to Airtable */
    sheetsToAirtable: {
      added: number;
      updated: number;
      deleted: number;
    };
    /** Conflicts detected and resolved */
    conflicts: {
      total: number;
      airtableWins: number;
      sheetsWins: number;
      deleted: number;
      skipped: number;
    };
  };
  /** Detailed sync phases */
  phases: {
    fetch: PhaseResult;
    conflictDetection: PhaseResult;
    conflictResolution: PhaseResult;
    airtableToSheets: PhaseResult;
    sheetsToAirtable: PhaseResult;
    stateUpdate: PhaseResult;
  };
  /** All errors across all phases */
  errors: SyncError[];
  /** All warnings across all phases */
  warnings: string[];
  /** Execution time in milliseconds */
  duration: number;
  /** Timestamp when sync started */
  startedAt: Date;
  /** Timestamp when sync completed */
  completedAt: Date;
  /** Last sync timestamp for next sync */
  lastSyncAt: Date;
}

export interface PhaseResult {
  /** Phase name */
  phase: string;
  /** Phase status */
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  /** Duration in milliseconds */
  duration: number;
  /** Errors in this phase */
  errors: SyncError[];
  /** Warnings in this phase */
  warnings: string[];
  /** Additional phase-specific data */
  metadata?: Record<string, any>;
}

export interface SyncError {
  /** Phase where error occurred */
  phase: string;
  /** Record ID or row number */
  recordId?: string;
  rowNumber?: number;
  /** Error message */
  message: string;
  /** Error type */
  type: 'FETCH' | 'TRANSFORM' | 'WRITE' | 'CONFLICT' | 'VALIDATION' | 'STATE' | 'RATE_LIMIT' | 'OAUTH' | 'NETWORK' | 'UNKNOWN';
  /** Original error */
  originalError?: any;
  /** Whether error is recoverable */
  recoverable?: boolean;
  /** Retry count for this error */
  retryCount?: number;
}

interface SyncCheckpoint {
  /** Records in Airtable */
  airtableRecords: AirtableRecord[];
  /** Rows in Sheets (excluding header) */
  sheetsRows: any[][];
  /** Table field definitions */
  tableFields: AirtableField[];
  /** Primary field name (for smart matching) */
  primaryFieldName?: string;
  /** Conflict detection results */
  conflictResults?: ConflictDetectionResult;
  /** Conflict resolutions */
  conflictResolutions?: ConflictResolution[];
}

// ============================================================================
// Main Bidirectional Sync Function
// ============================================================================

/**
 * Orchestrates bidirectional sync between Airtable and Google Sheets
 *
 * This function:
 * 1. Fetches current state from both sources
 * 2. Detects changes since last sync
 * 3. Identifies and resolves conflicts
 * 4. Applies changes bidirectionally
 * 5. Updates sync state for next run
 *
 * Uses a checkpoint system to track sync state and enable recovery.
 */
export async function syncBidirectional(
  options: BidirectionalSyncOptions
): Promise<BidirectionalSyncResult> {
  const startTime = Date.now();
  const result: BidirectionalSyncResult = {
    status: 'SUCCESS',
    summary: {
      airtableToSheets: { added: 0, updated: 0, deleted: 0 },
      sheetsToAirtable: { added: 0, updated: 0, deleted: 0 },
      conflicts: { total: 0, airtableWins: 0, sheetsWins: 0, deleted: 0, skipped: 0 },
    },
    phases: {
      fetch: createPhaseResult('fetch'),
      conflictDetection: createPhaseResult('conflictDetection'),
      conflictResolution: createPhaseResult('conflictResolution'),
      airtableToSheets: createPhaseResult('airtableToSheets'),
      sheetsToAirtable: createPhaseResult('sheetsToAirtable'),
      stateUpdate: createPhaseResult('stateUpdate'),
    },
    errors: [],
    warnings: [],
    duration: 0,
    startedAt: new Date(),
    completedAt: new Date(),
    lastSyncAt: new Date(),
  };

  // Set defaults
  const {
    syncConfigId,
    airtableAccessToken,
    sheetsAccessToken,
    baseId,
    tableId,
    viewId, // CRITICAL: Extract viewId for Airtable record ordering
    spreadsheetId,
    sheetId,
    conflictResolution,
    fieldMappings,
    idColumnIndex = 0,
    syncTimestampColumnIndex,
    includeHeader = true,
    resolveLinkedRecords: shouldResolveLinkedRecords = true,
    createMissingLinkedRecords = false,
    maxRetries = 3,
    batchSize = 10,
    dryRun = false,
  } = options;

  const checkpoint: SyncCheckpoint = {
    airtableRecords: [],
    sheetsRows: [],
    tableFields: [],
  };

  // Track the actual ID column index (will be set after detecting last column)
  let actualIdColumnIndex = idColumnIndex;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`[BidirectionalSync] Starting bidirectional sync for config: ${syncConfigId}`);
  console.log(`[BidirectionalSync] Conflict resolution strategy: ${conflictResolution}`);
  console.log(`[BidirectionalSync] Dry run: ${dryRun}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // ========================================================================
    // PHASE 1: FETCH CURRENT STATE FROM BOTH SOURCES
    // ========================================================================
    const fetchPhase = await executePhase('fetch', async () => {
      console.log(`[Phase 1: Fetch] Fetching current state from Airtable and Sheets...`);

      // 1.1: Fetch table schema FIRST (needed for primary field fallback ordering)
      console.log(`[Phase 1: Fetch] Fetching table schema...`);
      const schema = await retryWithBackoff(
        () => getBaseSchema(airtableAccessToken, baseId),
        maxRetries,
        'fetch table schema'
      );

      const table = schema.tables.find((t) => t.id === tableId || t.name === tableId);
      if (!table) {
        throw new Error(`Table ${tableId} not found in base schema`);
      }

      checkpoint.tableFields = table.fields;

      // Get primary field name for smart matching (when no record IDs available)
      const primaryField = table.fields.find((f) => f.id === table.primaryFieldId);
      if (primaryField) {
        checkpoint.primaryFieldName = primaryField.name;
        console.log(`[Phase 1: Fetch] Primary field for matching: "${checkpoint.primaryFieldName}"`);
      }

      // 1.2: Fetch Airtable records
      // CRITICAL: Use viewId if provided to ensure records are fetched in the exact order
      // shown in Airtable's UI. Without this, records come in an arbitrary order which
      // causes the data in Sheets to be in a different order than Airtable.
      console.log(`[Phase 1: Fetch] Fetching Airtable records...`);

      // Build fetch options for consistent ordering
      // Priority: 1) View (exact UI order), 2) Primary field sort (alphabetical), 3) Default
      const listRecordsOptions: { view?: string; sort?: Array<{ field: string; direction: 'asc' | 'desc' }> } = {};

      if (viewId) {
        // Use view for EXACT order matching Airtable UI
        listRecordsOptions.view = viewId;
        console.log(`[Phase 1: Fetch] Using view "${viewId}" for exact row ordering`);
      } else if (checkpoint.primaryFieldName) {
        // Fallback to sorting by primary field for consistent alphabetical order
        listRecordsOptions.sort = [{ field: checkpoint.primaryFieldName, direction: 'asc' }];
        console.log(`[Phase 1: Fetch] Sorting by primary field "${checkpoint.primaryFieldName}" for consistent order`);
      } else {
        console.warn(`[Phase 1: Fetch] No view or primary field - order may be unpredictable`);
      }

      checkpoint.airtableRecords = await retryWithBackoff(
        () => listRecords(airtableAccessToken, baseId, tableId, listRecordsOptions),
        maxRetries,
        'fetch Airtable records'
      );
      console.log(`[Phase 1: Fetch] ✓ Fetched ${checkpoint.airtableRecords.length} Airtable records`);

      // Apply field mappings if provided
      if (fieldMappings && Object.keys(fieldMappings).length > 0) {
        const mappedFieldIds = Object.keys(fieldMappings);
        checkpoint.tableFields = checkpoint.tableFields.filter((f) =>
          mappedFieldIds.includes(f.id)
        );
        checkpoint.tableFields.sort(
          (a, b) => (fieldMappings[a.id] || 0) - (fieldMappings[b.id] || 0)
        );
      }

      console.log(`[Phase 1: Fetch] ✓ Found ${checkpoint.tableFields.length} fields`);

      // 1.3: Resolve linked records in Airtable data
      if (shouldResolveLinkedRecords && checkpoint.airtableRecords.length > 0) {
        console.log(`[Phase 1: Fetch] Resolving linked records...`);
        const resolved = await resolveAllLinkedRecords(
          airtableAccessToken,
          baseId,
          tableId,
          checkpoint.airtableRecords,
          { strictMode: false }
        );
        checkpoint.airtableRecords = resolved.records;

        if (resolved.warnings.length > 0) {
          return { warnings: resolved.warnings };
        }

        console.log(`[Phase 1: Fetch] ✓ Linked records resolved`);
      }

      // 1.4: Fetch Sheets data
      console.log(`[Phase 1: Fetch] Fetching Sheets data...`);
      const sheetData = await retryWithBackoff(
        () => getSheetData(sheetsAccessToken, spreadsheetId, sheetId),
        maxRetries,
        'fetch Sheets data'
      );

      checkpoint.sheetsRows = sheetData.values || [];

      // CRITICAL: ALWAYS use a fixed far-right column for IDs to avoid shifting user's visible columns
      // We use column AA (index 26) by default - far enough that it won't interfere with typical data
      // This applies to EVERY sync, regardless of whether data exists or not
      if (idColumnIndex === 0) {
        const FIXED_ID_COLUMN_INDEX = 26; // Column AA (A=0, B=1, ..., Z=25, AA=26)
        actualIdColumnIndex = FIXED_ID_COLUMN_INDEX;

        const columnLetter = columnNumberToLetter(actualIdColumnIndex + 1);

        console.log(
          `[Phase 1: Fetch] Using fixed column ${columnLetter} (index ${actualIdColumnIndex}) for record IDs (will be hidden)`
        );
      }

      // Skip header row if configured
      if (includeHeader && checkpoint.sheetsRows.length > 0) {
        checkpoint.sheetsRows = checkpoint.sheetsRows.slice(1);
      }

      console.log(`[Phase 1: Fetch] ✓ Fetched ${checkpoint.sheetsRows.length} Sheets rows`);

      return {
        metadata: {
          airtableRecords: checkpoint.airtableRecords.length,
          sheetsRows: checkpoint.sheetsRows.length,
          fields: checkpoint.tableFields.length,
        },
      };
    });

    result.phases.fetch = fetchPhase;
    if (fetchPhase.status === 'FAILED') {
      result.status = 'FAILED';
      return finalizeSyncResult(result, startTime);
    }

    // ========================================================================
    // PHASE 2: DETECT CHANGES AND CONFLICTS
    // ========================================================================
    const conflictDetectionPhase = await executePhase('conflictDetection', async () => {
      console.log(`\n[Phase 2: Conflict Detection] Detecting changes and conflicts...`);

      checkpoint.conflictResults = detectConflicts(
        checkpoint.airtableRecords,
        checkpoint.sheetsRows,
        syncConfigId,
        actualIdColumnIndex
      );

      const summary = summarizeConflicts(checkpoint.conflictResults);
      console.log(`[Phase 2: Conflict Detection] ${summary.summary}`);

      if (checkpoint.conflictResults.conflicts.length > 0) {
        console.log(
          `[Phase 2: Conflict Detection] ⚠️  ${checkpoint.conflictResults.conflicts.length} conflicts detected`
        );
      }

      return {
        metadata: {
          conflicts: checkpoint.conflictResults.conflicts.length,
          airtableOnlyChanges: checkpoint.conflictResults.airtableOnlyChanges.length,
          sheetsOnlyChanges: checkpoint.conflictResults.sheetsOnlyChanges.length,
          newInAirtable: checkpoint.conflictResults.newInAirtable.length,
          newInSheets: checkpoint.conflictResults.newInSheets.length,
          noChanges: checkpoint.conflictResults.noChanges.length,
        },
      };
    });

    result.phases.conflictDetection = conflictDetectionPhase;

    // ========================================================================
    // PHASE 3: RESOLVE CONFLICTS
    // ========================================================================
    if (checkpoint.conflictResults && checkpoint.conflictResults.conflicts.length > 0) {
      const conflictResolutionPhase = await executePhase('conflictResolution', async () => {
        console.log(
          `\n[Phase 3: Conflict Resolution] Resolving ${checkpoint.conflictResults!.conflicts.length} conflicts...`
        );
        console.log(`[Phase 3: Conflict Resolution] Strategy: ${conflictResolution}`);

        checkpoint.conflictResolutions = resolveConflicts(
          checkpoint.conflictResults!.conflicts,
          conflictResolution
        );

        // Count resolutions by type
        const resolutionCounts = {
          USE_AIRTABLE: 0,
          USE_SHEETS: 0,
          DELETE: 0,
          SKIP: 0,
        };

        checkpoint.conflictResolutions.forEach((resolution) => {
          resolutionCounts[resolution.action]++;
          console.log(
            `[Phase 3: Conflict Resolution]   ${resolution.recordId}: ${resolution.action} (${resolution.reason})`
          );
        });

        result.summary.conflicts.total = checkpoint.conflictResolutions.length;
        result.summary.conflicts.airtableWins = resolutionCounts.USE_AIRTABLE;
        result.summary.conflicts.sheetsWins = resolutionCounts.USE_SHEETS;
        result.summary.conflicts.deleted = resolutionCounts.DELETE;
        result.summary.conflicts.skipped = resolutionCounts.SKIP;

        return { metadata: resolutionCounts };
      });

      result.phases.conflictResolution = conflictResolutionPhase;
    } else {
      result.phases.conflictResolution.status = 'SKIPPED';
      console.log(`\n[Phase 3: Conflict Resolution] No conflicts to resolve`);
    }

    // ========================================================================
    // PHASE 4: PUSH AIRTABLE CHANGES TO SHEETS
    // ========================================================================
    const airtableToSheetsPhase = await executePhase('airtableToSheets', async () => {
      console.log(`\n[Phase 4: Airtable → Sheets] Syncing Airtable changes to Sheets...`);

      if (!checkpoint.conflictResults) {
        throw new Error('Conflict results not available');
      }

      // Determine which records to sync from Airtable
      const recordsToSync = new Set<string>([
        ...checkpoint.conflictResults.airtableOnlyChanges,
        ...checkpoint.conflictResults.newInAirtable,
      ]);

      // Add conflict resolutions that favor Airtable
      if (checkpoint.conflictResolutions) {
        checkpoint.conflictResolutions.forEach((resolution) => {
          if (resolution.action === 'USE_AIRTABLE') {
            recordsToSync.add(resolution.recordId);
          }
        });
      }

      if (recordsToSync.size === 0) {
        console.log(`[Phase 4: Airtable → Sheets] No changes to sync`);
        return { metadata: { synced: 0 } };
      }

      console.log(`[Phase 4: Airtable → Sheets] Syncing ${recordsToSync.size} records...`);

      if (dryRun) {
        console.log(`[Phase 4: Airtable → Sheets] DRY RUN - Would sync ${recordsToSync.size} records`);
        return { metadata: { synced: recordsToSync.size, dryRun: true } };
      }

      // Transform and update Sheets
      const recordsToUpdate = checkpoint.airtableRecords.filter((r) => recordsToSync.has(r.id));

      let added = 0;
      let updated = 0;
      const phaseErrors: SyncError[] = [];

      // Track which rows need record IDs written to column AA
      const rowsNeedingRecordIds: Array<{ rowNumber: number; recordId: string }> = [];

      for (const record of recordsToUpdate) {
        try {
          const { row } = await airtableRecordToSheetsRow(record, checkpoint.tableFields, {
            accessToken: airtableAccessToken,
            baseId,
            tableId,
          });

          // Find if row exists in Sheets
          const existingRowIndex = checkpoint.sheetsRows.findIndex(
            (r) => r[actualIdColumnIndex] === record.id
          );

          if (existingRowIndex >= 0) {
            // Update existing row with just the data (no record ID in the array)
            const rowNumber = existingRowIndex + (includeHeader ? 2 : 1);
            await retryWithBackoff(
              () =>
                updateSheetData(sheetsAccessToken, spreadsheetId, sheetId, `A${rowNumber}`, [
                  row,
                ]),
              maxRetries,
              `update row ${rowNumber}`,
              { recordId: record.id, phase: 'airtableToSheets' }
            );
            updated++;
            rowsNeedingRecordIds.push({ rowNumber, recordId: record.id });
          } else {
            // Append new row with just the data (no record ID in the array)
            await retryWithBackoff(
              () => appendRows(sheetsAccessToken, spreadsheetId, sheetId, [row]),
              maxRetries,
              `append row for ${record.id}`,
              { recordId: record.id, phase: 'airtableToSheets' }
            );
            added++;
            // Calculate row number for newly appended row
            const newRowNumber = checkpoint.sheetsRows.length + added + (includeHeader ? 1 : 0);
            rowsNeedingRecordIds.push({ rowNumber: newRowNumber, recordId: record.id });
          }
        } catch (error) {
          // Log error but continue with other records
          const syncError = classifyError(error, 'airtableToSheets', record.id);
          phaseErrors.push(syncError);
          console.error(
            `[Phase 4: Airtable → Sheets] ✗ Failed to sync record ${record.id}: ${syncError.message}`
          );

          // If it's an OAuth error, stop the entire sync
          if (syncError.type === 'OAUTH') {
            throw error;
          }
          // Otherwise, continue with next record
        }
      }

      result.summary.airtableToSheets.added = added;
      result.summary.airtableToSheets.updated = updated;

      const totalAttempted = recordsToSync.size;
      const totalSuccessful = added + updated;
      const totalFailed = phaseErrors.length;

      if (totalFailed > 0) {
        console.log(
          `[Phase 4: Airtable → Sheets] ⚠️  Synced ${totalSuccessful}/${totalAttempted} records (${totalFailed} failed)`
        );
      } else {
        console.log(
          `[Phase 4: Airtable → Sheets] ✓ Synced ${totalSuccessful} records (${added} added, ${updated} updated)`
        );
      }

      // After syncing Airtable → Sheets, write record IDs to column AA and hide it
      if ((added > 0 || updated > 0) && !dryRun) {
        try {
          const columnLetter = columnNumberToLetter(actualIdColumnIndex + 1);

          // STEP 1: Ensure column AA exists
          // This prevents errors when the sheet only has columns A-Z (0-25)
          const requiredColumnCount = actualIdColumnIndex + 1; // Need at least 27 columns for column AA (index 26)
          console.log(
            `[Phase 4: Airtable → Sheets] Ensuring column ${columnLetter} exists (need ${requiredColumnCount} columns)...`
          );
          await ensureColumnsExist(sheetsAccessToken, spreadsheetId, sheetId, requiredColumnCount);

          // STEP 2: Write record IDs to column AA
          console.log(
            `[Phase 4: Airtable → Sheets] Writing ${rowsNeedingRecordIds.length} record IDs to column ${columnLetter}...`
          );
          for (const { rowNumber, recordId } of rowsNeedingRecordIds) {
            const range = `${columnLetter}${rowNumber}`;
            try {
              await updateSheetData(sheetsAccessToken, spreadsheetId, sheetId, range, [[recordId]]);
            } catch (error) {
              console.warn(
                `[Phase 4: Airtable → Sheets] Failed to write record ID to ${range}:`,
                error
              );
            }
          }
          console.log(`[Phase 4: Airtable → Sheets] ✓ Wrote record IDs to column ${columnLetter}`);

          // STEP 3: Hide column AA to keep sheets clean for users
          console.log(`[Phase 4: Airtable → Sheets] Hiding ID column ${columnLetter}...`);
          await hideColumn(sheetsAccessToken, spreadsheetId, sheetId, actualIdColumnIndex);
          console.log(
            `[Phase 4: Airtable → Sheets] ✓ Hidden column ${columnLetter} (users won't see record IDs)`
          );
        } catch (error) {
          console.warn('[Phase 4: Airtable → Sheets] Failed to write/hide ID column:', error);
        }
      }

      return {
        metadata: { added, updated, failed: totalFailed },
        errors: phaseErrors,
      };
    });

    result.phases.airtableToSheets = airtableToSheetsPhase;

    // ========================================================================
    // PHASE 5: PUSH SHEETS CHANGES TO AIRTABLE
    // ========================================================================
    const sheetsToAirtablePhase = await executePhase('sheetsToAirtable', async () => {
      console.log(`\n[Phase 5: Sheets → Airtable] Syncing Sheets changes to Airtable...`);

      if (!checkpoint.conflictResults) {
        throw new Error('Conflict results not available');
      }

      // Determine which rows to sync from Sheets
      const rowsToSync = new Set<number>();

      // Add rows that changed only in Sheets
      for (const id of checkpoint.conflictResults.sheetsOnlyChanges) {
        const rowIndex = checkpoint.sheetsRows.findIndex((r) => r[actualIdColumnIndex] === id);
        if (rowIndex >= 0) {
          rowsToSync.add(rowIndex);
        }
      }

      // Add new rows in Sheets
      // CRITICAL FIX: newInSheets can contain:
      // 1. Row indices (when rows don't have record IDs)
      // 2. Parsed from `row_X` identifiers
      for (const item of checkpoint.conflictResults.newInSheets) {
        // If it's a valid row index, use it directly
        if (typeof item === 'number' && item >= 0 && item < checkpoint.sheetsRows.length) {
          rowsToSync.add(item);
        }
      }

      // Add conflict resolutions that favor Sheets
      if (checkpoint.conflictResolutions) {
        checkpoint.conflictResolutions.forEach((resolution) => {
          if (resolution.action === 'USE_SHEETS') {
            const rowIndex = checkpoint.sheetsRows.findIndex(
              (r) => r[actualIdColumnIndex] === resolution.recordId
            );
            if (rowIndex >= 0) {
              rowsToSync.add(rowIndex);
            }
          }
        });
      }

      // Filter out invalid indices
      const validRows = Array.from(rowsToSync).filter((i) => i >= 0 && i < checkpoint.sheetsRows.length);

      if (validRows.length === 0) {
        console.log(`[Phase 5: Sheets → Airtable] No changes to sync`);
        return { metadata: { synced: 0 } };
      }

      console.log(`[Phase 5: Sheets → Airtable] Syncing ${validRows.length} rows...`);

      if (dryRun) {
        console.log(`[Phase 5: Sheets → Airtable] DRY RUN - Would sync ${validRows.length} rows`);
        return { metadata: { synced: validRows.length, dryRun: true } };
      }

      // Preload linked record caches
      if (shouldResolveLinkedRecords) {
        const linkedFields = checkpoint.tableFields.filter((f) => f.type === 'multipleRecordLinks');
        for (const field of linkedFields) {
          const linkedTableId = field.options?.linkedTableId;
          if (linkedTableId) {
            await preloadTableCache(airtableAccessToken, baseId, linkedTableId);
          }
        }
      }

      let added = 0;
      let updated = 0;
      const phaseErrors: SyncError[] = [];
      const newRecordIdUpdates: Array<{ row: number; recordId: string }> = [];

      // Process rows in batches of 10 (Airtable limit)
      const batchedRows = chunkArray(validRows, Math.min(batchSize, 10));

      for (const batchIndices of batchedRows) {
        const recordsToCreate: any[] = [];
        const recordsToUpdate: any[] = [];
        const rowMetadata: Map<number, { recordId?: string; rowIndex: number }> = new Map();

        for (const rowIndex of batchIndices) {
          try {
            const row = checkpoint.sheetsRows[rowIndex];
            const recordId = row[actualIdColumnIndex] ? String(row[actualIdColumnIndex]).trim() : undefined;

            // Remove ID column from data
            const dataRow = [...row];
            dataRow.splice(actualIdColumnIndex, 1);

            // Transform to Airtable fields
            const { fields } = await sheetsRowToAirtableFields(dataRow, checkpoint.tableFields, {
              accessToken: airtableAccessToken,
              baseId,
              tableId,
            });

            let matchedRecord: AirtableRecord | undefined;

            // Strategy 1: Match by record ID (if available)
            if (recordId) {
              matchedRecord = checkpoint.airtableRecords.find((r) => r.id === recordId);
            }

            // Strategy 2: Match by primary field (fallback when no ID)
            if (!matchedRecord && !recordId && checkpoint.primaryFieldName && fields[checkpoint.primaryFieldName]) {
              const primaryValue = String(fields[checkpoint.primaryFieldName]).trim().toLowerCase();
              if (primaryValue) {
                matchedRecord = checkpoint.airtableRecords.find((r) => {
                  const recordPrimaryValue = r.fields[checkpoint.primaryFieldName!];
                  return recordPrimaryValue &&
                         String(recordPrimaryValue).trim().toLowerCase() === primaryValue;
                });

                if (matchedRecord) {
                  console.log(
                    `[Phase 5: Sheets → Airtable] Matched row ${rowIndex} to existing record ${matchedRecord.id} by primary field "${checkpoint.primaryFieldName}"`
                  );
                }
              }
            }

            if (matchedRecord) {
              // Update existing record (matched by ID or primary field)
              const updateIndex = recordsToUpdate.length;
              recordsToUpdate.push({ id: matchedRecord.id, fields });
              rowMetadata.set(updateIndex, { recordId: matchedRecord.id, rowIndex });
            } else {
              // Create new record
              const createIndex = recordsToCreate.length;
              recordsToCreate.push({ fields });
              rowMetadata.set(createIndex, { rowIndex });
            }
          } catch (error) {
            // Log transformation error but continue with other rows
            const syncError = classifyError(error, 'sheetsToAirtable', undefined, rowIndex);
            phaseErrors.push(syncError);
            console.error(
              `[Phase 5: Sheets → Airtable] ✗ Failed to transform row ${rowIndex}: ${syncError.message}`
            );
          }
        }

        // Execute batch operations with error handling
        if (recordsToCreate.length > 0) {
          try {
            const created = await retryWithBackoff(
              () => createRecords(airtableAccessToken, baseId, tableId, recordsToCreate),
              maxRetries,
              'create records batch',
              { phase: 'sheetsToAirtable' }
            );
            added += created.length;

            // Track new record IDs to write back to Sheets
            for (let i = 0; i < created.length; i++) {
              const createdRecord = created[i];
              const metadata = Array.from(rowMetadata.values())[i];
              if (metadata && !metadata.recordId && createdRecord.id) {
                // This was a new record - track its ID and row number
                const sheetRowNumber = metadata.rowIndex + (includeHeader ? 2 : 1);
                newRecordIdUpdates.push({ row: sheetRowNumber, recordId: createdRecord.id });
              }
            }
          } catch (error) {
            // Batch create failed - log error for all records in batch
            const syncError = classifyError(error, 'sheetsToAirtable');
            phaseErrors.push(syncError);
            console.error(
              `[Phase 5: Sheets → Airtable] ✗ Failed to create ${recordsToCreate.length} records: ${syncError.message}`
            );

            // If it's an OAuth error, stop the entire sync
            if (syncError.type === 'OAUTH') {
              throw error;
            }
          }
        }

        if (recordsToUpdate.length > 0) {
          try {
            const updated_batch = await retryWithBackoff(
              () => updateRecords(airtableAccessToken, baseId, tableId, recordsToUpdate),
              maxRetries,
              'update records batch',
              { phase: 'sheetsToAirtable' }
            );
            updated += updated_batch.length;
          } catch (error) {
            // Batch update failed - log error for all records in batch
            const syncError = classifyError(error, 'sheetsToAirtable');
            phaseErrors.push(syncError);
            console.error(
              `[Phase 5: Sheets → Airtable] ✗ Failed to update ${recordsToUpdate.length} records: ${syncError.message}`
            );

            // If it's an OAuth error, stop the entire sync
            if (syncError.type === 'OAUTH') {
              throw error;
            }
          }
        }
      }

      result.summary.sheetsToAirtable.added = added;
      result.summary.sheetsToAirtable.updated = updated;

      const totalAttempted = validRows.length;
      const totalSuccessful = added + updated;
      const totalFailed = phaseErrors.length;

      if (totalFailed > 0) {
        console.log(
          `[Phase 5: Sheets → Airtable] ⚠️  Synced ${totalSuccessful}/${totalAttempted} records (${totalFailed} failed)`
        );
      } else {
        console.log(
          `[Phase 5: Sheets → Airtable] ✓ Synced ${totalSuccessful} records (${added} added, ${updated} updated)`
        );
      }

      // Write new record IDs back to Google Sheets to prevent duplicates on next sync
      if (newRecordIdUpdates.length > 0 && !dryRun) {
        console.log(
          `[Phase 5: Sheets → Airtable] Writing ${newRecordIdUpdates.length} new record IDs back to Sheets...`
        );

        try {
          const columnLetter = columnNumberToLetter(actualIdColumnIndex + 1);

          // STEP 1: Ensure column AA exists before writing to it
          // This prevents errors when the sheet only has columns A-Z (0-25)
          const requiredColumnCount = actualIdColumnIndex + 1; // Need at least 27 columns for column AA (index 26)
          console.log(
            `[Phase 5: Sheets → Airtable] Ensuring column ${columnLetter} exists (need ${requiredColumnCount} columns)...`
          );
          await ensureColumnsExist(sheetsAccessToken, spreadsheetId, sheetId, requiredColumnCount);

          // STEP 2: Write record IDs to column AA
          // Sort by row number
          newRecordIdUpdates.sort((a, b) => a.row - b.row);

          // Update each row's ID column
          const updatePromises: Promise<any>[] = [];

          for (const update of newRecordIdUpdates) {
            const range = `${columnLetter}${update.row}`;

            updatePromises.push(
              updateSheetData(
                sheetsAccessToken,
                spreadsheetId,
                sheetId,
                range,
                [[update.recordId]]
              ).catch((error) => {
                console.warn(
                  `[Phase 5: Sheets → Airtable] Failed to write ID for row ${update.row}:`,
                  error
                );
              })
            );

            // Batch updates to avoid rate limits
            if (updatePromises.length >= 10) {
              await Promise.all(updatePromises);
              updatePromises.length = 0;
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }

          // Process remaining updates
          if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
          }

          console.log(
            `[Phase 5: Sheets → Airtable] ✓ Successfully wrote ${newRecordIdUpdates.length} record IDs to column ${columnLetter}`
          );

          // STEP 3: Hide column AA to keep sheets clean for users
          try {
            await hideColumn(sheetsAccessToken, spreadsheetId, sheetId, actualIdColumnIndex);
            console.log(
              `[Phase 5: Sheets → Airtable] ✓ Hidden column ${columnLetter} (users won't see record IDs)`
            );
          } catch (error) {
            console.warn('[Phase 5: Sheets → Airtable] Failed to hide ID column:', error);
          }
        } catch (error) {
          console.error('[Phase 5: Sheets → Airtable] Error writing IDs back to Sheets:', error);
        }
      }

      return {
        metadata: { added, updated, failed: totalFailed },
        errors: phaseErrors,
      };
    });

    result.phases.sheetsToAirtable = sheetsToAirtablePhase;

    // ========================================================================
    // PHASE 6: UPDATE SYNC STATE
    // ========================================================================
    const stateUpdatePhase = await executePhase('stateUpdate', async () => {
      console.log(`\n[Phase 6: State Update] Updating sync state...`);

      if (dryRun) {
        console.log(`[Phase 6: State Update] DRY RUN - Would update sync state`);
        return { metadata: { dryRun: true } };
      }

      // Re-fetch current state to update sync checkpoint
      // CRITICAL: Use viewId or primary field to maintain consistent ordering for state tracking
      const stateListOptions: { view?: string; sort?: Array<{ field: string; direction: 'asc' | 'desc' }> } = {};
      if (viewId) {
        stateListOptions.view = viewId;
      } else if (checkpoint.primaryFieldName) {
        stateListOptions.sort = [{ field: checkpoint.primaryFieldName, direction: 'asc' }];
      }
      const updatedRecords = await listRecords(airtableAccessToken, baseId, tableId, stateListOptions);
      const updatedSheetData = await getSheetData(sheetsAccessToken, spreadsheetId, sheetId);
      const updatedRows = (updatedSheetData.values || []).slice(includeHeader ? 1 : 0);

      updateSyncState(syncConfigId, updatedRecords, updatedRows, actualIdColumnIndex);

      result.lastSyncAt = new Date();

      console.log(`[Phase 6: State Update] ✓ Sync state updated`);

      return { metadata: { timestamp: result.lastSyncAt.toISOString() } };
    });

    result.phases.stateUpdate = stateUpdatePhase;

    // ========================================================================
    // FINALIZE RESULT
    // ========================================================================

    // Determine overall status
    const hasErrors = Object.values(result.phases).some((p) => p.errors.length > 0);
    const hasCriticalFailure = Object.values(result.phases).some((p) => p.status === 'FAILED');

    if (hasCriticalFailure) {
      result.status = 'FAILED';
    } else if (hasErrors) {
      result.status = 'PARTIAL';
    } else {
      result.status = 'SUCCESS';
    }

    // Aggregate errors and warnings
    Object.values(result.phases).forEach((phase) => {
      result.errors.push(...phase.errors);
      result.warnings.push(...phase.warnings);
    });

    console.log(`\n${'='.repeat(80)}`);
    console.log(`[BidirectionalSync] Sync complete - Status: ${result.status}`);
    console.log(
      `[BidirectionalSync] Airtable → Sheets: ${result.summary.airtableToSheets.added} added, ${result.summary.airtableToSheets.updated} updated`
    );
    console.log(
      `[BidirectionalSync] Sheets → Airtable: ${result.summary.sheetsToAirtable.added} added, ${result.summary.sheetsToAirtable.updated} updated`
    );
    console.log(
      `[BidirectionalSync] Conflicts: ${result.summary.conflicts.total} resolved`
    );
    console.log(`[BidirectionalSync] Errors: ${result.errors.length}, Warnings: ${result.warnings.length}`);
    console.log(`${'='.repeat(80)}\n`);

    const finalResult = finalizeSyncResult(result, startTime);

    // Save results to database (including error info for dashboard)
    await saveSyncResults(syncConfigId, finalResult);

    return finalResult;
  } catch (error) {
    console.error(`\n[BidirectionalSync] Fatal error:`, error);
    console.error(`[BidirectionalSync] Error type:`, error?.constructor?.name);
    console.error(`[BidirectionalSync] Error message:`, error instanceof Error ? error.message : String(error));
    console.error(`[BidirectionalSync] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');

    // Log full error object for debugging
    if (error && typeof error === 'object') {
      console.error(`[BidirectionalSync] Error details:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }

    result.status = 'FAILED';

    // Classify the fatal error
    const syncError = classifyError(error, 'sync');
    result.errors.push(syncError);

    const finalResult = finalizeSyncResult(result, startTime);

    // Save results to database (including error info for dashboard)
    await saveSyncResults(syncConfigId, finalResult);

    return finalResult;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a new phase result
 */
function createPhaseResult(phase: string): PhaseResult {
  return {
    phase,
    status: 'SUCCESS',
    duration: 0,
    errors: [],
    warnings: [],
  };
}

/**
 * Executes a sync phase with error handling and timing
 */
async function executePhase(
  phaseName: string,
  fn: () => Promise<{ errors?: SyncError[]; warnings?: string[]; metadata?: any }>
): Promise<PhaseResult> {
  const startTime = Date.now();
  const result = createPhaseResult(phaseName);

  try {
    const phaseResult = await fn();

    if (phaseResult.errors && phaseResult.errors.length > 0) {
      result.errors.push(...phaseResult.errors);
      result.status = 'FAILED';
    }

    if (phaseResult.warnings && phaseResult.warnings.length > 0) {
      result.warnings.push(...phaseResult.warnings);
    }

    if (phaseResult.metadata) {
      result.metadata = phaseResult.metadata;
    }
  } catch (error) {
    result.status = 'FAILED';
    result.errors.push({
      phase: phaseName,
      type: 'UNKNOWN',
      message: `Phase failed: ${error instanceof Error ? error.message : String(error)}`,
      originalError: error,
    });
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Classifies an error into a SyncError with appropriate type and metadata
 */
function classifyError(
  error: unknown,
  phase: string,
  recordId?: string,
  rowNumber?: number
): SyncError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Detect OAuth/authentication errors
  const oauthPatterns = [
    'invalid_grant',
    'refresh token',
    'revoked',
    'unauthorized',
    'invalid_client',
    'please reconnect',
    'needs reauthorization',
    '401',
    'authentication failed',
    'token expired',
  ];

  if (oauthPatterns.some((pattern) => lowerMessage.includes(pattern))) {
    return {
      phase,
      recordId,
      rowNumber,
      message: 'OAuth token invalid or expired. Please reconnect your account.',
      type: 'OAUTH',
      originalError: error,
      recoverable: false,
    };
  }

  // Detect rate limit errors
  const rateLimitPatterns = ['rate limit', 'quota', '429', 'too many requests'];

  if (rateLimitPatterns.some((pattern) => lowerMessage.includes(pattern))) {
    return {
      phase,
      recordId,
      rowNumber,
      message: 'API rate limit exceeded. Will retry with backoff.',
      type: 'RATE_LIMIT',
      originalError: error,
      recoverable: true,
    };
  }

  // Detect network errors
  const networkPatterns = [
    'network',
    'econnrefused',
    'enotfound',
    'etimedout',
    'fetch failed',
    'socket',
    'connection',
    'dns',
  ];

  if (networkPatterns.some((pattern) => lowerMessage.includes(pattern))) {
    return {
      phase,
      recordId,
      rowNumber,
      message: 'Network error. Will retry.',
      type: 'NETWORK',
      originalError: error,
      recoverable: true,
    };
  }

  // Detect validation errors
  const validationPatterns = [
    'invalid',
    'validation',
    'required field',
    'type mismatch',
    'schema',
    'format',
  ];

  if (validationPatterns.some((pattern) => lowerMessage.includes(pattern))) {
    return {
      phase,
      recordId,
      rowNumber,
      message: errorMessage,
      type: 'VALIDATION',
      originalError: error,
      recoverable: false,
    };
  }

  // Default to unknown error
  return {
    phase,
    recordId,
    rowNumber,
    message: errorMessage,
    type: 'UNKNOWN',
    originalError: error,
    recoverable: true,
  };
}

/**
 * Retries a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  operation: string,
  context?: { recordId?: string; rowNumber?: number; phase?: string }
): Promise<T> {
  let lastError: Error | undefined;
  let retryCount = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retryCount = attempt;

      // Classify the error
      const syncError = classifyError(
        error,
        context?.phase || 'retry',
        context?.recordId,
        context?.rowNumber
      );

      // Don't retry OAuth errors - these need user intervention
      if (syncError.type === 'OAUTH') {
        console.error(`[RetryBackoff] ${operation} failed with OAuth error - stopping retry`);
        throw lastError;
      }

      // Don't retry validation errors - data is bad
      if (syncError.type === 'VALIDATION') {
        console.error(`[RetryBackoff] ${operation} failed with validation error - stopping retry`);
        throw lastError;
      }

      // Check if we should retry
      if (attempt === maxRetries) break;

      // Only retry rate limit and network errors after first attempt
      const shouldRetry = syncError.type === 'RATE_LIMIT' || syncError.type === 'NETWORK';

      if (!shouldRetry && attempt > 0) {
        console.warn(`[RetryBackoff] ${operation} failed with non-retryable error type: ${syncError.type}`);
        break;
      }

      // Calculate delay with exponential backoff
      const baseDelay = syncError.type === 'RATE_LIMIT' ? 2000 : 1000;
      const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000) + Math.random() * 1000;

      console.warn(
        `[RetryBackoff] ${operation} failed (attempt ${attempt + 1}/${maxRetries + 1}) - ${syncError.type}, ` +
          `retrying in ${Math.round(delay)}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Chunks an array into smaller arrays
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Finalizes the sync result
 */
function finalizeSyncResult(
  result: BidirectionalSyncResult,
  startTime: number
): BidirectionalSyncResult {
  result.duration = Date.now() - startTime;
  result.completedAt = new Date();
  return result;
}

/**
 * Marks OAuth connections as needing reauth if OAuth errors occurred
 */
async function handleOAuthErrors(syncConfigId: string, errors: SyncError[]): Promise<void> {
  const oauthErrors = errors.filter((e) => e.type === 'OAUTH');
  if (oauthErrors.length === 0) return;

  try {
    // Get the sync config to find the user
    const syncConfig = await prisma.syncConfig.findUnique({
      where: { id: syncConfigId },
      select: { userId: true },
    });

    if (!syncConfig) {
      console.error(`[HandleOAuthErrors] SyncConfig ${syncConfigId} not found`);
      return;
    }

    const userId = syncConfig.userId;
    const now = new Date();

    // Mark both connections as needing reauth (we don't know which one failed)
    // In a real scenario, we'd track which API call failed
    const errorMessage = 'OAuth token invalid or expired during sync. Please reconnect.';

    // Update Airtable connection
    const airtableConn = await prisma.airtableConnection.findUnique({
      where: { userId },
    });

    if (airtableConn) {
      await prisma.airtableConnection.update({
        where: { userId },
        data: {
          needsReauth: true,
          lastRefreshError: errorMessage,
          lastRefreshAttempt: now,
        },
      });
      console.warn(`[HandleOAuthErrors] Marked Airtable connection for user ${userId} as needing reauth`);
    }

    // Update Google Sheets connection
    const googleConn = await prisma.googleSheetsConnection.findUnique({
      where: { userId },
    });

    if (googleConn) {
      await prisma.googleSheetsConnection.update({
        where: { userId },
        data: {
          needsReauth: true,
          lastRefreshError: errorMessage,
          lastRefreshAttempt: now,
        },
      });
      console.warn(`[HandleOAuthErrors] Marked Google connection for user ${userId} as needing reauth`);
    }
  } catch (error) {
    console.error(`[HandleOAuthErrors] Failed to mark connections as needing reauth:`, error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Saves sync results to the database, including error information
 */
async function saveSyncResults(
  syncConfigId: string,
  result: BidirectionalSyncResult
): Promise<void> {
  try {
    const now = new Date();

    // Handle OAuth errors by marking connections as needing reauth
    if (result.errors.some((e) => e.type === 'OAUTH')) {
      await handleOAuthErrors(syncConfigId, result.errors);
    }

    // Prepare error message for dashboard (user-friendly)
    let lastErrorMessage: string | null = null;
    let lastErrorAt: Date | null = null;

    if (result.errors.length > 0) {
      lastErrorAt = now;

      // Group errors by type
      const errorsByType = result.errors.reduce((acc, err) => {
        acc[err.type] = (acc[err.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Create user-friendly error summary
      const errorSummary = Object.entries(errorsByType)
        .map(([type, count]) => {
          switch (type) {
            case 'OAUTH':
              return 'Authentication failed - please reconnect your account';
            case 'RATE_LIMIT':
              return `Rate limit exceeded (${count} ${count === 1 ? 'error' : 'errors'})`;
            case 'NETWORK':
              return `Network errors (${count} ${count === 1 ? 'error' : 'errors'})`;
            case 'VALIDATION':
              return `Data validation errors (${count} ${count === 1 ? 'error' : 'errors'})`;
            default:
              return `${count} ${count === 1 ? 'error' : 'errors'}`;
          }
        })
        .join('; ');

      lastErrorMessage = errorSummary;

      // If there's a critical OAuth error, use a more specific message
      const oauthError = result.errors.find((e) => e.type === 'OAUTH');
      if (oauthError) {
        lastErrorMessage = 'Authentication failed - please reconnect your account in Settings';
      }
    }

    // Update SyncConfig with results
    await prisma.syncConfig.update({
      where: { id: syncConfigId },
      data: {
        lastSyncAt: now,
        lastSyncStatus: result.status.toLowerCase(),
        lastErrorAt: lastErrorAt,
        lastErrorMessage: lastErrorMessage,
      },
    });

    console.log(`[SaveSyncResults] Updated SyncConfig ${syncConfigId} with status: ${result.status}`);
  } catch (error) {
    console.error(
      `[SaveSyncResults] Failed to save sync results for config ${syncConfigId}:`,
      error
    );
    // Don't throw - this is a non-critical operation
  }
}

// ============================================================================
// Exports
// ============================================================================

export { createPhaseResult, executePhase, retryWithBackoff, chunkArray, classifyError };
