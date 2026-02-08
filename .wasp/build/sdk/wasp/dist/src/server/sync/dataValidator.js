/**
 * Data Validator
 * Validates data before syncing to ensure data integrity and prevent errors
 */
export var ValidationErrorCode;
(function (ValidationErrorCode) {
    ValidationErrorCode["REQUIRED_FIELD_MISSING"] = "REQUIRED_FIELD_MISSING";
    ValidationErrorCode["INVALID_TYPE"] = "INVALID_TYPE";
    ValidationErrorCode["STRING_TOO_LONG"] = "STRING_TOO_LONG";
    ValidationErrorCode["INVALID_DATE_FORMAT"] = "INVALID_DATE_FORMAT";
    ValidationErrorCode["INVALID_NUMBER"] = "INVALID_NUMBER";
    ValidationErrorCode["INVALID_EMAIL"] = "INVALID_EMAIL";
    ValidationErrorCode["INVALID_URL"] = "INVALID_URL";
    ValidationErrorCode["UNSAFE_CONTENT"] = "UNSAFE_CONTENT";
})(ValidationErrorCode || (ValidationErrorCode = {}));
// ============================================================================
// Constants
// ============================================================================
const AIRTABLE_MAX_STRING_LENGTH = 100000; // Airtable's long text field limit
const SHEETS_MAX_CELL_LENGTH = 50000; // Google Sheets cell character limit
// Dangerous patterns that could break formulas or CSV parsing
const UNSAFE_PATTERNS = [
    /^[=+\-@]/, // Formula injection
    /\x00/g, // Null bytes
];
// ============================================================================
// Main Validation Functions
// ============================================================================
/**
 * Validate data for Airtable → Sheets sync
 */
export function validateForSheets(data, fieldMappings, options = {}) {
    const { maxStringLength = SHEETS_MAX_CELL_LENGTH, sanitize = true, checkRequired = true, } = options;
    const errors = [];
    const sanitizedData = [];
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        const sanitizedRow = {};
        for (const [fieldName, value] of Object.entries(row)) {
            const field = fieldMappings.get(fieldName);
            // Note: Airtable API doesn't expose required field information in a simple way
            // Skip required field validation for now - can be added via custom schema metadata if needed
            // Skip validation for null/undefined (allowed in non-required fields)
            if (value === null || value === undefined) {
                sanitizedRow[fieldName] = value;
                continue;
            }
            // Validate and sanitize based on field type
            const validationResult = validateFieldValue(fieldName, value, { maxStringLength, sanitize, rowIndex: rowIndex + 1 }, field?.type);
            if (validationResult.errors.length > 0) {
                errors.push(...validationResult.errors);
            }
            sanitizedRow[fieldName] = validationResult.sanitizedValue;
        }
        sanitizedData.push(sanitizedRow);
    }
    return {
        valid: errors.length === 0,
        errors,
        sanitizedData: sanitize ? sanitizedData : undefined,
    };
}
/**
 * Validate data for Sheets → Airtable sync
 */
export function validateForAirtable(data, fieldMappings, options = {}) {
    const { maxStringLength = AIRTABLE_MAX_STRING_LENGTH, sanitize = true, checkRequired = true, } = options;
    const errors = [];
    const sanitizedData = [];
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        const sanitizedRow = {};
        for (const [fieldName, value] of Object.entries(row)) {
            const field = fieldMappings.get(fieldName);
            // Note: Airtable API doesn't expose required field information in a simple way
            // Skip required field validation for now - can be added via custom schema metadata if needed
            // Skip validation for null/undefined (allowed in non-required fields)
            if (value === null || value === undefined) {
                sanitizedRow[fieldName] = value;
                continue;
            }
            // Validate and sanitize based on field type
            const validationResult = validateFieldValue(fieldName, value, { maxStringLength, sanitize, rowIndex: rowIndex + 1 }, field?.type);
            if (validationResult.errors.length > 0) {
                errors.push(...validationResult.errors);
            }
            sanitizedRow[fieldName] = validationResult.sanitizedValue;
        }
        sanitizedData.push(sanitizedRow);
    }
    return {
        valid: errors.length === 0,
        errors,
        sanitizedData: sanitize ? sanitizedData : undefined,
    };
}
/**
 * Validate and sanitize a single field value
 */
