/**
 * Airtable → Google Sheets One-Way Sync
 * Syncs data from Airtable to Google Sheets with comprehensive error handling
 */

import type { AirtableRecord, AirtableField } from '../airtable/client';
import { listRecords, getBaseSchema } from '../airtable/client';
import {
  getSheetData,
  updateSheetData,
  appendRows,
  clearSheetData,
  getSheetIdByName,
  hideColumn,
  columnNumberToLetter,
  ensureColumnsExist,
  batchSetDropdownValidations,
  type SheetData,
} from '../google/client';
import { airtableRecordToSheetsRow } from './fieldMapper';
import { resolveAllLinkedRecords } from './linkedRecordResolver';
import {
  detectDropdownFields,
  convertToSheetsValidation,
  logDropdownFields,
} from './dropdownFieldDetector';

// ============================================================================
// Types
// ============================================================================

export interface AirtableToSheetsSyncOptions {
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
  /** Field mappings: { airtableFieldId: columnIndex } */
  fieldMappings?: Record<string, number>;
  /** Whether to include a header row (default: true) */
  includeHeader?: boolean;
  /** Whether to clear extra rows in Sheets not in Airtable (default: false) */
  deleteExtraRows?: boolean;
  /** Whether to resolve linked records to names (default: true) */
  resolveLinkedRecords?: boolean;
  /** Column index to store Airtable record IDs (for tracking, default: 0) */
  idColumnIndex?: number;
  /** Maximum retries for rate limit errors (default: 3) */
  maxRetries?: number;
  /** Batch size for Sheets updates (default: 100 rows) */
  batchSize?: number;
}

export interface SyncResult {
  /** Number of rows added to Sheets */
  added: number;
  /** Number of rows updated in Sheets */
  updated: number;
  /** Number of rows deleted from Sheets */
  deleted: number;
  /** Total number of records processed */
  total: number;
  /** Errors encountered during sync */
  errors: SyncError[];
  /** Warnings (non-fatal issues) */
  warnings: string[];
  /** Execution time in milliseconds */
  duration: number;
  /** Timestamp when sync started */
  startedAt: Date;
  /** Timestamp when sync completed */
  completedAt: Date;
}

export interface SyncError {
  /** Record ID or row number where error occurred */
  recordId?: string;
  /** Row index in Sheets */
  rowIndex?: number;
  /** Error message */
  message: string;
  /** Error type */
  type: 'FETCH' | 'TRANSFORM' | 'WRITE' | 'VALIDATION' | 'RATE_LIMIT' | 'UNKNOWN';
  /** Original error object */
  originalError?: any;
}

interface RowDiff {
  /** Rows to add (new records) */
  toAdd: any[][];
  /** Rows to update (existing records that changed) */
  toUpdate: Array<{ rowIndex: number; data: any[] }>;
  /** Row indices to delete */
  toDelete: number[];
}

// ============================================================================
// Main Sync Function
// ============================================================================

/**
 * Syncs data from Airtable to Google Sheets (one-way)
 *
 * Process:
 * 1. Fetch all records from Airtable (with pagination)
 * 2. Fetch table schema to get field metadata
 * 3. Resolve linked records to human-readable names
 * 4. Transform Airtable records to Sheets rows
 * 5. Fetch existing Sheets data
 * 6. Calculate diff (add/update/delete)
 * 7. Apply changes to Sheets in batches
 * 8. Return sync summary
 */
