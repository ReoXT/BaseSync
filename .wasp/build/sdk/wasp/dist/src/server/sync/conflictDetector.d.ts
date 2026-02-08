/**
 * Conflict Detector for Bidirectional Sync
 * Detects and resolves conflicts when the same record changes in both Airtable and Sheets
 */
import type { AirtableRecord } from '../airtable/client';
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
/**
 * Generates a hash of record field values for change detection
 * This allows us to detect actual changes vs. no-op updates
 */
export declare function generateRecordHash(fields: Record<string, any>): string;
/**
 * Generates a hash of a Sheets row for change detection
 */
export declare function generateRowHash(row: any[]): string;
/**
 * Captures the current state of Airtable records
 * @param records - Airtable records to capture
 *
 * CRITICAL: Always hashes ALL fields in Airtable records, not just mapped fields.
 * This ensures we detect changes to any field in Airtable, even if it's not mapped to Sheets.
 */
export declare function captureAirtableState(records: AirtableRecord[]): RecordState[];
/**
 * Captures the current state of Sheets rows
 * @param rows - Array of rows from Sheets
 * @param idColumnIndex - Column index containing Airtable record IDs (optional)
 */
export declare function captureSheetsState(rows: any[][], idColumnIndex?: number): Map<string, RecordState>;
/**
 * Detects conflicts between Airtable and Sheets states
 *
 * @param airtableRecords - Current records from Airtable
 * @param sheetsRows - Current rows from Sheets
 * @param syncConfigId - Sync configuration ID
 * @param idColumnIndex - Column index in Sheets containing Airtable record IDs
 * @returns Conflict detection results
 */
export declare function detectConflicts(airtableRecords: AirtableRecord[], sheetsRows: any[][], syncConfigId: string, idColumnIndex?: number): ConflictDetectionResult;
/**
 * Resolves conflicts based on the specified strategy
 *
 * @param conflicts - Array of detected conflicts
 * @param strategy - Conflict resolution strategy
 * @returns Array of conflict resolutions
 */
export declare function resolveConflicts(conflicts: ConflictInfo[], strategy: ConflictResolutionStrategy): ConflictResolution[];
/**
 * Updates the sync state after a successful sync
 */
export declare function updateSyncState(syncConfigId: string, airtableRecords: AirtableRecord[], sheetsRows: any[][], idColumnIndex?: number): void;
/**
 * Gets the current sync state for a config
 */
export declare function getSyncState(syncConfigId: string): SyncState | undefined;
/**
 * Clears the sync state for a config
 */
export declare function clearSyncState(syncConfigId: string): void;
/**
 * Gets statistics about sync states
 */
export declare function getSyncStateStats(): {
    totalConfigs: number;
    totalRecords: number;
    configs: Array<{
        id: string;
        recordCount: number;
        lastSync: number;
    }>;
};
/**
 * Checks if a record has actually changed based on content hash
 */
export declare function hasRecordChanged(currentHash: string, previousHash?: string): boolean;
/**
 * Gets a summary of conflict detection results
 */
export declare function summarizeConflicts(result: ConflictDetectionResult): {
    totalConflicts: number;
    totalChanges: number;
    summary: string;
};
//# sourceMappingURL=conflictDetector.d.ts.map