/**
 * Bidirectional Field Type Mapper
 * Converts field types and values between Airtable and Google Sheets
 */
import type { AirtableFieldType, AirtableFieldValue, AirtableField, AirtableRecord } from '../airtable/client';
export interface FieldMappingContext {
    /** Airtable field metadata for type-aware conversions */
    airtableField?: AirtableField;
    /** Access token for fetching linked record names */
    accessToken?: string;
    /** Base ID for linked record lookups */
    baseId?: string;
    /** Table ID for linked record lookups */
    tableId?: string;
}
export interface FieldConversionResult {
    value: any;
    errors?: string[];
    warnings?: string[];
}
export declare class FieldMapperError extends Error {
    fieldName?: string | undefined;
    sourceType?: string | undefined;
    targetType?: string | undefined;
    constructor(message: string, fieldName?: string | undefined, sourceType?: string | undefined, targetType?: string | undefined);
}
/**
 * Converts an Airtable field value to a Google Sheets-compatible value
 */
export declare function airtableToSheets(value: AirtableFieldValue, fieldType: AirtableFieldType, context?: FieldMappingContext): Promise<FieldConversionResult>;
/**
 * Converts a Google Sheets value to an Airtable-compatible value
 */
export declare function sheetsToAirtable(value: any, targetFieldType: AirtableFieldType, context?: FieldMappingContext): Promise<FieldConversionResult>;
/**
 * Converts a complete Airtable record to a Sheets row
 */
export declare function airtableRecordToSheetsRow(record: AirtableRecord, fields: AirtableField[], context?: FieldMappingContext): Promise<{
    row: any[];
    errors: string[];
    warnings: string[];
}>;
/**
 * Converts a Sheets row to Airtable record fields
 */
export declare function sheetsRowToAirtableFields(row: any[], fields: AirtableField[], context?: FieldMappingContext): Promise<{
    fields: Record<string, AirtableFieldValue>;
    errors: string[];
    warnings: string[];
}>;
/**
 * Converts a Sheets row to Airtable record fields using explicit field mappings
 * This version uses the field mappings to extract values from the correct columns
 *
 * @param row - Complete row from Sheets (including ID column)
 * @param fields - Airtable fields (already filtered and sorted by mapping)
 * @param fieldMappings - Map of airtableFieldId -> columnIndex
 * @param idColumnIndex - Which column contains the Airtable record ID
 * @param context - Additional context for conversion
 */
export declare function sheetsRowToAirtableFieldsWithMapping(row: any[], fields: AirtableField[], fieldMappings: Record<string, number>, idColumnIndex: number, context?: FieldMappingContext): Promise<{
    fields: Record<string, AirtableFieldValue>;
    errors: string[];
    warnings: string[];
}>;
/**
 * Checks if an Airtable field type is read-only
 */
export declare function isReadOnlyField(fieldType: AirtableFieldType): boolean;
/**
 * Checks if an Airtable field type supports writing from Sheets
 */
export declare function isWritableFromSheets(fieldType: AirtableFieldType): boolean;
/**
 * Validates field type compatibility between Airtable and Sheets
 */
export declare function validateFieldCompatibility(airtableField: AirtableField): {
    compatible: boolean;
    issues: string[];
};
//# sourceMappingURL=fieldMapper.d.ts.map