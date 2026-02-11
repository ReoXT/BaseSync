/**
 * Dropdown Field Detector
 * Detects Airtable dropdown fields (Single Select, Multi Select) and extracts their choices
 * for automatic Google Sheets data validation setup
 */
import type { AirtableField, AirtableFieldType } from '../airtable/client';
export interface DropdownFieldInfo {
    /** Field ID from Airtable */
    fieldId: string;
    /** Field name from Airtable */
    fieldName: string;
    /** Field type (singleSelect or multipleSelects) */
    fieldType: 'singleSelect' | 'multipleSelects';
    /** Column index in Google Sheets (0-based) */
    columnIndex: number;
    /** Available dropdown choices */
    choices: string[];
    /** Choice metadata (name, color, id) */
    choiceDetails: Array<{
        id: string;
        name: string;
        color?: string;
    }>;
}
/**
 * Checks if an Airtable field is a dropdown type
 */
export declare function isDropdownField(fieldType: AirtableFieldType): boolean;
/**
 * Extracts dropdown choices from an Airtable field
 * Returns null if the field is not a dropdown type or has no choices defined
 */
export declare function extractDropdownChoices(field: AirtableField): string[] | null;
/**
 * Extracts detailed choice information from an Airtable field
 * Includes color metadata which could be used for future enhancements
 */
export declare function extractDropdownChoiceDetails(field: AirtableField): Array<{
    id: string;
    name: string;
    color?: string;
}> | null;
/**
 * Detects all dropdown fields in a list of Airtable fields
 * Maps them to their column indices based on field mappings
 *
 * @param fields - Array of Airtable fields to analyze (should be in the order they appear in Sheets)
 * @param fieldMappings - Optional mapping of fieldId -> columnIndex
 *                        If not provided, uses array index as column index
 * @returns Array of dropdown field information
 */
export declare function detectDropdownFields(fields: AirtableField[], fieldMappings?: Record<string, number>): DropdownFieldInfo[];
/**
 * Converts dropdown field information to Google Sheets validation format
 */
export declare function convertToSheetsValidation(dropdownField: DropdownFieldInfo): {
    columnIndex: number;
    choices: string[];
    showDropdown: boolean;
    strict: boolean;
};
/**
 * Validates that a value matches the dropdown choices
 * Used for pre-validation before syncing to Sheets
 */
export declare function validateDropdownValue(value: string | string[], choices: string[], fieldType: 'singleSelect' | 'multipleSelects'): {
    valid: boolean;
    error?: string;
};
/**
 * Logs detected dropdown fields (useful for debugging)
 */
export declare function logDropdownFields(dropdownFields: DropdownFieldInfo[]): void;
//# sourceMappingURL=dropdownFieldDetector.d.ts.map