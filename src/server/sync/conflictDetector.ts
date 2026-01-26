/**
 * Conflict Detector for Bidirectional Sync
 * Detects and resolves conflicts when the same record changes in both Airtable and Sheets
 */

import crypto from 'crypto';
import type { AirtableRecord } from '../airtable/client';

// ============================================================================
// Types
// ============================================================================

export type ConflictResolutionStrategy = 'AIRTABLE_WINS' | 'SHEETS_WINS' | 'NEWEST_WINS';

export interface RecordState {
  /** Record ID (Airtable record ID) */
  recordId: string;
  /** Hash of all field values (for change detection) */
  contentHash: string;
  /** Last modification timestamp from Airtable */
  airtableModifiedTime?: string;
  /** Last modification timestamp from Sheets (or last sync time) */
  sheetsModifiedTime?: string;
  /** Timestamp when this state was captured */
  capturedAt: number;
}

export interface SyncState {
  /** Sync config ID this state belongs to */
  syncConfigId: string;
  /** Map of record ID to last known state */
  records: Map<string, RecordState>;
  /** Timestamp of last sync operation */
  lastSyncTime: number;
}

export interface ConflictInfo {
  /** Record ID experiencing conflict */
  recordId: string;
  /** Current state in Airtable */
  airtableState: {
    record: AirtableRecord;
    contentHash: string;
    modifiedTime?: string;
  };
  /** Current state in Sheets */
  sheetsState: {
    row: any[];
    contentHash: string;
    modifiedTime?: string;
  };
  /** Last known state from previous sync */
  lastKnownState?: RecordState;
  /** Type of conflict detected */
  conflictType: 'BOTH_MODIFIED' | 'DELETED_IN_AIRTABLE' | 'DELETED_IN_SHEETS';
}

export interface ConflictResolution {
  /** Record ID */
  recordId: string;
  /** Resolved action to take */
  action: 'USE_AIRTABLE' | 'USE_SHEETS' | 'DELETE' | 'SKIP';
  /** Source that won the conflict */
  winner: 'AIRTABLE' | 'SHEETS' | 'NONE';
  /** Reason for resolution */
  reason: string;
}

export interface ConflictDetectionResult {
  /** Records that have conflicts */
  conflicts: ConflictInfo[];
  /** Records changed only in Airtable */
  airtableOnlyChanges: string[];
  /** Records changed only in Sheets */
  sheetsOnlyChanges: string[];
  /** Records with no changes */
  noChanges: string[];
  /** New records in Airtable */
  newInAirtable: string[];
  /** New records in Sheets */
  newInSheets: number[];
}

// ============================================================================
// In-Memory State Storage
// ============================================================================

class SyncStateManager {
  private states: Map<string, SyncState> = new Map();

  /**
   * Gets the sync state for a config
   */
  getState(syncConfigId: string): SyncState | undefined {
    return this.states.get(syncConfigId);
  }

  /**
   * Sets the sync state for a config
   */
  setState(syncConfigId: string, state: SyncState): void {
    this.states.set(syncConfigId, state);
  }

  /**
   * Updates the state for a single record
   */
  updateRecordState(syncConfigId: string, recordState: RecordState): void {
    let state = this.states.get(syncConfigId);
    if (!state) {
      state = {
        syncConfigId,
        records: new Map(),
        lastSyncTime: Date.now(),
      };
      this.states.set(syncConfigId, state);
    }
    state.records.set(recordState.recordId, recordState);
  }

  /**
   * Removes a record from state
   */
  removeRecordState(syncConfigId: string, recordId: string): void {
    const state = this.states.get(syncConfigId);
    if (state) {
      state.records.delete(recordId);
    }
  }

  /**
   * Clears state for a sync config
   */
  clearState(syncConfigId: string): void {
    this.states.delete(syncConfigId);
  }

  /**
   * Clears all states
   */
  clearAll(): void {
    this.states.clear();
  }

