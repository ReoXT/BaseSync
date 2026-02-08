/**
 * Conflict Detector for Bidirectional Sync
 * Detects and resolves conflicts when the same record changes in both Airtable and Sheets
 */
import crypto from 'crypto';
// ============================================================================
// In-Memory State Storage
// ============================================================================
class SyncStateManager {
    states = new Map();
    /**
     * Gets the sync state for a config
     */
    getState(syncConfigId) {
        return this.states.get(syncConfigId);
    }
    /**
     * Sets the sync state for a config
     */
    setState(syncConfigId, state) {
        this.states.set(syncConfigId, state);
    }
    /**
     * Updates the state for a single record
     */
    updateRecordState(syncConfigId, recordState) {
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
    removeRecordState(syncConfigId, recordId) {
        const state = this.states.get(syncConfigId);
        if (state) {
            state.records.delete(recordId);
        }
    }
    /**
     * Clears state for a sync config
     */
    clearState(syncConfigId) {
        this.states.delete(syncConfigId);
    }
    /**
     * Clears all states
     */
    clearAll() {
        this.states.clear();
    }
    /**
     * Gets statistics about stored states
     */
    getStats() {
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
export function generateRecordHash(fields) {
    // Sort keys to ensure consistent hash regardless of field order
    const sortedFields = Object.keys(fields)
        .sort()
        .reduce((acc, key) => {
        acc[key] = normalizeFieldValue(fields[key]);
        return acc;
    }, {});
    const content = JSON.stringify(sortedFields);
    return crypto.createHash('sha256').update(content).digest('hex');
}
/**
 * Generates a hash of a Sheets row for change detection
 */
export function generateRowHash(row) {
    // Normalize array values
    const normalized = row.map(normalizeFieldValue);
    const content = JSON.stringify(normalized);
    return crypto.createHash('sha256').update(content).digest('hex');
}
/**
 * Normalizes field values for consistent hashing
 */
function normalizeFieldValue(value) {
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
        }, {});
    }
    return value;
}
// ============================================================================
// State Capture
// ============================================================================
/**
 * Captures the current state of Airtable records
 * @param records - Airtable records to capture
 *
 * CRITICAL: Always hashes ALL fields in Airtable records, not just mapped fields.
 * This ensures we detect changes to any field in Airtable, even if it's not mapped to Sheets.
 */
export function captureAirtableState(records) {
    const now = Date.now();
    return records.map((record) => {
        // Hash all fields to detect any changes
        const fieldsToHash = record.fields;
        return {
            recordId: record.id,
            contentHash: generateRecordHash(fieldsToHash),
            airtableModifiedTime: record.createdTime,
            capturedAt: now,
        };
    });
}
/**
 * Captures the current state of Sheets rows
 * @param rows - Array of rows from Sheets
 * @param idColumnIndex - Column index containing Airtable record IDs (optional)
 */
export function captureSheetsState(rows, idColumnIndex) {
    const now = Date.now();
    const states = new Map();
    rows.forEach((row, rowIndex) => {
        // CRITICAL FIX: If row doesn't have a record ID yet (first sync), use row index as identifier
        // This allows initial bidirectional sync to work when Sheets has data but no record IDs
        const hasRecordId = idColumnIndex !== undefined && row[idColumnIndex] && String(row[idColumnIndex]).trim() !== '';
        const recordId = hasRecordId
            ? String(row[idColumnIndex]).trim()
            : `row_${rowIndex}`;
        // Skip completely empty rows
        if (isRowEmpty(row)) {
            return;
        }
        // CRITICAL: Exclude ID column from hash to avoid false-positive change detection
        // The ID column is metadata for sync tracking, not user data
        const rowDataOnly = idColumnIndex !== undefined
            ? row.filter((_, idx) => idx !== idColumnIndex)
            : row;
        states.set(recordId, {
            recordId: recordId,
            contentHash: generateRowHash(rowDataOnly),
            sheetsModifiedTime: new Date().toISOString(), // Sheets doesn't provide cell-level timestamps
            capturedAt: now,
        });
    });
    return states;
}
/**
 * Checks if a row is completely empty
 */