export async function syncAirtableToSheets(
  options: AirtableToSheetsSyncOptions
): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = {
    added: 0,
    updated: 0,
    deleted: 0,
    total: 0,
    errors: [],
    warnings: [],
    duration: 0,
    startedAt: new Date(),
    completedAt: new Date(),
  };

  // Set defaults
  const {
    airtableAccessToken,
    sheetsAccessToken,
    baseId,
    tableId,
    viewId, // Optional view ID for exact row order
    spreadsheetId,
    sheetId,
    fieldMappings,
    includeHeader = true,
    resolveLinkedRecords: shouldResolveLinkedRecords = true,
    idColumnIndex = 0,
    maxRetries = 3,
    batchSize = 100,
  } = options;

  // CRITICAL: Use fixed column AA (index 26) for record IDs to avoid shifting user's columns
  const FIXED_ID_COLUMN_INDEX = 26; // Column AA
  const actualIdColumnIndex = idColumnIndex === 0 ? FIXED_ID_COLUMN_INDEX : idColumnIndex;

  try {
    // ========================================================================
    // STEP 1: Fetch Table Schema FIRST (needed for primary field name)
    // ========================================================================
    console.log(`[AirtableToSheets] Fetching table schema...`);

    let tableFields: AirtableField[] = [];
    let primaryFieldName: string | undefined;
    try {
      const schema = await retryWithBackoff(
        () => getBaseSchema(airtableAccessToken, baseId),
        maxRetries,
        'fetch table schema'
      );

      const table = schema.tables.find((t) => t.id === tableId || t.name === tableId);
      if (!table) {
        throw new Error(`Table ${tableId} not found in base schema`);
      }

      tableFields = table.fields;

      // Get primary field name for sorting (ensures consistent order)
      const primaryField = table.fields.find((f) => f.id === table.primaryFieldId);
      if (primaryField) {
        primaryFieldName = primaryField.name;
        console.log(`[AirtableToSheets] Primary field for ordering: "${primaryFieldName}"`);
      }

      // Apply field mappings if provided (filter to only mapped fields)
      if (fieldMappings && Object.keys(fieldMappings).length > 0) {
        const mappedFieldIds = Object.keys(fieldMappings);
        tableFields = tableFields.filter((f) => mappedFieldIds.includes(f.id));
        // Sort by column index
        tableFields.sort((a, b) => (fieldMappings[a.id] || 0) - (fieldMappings[b.id] || 0));
      }

      console.log(`[AirtableToSheets] Found ${tableFields.length} fields to sync`);
    } catch (error) {
      result.errors.push({
        type: 'FETCH',
        message: `Failed to fetch table schema: ${error instanceof Error ? error.message : String(error)}`,
        originalError: error,
      });
      return finalizeSyncResult(result, startTime);
    }

    // ========================================================================
    // STEP 2: Fetch Airtable Records (SORTED BY PRIMARY FIELD for consistent order)
    // ========================================================================
    console.log(`[AirtableToSheets] Fetching records from Airtable table ${tableId}...`);

    let airtableRecords: AirtableRecord[] = [];
    try {
      // CRITICAL: Use view or sort by primary field to ensure consistent ordering
      // Priority: 1) View (exact UI order), 2) Primary field sort (alphabetical), 3) Default
      const fetchOptions: any = {};

      if (viewId) {
        // Use view for EXACT order matching Airtable UI
        fetchOptions.view = viewId;
        console.log(`[AirtableToSheets] Using Airtable view "${viewId}" for exact row order`);
      } else if (primaryFieldName) {
        // Fallback to sorting by primary field for consistent alphabetical order
        fetchOptions.sort = [{ field: primaryFieldName, direction: 'asc' as const }];
        console.log(`[AirtableToSheets] Sorting by primary field "${primaryFieldName}" for consistent order`);
      } else {
        console.warn(`[AirtableToSheets] No view or primary field - order may be unpredictable`);
      }

      airtableRecords = await retryWithBackoff(
        () => listRecords(airtableAccessToken, baseId, tableId, fetchOptions),
        maxRetries,
        'fetch Airtable records'
      );
      console.log(`[AirtableToSheets] Fetched ${airtableRecords.length} records from Airtable`);
    } catch (error) {
      result.errors.push({
        type: 'FETCH',
        message: `Failed to fetch Airtable records: ${error instanceof Error ? error.message : String(error)}`,
        originalError: error,
      });
      return finalizeSyncResult(result, startTime);
    }

    result.total = airtableRecords.length;

    // ========================================================================
    // STEP 3: Resolve Linked Records (Optional)
    // ========================================================================
    if (shouldResolveLinkedRecords && airtableRecords.length > 0) {
      console.log(`[AirtableToSheets] Resolving linked records...`);

      try {
        const resolved = await resolveAllLinkedRecords(
          airtableAccessToken,
          baseId,
          tableId,
          airtableRecords,
          { strictMode: false }
        );

        airtableRecords = resolved.records;

        if (resolved.warnings.length > 0) {
          result.warnings.push(...resolved.warnings);
        }

        console.log(`[AirtableToSheets] Linked records resolved`);
      } catch (error) {
        // Non-fatal error, continue without resolved links
        result.warnings.push(
          `Failed to resolve linked records: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // ========================================================================
    // STEP 4: Transform Airtable Records to Sheets Rows
    // ========================================================================
    console.log(`[AirtableToSheets] Transforming records to Sheets rows...`);

    const transformedRows: any[][] = [];
    const transformedRowsWithoutIds: any[][] = []; // Rows without record IDs for writing
    const recordIdMapping: Map<number, string> = new Map(); // rowIndex -> recordId

    for (let i = 0; i < airtableRecords.length; i++) {
      const record = airtableRecords[i];

      try {
        const { row, errors, warnings } = await airtableRecordToSheetsRow(
          record,
          tableFields,
          {
            accessToken: airtableAccessToken,
            baseId,
            tableId,
          }
        );

        // Create row WITH record ID at column AA for diff calculation
        const rowWithId = [...row];
        while (rowWithId.length <= actualIdColumnIndex) {
          rowWithId.push('');
        }
        rowWithId[actualIdColumnIndex] = record.id;
        transformedRows.push(rowWithId);

        // Keep row WITHOUT record ID for actual writing to sheets
        transformedRowsWithoutIds.push(row);
        recordIdMapping.set(i, record.id);

        if (errors.length > 0) {
          result.errors.push({
            recordId: record.id,
            type: 'TRANSFORM',
            message: `Transformation errors: ${errors.join('; ')}`,
          });
        }

        if (warnings.length > 0) {
          result.warnings.push(`Record ${record.id}: ${warnings.join('; ')}`);
        }
      } catch (error) {
        result.errors.push({
          recordId: record.id,
          type: 'TRANSFORM',
          message: `Failed to transform record: ${error instanceof Error ? error.message : String(error)}`,
          originalError: error,
        });
      }
    }

    console.log(`[AirtableToSheets] Transformed ${transformedRows.length} rows`);

    // ========================================================================
    // STEP 5: Fetch Existing Sheets Data
    // ========================================================================
    console.log(`[AirtableToSheets] Fetching existing Sheets data...`);

    let existingData: SheetData | null = null;
    let headerRowOffset = includeHeader ? 1 : 0;

    try {
      existingData = await retryWithBackoff(
        () => getSheetData(sheetsAccessToken, spreadsheetId, sheetId),
        maxRetries,
        'fetch Sheets data'
      );

      console.log(
        `[AirtableToSheets] Found ${existingData.values?.length || 0} existing rows in Sheets`
      );
    } catch (error) {
      // If sheet is empty or doesn't exist, treat as empty
      console.log(`[AirtableToSheets] Sheet appears to be empty or new`);
      existingData = { range: '', majorDimension: 'ROWS', values: [] };
    }

    // ========================================================================
    // STEP 6: Prepare Data for Writing (PRESERVE AIRTABLE ORDER)
    // ========================================================================
    console.log(`[AirtableToSheets] Preparing ${transformedRowsWithoutIds.length} rows to write...`);

    // CRITICAL FIX: To preserve Airtable's exact ordering in Sheets, we MUST write
    // all data in Airtable's order. The previous approach of "update existing + append new"
    // loses ordering because:
    // 1. Existing rows stay in their (possibly wrong) Sheet positions
    // 2. New rows get appended at the end in unpredictable order
    //
    // The solution: Write ALL rows in Airtable order, starting from row 2 (after header).
    // This ensures Sheets always mirrors Airtable's exact ordering.

    const startRow = includeHeader ? 2 : 1; // Row 2 if header exists, Row 1 otherwise

    // Build a Set of existing record IDs in Sheets (for tracking adds vs updates)
    const existingRecordIds = new Set<string>();
    if (existingData.values && existingData.values.length > headerRowOffset) {
      const dataRows = existingData.values.slice(headerRowOffset);
      for (const row of dataRows) {
        const recordId = row[actualIdColumnIndex] ? String(row[actualIdColumnIndex]).trim() : undefined;
        if (recordId) {
          existingRecordIds.add(recordId);
        }
      }
    }

    // Prepare all rows in AIRTABLE ORDER - this is the key to preserving order
    const allRowsInOrder: Array<{ data: any[]; recordId: string; isNew: boolean }> = [];
    for (let i = 0; i < airtableRecords.length; i++) {
      const record = airtableRecords[i];
      const rowData = transformedRowsWithoutIds[i];
      const isNew = !existingRecordIds.has(record.id);
      allRowsInOrder.push({ data: rowData, recordId: record.id, isNew });
    }

    const newCount = allRowsInOrder.filter(r => r.isNew).length;
    const updateCount = allRowsInOrder.filter(r => !r.isNew).length;
    console.log(`[AirtableToSheets] Will write ${allRowsInOrder.length} rows in Airtable order (${newCount} new, ${updateCount} existing)`);

    // ========================================================================
    // STEP 7: Write ALL Data to Sheets in Airtable Order
    // ========================================================================

    // 7.1: Add header row if needed
    if (includeHeader && (!existingData.values || existingData.values.length === 0)) {
      console.log(`[AirtableToSheets] Adding header row...`);

      const headerRow = tableFields.map((f) => f.name);

      try {
        // Write the main header row (field names) to A1
        await retryWithBackoff(
          () =>
            updateSheetData(sheetsAccessToken, spreadsheetId, sheetId, 'A1', [headerRow]),
          maxRetries,
          'add header row'
        );

        // Write "Record ID" header to column AA separately
        if (actualIdColumnIndex === FIXED_ID_COLUMN_INDEX) {
          const columnLetter = columnNumberToLetter(actualIdColumnIndex + 1);
          const headerRange = `${columnLetter}1`;
          await updateSheetData(sheetsAccessToken, spreadsheetId, sheetId, headerRange, [['Record ID']]);
          console.log(`[AirtableToSheets] Added "Record ID" header to ${headerRange}`);
        }

        headerRowOffset = 1;
      } catch (error) {
        result.errors.push({
          type: 'WRITE',
          message: `Failed to add header row: ${error instanceof Error ? error.message : String(error)}`,
          originalError: error,
        });
      }
    }

    // 7.2: Write all rows in Airtable order (batched for efficiency)
    if (allRowsInOrder.length > 0) {
      console.log(`[AirtableToSheets] Writing ${allRowsInOrder.length} rows in Airtable order...`);

      // Write in batches for efficiency
      const writeBatches = chunkArray(allRowsInOrder, batchSize);
      let writtenSoFar = 0;

      for (let i = 0; i < writeBatches.length; i++) {
        const batch = writeBatches[i];
        const batchData = batch.map(r => r.data);
        const batchStartRow = startRow + writtenSoFar;

        try {
          // Write the batch starting at the correct row
          const range = `A${batchStartRow}`;
          await retryWithBackoff(
            () => updateSheetData(sheetsAccessToken, spreadsheetId, sheetId, range, batchData),
            maxRetries,
            `write rows batch ${i + 1}/${writeBatches.length}`
          );

          // Track results and record ID mappings
          for (let j = 0; j < batch.length; j++) {
            const rowInfo = batch[j];
            if (rowInfo.isNew) {
              result.added++;
            } else {
              result.updated++;
            }
            // Map row index to record ID (0-based index relative to data start)
            recordIdMapping.set(writtenSoFar + j, rowInfo.recordId);
          }

          writtenSoFar += batch.length;
          console.log(
            `[AirtableToSheets] Wrote batch ${i + 1}/${writeBatches.length} (${batch.length} rows)`
          );
        } catch (error) {
          result.errors.push({
            type: 'WRITE',
            message: `Failed to write rows batch ${i + 1}: ${error instanceof Error ? error.message : String(error)}`,
            originalError: error,
          });
        }
      }

      console.log(`[AirtableToSheets] ✓ Wrote ${result.added} new + ${result.updated} updated rows in Airtable order`);
    }

    // ========================================================================
    // STEP 8: Setup Dropdown Data Validation for Select Fields
    // ========================================================================

    // Detect dropdown fields (Single Select, Multi Select) and set up Google Sheets data validation
    console.log(`[AirtableToSheets] Detecting dropdown fields for data validation...`);
    console.log(`[AirtableToSheets] Total fields to check: ${tableFields.length}`);
    console.log(`[AirtableToSheets] Field types: ${tableFields.map(f => `${f.name}:${f.type}`).join(', ')}`);

    const dropdownFields = detectDropdownFields(tableFields, fieldMappings);

    if (dropdownFields.length > 0) {
      logDropdownFields(dropdownFields);

      try {
        // Convert to Sheets validation format
        const validations = dropdownFields.map(convertToSheetsValidation);

        console.log(`[AirtableToSheets] Validation configurations:`, JSON.stringify(validations, null, 2));

        // Apply data validation to all dropdown columns
        console.log(`[AirtableToSheets] Applying data validation to ${validations.length} dropdown column(s)...`);
        await batchSetDropdownValidations(
          sheetsAccessToken,
          spreadsheetId,
          sheetId,
          validations
        );
        console.log(`[AirtableToSheets] ✓ Data validation applied successfully`);
      } catch (error) {
        // Non-fatal error - log warning but continue
        const errorMessage = `Failed to set up dropdown validation: ${error instanceof Error ? error.message : String(error)}`;
        result.warnings.push(errorMessage);
        console.error('[AirtableToSheets] Failed to set up dropdown validation:', error);
        console.error('[AirtableToSheets] Error details:', error instanceof Error ? error.stack : error);
      }
    } else {
      console.log(`[AirtableToSheets] No dropdown fields detected - skipping data validation`);
      console.log(`[AirtableToSheets] This might mean: 1) No singleSelect/multipleSelects fields, 2) No choices defined, or 3) All dropdown fields were filtered out`);
    }

    // ========================================================================
    // STEP 9: Write Record IDs to Column AA, Then Hide It
    // ========================================================================

    // Write record IDs to column AA and hide it to keep sheets clean for users
    if (actualIdColumnIndex === FIXED_ID_COLUMN_INDEX && (result.added > 0 || result.updated > 0)) {
      const columnLetter = columnNumberToLetter(actualIdColumnIndex + 1);
      try {
        // STEP 1: Ensure column AA exists
        const requiredColumnCount = actualIdColumnIndex + 1; // Need at least 27 columns for column AA (index 26)
        console.log(
          `[AirtableToSheets] Ensuring column ${columnLetter} exists (need ${requiredColumnCount} columns)...`
        );
        await ensureColumnsExist(sheetsAccessToken, spreadsheetId, sheetId, requiredColumnCount);

        // STEP 2: Write all record IDs to column AA
        console.log(`[AirtableToSheets] Writing ${recordIdMapping.size} record IDs to column ${columnLetter}...`);

        for (const [rowIndex, recordId] of recordIdMapping) {
          const rowNumber = rowIndex + headerRowOffset + 1; // +1 for 1-based indexing
          const range = `${columnLetter}${rowNumber}`;

          try {
            await updateSheetData(
              sheetsAccessToken,
              spreadsheetId,
              sheetId,
              range,
              [[recordId]]
            );
          } catch (error) {
            result.warnings.push(
              `Failed to write record ID to ${range}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }

        console.log(`[AirtableToSheets] ✓ Wrote ${recordIdMapping.size} record IDs to column ${columnLetter}`);

        // STEP 3: Hide column AA
        console.log(`[AirtableToSheets] Hiding ID column ${columnLetter}...`);
        await hideColumn(sheetsAccessToken, spreadsheetId, sheetId, actualIdColumnIndex);
        console.log(
          `[AirtableToSheets] ✓ Hidden column ${columnLetter} (users won't see record IDs)`
        );
      } catch (error) {
        // Non-fatal - log warning
        result.warnings.push(
          `Could not write/hide ID column: ${error instanceof Error ? error.message : String(error)}`
        );
        console.warn('[AirtableToSheets] Failed to write/hide ID column:', error);
      }
    }

    // ========================================================================
    // STEP 10: Finalize
    // ========================================================================

    console.log(
      `[AirtableToSheets] Sync complete: ${result.added} added, ${result.updated} updated, ${result.deleted} deleted`
    );

    return finalizeSyncResult(result, startTime);
  } catch (error) {
    result.errors.push({
      type: 'UNKNOWN',
      message: `Unexpected error during sync: ${error instanceof Error ? error.message : String(error)}`,
      originalError: error,
    });

    return finalizeSyncResult(result, startTime);
  }
}

