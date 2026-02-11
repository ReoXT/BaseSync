/**
 * Linked Record Resolver
 * Efficiently resolves linked records between IDs and human-readable names
 * Critical for BaseSync's value prop - makes linked records usable in Google Sheets
 */
import { listRecords, getBaseSchema, createRecords } from '../airtable/client';
// ============================================================================
// In-Memory Cache with TTL
// ============================================================================
class LinkedRecordCacheManager {
    cache = new Map();
    defaultTTL = 5 * 60 * 1000; // 5 minutes
    /**
     * Generates a cache key for a specific table
     */
    getCacheKey(baseId, tableId) {
        return `${baseId}:${tableId}`;
    }
    /**
     * Gets cache for a table, returns undefined if expired
     */
    getCache(baseId, tableId, ttl) {
        const key = this.getCacheKey(baseId, tableId);
        const cached = this.cache.get(key);
        if (!cached)
            return undefined;
        const maxAge = ttl ?? this.defaultTTL;
        const age = Date.now() - cached.timestamp;
        if (age > maxAge) {
            // Cache expired, remove it
            this.cache.delete(key);
            return undefined;
        }
        return cached;
    }
    /**
     * Sets cache for a table
     */
    setCache(baseId, tableId, cache) {
        const key = this.getCacheKey(baseId, tableId);
        this.cache.set(key, cache);
    }
    /**
     * Updates existing cache with new records
     */
    updateCache(baseId, tableId, records) {
        const key = this.getCacheKey(baseId, tableId);
        const existing = this.cache.get(key);
        if (existing) {
            records.forEach((record) => {
                existing.idToName.set(record.id, record.name);
                existing.nameToId.set(record.name.toLowerCase(), record.id);
            });
            existing.timestamp = Date.now(); // Refresh timestamp
        }
        else {
            // Create new cache
            const newCache = {
                idToName: new Map(records.map((r) => [r.id, r.name])),
                nameToId: new Map(records.map((r) => [r.name.toLowerCase(), r.id])),
                timestamp: Date.now(),
            };
            this.cache.set(key, newCache);
        }
    }
    /**
     * Clears all cache entries
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Clears cache for a specific table
     */
    clearTable(baseId, tableId) {
        const key = this.getCacheKey(baseId, tableId);
        this.cache.delete(key);
    }
    /**
     * Clears expired cache entries
     */
    clearExpired(ttl) {
        const maxAge = ttl ?? this.defaultTTL;
        const now = Date.now();
        for (const [key, cache] of this.cache.entries()) {
            if (now - cache.timestamp > maxAge) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * Gets cache statistics
     */
    getStats() {
        const tables = Array.from(this.cache.entries()).map(([key, cache]) => ({
            key,
            recordCount: cache.idToName.size,
            age: Date.now() - cache.timestamp,
        }));
        return {
            totalEntries: this.cache.size,
            tables,
        };
    }
}
// Global cache instance
const cacheManager = new LinkedRecordCacheManager();
// ============================================================================
// Core Resolution Functions
// ============================================================================
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
export async function resolveLinkedRecordNames(accessToken, baseId, tableId, recordIds, options = {}) {
    const { cacheTTL, strictMode = true } = options;
    const result = {
        resolved: [],
        missing: [],
        created: [],
        warnings: [],
    };
    if (recordIds.length === 0) {
        return result;
    }
    // Check cache first
    let cache = cacheManager.getCache(baseId, tableId, cacheTTL);
    // If cache exists, try to resolve from it
    if (cache) {
        const uncachedIds = [];
        for (const recordId of recordIds) {
            const name = cache.idToName.get(recordId);
            if (name) {
                result.resolved.push(name);
            }
            else {
                uncachedIds.push(recordId);
            }
        }
        // If all resolved from cache, return early
        if (uncachedIds.length === 0) {
            return result;
        }
        // Fetch only the uncached records
        recordIds.splice(0, recordIds.length, ...uncachedIds);
    }
    // Fetch records from Airtable
    try {
        // Use filterByFormula to fetch only the specific records we need
        const formula = `OR(${recordIds.map((id) => `RECORD_ID()='${id}'`).join(',')})`;
        const records = await listRecords(accessToken, baseId, tableId, {
            filterByFormula: formula,
            maxRecords: recordIds.length,
        });
        // Get the table schema to identify the primary field
        const schema = await getBaseSchema(accessToken, baseId);
        const table = schema.tables.find((t) => t.id === tableId || t.name === tableId);
        if (!table) {
            throw new Error(`Table ${tableId} not found in base schema`);
        }
        const primaryField = table.fields.find((f) => f.id === table.primaryFieldId);
        if (!primaryField) {
            result.warnings.push('Could not identify primary field, using first field value');
        }
        // Build cache updates and resolve names
        const cacheUpdates = [];
        for (const recordId of recordIds) {
            const record = records.find((r) => r.id === recordId);
            if (record) {
                // Get primary field value
                const primaryValue = primaryField
                    ? record.fields[primaryField.name]
                    : Object.values(record.fields)[0];
                const name = primaryValue ? String(primaryValue) : recordId;
                result.resolved.push(name);
                cacheUpdates.push({ id: recordId, name });
            }
            else {
                result.missing.push(recordId);
                if (strictMode) {
                    result.warnings.push(`Record ID ${recordId} not found in table ${tableId}`);
                }
            }
        }
        // Update cache with newly fetched records
        if (cacheUpdates.length > 0) {
            cacheManager.updateCache(baseId, tableId, cacheUpdates);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.warnings.push(`Failed to fetch linked records: ${errorMessage}`);
        // In non-strict mode, return IDs as fallback
        if (!strictMode) {
            result.resolved.push(...recordIds);
        }
        else {
            result.missing.push(...recordIds);
        }
    }
    return result;
}
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
export async function resolveNamesToRecordIds(accessToken, baseId, tableId, names, options = {}) {
    const { cacheTTL, createMissing = false, strictMode = true } = options;
    const result = {
        resolved: [],
        missing: [],
        created: [],
        warnings: [],
    };
    if (names.length === 0) {
        return result;
    }
    // Normalize names (trim and remove duplicates)
    const normalizedNames = [...new Set(names.map((n) => n.trim()))].filter((n) => n);
    if (normalizedNames.length === 0) {
        return result;
    }
    // Check cache first
    let cache = cacheManager.getCache(baseId, tableId, cacheTTL);
    if (cache) {
        const uncachedNames = [];
        for (const name of normalizedNames) {
            const recordId = cache.nameToId.get(name.toLowerCase());
            if (recordId) {
                result.resolved.push(recordId);
            }
            else {
                uncachedNames.push(name);
            }
        }
        // If all resolved from cache, return early
        if (uncachedNames.length === 0) {
            return result;
        }
        // Continue with only uncached names
        normalizedNames.splice(0, normalizedNames.length, ...uncachedNames);
    }
    // Fetch records from Airtable
    try {
        // Get the table schema to identify the primary field
        const schema = await getBaseSchema(accessToken, baseId);
        const table = schema.tables.find((t) => t.id === tableId || t.name === tableId);
        if (!table) {
            throw new Error(`Table ${tableId} not found in base schema`);
        }
        const primaryField = table.fields.find((f) => f.id === table.primaryFieldId);
        if (!primaryField) {
            throw new Error('Could not identify primary field for linked table');
        }
        // Fetch all records from the linked table
        // Note: For large tables, this could be optimized with filterByFormula
        // but that requires exact name matching which may miss case variations
        const records = await listRecords(accessToken, baseId, tableId);
        // Build a lookup map of primary field values to record IDs
        const nameLookup = new Map();
        const cacheUpdates = [];
        for (const record of records) {
            const primaryValue = record.fields[primaryField.name];
            if (primaryValue) {
                const name = String(primaryValue);
                nameLookup.set(name.toLowerCase(), record.id);
                cacheUpdates.push({ id: record.id, name });
            }
        }
        // Update cache with all fetched records
        if (cacheUpdates.length > 0) {
            cacheManager.updateCache(baseId, tableId, cacheUpdates);
        }
        // Resolve names to IDs
        const missingNames = [];
        for (const name of normalizedNames) {
            const recordId = nameLookup.get(name.toLowerCase());
            if (recordId) {
                result.resolved.push(recordId);
            }
            else {
                missingNames.push(name);
            }
        }
        // Handle missing names
        if (missingNames.length > 0) {
            if (createMissing) {
                // Create new records for missing names
                try {
                    const newRecords = await createNewLinkedRecords(accessToken, baseId, tableId, primaryField.name, missingNames);
                    result.resolved.push(...newRecords.map((r) => r.id));
                    result.created.push(...newRecords.map((r) => r.id));
                    result.warnings.push(`Created ${newRecords.length} new records: ${missingNames.join(', ')}`);
                    // Update cache with newly created records
                    const newCacheUpdates = newRecords.map((r, i) => ({
                        id: r.id,
                        name: missingNames[i],
                    }));
                    cacheManager.updateCache(baseId, tableId, newCacheUpdates);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    result.warnings.push(`Failed to create new records: ${errorMessage}`);
                    result.missing.push(...missingNames);
                }
            }
            else {
                result.missing.push(...missingNames);
                if (strictMode) {
                    result.warnings.push(`The following names were not found in linked table: ${missingNames.join(', ')}`);
                }
            }
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.warnings.push(`Failed to resolve names to record IDs: ${errorMessage}`);
        result.missing.push(...normalizedNames);
    }
    return result;
}
/**
 * Helper function to create new records in a linked table
 */
async function createNewLinkedRecords(accessToken, baseId, tableId, primaryFieldName, names) {
    // Create records in batches of 10 (Airtable limit)
    const batchSize = 10;
    const allCreatedRecords = [];
    for (let i = 0; i < names.length; i += batchSize) {
        const batch = names.slice(i, i + batchSize);
        const recordData = batch.map((name) => ({
            fields: { [primaryFieldName]: name },
        }));
        const createdRecords = await createRecords(accessToken, baseId, tableId, recordData);
        allCreatedRecords.push(...createdRecords);
    }
    return allCreatedRecords;
}
// ============================================================================
// Batch Resolution Helpers
// ============================================================================
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
export async function resolveAllLinkedRecords(accessToken, baseId, tableId, records, options = {}) {
    const warnings = [];
    if (records.length === 0) {
        return { records, warnings };
    }
    // Get table schema to identify linked record fields
    const schema = await getBaseSchema(accessToken, baseId);
    const table = schema.tables.find((t) => t.id === tableId || t.name === tableId);
    if (!table) {
        warnings.push(`Table ${tableId} not found in schema`);
        return { records, warnings };
    }
    // Find all linked record fields
    const linkedFields = table.fields.filter((f) => f.type === 'multipleRecordLinks');
    if (linkedFields.length === 0) {
        return { records, warnings }; // No linked fields to resolve
    }
    // Group record IDs by linked table to minimize API calls
    const linkedTableMap = new Map();
    for (const field of linkedFields) {
        const linkedTableId = field.options?.linkedTableId;
        if (!linkedTableId)
            continue;
        const fieldData = { fieldName: field.name, recordIds: new Set() };
        // Collect all record IDs for this field across all records
        for (const record of records) {
            const value = record.fields[field.name];
            if (Array.isArray(value)) {
                value.forEach((item) => {
                    if (item && typeof item === 'object' && 'id' in item) {
                        fieldData.recordIds.add(item.id);
                    }
                });
            }
        }
        if (fieldData.recordIds.size > 0) {
            const existing = linkedTableMap.get(linkedTableId) || [];
            existing.push(fieldData);
            linkedTableMap.set(linkedTableId, existing);
        }
    }
    // Resolve all linked records per table
    const resolutionMap = new Map(); // linkedTableId -> (recordId -> name)
    for (const [linkedTableId, fields] of linkedTableMap.entries()) {
        // Collect all unique record IDs for this linked table
        const allRecordIds = new Set();
        fields.forEach((f) => f.recordIds.forEach((id) => allRecordIds.add(id)));
        // Resolve all at once
        const result = await resolveLinkedRecordNames(accessToken, baseId, linkedTableId, Array.from(allRecordIds), options);
        // Build lookup map
        const lookup = new Map();
        const recordIdsArray = Array.from(allRecordIds);
        result.resolved.forEach((name, index) => {
            if (recordIdsArray[index]) {
                lookup.set(recordIdsArray[index], name);
            }
        });
        resolutionMap.set(linkedTableId, lookup);
        if (result.warnings.length > 0) {
            warnings.push(...result.warnings);
        }
    }
    // Apply resolved names to records
    const enrichedRecords = records.map((record) => {
        const _resolvedLinks = {};
        for (const field of linkedFields) {
            const linkedTableId = field.options?.linkedTableId;
            if (!linkedTableId)
                continue;
            const lookup = resolutionMap.get(linkedTableId);
            if (!lookup)
                continue;
            const value = record.fields[field.name];
            if (Array.isArray(value)) {
                const names = value
                    .map((item) => {
                    if (item && typeof item === 'object' && 'id' in item) {
                        const id = item.id;
                        return lookup.get(id) || id; // Fallback to ID if not resolved
                    }
                    return null;
                })
                    .filter((name) => name !== null);
                _resolvedLinks[field.name] = names;
            }
        }
        return {
            ...record,
            _resolvedLinks: Object.keys(_resolvedLinks).length > 0 ? _resolvedLinks : undefined,
        };
    });
    return { records: enrichedRecords, warnings };
}
// ============================================================================
// Cache Management Utilities
// ============================================================================
/**
 * Clears the entire linked record cache
 */
export function clearLinkedRecordCache() {
    cacheManager.clear();
}
/**
 * Clears cache for a specific table
 */
export function clearTableCache(baseId, tableId) {
    cacheManager.clearTable(baseId, tableId);
}
/**
 * Clears expired cache entries
 */
export function clearExpiredCache(ttl) {
    cacheManager.clearExpired(ttl);
}
/**
 * Gets cache statistics
 */
export function getCacheStats() {
    return cacheManager.getStats();
}
/**
 * Pre-loads cache for a table (useful for batch operations)
 */
export async function preloadTableCache(accessToken, baseId, tableId) {
    const startTime = Date.now();
    // Get table schema to find primary field
    const schema = await getBaseSchema(accessToken, baseId);
    const table = schema.tables.find((t) => t.id === tableId || t.name === tableId);
    if (!table) {
        throw new Error(`Table ${tableId} not found in base schema`);
    }
    const primaryField = table.fields.find((f) => f.id === table.primaryFieldId);
    if (!primaryField) {
        throw new Error('Could not identify primary field for table');
    }
    // Fetch all records
    const records = await listRecords(accessToken, baseId, tableId);
    // Build cache
    const cacheUpdates = [];
    for (const record of records) {
        const primaryValue = record.fields[primaryField.name];
        if (primaryValue) {
            cacheUpdates.push({ id: record.id, name: String(primaryValue) });
        }
    }
    cacheManager.updateCache(baseId, tableId, cacheUpdates);
    const duration = Date.now() - startTime;
    return { recordCount: cacheUpdates.length, duration };
}
//# sourceMappingURL=linkedRecordResolver.js.map