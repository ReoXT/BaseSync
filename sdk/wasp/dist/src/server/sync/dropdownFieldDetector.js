/**
 * Dropdown Field Detector
 * Detects Airtable dropdown fields (Single Select, Multi Select) and extracts their choices
 * for automatic Google Sheets data validation setup
 */
// ============================================================================
// Detection Functions
// ============================================================================
/**
 * Checks if an Airtable field is a dropdown type
 */
export function isDropdownField(fieldType) {
    return fieldType === 'singleSelect' || fieldType === 'multipleSelects';
}
/**
 * Extracts dropdown choices from an Airtable field
 * Returns null if the field is not a dropdown type or has no choices defined
 */
export function extractDropdownChoices(field) {
    if (!isDropdownField(field.type)) {
        return null;
    }
    if (!field.options?.choices || !Array.isArray(field.options.choices)) {
        console.warn(`Dropdown field "${field.name}" (${field.type}) has no choices defined - skipping validation`);
        return null;
    }
    return field.options.choices.map((choice) => choice.name);
}
/**
 * Extracts detailed choice information from an Airtable field
 * Includes color metadata which could be used for future enhancements
 */
export function extractDropdownChoiceDetails(field) {
    if (!isDropdownField(field.type)) {
        return null;
    }
    if (!field.options?.choices || !Array.isArray(field.options.choices)) {
        return null;
    }
    return field.options.choices.map((choice) => ({
        id: choice.id,
        name: choice.name,
        color: choice.color,
    }));
}
/**
 * Detects all dropdown fields in a list of Airtable fields
 * Maps them to their column indices based on field mappings
 *
 * @param fields - Array of Airtable fields to analyze (should be in the order they appear in Sheets)
 * @param fieldMappings - Optional mapping of fieldId -> columnIndex
 *                        If not provided, uses array index as column index
 * @returns Array of dropdown field information
 */
export function detectDropdownFields(fields, fieldMappings) {
    const dropdownFields = [];
    fields.forEach((field, index) => {
        if (!isDropdownField(field.type)) {
            return;
        }
        const choices = extractDropdownChoices(field);
        const choiceDetails = extractDropdownChoiceDetails(field);
        if (!choices || choices.length === 0) {
            console.warn(`[DropdownDetector] Skipping field "${field.name}" - no choices defined`);
            return;
        }
        // Determine column index
        let columnIndex;
        if (fieldMappings && field.id in fieldMappings) {
            // Use explicit field mapping if available
            columnIndex = fieldMappings[field.id];
            console.log(`[DropdownDetector] Field "${field.name}" mapped to column ${columnIndex} via fieldMappings`);
        }
        else {
            // Fallback to array index if no explicit mapping
            // This assumes fields array is already sorted in the correct Sheets column order
            columnIndex = index;
            console.log(`[DropdownDetector] Field "${field.name}" using array index ${columnIndex} (no field mapping)`);
        }
        dropdownFields.push({
            fieldId: field.id,
            fieldName: field.name,
            fieldType: field.type,
            columnIndex,
            choices,
            choiceDetails: choiceDetails || [],
        });
    });
    return dropdownFields;
}
/**
 * Converts dropdown field information to Google Sheets validation format
 */
export function convertToSheetsValidation(dropdownField) {
    return {
        columnIndex: dropdownField.columnIndex,
        choices: dropdownField.choices,
        showDropdown: true,
        // For multi-select, we'll be less strict since users need to enter comma-separated values
        // Single select can be strict since it's just one value
        strict: dropdownField.fieldType === 'singleSelect',
    };
}
/**
 * Validates that a value matches the dropdown choices
 * Used for pre-validation before syncing to Sheets
 */
export function validateDropdownValue(value, choices, fieldType) {
    if (fieldType === 'singleSelect') {
        const stringValue = String(value);
        if (!choices.includes(stringValue)) {
            return {
                valid: false,
                error: `Value "${stringValue}" is not a valid choice. Available: ${choices.join(', ')}`,
            };
        }
        return { valid: true };
    }
    // Multiple selects
    const values = Array.isArray(value) ? value : String(value).split(',').map((v) => v.trim());
    const invalidValues = values.filter((v) => !choices.includes(v));
    if (invalidValues.length > 0) {
        return {
            valid: false,
            error: `Invalid choices: ${invalidValues.join(', ')}. Available: ${choices.join(', ')}`,
        };
    }
    return { valid: true };
}
// ============================================================================
// Logging Helpers
// ============================================================================
/**
 * Logs detected dropdown fields (useful for debugging)
 */
export function logDropdownFields(dropdownFields) {
    if (dropdownFields.length === 0) {
        console.log('[DropdownDetector] No dropdown fields detected');
        return;
    }
    console.log(`[DropdownDetector] Detected ${dropdownFields.length} dropdown field(s):`);
    dropdownFields.forEach((field) => {
        console.log(`  - "${field.fieldName}" (${field.fieldType}) at column ${field.columnIndex}: ` +
            `${field.choices.length} choices [${field.choices.join(', ')}]`);
    });
}
//# sourceMappingURL=dropdownFieldDetector.js.map