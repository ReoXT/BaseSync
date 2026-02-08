/**
 * Linked Record Resolver
 * Efficiently resolves linked records between IDs and human-readable names
 * Critical for BaseSync's value prop - makes linked records usable in Google Sheets
 */
import type { AirtableRecord } from '../airtable/client';
export interface LinkedRecordCache {
    /** Map of record ID to primary field value */
    idToName: Map<string, string>;
    /** Map of primary field value (lowercase) to record ID */
    nameToId: Map<string, string>;
    /** Timestamp when cache was created */
    timestamp: number;
}
export interface ResolveOptions {
    /** Time-to-live for cache entries in milliseconds (default: 5 minutes) */
    cacheTTL?: number;
    /** Whether to create new records if names don't exist (default: false) */
    createMissing?: boolean;
    /** Whether to throw errors on missing records (default: true) */
    strictMode?: boolean;
}
export interface ResolveResult {
    /** Successfully resolved record IDs or names */
    resolved: string[];
    /** Items that couldn't be resolved */
    missing: string[];
    /** Items that were newly created (if createMissing is true) */
    created: string[];
    /** Any warnings during resolution */
    warnings: string[];
}
/**
 * Resolves linked record IDs to their primary field values (human-readable names)
 *
 * @param accessToken - Airtable access token
 * @param baseId - Airtable base ID
 * @param tableId - The linked table ID (where the records live)
 * @param recordIds - Array of record IDs to resolve
 * @param options - Resolution options
 * @returns Resolved names and resolution metadata
 */
export declare function resolveLinkedRecordNames(accessToken: string, baseId: string, tableId: string, recordIds: string[], options?: ResolveOptions): Promise<ResolveResult>;
/**
 * Resolves human-readable names to record IDs in a linked table
 *
 * @param accessToken - Airtable access token
 * @param baseId - Airtable base ID
 * @param tableId - The linked table ID (where the records should be found/created)
 * @param names - Array of human-readable names to resolve
 * @param options - Resolution options
 * @returns Resolved record IDs and resolution metadata
 */
export declare function resolveNamesToRecordIds(accessToken: string, baseId: string, tableId: string, names: string[], options?: ResolveOptions): Promise<ResolveResult>;
/**
 * Resolves all linked record fields in multiple Airtable records
 * Optimized to minimize API calls by batching requests per linked table
 *
 * @param accessToken - Airtable access token
 * @param baseId - Airtable base ID
 * @param tableId - Current table ID (for schema lookup)
 * @param records - Array of Airtable records to process
 * @param options - Resolution options
 * @returns Records with resolved linked record names
 */
export declare function resolveAllLinkedRecords(accessToken: string, baseId: string, tableId: string, records: AirtableRecord[], options?: ResolveOptions): Promise<{
    records: Array<AirtableRecord & {
        _resolvedLinks?: Record<string, string[]>;
    }>;
    warnings: string[];
}>;
/**
 * Clears the entire linked record cache
 */
export declare function clearLinkedRecordCache(): void;
/**
 * Clears cache for a specific table
 */
export declare function clearTableCache(baseId: string, tableId: string): void;
/**
 * Clears expired cache entries
 */
export declare function clearExpiredCache(ttl?: number): void;
/**
 * Gets cache statistics
 */
export declare function getCacheStats(): {
    totalEntries: number;
    tables: Array<{
        key: string;
        recordCount: number;
        age: number;
    }>;
};
/**
 * Pre-loads cache for a table (useful for batch operations)
 */
export declare function preloadTableCache(accessToken: string, baseId: string, tableId: string): Promise<{
    recordCount: number;
    duration: number;
}>;
//# sourceMappingURL=linkedRecordResolver.d.ts.map