// ============================================================================
// Diff Calculation
// ============================================================================

/**
 * Calculates the difference between new data and existing Sheets data
 */
function calculateRowDiff(
  newRows: any[][],
  existingRows: any[][],
  idColumnIndex: number,
  headerRowOffset: number,
  deleteExtra: boolean
): RowDiff {
  const diff: RowDiff = {
    toAdd: [],
    toUpdate: [],
    toDelete: [],
  };

  // Skip header row if present
  const dataRows = existingRows.slice(headerRowOffset);

  // Build a map of existing record IDs to row indices
  const existingRecordMap = new Map<string, number>();
  dataRows.forEach((row, index) => {
    const recordId = row[idColumnIndex];
    if (recordId && recordId !== '') {
      existingRecordMap.set(String(recordId), index);
    }
  });

  // Process new rows
  const processedIndices = new Set<number>();

  for (const newRow of newRows) {
    const recordId = String(newRow[idColumnIndex]);

    if (existingRecordMap.has(recordId)) {
      // Record exists - check if it changed
      const existingIndex = existingRecordMap.get(recordId)!;
      const existingRow = dataRows[existingIndex];

      processedIndices.add(existingIndex);

      if (!areRowsEqual(newRow, existingRow)) {
        diff.toUpdate.push({
          rowIndex: existingIndex,
          data: newRow,
        });
      }
    } else {
      // New record - add it
      diff.toAdd.push(newRow);
    }
  }

  // Find rows to delete (exist in Sheets but not in new data)
  if (deleteExtra) {
    dataRows.forEach((row, index) => {
      if (!processedIndices.has(index)) {
        diff.toDelete.push(index);
      }
    });
  }

  return diff;
}