  /**
   * Gets statistics about stored states
   */
  getStats(): {
    totalConfigs: number;
    totalRecords: number;
    configs: Array<{ id: string; recordCount: number; lastSync: number }>;
  } {
    const configs = Array.from(this.states.entries()).map(([id, state]) => ({
      id,
      recordCount: state.records.size,
      lastSync: state.lastSyncTime,
    }));

    const totalRecords = configs.reduce((sum, c) => sum + c.recordCount, 0);

    return {
      totalConfigs: this.states.size,
      totalRecords,
      configs,
    };
  }
}

// Global state manager instance
const stateManager = new SyncStateManager();

// ============================================================================
// Hash Generation
// ============================================================================

/**
 * Generates a hash of record field values for change detection
 * This allows us to detect actual changes vs. no-op updates
 */
export function generateRecordHash(fields: Record<string, any>): string {
  // Sort keys to ensure consistent hash regardless of field order
  const sortedFields = Object.keys(fields)
    .sort()
    .reduce((acc, key) => {
      acc[key] = normalizeFieldValue(fields[key]);
      return acc;
    }, {} as Record<string, any>);

  const content = JSON.stringify(sortedFields);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Generates a hash of a Sheets row for change detection
 */
export function generateRowHash(row: any[]): string {
  // Normalize array values
  const normalized = row.map(normalizeFieldValue);
  const content = JSON.stringify(normalized);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Normalizes field values for consistent hashing
 */
function normalizeFieldValue(value: any): any {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    // Handle floating point precision issues
    return Math.round(value * 1000000) / 1000000;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeFieldValue).sort();
  }

  if (typeof value === 'object') {
    // For objects (like linked records), sort by ID
    if ('id' in value) {
      return value.id;
    }
    // For other objects, recursively normalize
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = normalizeFieldValue(value[key]);
        return acc;
      }, {} as Record<string, any>);
  }

  return value;
}

// ============================================================================
// State Capture
// ============================================================================

/**
 * Captures the current state of Airtable records
 */
export function captureAirtableState(records: AirtableRecord[]): RecordState[] {
  const now = Date.now();

  return records.map((record) => {
    // Remove metadata fields that shouldn't affect hash
    const { id, createdTime, ...fields } = record;

    return {
      recordId: record.id,
      contentHash: generateRecordHash(record.fields),
      airtableModifiedTime: createdTime, // Airtable doesn't provide modifiedTime in base API
      capturedAt: now,
    };
  });
}

/**
 * Captures the current state of Sheets rows
 * @param rows - Array of rows from Sheets
 * @param idColumnIndex - Column index containing Airtable record IDs (optional)
 */
export function captureSheetsState(
  rows: any[][],
  idColumnIndex?: number
): Map<string, RecordState> {
  const now = Date.now();
  const states = new Map<string, RecordState>();

  rows.forEach((row, rowIndex) => {
    // If we have an ID column, use it; otherwise use row index as identifier
    const recordId = idColumnIndex !== undefined ? row[idColumnIndex] : `row_${rowIndex}`;

    if (!recordId || recordId === '') {
      return; // Skip rows without IDs
    }

    states.set(String(recordId), {
      recordId: String(recordId),
      contentHash: generateRowHash(row),
      sheetsModifiedTime: new Date().toISOString(), // Sheets doesn't provide cell-level timestamps
      capturedAt: now,
    });
  });

  return states;
}

// ============================================================================
// Conflict Detection
// ============================================================================

/**
 * Detects conflicts between Airtable and Sheets states
 *
 * @param airtableRecords - Current records from Airtable
 * @param sheetsRows - Current rows from Sheets
 * @param syncConfigId - Sync configuration ID
 * @param idColumnIndex - Column index in Sheets containing Airtable record IDs
 * @returns Conflict detection results
 */
