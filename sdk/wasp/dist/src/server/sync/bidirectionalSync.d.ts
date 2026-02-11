/**
 * Bidirectional Sync Orchestrator
 * Orchestrates two-way sync between Airtable and Google Sheets with conflict detection and resolution
 *
 * This is the most complex sync function - coordinates multiple sync operations,
 * detects conflicts, applies resolution strategies, and maintains sync state.
 */
import { type ConflictResolutionStrategy } from './conflictDetector';
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
export declare function syncBidirectional(options: BidirectionalSyncOptions): Promise<BidirectionalSyncResult>;
/**
 * Creates a new phase result
 */
declare function createPhaseResult(phase: string): PhaseResult;
/**
 * Executes a sync phase with error handling and timing
 */
declare function executePhase(phaseName: string, fn: () => Promise<{
    errors?: SyncError[];
    warnings?: string[];
    metadata?: any;
}>): Promise<PhaseResult>;
/**
 * Classifies an error into a SyncError with appropriate type and metadata
 */
declare function classifyError(error: unknown, phase: string, recordId?: string, rowNumber?: number): SyncError;
/**
 * Retries a function with exponential backoff
 */
declare function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number, operation: string, context?: {
    recordId?: string;
    rowNumber?: number;
    phase?: string;
}): Promise<T>;
/**
 * Chunks an array into smaller arrays
 */
declare function chunkArray<T>(array: T[], size: number): T[][];
export { createPhaseResult, executePhase, retryWithBackoff, chunkArray, classifyError };
//# sourceMappingURL=bidirectionalSync.d.ts.map