function validateFieldValue(fieldName, value, options, fieldType) {
    const errors = [];
    let sanitizedValue = value;
    // Type-specific validation
    switch (fieldType) {
        case 'singleLineText':
        case 'multilineText':
        case 'richText':
        case 'email':
        case 'url':
        case 'phoneNumber':
            const stringValidation = validateString(fieldName, value, {
                maxLength: options.maxStringLength,
                fieldType,
                sanitize: options.sanitize,
                rowIndex: options.rowIndex,
            });
            errors.push(...stringValidation.errors);
            sanitizedValue = stringValidation.sanitizedValue;
            break;
        case 'number':
        case 'currency':
        case 'percent':
        case 'duration':
        case 'rating':
            const numberValidation = validateNumber(fieldName, value, options.rowIndex);
            errors.push(...numberValidation.errors);
            sanitizedValue = numberValidation.sanitizedValue;
            break;
        case 'checkbox':
            const boolValidation = validateBoolean(fieldName, value, options.rowIndex);
            errors.push(...boolValidation.errors);
            sanitizedValue = boolValidation.sanitizedValue;
            break;
        case 'date':
        case 'dateTime':
            const dateValidation = validateDate(fieldName, value, options.rowIndex);
            errors.push(...dateValidation.errors);
            sanitizedValue = dateValidation.sanitizedValue;
            break;
        case 'singleSelect':
        case 'multipleSelects':
            // Options validation would require knowing valid options from schema
            // For now, just validate it's a string
            const selectValidation = validateString(fieldName, value, {
                maxLength: options.maxStringLength,
                sanitize: options.sanitize,
                rowIndex: options.rowIndex,
            });
            errors.push(...selectValidation.errors);
            sanitizedValue = selectValidation.sanitizedValue;
            break;
        case 'multipleRecordLinks':
        case 'singleCollaborator':
        case 'multipleCollaborators':
        case 'multipleLookupValues':
        case 'rollup':
        case 'count':
        case 'formula':
        case 'createdTime':
        case 'lastModifiedTime':
        case 'createdBy':
        case 'lastModifiedBy':
        case 'autoNumber':
        case 'barcode':
        case 'button':
            // These fields are handled by specialized converters
            // Basic sanitization only
            if (options.sanitize && typeof sanitizedValue === 'string') {
                sanitizedValue = sanitizeString(sanitizedValue);
            }
            break;
        case 'multipleAttachments':
            // Attachments should be arrays of URLs
            if (Array.isArray(value)) {
                sanitizedValue = value.map(v => typeof v === 'string' && options.sanitize ? sanitizeString(v) : v);
            }
            else if (typeof value === 'string') {
                sanitizedValue = options.sanitize ? sanitizeString(value) : value;
            }
            break;
        default:
            // Unknown field type - apply basic sanitization
            if (options.sanitize && typeof sanitizedValue === 'string') {
                sanitizedValue = sanitizeString(sanitizedValue);
            }
    }
    return { sanitizedValue, errors };
}
// ============================================================================
// Type-Specific Validators
// ============================================================================
function validateString(fieldName, value, options) {
    const errors = [];
    let sanitizedValue = value;
    // Coerce to string if needed
    if (typeof value !== 'string') {
        sanitizedValue = String(value);
    }
    // Check length
    if (sanitizedValue.length > options.maxLength) {
        errors.push({
            field: fieldName,
            message: `String too long in row ${options.rowIndex}: ${sanitizedValue.length} characters (max: ${options.maxLength})`,
            code: ValidationErrorCode.STRING_TOO_LONG,
            value: sanitizedValue.substring(0, 100) + '...',
        });
        // Truncate if needed
        sanitizedValue = sanitizedValue.substring(0, options.maxLength);
    }
    // Field-type specific validation
    if (options.fieldType === 'email') {
        if (!isValidEmail(sanitizedValue)) {
            errors.push({
                field: fieldName,
                message: `Invalid email format in row ${options.rowIndex}: "${sanitizedValue}"`,
                code: ValidationErrorCode.INVALID_EMAIL,
                value: sanitizedValue,
            });
        }
    }
    if (options.fieldType === 'url') {
        if (!isValidUrl(sanitizedValue)) {
            errors.push({
                field: fieldName,
                message: `Invalid URL format in row ${options.rowIndex}: "${sanitizedValue}"`,
                code: ValidationErrorCode.INVALID_URL,
                value: sanitizedValue,
            });
        }
    }
    // Sanitize for formula injection and other unsafe content
    if (options.sanitize) {
        const sanitized = sanitizeString(sanitizedValue);
        if (sanitized !== sanitizedValue) {
            sanitizedValue = sanitized;
        }
    }
    return { sanitizedValue, errors };
}
function validateNumber(fieldName, value, rowIndex) {
    const errors = [];
    let sanitizedValue = value;
    // Try to convert to number
    const num = typeof value === 'number' ? value : Number(value);
    if (isNaN(num) || !isFinite(num)) {
        errors.push({
            field: fieldName,
            message: `Invalid number in row ${rowIndex}: "${value}"`,
            code: ValidationErrorCode.INVALID_NUMBER,
            value,
        });
        sanitizedValue = null;
    }
    else {
        sanitizedValue = num;
    }
    return { sanitizedValue, errors };
}
function validateBoolean(fieldName, value, rowIndex) {
    const errors = [];
    let sanitizedValue = value;
    // Convert common boolean representations
    if (typeof value === 'boolean') {
        sanitizedValue = value;
    }
    else if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        if (lower === 'true' || lower === 'yes' || lower === '1') {
            sanitizedValue = true;
        }
        else if (lower === 'false' || lower === 'no' || lower === '0' || lower === '') {
            sanitizedValue = false;
        }
        else {
            errors.push({
                field: fieldName,
                message: `Invalid boolean value in row ${rowIndex}: "${value}"`,
                code: ValidationErrorCode.INVALID_TYPE,
                value,
            });
            sanitizedValue = false;
        }
    }
    else if (typeof value === 'number') {
        sanitizedValue = value !== 0;
    }
    else {
        sanitizedValue = Boolean(value);
    }
    return { sanitizedValue, errors };
}
function validateDate(fieldName, value, rowIndex) {
    const errors = [];
    let sanitizedValue = value;
    // Try to parse as date
    let date;
    if (value instanceof Date) {
        date = value;
    }
    else if (typeof value === 'string' || typeof value === 'number') {
        date = new Date(value);
    }
    else {
        errors.push({
            field: fieldName,
            message: `Invalid date format in row ${rowIndex}: "${value}"`,
            code: ValidationErrorCode.INVALID_DATE_FORMAT,
            value,
        });
        return { sanitizedValue: null, errors };
    }
    // Check if date is valid
    if (isNaN(date.getTime())) {
        errors.push({
            field: fieldName,
            message: `Invalid date format in row ${rowIndex}: "${value}"`,
            code: ValidationErrorCode.INVALID_DATE_FORMAT,
            value,
        });
        sanitizedValue = null;
    }
    else {
        // Return ISO string for consistency
        sanitizedValue = date.toISOString();
    }
    return { sanitizedValue, errors };
}
// ============================================================================
// Sanitization Functions
// ============================================================================
/**
 * Sanitize string to prevent formula injection and CSV parsing issues
 */
