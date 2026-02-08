/**
 * Data Validator
 * Validates data before syncing to ensure data integrity and prevent errors
 */
import type { AirtableField } from '../airtable/client';
export interface ValidationError {
    field: string;
    message: string;
    code: ValidationErrorCode;
    value?: any;
}
export declare enum ValidationErrorCode {
    REQUIRED_FIELD_MISSING = "REQUIRED_FIELD_MISSING",
    INVALID_TYPE = "INVALID_TYPE",
    STRING_TOO_LONG = "STRING_TOO_LONG",
    INVALID_DATE_FORMAT = "INVALID_DATE_FORMAT",
    INVALID_NUMBER = "INVALID_NUMBER",
    INVALID_EMAIL = "INVALID_EMAIL",
    INVALID_URL = "INVALID_URL",
    UNSAFE_CONTENT = "UNSAFE_CONTENT"
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    sanitizedData?: Record<string, any>[];
}
export interface ValidationOptions {
    /** Maximum string length (default: 100000 per Airtable limits) */
    maxStringLength?: number;
    /** Whether to sanitize data (default: true) */
    sanitize?: boolean;
    /** Whether to validate required fields (default: true) */
    checkRequired?: boolean;
    /** Direction of sync for context-specific validation */
    direction?: 'airtable-to-sheets' | 'sheets-to-airtable';
}
/**
 * Validate data for Airtable → Sheets sync
 */
export declare function validateForSheets(data: Record<string, any>[], fieldMappings: Map<string, AirtableField>, options?: ValidationOptions): ValidationResult;
/**
 * Validate data for Sheets → Airtable sync
 */
export declare function validateForAirtable(data: Record<string, any>[], fieldMappings: Map<string, AirtableField>, options?: ValidationOptions): ValidationResult;
/**
 * Validate data in batches for better performance on large datasets
 */
export declare function validateInBatches(data: Record<string, any>[], fieldMappings: Map<string, AirtableField>, direction: 'airtable-to-sheets' | 'sheets-to-airtable', options?: ValidationOptions, batchSize?: number): ValidationResult;
//# sourceMappingURL=dataValidator.d.ts.map