export function detectConflicts(
  airtableRecords: AirtableRecord[],
  sheetsRows: any[][],
  syncConfigId: string,
  idColumnIndex?: number
): ConflictDetectionResult {
  const result: ConflictDetectionResult = {
    conflicts: [],
    airtableOnlyChanges: [],
    sheetsOnlyChanges: [],
    noChanges: [],
    newInAirtable: [],
    newInSheets: [],
  };

  // Get last known state
  const lastState = stateManager.getState(syncConfigId);

  // Capture current states
  const currentAirtableStates = new Map(
    captureAirtableState(airtableRecords).map((s) => [s.recordId, s])
  );
  const currentSheetsStates = captureSheetsState(sheetsRows, idColumnIndex);

  // If no previous state, everything is new
  if (!lastState) {
    result.newInAirtable = Array.from(currentAirtableStates.keys());
    result.newInSheets = Array.from(currentSheetsStates.keys())
      .map((id) => parseInt(id.replace('row_', '')))
      .filter((n) => !isNaN(n));
    return result;
  }

  const lastKnownRecords = lastState.records;
  const processedRecords = new Set<string>();

  // Check Airtable records for changes and conflicts
  for (const [recordId, airtableState] of currentAirtableStates.entries()) {
    processedRecords.add(recordId);

    const sheetsState = currentSheetsStates.get(recordId);
    const lastKnown = lastKnownRecords.get(recordId);

    // New record in Airtable
    if (!lastKnown) {
      result.newInAirtable.push(recordId);
      continue;
    }

    // Record deleted in Sheets
    if (!sheetsState) {
      const airtableChanged = airtableState.contentHash !== lastKnown.contentHash;

      if (airtableChanged) {
        // Conflict: modified in Airtable but deleted in Sheets
        const record = airtableRecords.find((r) => r.id === recordId)!;
        result.conflicts.push({
          recordId,
          airtableState: {
            record,
            contentHash: airtableState.contentHash,
            modifiedTime: airtableState.airtableModifiedTime,
          },
          sheetsState: {
            row: [],
            contentHash: '',
            modifiedTime: undefined,
          },
          lastKnownState: lastKnown,
          conflictType: 'DELETED_IN_SHEETS',
        });
      } else {
        // Just deleted in Sheets, no conflict
        result.sheetsOnlyChanges.push(recordId);
      }
      continue;
    }

    // Check for changes
    const airtableChanged = airtableState.contentHash !== lastKnown.contentHash;
    const sheetsChanged = sheetsState.contentHash !== lastKnown.contentHash;

    if (airtableChanged && sheetsChanged) {
      // Conflict: both sides modified
      const record = airtableRecords.find((r) => r.id === recordId)!;
      const rowIndex = Array.from(currentSheetsStates.entries()).findIndex(
        ([id]) => id === recordId
      );
      result.conflicts.push({
        recordId,
        airtableState: {
          record,
          contentHash: airtableState.contentHash,
          modifiedTime: airtableState.airtableModifiedTime,
        },
        sheetsState: {
          row: sheetsRows[rowIndex],
          contentHash: sheetsState.contentHash,
          modifiedTime: sheetsState.sheetsModifiedTime,
        },
        lastKnownState: lastKnown,
        conflictType: 'BOTH_MODIFIED',
      });
    } else if (airtableChanged) {
      result.airtableOnlyChanges.push(recordId);
    } else if (sheetsChanged) {
      result.sheetsOnlyChanges.push(recordId);
    } else {
      result.noChanges.push(recordId);
    }
  }

  // Check for records that exist in Sheets but not in Airtable
  for (const [recordId, sheetsState] of currentSheetsStates.entries()) {
    if (processedRecords.has(recordId)) continue;

    const lastKnown = lastKnownRecords.get(recordId);

    // New record in Sheets
    if (!lastKnown) {
      const rowNum = parseInt(recordId.replace('row_', ''));
      if (!isNaN(rowNum)) {
        result.newInSheets.push(rowNum);
      }
      continue;
    }

    // Record deleted in Airtable
    const sheetsChanged = sheetsState.contentHash !== lastKnown.contentHash;

    if (sheetsChanged) {
      // Conflict: modified in Sheets but deleted in Airtable
      const rowIndex = Array.from(currentSheetsStates.entries()).findIndex(
        ([id]) => id === recordId
      );
      result.conflicts.push({
        recordId,
        airtableState: {
          record: { id: recordId, createdTime: '', fields: {} },
          contentHash: '',
          modifiedTime: undefined,
        },
        sheetsState: {
          row: sheetsRows[rowIndex],
          contentHash: sheetsState.contentHash,
          modifiedTime: sheetsState.sheetsModifiedTime,
        },
        lastKnownState: lastKnown,
        conflictType: 'DELETED_IN_AIRTABLE',
      });
    } else {
      // Just deleted in Airtable, no conflict
      result.airtableOnlyChanges.push(recordId);
    }
  }

  return result;
}

