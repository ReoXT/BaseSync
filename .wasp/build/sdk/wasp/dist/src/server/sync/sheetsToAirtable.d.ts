/**
 * Google Sheets → Airtable One-Way Sync
 * Syncs data from Google Sheets to Airtable with comprehensive error handling
 */
export interface SheetsToAirtableSyncOptions {
    /** Google Sheets access token */
    sheetsAccessToken: string;
    /** Airtable access token */
    airtableAccessToken: string;
    /** Google Sheets spreadsheet ID */
    spreadsheetId: string;
    /** Google Sheet ID (name or gid) */
    sheetId: string | number;
    /** Airtable base ID */
    baseId: string;
    /** Airtable table ID or name */
    tableId: string;
    /** Field mappings: { airtableFieldId: columnIndex } */
    fieldMappings?: Record<string, number>;
    /** Column index containing Airtable record IDs (default: 0) */
    idColumnIndex?: number;
    /** Whether to skip header row (default: true) */
    skipHeaderRow?: boolean;
    /** Whether to delete records in Airtable not in Sheets (default: false) */
    deleteExtraRecords?: boolean;
    /** Whether to resolve linked record names to IDs (default: true) */
    resolveLinkedRecords?: boolean;
    /** Whether to create missing linked records (default: false) */
    createMissingLinkedRecords?: boolean;
    /** Maximum retries for rate limit errors (default: 3) */
    maxRetries?: number;
    /** Batch size for Airtable operations (max 10) */
    batchSize?: number;
    /** Validation mode: 'strict' throws on invalid data, 'lenient' skips invalid rows */
    validationMode?: 'strict' | 'lenient';
}
export interface SyncResult {
    /** Number of records added to Airtable */
    added: number;
    /** Number of records updated in Airtable */
    updated: number;
    /** Number of records deleted from Airtable */
    deleted: number;
    /** Total number of rows processed */
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
    /** Row number in Sheets where error occurred */
    rowNumber?: number;
    /** Record ID if applicable */
    recordId?: string;
    /** Error message */
    message: string;
    /** Error type */
    type: 'FETCH' | 'TRANSFORM' | 'WRITE' | 'VALIDATION' | 'RATE_LIMIT' | 'LINKED_RECORD' | 'UNKNOWN';
    /** Original error object */
    originalError?: any;
}
/**
 * Syncs data from Google Sheets to Airtable (one-way)
 *
 * Process:
 * 1. Fetch all rows from Google Sheets
 * 2. Fetch table schema from Airtable
 * 3. Preload linked record caches (if needed)
 * 4. Transform Sheets rows to Airtable records
 * 5. Fetch existing Airtable records
 * 6. Calculate diff (create/update/delete)
 * 7. Apply changes to Airtable in batches (max 10 per batch)
 * 8. Return sync summary
 */
export declare function syncSheetsToAirtable(options: SheetsToAirtableSyncOptions): Promise<SyncResult>;
/**
 * Checks if a record has changed by comparing fields
 */
declare function hasRecordChanged(newFields: Record<string, any>, existingFields: Record<string, any>): boolean;
/**
 * Normalizes a field value for comparison
 */
declare function normalizeFieldValue(value: any): any;
/**
 * Compares two normalized values for equality
 */
declare function areValuesEqual(val1: any, val2: any): boolean;
/**
 * Checks if a row is completely empty
 */
declare function isRowEmpty(row: any[]): boolean;
/**
 * Retries a function with exponential backoff
 */
declare function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number, operation: string): Promise<T>;
export { retryWithBackoff, hasRecordChanged, normalizeFieldValue, areValuesEqual, isRowEmpty, };
//# sourceMappingURL=sheetsToAirtable.d.ts.map