function isRowEmpty(row) {
    return row.every((cell) => cell === null || cell === undefined || String(cell).trim() === '');
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
export function detectConflicts(airtableRecords, sheetsRows, syncConfigId, idColumnIndex) {
    const result = {
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
    // CRITICAL: Airtable state now includes ALL fields (not filtered by mappings)
    // This ensures we detect changes to any Airtable field, even unmapped ones
    const currentAirtableStates = new Map(captureAirtableState(airtableRecords).map((s) => [s.recordId, s]));
    const currentSheetsStates = captureSheetsState(sheetsRows, idColumnIndex);
    // DEBUG: Log state for troubleshooting
    console.log(`[ConflictDetector] ========== DEBUG INFO ==========`);
    console.log(`[ConflictDetector] Tracking ALL Airtable fields (not filtered by mappings)`);
    console.log(`[ConflictDetector] ID column index: ${idColumnIndex}`);
    console.log(`[ConflictDetector] Airtable records: ${airtableRecords.length}`);
    console.log(`[ConflictDetector] Sheets rows: ${sheetsRows.length}`);
    console.log(`[ConflictDetector] Has previous state: ${!!lastState}`);
    if (lastState) {
        console.log(`[ConflictDetector] Previous state records: ${lastState.records.size}`);
    }
    // Log first record comparison for debugging
    if (airtableRecords.length > 0) {
        const firstRecord = airtableRecords[0];
        const airtableState = currentAirtableStates.get(firstRecord.id);
        const sheetsState = currentSheetsStates.get(firstRecord.id);
        const lastKnown = lastState?.records.get(firstRecord.id);
        console.log(`[ConflictDetector] --- First Record Debug (${firstRecord.id}) ---`);
        console.log(`[ConflictDetector] Airtable fields:`, JSON.stringify(firstRecord.fields, null, 2));
        // Get the row from Sheets
        const sheetsRow = sheetsRows.find(row => row[idColumnIndex || 0] === firstRecord.id);
        console.log(`[ConflictDetector] Sheets row:`, JSON.stringify(sheetsRow, null, 2));
        console.log(`[ConflictDetector] Airtable hash: ${airtableState?.contentHash?.substring(0, 16)}...`);
        console.log(`[ConflictDetector] Sheets hash:   ${sheetsState?.contentHash?.substring(0, 16) || 'NOT FOUND'}...`);
        console.log(`[ConflictDetector] Last hash:     ${lastKnown?.contentHash?.substring(0, 16) || 'NO PREVIOUS STATE'}...`);
        if (lastKnown) {
            console.log(`[ConflictDetector] Airtable changed: ${airtableState?.contentHash !== lastKnown.contentHash}`);
            console.log(`[ConflictDetector] Sheets changed:   ${sheetsState?.contentHash !== lastKnown.contentHash}`);
        }
    }
    console.log(`[ConflictDetector] ================================`);
    // If no previous state, everything is new
    if (!lastState) {
        result.newInAirtable = Array.from(currentAirtableStates.keys());
        // CRITICAL FIX: newInSheets should contain row indices for rows without record IDs
        // Parse `row_X` identifiers back to row indices
        result.newInSheets = Array.from(currentSheetsStates.keys())
            .filter((id) => id.startsWith('row_'))
            .map((id) => parseInt(id.replace('row_', ''), 10))
            .filter((n) => !isNaN(n));
        console.log(`[ConflictDetector] First sync detected: ${result.newInAirtable.length} new in Airtable, ${result.newInSheets.length} new in Sheets`);
        return result;
    }
    const lastKnownRecords = lastState.records;
    const processedRecords = new Set();
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
                const record = airtableRecords.find((r) => r.id === recordId);
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
            }
            else {
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
            const record = airtableRecords.find((r) => r.id === recordId);
            const rowIndex = Array.from(currentSheetsStates.entries()).findIndex(([id]) => id === recordId);
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
        }
        else if (airtableChanged) {
            result.airtableOnlyChanges.push(recordId);
        }
        else if (sheetsChanged) {
            result.sheetsOnlyChanges.push(recordId);
        }
        else {
            result.noChanges.push(recordId);
        }
    }
    // Check for records that exist in Sheets but not in Airtable
    for (const [recordId, sheetsState] of currentSheetsStates.entries()) {
        if (processedRecords.has(recordId))
            continue;
        const lastKnown = lastKnownRecords.get(recordId);
        // New record in Sheets
        if (!lastKnown) {
            // CRITICAL FIX: Find the row index for this record ID or row identifier
            let rowIndex = -1;
            if (recordId.startsWith('row_')) {
                // Row without record ID - extract index from identifier
                rowIndex = parseInt(recordId.replace('row_', ''), 10);
            }
            else {
                // Row with record ID - find it in sheetsRows by matching the ID column
                rowIndex = sheetsRows.findIndex((row) => idColumnIndex !== undefined && row[idColumnIndex] && String(row[idColumnIndex]).trim() === recordId);
            }
            if (rowIndex >= 0 && !isNaN(rowIndex)) {
                result.newInSheets.push(rowIndex);
            }
            continue;
        }
        // Record deleted in Airtable
        const sheetsChanged = sheetsState.contentHash !== lastKnown.contentHash;
        if (sheetsChanged) {
            // Conflict: modified in Sheets but deleted in Airtable
            // Find row index for this record
            let rowIndex = -1;
            if (recordId.startsWith('row_')) {
                rowIndex = parseInt(recordId.replace('row_', ''), 10);
            }
            else {
                rowIndex = sheetsRows.findIndex((row) => idColumnIndex !== undefined && row[idColumnIndex] && String(row[idColumnIndex]).trim() === recordId);
            }
            result.conflicts.push({
                recordId,
                airtableState: {
                    record: { id: recordId, createdTime: '', fields: {} },
                    contentHash: '',
                    modifiedTime: undefined,
                },
                sheetsState: {
                    row: rowIndex >= 0 ? sheetsRows[rowIndex] : [],
                    contentHash: sheetsState.contentHash,
                    modifiedTime: sheetsState.sheetsModifiedTime,
                },
                lastKnownState: lastKnown,
                conflictType: 'DELETED_IN_AIRTABLE',
            });
        }
        else {
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
export function resolveConflicts(conflicts, strategy) {
    return conflicts.map((conflict) => resolveConflict(conflict, strategy));
}
/**
 * Resolves a single conflict based on the strategy
 */
function resolveConflict(conflict, strategy) {
    // Handle deletion conflicts
    if (conflict.conflictType === 'DELETED_IN_AIRTABLE') {
        if (strategy === 'AIRTABLE_WINS') {
            return {
                recordId: conflict.recordId,
                action: 'DELETE',
                winner: 'AIRTABLE',
                reason: 'Record deleted in Airtable, applying deletion to Sheets (AIRTABLE_WINS)',
            };
        }
        else if (strategy === 'SHEETS_WINS') {
            return {
                recordId: conflict.recordId,
                action: 'USE_SHEETS',
                winner: 'SHEETS',
                reason: 'Record modified in Sheets but deleted in Airtable, recreating in Airtable (SHEETS_WINS)',
            };
        }
        else {
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
        }
        else if (strategy === 'SHEETS_WINS') {
            return {
                recordId: conflict.recordId,
                action: 'DELETE',
                winner: 'SHEETS',
                reason: 'Record deleted in Sheets, applying deletion to Airtable (SHEETS_WINS)',
            };
        }
        else {
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
    // NEWEST_WINS - Since reliable timestamps aren't available (Airtable only has createdTime,
    // Sheets has no modification timestamps), we default to Airtable as source of truth
    // when both sides have truly been modified since last sync
    return {
        recordId: conflict.recordId,
        action: 'USE_AIRTABLE',
        winner: 'AIRTABLE',
        reason: 'Both sides modified since last sync, no reliable modification timestamps available, defaulting to Airtable as source of truth',
    };
}
// ============================================================================
// State Management
// ============================================================================
/**
 * Updates the sync state after a successful sync
 */
export function updateSyncState(syncConfigId, airtableRecords, sheetsRows, idColumnIndex) {
    const airtableStates = captureAirtableState(airtableRecords);
    const sheetsStates = captureSheetsState(sheetsRows, idColumnIndex);
    // Merge both states
    const allRecords = new Map();
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
        }
        else {
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
export function getSyncState(syncConfigId) {
    return stateManager.getState(syncConfigId);
}
/**
 * Clears the sync state for a config
 */
export function clearSyncState(syncConfigId) {
    stateManager.clearState(syncConfigId);
}
/**
 * Gets statistics about sync states
 */
export function getSyncStateStats() {
    return stateManager.getStats();
}
// ============================================================================
// Utilities
// ============================================================================
/**
 * Checks if a record has actually changed based on content hash
 */
export function hasRecordChanged(currentHash, previousHash) {
    if (!previousHash)
        return true;
    return currentHash !== previousHash;
}
/**
 * Gets a summary of conflict detection results
 */
export function summarizeConflicts(result) {
    const totalConflicts = result.conflicts.length;
    const totalChanges = result.airtableOnlyChanges.length +
        result.sheetsOnlyChanges.length +
        result.newInAirtable.length +
        result.newInSheets.length;
    const parts = [];
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
//# sourceMappingURL=conflictDetector.js.map