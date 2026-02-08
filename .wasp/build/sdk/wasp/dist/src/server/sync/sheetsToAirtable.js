/**
 * Google Sheets → Airtable One-Way Sync
 * Syncs data from Google Sheets to Airtable with comprehensive error handling
 */
import { listRecords, getBaseSchema, createRecords, updateRecords, deleteRecords, batchOperations, } from '../airtable/client';
import { getSheetData, updateSheetData, hideColumn, columnNumberToLetter, ensureColumnsExist } from '../google/client';
import { sheetsRowToAirtableFields, sheetsRowToAirtableFieldsWithMapping, isReadOnlyField } from './fieldMapper';
import { resolveNamesToRecordIds, preloadTableCache } from './linkedRecordResolver';
// ============================================================================
// Main Sync Function
// ============================================================================
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
export async function syncSheetsToAirtable(options) {
    const startTime = Date.now();
    const result = {
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
    const { sheetsAccessToken, airtableAccessToken, spreadsheetId, sheetId, baseId, tableId, fieldMappings, idColumnIndex = 0, skipHeaderRow = true, deleteExtraRecords = false, resolveLinkedRecords: shouldResolveLinkedRecords = true, createMissingLinkedRecords = false, maxRetries = 3, batchSize = 10, validationMode = 'lenient', } = options;
    // Validate batch size
    const effectiveBatchSize = Math.min(Math.max(1, batchSize), 10);
    try {
        // ========================================================================
        // STEP 1: Fetch Sheets Data
        // ========================================================================
        console.log(`[SheetsToAirtable] Fetching data from Google Sheets...`);
        let sheetsData = [];
        let sheetData;
        let actualIdColumnIndex = idColumnIndex;
        try {
            // CRITICAL: ALWAYS use a fixed far-right column for IDs to avoid shifting user's visible columns
            // We use column AA (index 26) by default - far enough that it won't interfere with typical data
            // This column will be hidden, so users won't see it, and it won't affect their A-Z column layout
            // This applies to EVERY sync, regardless of whether data exists or not
            if (idColumnIndex === 0) {
                const FIXED_ID_COLUMN_INDEX = 26; // Column AA (A=0, B=1, ..., Z=25, AA=26)
                actualIdColumnIndex = FIXED_ID_COLUMN_INDEX;
                const columnLetter = columnNumberToLetter(actualIdColumnIndex + 1);
                console.log(`[SheetsToAirtable] Using fixed column ${columnLetter} (index ${actualIdColumnIndex}) for record IDs (will be hidden)`);
            }
            // CRITICAL FIX: Fetch data up to column AA explicitly to ensure ID column is included
            // Without this, Google Sheets API might not return trailing empty columns
            const fetchRange = `A:${columnNumberToLetter(actualIdColumnIndex + 1)}`;
            console.log(`[SheetsToAirtable] Fetching range: ${fetchRange} (includes ID column)`);
            sheetData = await retryWithBackoff(() => getSheetData(sheetsAccessToken, spreadsheetId, sheetId, fetchRange), maxRetries, 'fetch Sheets data');
            sheetsData = sheetData.values || [];
            // Skip header row if configured
            if (skipHeaderRow && sheetsData.length > 0) {
                sheetsData = sheetsData.slice(1);
            }
            console.log(`[SheetsToAirtable] Fetched ${sheetsData.length} rows from Sheets`);
        }
        catch (error) {
            result.errors.push({
                type: 'FETCH',
                message: `Failed to fetch Sheets data: ${error instanceof Error ? error.message : String(error)}`,
                originalError: error,
            });
            return finalizeSyncResult(result, startTime);
        }
        // Handle empty sheet
        if (sheetsData.length === 0) {
            console.log(`[SheetsToAirtable] Sheet is empty, no data to sync`);
            result.warnings.push('Sheet is empty, no data to sync');
            return finalizeSyncResult(result, startTime);
        }
        result.total = sheetsData.length;
        // ========================================================================
        // STEP 2: Fetch Airtable Table Schema
        // ========================================================================
        console.log(`[SheetsToAirtable] Fetching Airtable table schema...`);
        let tableFields = [];
        let primaryFieldId = '';
        let primaryFieldName;
        try {
            const schema = await retryWithBackoff(() => getBaseSchema(airtableAccessToken, baseId), maxRetries, 'fetch table schema');
            const table = schema.tables.find((t) => t.id === tableId || t.name === tableId);
            if (!table) {
                throw new Error(`Table ${tableId} not found in base schema`);
            }
            tableFields = table.fields;
            primaryFieldId = table.primaryFieldId;
            // Get primary field name for smart matching
            const primaryField = tableFields.find((f) => f.id === primaryFieldId);
            if (primaryField) {
                primaryFieldName = primaryField.name;
                console.log(`[SheetsToAirtable] Primary field for matching: "${primaryFieldName}"`);
            }
            // Filter out read-only fields
            const writableFields = tableFields.filter((f) => !isReadOnlyField(f.type));
            // Apply field mappings if provided
            if (fieldMappings && Object.keys(fieldMappings).length > 0) {
                const mappedFieldIds = Object.keys(fieldMappings);
                tableFields = writableFields.filter((f) => mappedFieldIds.includes(f.id));
                // Sort by column index
                tableFields.sort((a, b) => (fieldMappings[a.id] || 0) - (fieldMappings[b.id] || 0));
            }
            else {
                tableFields = writableFields;
            }
            console.log(`[SheetsToAirtable] Found ${tableFields.length} writable fields`);
        }
        catch (error) {
            result.errors.push({
                type: 'FETCH',
                message: `Failed to fetch table schema: ${error instanceof Error ? error.message : String(error)}`,
                originalError: error,
            });
            return finalizeSyncResult(result, startTime);
        }
        // ========================================================================
        // STEP 3: Preload Linked Record Caches (Optional)
        // ========================================================================
        if (shouldResolveLinkedRecords) {
            console.log(`[SheetsToAirtable] Preloading linked record caches...`);
            const linkedFields = tableFields.filter((f) => f.type === 'multipleRecordLinks');
            for (const field of linkedFields) {
                const linkedTableId = field.options?.linkedTableId;
                if (!linkedTableId)
                    continue;
                try {
                    const { recordCount, duration } = await preloadTableCache(airtableAccessToken, baseId, linkedTableId);
                    console.log(`[SheetsToAirtable] Preloaded ${recordCount} records from linked table ${linkedTableId} in ${duration}ms`);
                }
                catch (error) {
                    result.warnings.push(`Failed to preload cache for linked table ${linkedTableId}: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }
        // ========================================================================
        // STEP 4: Transform Sheets Rows to Airtable Records
        // ========================================================================
        console.log(`[SheetsToAirtable] Transforming Sheets rows to Airtable records...`);
        const transformedRows = [];
        for (let i = 0; i < sheetsData.length; i++) {
            const row = sheetsData[i];
            const rowNumber = i + (skipHeaderRow ? 2 : 1); // Account for header and 1-based indexing
            // Extract record ID from ID column
            const recordId = row[actualIdColumnIndex] ? String(row[actualIdColumnIndex]).trim() : undefined;
            console.log(`[SheetsToAirtable] Row ${i}: Column ${actualIdColumnIndex} value = "${row[actualIdColumnIndex]}" | Parsed ID = "${recordId}" | Row length = ${row.length}`);
            // Skip completely empty rows
            if (isRowEmpty(row)) {
                result.warnings.push(`Row ${rowNumber} is empty, skipping`);
                continue;
            }
            try {
                // Transform to Airtable fields using field mappings
                // If we have field mappings, extract values from the correct columns
                // Otherwise, use positional mapping (after removing ID column)
                const transformed = fieldMappings && Object.keys(fieldMappings).length > 0
                    ? await sheetsRowToAirtableFieldsWithMapping(row, tableFields, fieldMappings, actualIdColumnIndex, {
                        accessToken: airtableAccessToken,
                        baseId,
                        tableId,
                    })
                    : await sheetsRowToAirtableFields((() => {
                        const dataRow = [...row];
                        dataRow.splice(actualIdColumnIndex, 1);
                        return dataRow;
                    })(), tableFields, {
                        accessToken: airtableAccessToken,
                        baseId,
                        tableId,
                    });
                // Handle linked record resolution
                if (shouldResolveLinkedRecords) {
                    for (const field of tableFields) {
                        if (field.type !== 'multipleRecordLinks')
                            continue;
                        const linkedTableId = field.options?.linkedTableId;
                        if (!linkedTableId || !transformed.fields[field.name])
                            continue;
                        // Value should be comma-separated names (string)
                        const namesValue = transformed.fields[field.name];
                        if (typeof namesValue !== 'string')
                            continue;
                        const names = namesValue.split(',').map((n) => n.trim()).filter((n) => n);
                        if (names.length === 0)
                            continue;
                        try {
                            const resolveResult = await resolveNamesToRecordIds(airtableAccessToken, baseId, linkedTableId, names, {
                                createMissing: createMissingLinkedRecords,
                                strictMode: validationMode === 'strict',
                            });
                            // Convert to Airtable format
                            transformed.fields[field.name] = resolveResult.resolved.map((id) => ({ id }));
                            if (resolveResult.warnings.length > 0) {
                                transformed.warnings.push(...resolveResult.warnings);
                            }
                            if (resolveResult.missing.length > 0) {
                                const msg = `Row ${rowNumber}, field ${field.name}: Could not resolve names: ${resolveResult.missing.join(', ')}`;
                                if (validationMode === 'strict') {
                                    transformed.errors.push(msg);
                                }
                                else {
                                    transformed.warnings.push(msg);
                                }
                            }
                        }
                        catch (error) {
                            const msg = `Row ${rowNumber}, field ${field.name}: Failed to resolve linked records: ${error instanceof Error ? error.message : String(error)}`;
                            if (validationMode === 'strict') {
                                transformed.errors.push(msg);
                            }
                            else {
                                transformed.warnings.push(msg);
                            }
                        }
                    }
                }
                // Check if row is valid
                const isValid = validationMode === 'lenient' || transformed.errors.length === 0;
                transformedRows.push({
                    rowIndex: i,
                    recordId,
                    fields: transformed.fields,
                    errors: transformed.errors,
                    warnings: transformed.warnings,
                    isValid,
                });
                // Log errors and warnings
                if (transformed.errors.length > 0) {
                    result.errors.push({
                        rowNumber,
                        recordId,
                        type: 'TRANSFORM',
                        message: `Transformation errors: ${transformed.errors.join('; ')}`,
                    });
                }
                if (transformed.warnings.length > 0) {
                    result.warnings.push(`Row ${rowNumber}: ${transformed.warnings.join('; ')}`);
                }
            }
            catch (error) {
                const msg = `Failed to transform row ${rowNumber}: ${error instanceof Error ? error.message : String(error)}`;
                if (validationMode === 'strict') {
                    result.errors.push({
                        rowNumber,
                        recordId,
                        type: 'TRANSFORM',
                        message: msg,
                        originalError: error,
                    });
                }
                else {
                    result.warnings.push(msg);
                    // Add invalid row
                    transformedRows.push({
                        rowIndex: i,
                        recordId,
                        fields: {},
                        errors: [msg],
                        warnings: [],
                        isValid: false,
                    });
                }
            }
        }
        // Filter to only valid rows
        const validRows = transformedRows.filter((r) => r.isValid);
        console.log(`[SheetsToAirtable] Transformed ${validRows.length}/${transformedRows.length} valid rows`);
        if (validRows.length === 0 && transformedRows.length > 0) {
            result.errors.push({
                type: 'VALIDATION',
                message: 'No valid rows to sync after transformation',
            });
            return finalizeSyncResult(result, startTime);
        }
        // ========================================================================
        // STEP 5: Fetch Existing Airtable Records
        // ========================================================================
        console.log(`[SheetsToAirtable] Fetching existing Airtable records...`);
        let existingRecords = [];
        try {
            existingRecords = await retryWithBackoff(() => listRecords(airtableAccessToken, baseId, tableId), maxRetries, 'fetch Airtable records');
            console.log(`[SheetsToAirtable] Found ${existingRecords.length} existing records in Airtable`);
        }
        catch (error) {
            result.errors.push({
                type: 'FETCH',
                message: `Failed to fetch existing Airtable records: ${error instanceof Error ? error.message : String(error)}`,
                originalError: error,
            });
            return finalizeSyncResult(result, startTime);
        }
        // ========================================================================
        // STEP 6: Calculate Diff (Create/Update/Delete)
        // ========================================================================
        console.log(`[SheetsToAirtable] Calculating changes...`);
        const diff = calculateRecordDiff(validRows, existingRecords, deleteExtraRecords, primaryFieldName);
        console.log(`[SheetsToAirtable] Changes: ${diff.toCreate.length} to create, ${diff.toUpdate.length} to update, ${diff.toDelete.length} to delete`);
        // ========================================================================
        // STEP 7: Apply Changes to Airtable
        // ========================================================================
        // 7.1: Create new records (in batches of 10)
        const newRecordIdUpdates = [];
        if (diff.toCreate.length > 0) {
            console.log(`[SheetsToAirtable] Creating ${diff.toCreate.length} new records...`);
            const createBatches = batchOperations(diff.toCreate, effectiveBatchSize);
            let createdSoFar = 0;
            for (let i = 0; i < createBatches.length; i++) {
                const batch = createBatches[i];
                try {
                    const created = await retryWithBackoff(() => createRecords(airtableAccessToken, baseId, tableId, batch), maxRetries, `create records batch ${i + 1}/${createBatches.length}`);
                    // Track which rows got which record IDs so we can write them back to Sheets
                    for (let j = 0; j < created.length; j++) {
                        const createdRecord = created[j];
                        const originalRowIndex = validRows.filter(r => !r.recordId)[createdSoFar + j]?.rowIndex;
                        if (originalRowIndex !== undefined && createdRecord.id) {
                            // Store the row number (accounting for header) and the new record ID
                            const sheetRowNumber = originalRowIndex + (skipHeaderRow ? 2 : 1);
                            newRecordIdUpdates.push({ row: sheetRowNumber, recordId: createdRecord.id });
                        }
                    }
                    createdSoFar += created.length;
                    result.added += created.length;
                    console.log(`[SheetsToAirtable] Created batch ${i + 1}/${createBatches.length} (${created.length} records)`);
                }
                catch (error) {
                    result.errors.push({
                        type: 'WRITE',
                        message: `Failed to create records batch ${i + 1}: ${error instanceof Error ? error.message : String(error)}`,
                        originalError: error,
                    });
                    // In lenient mode, continue with remaining batches
                    if (validationMode === 'strict') {
                        return finalizeSyncResult(result, startTime);
                    }
                }
            }
        }
        // 7.2: Update existing records (in batches of 10)
        if (diff.toUpdate.length > 0) {
            console.log(`[SheetsToAirtable] Updating ${diff.toUpdate.length} records...`);
            const updateBatches = batchOperations(diff.toUpdate, effectiveBatchSize);
            for (let i = 0; i < updateBatches.length; i++) {
                const batch = updateBatches[i];
                try {
                    const updated = await retryWithBackoff(() => updateRecords(airtableAccessToken, baseId, tableId, batch), maxRetries, `update records batch ${i + 1}/${updateBatches.length}`);
                    result.updated += updated.length;
                    console.log(`[SheetsToAirtable] Updated batch ${i + 1}/${updateBatches.length} (${updated.length} records)`);
                }
                catch (error) {
                    result.errors.push({
                        type: 'WRITE',
                        message: `Failed to update records batch ${i + 1}: ${error instanceof Error ? error.message : String(error)}`,
                        originalError: error,
                    });
                    // In lenient mode, continue with remaining batches
                    if (validationMode === 'strict') {
                        return finalizeSyncResult(result, startTime);
                    }
                }
            }
        }
        // 7.3: Delete extra records (in batches of 10)
        if (diff.toDelete.length > 0 && deleteExtraRecords) {
            console.log(`[SheetsToAirtable] Deleting ${diff.toDelete.length} extra records...`);
            const deleteBatches = batchOperations(diff.toDelete, effectiveBatchSize);
            for (let i = 0; i < deleteBatches.length; i++) {
                const batch = deleteBatches[i];
                try {
                    const deleted = await retryWithBackoff(() => deleteRecords(airtableAccessToken, baseId, tableId, batch), maxRetries, `delete records batch ${i + 1}/${deleteBatches.length}`);
                    result.deleted += deleted.length;
                    console.log(`[SheetsToAirtable] Deleted batch ${i + 1}/${deleteBatches.length} (${deleted.length} records)`);
                }
                catch (error) {
                    result.errors.push({
                        type: 'WRITE',
                        message: `Failed to delete records batch ${i + 1}: ${error instanceof Error ? error.message : String(error)}`,
                        originalError: error,
                    });
                    // In lenient mode, continue with remaining batches
                    if (validationMode === 'strict') {
                        return finalizeSyncResult(result, startTime);
                    }
                }
            }
        }
        // ========================================================================
        // STEP 7.4: Write new record IDs back to Google Sheets
        // ========================================================================
        // CRITICAL: This prevents duplicate records on subsequent syncs
        if (newRecordIdUpdates.length > 0) {
            console.log(`[SheetsToAirtable] Writing ${newRecordIdUpdates.length} new record IDs back to Sheets...`);
            try {
                const columnLetter = columnNumberToLetter(actualIdColumnIndex + 1);
                // STEP 1: Ensure column AA (index 26) exists before writing to it
                // This prevents errors when the sheet only has columns A-Z (0-25)
                const requiredColumnCount = actualIdColumnIndex + 1; // Need at least this many columns (index 26 = 27 columns total)
                console.log(`[SheetsToAirtable] Ensuring column ${columnLetter} exists (need ${requiredColumnCount} columns)...`);
                await ensureColumnsExist(sheetsAccessToken, spreadsheetId, sheetId, requiredColumnCount);
                // STEP 2: Write record IDs to column AA
                // Sort by row number to ensure correct order
                newRecordIdUpdates.sort((a, b) => a.row - b.row);
                // Update each row's ID column with the new Airtable record ID
                // We'll batch these updates for efficiency
                const updatePromises = [];
                for (const update of newRecordIdUpdates) {
                    // Convert row number to A1 notation for the ID column
                    const range = `${columnLetter}${update.row}`;
                    updatePromises.push(updateSheetData(sheetsAccessToken, spreadsheetId, sheetId, range, [[update.recordId]]).catch((error) => {
                        // Log error but don't fail the entire sync
                        result.warnings.push(`Failed to write record ID ${update.recordId} to row ${update.row}: ${error instanceof Error ? error.message : String(error)}`);
                        console.warn(`[SheetsToAirtable] Failed to write ID for row ${update.row}:`, error);
                    }));
                    // Batch updates in groups of 10 to avoid rate limits
                    if (updatePromises.length >= 10) {
                        await Promise.all(updatePromises);
                        updatePromises.length = 0;
                        // Small delay to respect rate limits
                        await new Promise((resolve) => setTimeout(resolve, 100));
                    }
                }
                // Process remaining updates
                if (updatePromises.length > 0) {
                    await Promise.all(updatePromises);
                }
                console.log(`[SheetsToAirtable] ✓ Successfully wrote ${newRecordIdUpdates.length} record IDs to column ${columnLetter}`);
                // STEP 3: Hide column AA to keep sheets clean for users
                try {
                    await hideColumn(sheetsAccessToken, spreadsheetId, sheetId, actualIdColumnIndex);
                    console.log(`[SheetsToAirtable] ✓ Hidden column ${columnLetter} (users won't see record IDs)`);
                }
                catch (error) {
                    // Non-fatal - log warning
                    result.warnings.push(`Could not auto-hide ID column: ${error instanceof Error ? error.message : String(error)}`);
                    console.warn('[SheetsToAirtable] Failed to hide ID column:', error);
                }
            }
            catch (error) {
                // Non-fatal error - log warning but don't fail the sync
                const warningMsg = `Failed to write some record IDs back to Sheets: ${error instanceof Error ? error.message : String(error)}. You may experience duplicate records on next sync.`;
                result.warnings.push(warningMsg);
                console.error('[SheetsToAirtable] Error writing IDs back to Sheets:', error);
            }
        }
        // ========================================================================
        // STEP 8: Finalize
        // ========================================================================
        console.log(`[SheetsToAirtable] Sync complete: ${result.added} added, ${result.updated} updated, ${result.deleted} deleted`);
        return finalizeSyncResult(result, startTime);
    }
    catch (error) {
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
 * Calculates the difference between Sheets data and existing Airtable records
 *
 * Smart Matching Strategy:
 * 1. If row has a record ID (from previous sync) → Match by ID (exact match)
 * 2. If no ID, try to match by primary field value (e.g., Name, Email)
 * 3. If still no match → Create new record
 *
 * This allows first-time syncs to work without IDs while preventing duplicates
 */
function calculateRecordDiff(transformedRows, existingRecords, deleteExtra, primaryFieldName) {
    const diff = {
        toCreate: [],
        toUpdate: [],
        toDelete: [],
        rowToRecordMap: new Map(),
    };
    // Build map of existing records by ID
    const existingRecordsMap = new Map(existingRecords.map((r) => [r.id, r]));
    // Build map of existing records by primary field (for smart matching)
    const existingRecordsByPrimaryField = new Map();
    if (primaryFieldName) {
        for (const record of existingRecords) {
            const primaryValue = record.fields[primaryFieldName];
            if (primaryValue) {
                const normalizedValue = String(primaryValue).trim().toLowerCase();
                if (normalizedValue) {
                    existingRecordsByPrimaryField.set(normalizedValue, record);
                }
            }
        }
    }
    // Track which existing records are still in Sheets
    const processedRecordIds = new Set();
    // Process transformed rows
    for (const row of transformedRows) {
        if (!row.isValid)
            continue;
        let matchedRecord;
        // Strategy 1: Match by record ID (if available)
        if (row.recordId && existingRecordsMap.has(row.recordId)) {
            matchedRecord = existingRecordsMap.get(row.recordId);
        }
        // Strategy 2: Match by primary field (fallback when no ID)
        else if (!row.recordId && primaryFieldName && row.fields[primaryFieldName]) {
            const primaryValue = String(row.fields[primaryFieldName]).trim().toLowerCase();
            if (primaryValue) {
                matchedRecord = existingRecordsByPrimaryField.get(primaryValue);
                if (matchedRecord) {
                    console.log(`[SheetsToAirtable] Matched row ${row.rowIndex} to existing record ${matchedRecord.id} by primary field "${primaryFieldName}"`);
                }
            }
        }
        if (matchedRecord) {
            // Record exists (either by ID or primary field match) - check if it needs updating
            processedRecordIds.add(matchedRecord.id);
            if (hasRecordChanged(row.fields, matchedRecord.fields)) {
                diff.toUpdate.push({
                    id: matchedRecord.id,
                    fields: row.fields,
                });
            }
            diff.rowToRecordMap.set(row.rowIndex, matchedRecord.id);
        }
        else {
            // New record - create it
            // Remove empty fields to avoid validation errors
            const cleanedFields = Object.fromEntries(Object.entries(row.fields).filter(([_, value]) => value !== null && value !== undefined));
            diff.toCreate.push({
                fields: cleanedFields,
            });
        }
    }
    // Find records to delete (exist in Airtable but not in Sheets)
    if (deleteExtra) {
        for (const record of existingRecords) {
            if (!processedRecordIds.has(record.id)) {
                diff.toDelete.push(record.id);
            }
        }
    }
    return diff;
}
/**
 * Checks if a record has changed by comparing fields
 */
function hasRecordChanged(newFields, existingFields) {
    // Get all field names from both objects
    const allFieldNames = new Set([
        ...Object.keys(newFields),
        ...Object.keys(existingFields),
    ]);
    for (const fieldName of allFieldNames) {
        const newValue = normalizeFieldValue(newFields[fieldName]);
        const existingValue = normalizeFieldValue(existingFields[fieldName]);
        if (!areValuesEqual(newValue, existingValue)) {
            return true;
        }
    }
    return false;
}
/**
 * Normalizes a field value for comparison
 */
function normalizeFieldValue(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    if (typeof value === 'string') {
        return value.trim();
    }
    if (typeof value === 'number') {
        // Handle floating point precision
        return Math.round(value * 1000000) / 1000000;
    }
    if (Array.isArray(value)) {
        // For linked records, sort by ID
        if (value.length > 0 && typeof value[0] === 'object' && 'id' in value[0]) {
            return value.map((v) => v.id).sort();
        }
        return value.map(normalizeFieldValue).sort();
    }
    if (typeof value === 'object') {
        // For objects like linked records, extract ID
        if ('id' in value) {
            return value.id;
        }
    }
    return value;
}
/**
 * Compares two normalized values for equality
 */
function areValuesEqual(val1, val2) {
    if (val1 === val2)
        return true;
    if (val1 === null || val2 === null)
        return val1 === val2;
    if (Array.isArray(val1) && Array.isArray(val2)) {
        if (val1.length !== val2.length)
            return false;
        return val1.every((v, i) => v === val2[i]);
    }
    return false;
}
/**
 * Checks if a row is completely empty
 */
function isRowEmpty(row) {
    return row.every((cell) => cell === null || cell === undefined || String(cell).trim() === '');
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Retries a function with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries, operation) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // Don't retry on last attempt
            if (attempt === maxRetries) {
                break;
            }
            // Check if it's a rate limit error
            const isRateLimit = lastError.message.toLowerCase().includes('rate limit') ||
                lastError.message.toLowerCase().includes('quota') ||
                lastError.message.includes('429');
            // Check if it's a validation error (don't retry these)
            const isValidationError = lastError.message.toLowerCase().includes('invalid') ||
                lastError.message.toLowerCase().includes('validation') ||
                lastError.message.includes('422');
            if (isValidationError) {
                // Don't retry validation errors
                throw lastError;
            }
            if (!isRateLimit && attempt > 0) {
                // Only retry non-rate-limit errors once
                break;
            }
            // Exponential backoff with jitter
            const delay = Math.min(1000 * Math.pow(2, attempt), 30000) + Math.random() * 1000;
            console.warn(`[SheetsToAirtable] ${operation} failed (attempt ${attempt + 1}/${maxRetries + 1}), ` +
                `retrying in ${Math.round(delay)}ms...`, lastError.message);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}
/**
 * Finalizes the sync result with duration and completion time
 */
function finalizeSyncResult(result, startTime) {
    result.duration = Date.now() - startTime;
    result.completedAt = new Date();
    return result;
}
// ============================================================================
// Exports
// ============================================================================
export { retryWithBackoff, hasRecordChanged, normalizeFieldValue, areValuesEqual, isRowEmpty, };
//# sourceMappingURL=sheetsToAirtable.js.map