function sanitizeString(value) {
    let sanitized = value;
    // Remove null bytes
    sanitized = sanitized.replace(/\x00/g, '');
    // Prevent formula injection by escaping leading special characters
    // This is crucial for both Sheets and CSV exports
    if (UNSAFE_PATTERNS[0].test(sanitized)) {
        sanitized = "'" + sanitized; // Prefix with single quote to escape
    }
    // Remove other potentially dangerous control characters
    sanitized = sanitized.replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F]/g, '');
    return sanitized;
}
/**
 * Check if a value is considered empty (for required field validation)
 */
function isEmptyValue(value) {
    if (value === null || value === undefined) {
        return true;
    }
    if (typeof value === 'string') {
        return value.trim() === '';
    }
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    return false;
}
/**
 * Basic email validation
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Basic URL validation
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
// ============================================================================
// Batch Validation Helper
// ============================================================================
/**
 * Validate data in batches for better performance on large datasets
 */
export function validateInBatches(data, fieldMappings, direction, options = {}, batchSize = 100) {
    const allErrors = [];
    const allSanitizedData = [];
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const result = direction === 'airtable-to-sheets'
            ? validateForSheets(batch, fieldMappings, options)
            : validateForAirtable(batch, fieldMappings, options);
        allErrors.push(...result.errors);
        if (result.sanitizedData) {
            allSanitizedData.push(...result.sanitizedData);
        }
    }
    return {
        valid: allErrors.length === 0,
        errors: allErrors,
        sanitizedData: options.sanitize !== false ? allSanitizedData : undefined,
    };
}
//# sourceMappingURL=dataValidator.js.map