/**
 * Compares two rows for equality
 */
function areRowsEqual(row1: any[], row2: any[]): boolean {
  if (row1.length !== row2.length) return false;

  for (let i = 0; i < row1.length; i++) {
    const val1 = normalizeValue(row1[i]);
    const val2 = normalizeValue(row2[i]);

    if (val1 !== val2) return false;
  }

  return true;
}

/**
 * Normalizes a cell value for comparison
 */
function normalizeValue(value: any): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'number') {
    // Handle floating point precision
    return String(Math.round(value * 1000000) / 1000000);
  }

  return String(value).trim();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Retries a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  operation: string
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if it's a rate limit error
      const isRateLimit =
        lastError.message.toLowerCase().includes('rate limit') ||
        lastError.message.toLowerCase().includes('quota') ||
        lastError.message.includes('429');

      if (!isRateLimit && attempt > 0) {
        // Only retry non-rate-limit errors once
        break;
      }

      // Exponential backoff with jitter
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000) + Math.random() * 1000;
      console.warn(
        `[AirtableToSheets] ${operation} failed (attempt ${attempt + 1}/${maxRetries + 1}), ` +
          `retrying in ${Math.round(delay)}ms...`,
        lastError.message
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Chunks an array into smaller arrays of specified size
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Groups consecutive numbers into ranges
 * Example: [1, 2, 3, 5, 7, 8, 9] → [{start: 1, end: 3}, {start: 5, end: 5}, {start: 7, end: 9}]
 */
function groupConsecutiveNumbers(numbers: number[]): Array<{ start: number; end: number }> {
  if (numbers.length === 0) return [];

  const sorted = [...numbers].sort((a, b) => a - b);
  const ranges: Array<{ start: number; end: number }> = [];

  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === rangeEnd + 1) {
      // Consecutive number, extend range
      rangeEnd = sorted[i];
    } else {
      // Gap found, save current range and start new one
      ranges.push({ start: rangeStart, end: rangeEnd });
      rangeStart = sorted[i];
      rangeEnd = sorted[i];
    }
  }

  // Add final range
  ranges.push({ start: rangeStart, end: rangeEnd });

  return ranges;
}

/**
 * Finalizes the sync result with duration and completion time
 */
function finalizeSyncResult(result: SyncResult, startTime: number): SyncResult {
  result.duration = Date.now() - startTime;
  result.completedAt = new Date();
  return result;
}

// ============================================================================
// Helper: Delete Rows (imported from Google client)
// ============================================================================

/**
 * Local import of deleteRows to avoid circular dependency
 */
async function deleteRows(
  accessToken: string,
  spreadsheetId: string,
  sheetId: number,
  startRow: number,
  count: number
): Promise<void> {
  const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4';

  const response = await fetch(`${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: startRow,
              endIndex: startRow + count,
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to delete rows: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }
}

// ============================================================================
// Exports
// ============================================================================

export { chunkArray, retryWithBackoff, areRowsEqual, normalizeValue };
