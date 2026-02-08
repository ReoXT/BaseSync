/**
 * Airtable → Google Sheets One-Way Sync
 * Syncs data from Airtable to Google Sheets with comprehensive error handling
 */
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
export declare function syncAirtableToSheets(options: AirtableToSheetsSyncOptions): Promise<SyncResult>;
/**
 * Compares two rows for equality
 */
declare function areRowsEqual(row1: any[], row2: any[]): boolean;
/**
 * Normalizes a cell value for comparison
 */
declare function normalizeValue(value: any): string;
/**
 * Retries a function with exponential backoff
 */
declare function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number, operation: string): Promise<T>;
/**
 * Chunks an array into smaller arrays of specified size
 */
declare function chunkArray<T>(array: T[], size: number): T[][];
export { chunkArray, retryWithBackoff, areRowsEqual, normalizeValue };
//# sourceMappingURL=airtableToSheets.d.ts.map