// ============================================================================
// Conflict Resolution
// ============================================================================

/**
 * Resolves conflicts based on the specified strategy
 *
 * @param conflicts - Array of detected conflicts
 * @param strategy - Conflict resolution strategy
 * @returns Array of conflict resolutions
 */
export function resolveConflicts(
  conflicts: ConflictInfo[],
  strategy: ConflictResolutionStrategy
): ConflictResolution[] {
  return conflicts.map((conflict) => resolveConflict(conflict, strategy));
}

/**
 * Resolves a single conflict based on the strategy
 */
function resolveConflict(
  conflict: ConflictInfo,
  strategy: ConflictResolutionStrategy
): ConflictResolution {
  // Handle deletion conflicts
  if (conflict.conflictType === 'DELETED_IN_AIRTABLE') {
    if (strategy === 'AIRTABLE_WINS') {
      return {
        recordId: conflict.recordId,
        action: 'DELETE',
        winner: 'AIRTABLE',
        reason: 'Record deleted in Airtable, applying deletion to Sheets (AIRTABLE_WINS)',
      };
    } else if (strategy === 'SHEETS_WINS') {
      return {
        recordId: conflict.recordId,
        action: 'USE_SHEETS',
        winner: 'SHEETS',
        reason: 'Record modified in Sheets but deleted in Airtable, recreating in Airtable (SHEETS_WINS)',
      };
    } else {
      // NEWEST_WINS - deletion is considered newer
      return {
        recordId: conflict.recordId,
        action: 'DELETE',
        winner: 'AIRTABLE',
        reason: 'Record deleted in Airtable (deletion considered most recent)',
      };
    }
  }

  if (conflict.conflictType === 'DELETED_IN_SHEETS') {
    if (strategy === 'AIRTABLE_WINS') {
      return {
        recordId: conflict.recordId,
        action: 'USE_AIRTABLE',
        winner: 'AIRTABLE',
        reason: 'Record modified in Airtable but deleted in Sheets, restoring to Sheets (AIRTABLE_WINS)',
      };
    } else if (strategy === 'SHEETS_WINS') {
      return {
        recordId: conflict.recordId,
        action: 'DELETE',
        winner: 'SHEETS',
        reason: 'Record deleted in Sheets, applying deletion to Airtable (SHEETS_WINS)',
      };
    } else {
      // NEWEST_WINS - deletion is considered newer
      return {
        recordId: conflict.recordId,
        action: 'DELETE',
        winner: 'SHEETS',
        reason: 'Record deleted in Sheets (deletion considered most recent)',
      };
    }
  }

  // Handle BOTH_MODIFIED conflicts
  if (strategy === 'AIRTABLE_WINS') {
    return {
      recordId: conflict.recordId,
      action: 'USE_AIRTABLE',
      winner: 'AIRTABLE',
      reason: 'Both sides modified, Airtable takes precedence (AIRTABLE_WINS)',
    };
  }

  if (strategy === 'SHEETS_WINS') {
    return {
      recordId: conflict.recordId,
      action: 'USE_SHEETS',
      winner: 'SHEETS',
      reason: 'Both sides modified, Sheets takes precedence (SHEETS_WINS)',
    };
  }

  // NEWEST_WINS - compare timestamps
  const airtableTime = conflict.airtableState.modifiedTime
    ? new Date(conflict.airtableState.modifiedTime).getTime()
    : 0;
  const sheetsTime = conflict.sheetsState.modifiedTime
    ? new Date(conflict.sheetsState.modifiedTime).getTime()
    : 0;

  if (airtableTime === 0 && sheetsTime === 0) {
    // No timestamps available, default to Airtable
    return {
      recordId: conflict.recordId,
      action: 'USE_AIRTABLE',
      winner: 'AIRTABLE',
      reason: 'Both sides modified, no timestamps available, defaulting to Airtable',
    };
  }

  if (airtableTime > sheetsTime) {
    return {
      recordId: conflict.recordId,
      action: 'USE_AIRTABLE',
      winner: 'AIRTABLE',
      reason: `Both sides modified, Airtable is newer (${new Date(airtableTime).toISOString()})`,
    };
  } else if (sheetsTime > airtableTime) {
    return {
      recordId: conflict.recordId,
      action: 'USE_SHEETS',
      winner: 'SHEETS',
      reason: `Both sides modified, Sheets is newer (${new Date(sheetsTime).toISOString()})`,
    };
  } else {
    // Same timestamp, default to Airtable
    return {
      recordId: conflict.recordId,
      action: 'USE_AIRTABLE',
      winner: 'AIRTABLE',
      reason: 'Both sides modified at same time, defaulting to Airtable',
    };
  }
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Updates the sync state after a successful sync
 */
export function updateSyncState(
  syncConfigId: string,
  airtableRecords: AirtableRecord[],
  sheetsRows: any[][],
  idColumnIndex?: number
): void {
  const airtableStates = captureAirtableState(airtableRecords);
  const sheetsStates = captureSheetsState(sheetsRows, idColumnIndex);

  // Merge both states
  const allRecords = new Map<string, RecordState>();

  airtableStates.forEach((state) => {
    allRecords.set(state.recordId, state);
  });

  // Update with Sheets data where available
  sheetsStates.forEach((state, recordId) => {
    const existing = allRecords.get(recordId);
    if (existing) {
      // Merge timestamps
      allRecords.set(recordId, {
        ...existing,
        sheetsModifiedTime: state.sheetsModifiedTime,
      });
    } else {
      allRecords.set(recordId, state);
    }
  });

  stateManager.setState(syncConfigId, {
    syncConfigId,
    records: allRecords,
    lastSyncTime: Date.now(),
  });
}

/**
 * Gets the current sync state for a config
 */
export function getSyncState(syncConfigId: string): SyncState | undefined {
  return stateManager.getState(syncConfigId);
}

/**
 * Clears the sync state for a config
 */
export function clearSyncState(syncConfigId: string): void {
  stateManager.clearState(syncConfigId);
}

/**
 * Gets statistics about sync states
 */
export function getSyncStateStats(): {
  totalConfigs: number;
  totalRecords: number;
  configs: Array<{ id: string; recordCount: number; lastSync: number }>;
} {
  return stateManager.getStats();
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Checks if a record has actually changed based on content hash
 */
export function hasRecordChanged(
  currentHash: string,
  previousHash?: string
): boolean {
  if (!previousHash) return true;
  return currentHash !== previousHash;
}

/**
 * Gets a summary of conflict detection results
 */
export function summarizeConflicts(result: ConflictDetectionResult): {
  totalConflicts: number;
  totalChanges: number;
  summary: string;
} {
  const totalConflicts = result.conflicts.length;
  const totalChanges =
    result.airtableOnlyChanges.length +
    result.sheetsOnlyChanges.length +
    result.newInAirtable.length +
    result.newInSheets.length;

  const parts: string[] = [];
  if (result.conflicts.length > 0) {
    parts.push(`${result.conflicts.length} conflicts`);
  }
  if (result.airtableOnlyChanges.length > 0) {
    parts.push(`${result.airtableOnlyChanges.length} Airtable changes`);
  }
  if (result.sheetsOnlyChanges.length > 0) {
    parts.push(`${result.sheetsOnlyChanges.length} Sheets changes`);
  }
  if (result.newInAirtable.length > 0) {
    parts.push(`${result.newInAirtable.length} new in Airtable`);
  }
  if (result.newInSheets.length > 0) {
    parts.push(`${result.newInSheets.length} new in Sheets`);
  }
  if (result.noChanges.length > 0) {
    parts.push(`${result.noChanges.length} unchanged`);
  }

  return {
    totalConflicts,
    totalChanges,
    summary: parts.join(', '),
  };
}
