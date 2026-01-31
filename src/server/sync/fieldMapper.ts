/**
 * Bidirectional Field Type Mapper
 * Converts field types and values between Airtable and Google Sheets
 */

import type {
  AirtableFieldType,
  AirtableFieldValue,
  AirtableField,
  AirtableAttachment,
  AirtableRecord,
} from '../airtable/client';

// ============================================================================
// Types
// ============================================================================

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

export class FieldMapperError extends Error {
  constructor(
    message: string,
    public fieldName?: string,
    public sourceType?: string,
    public targetType?: string
  ) {
    super(message);
    this.name = 'FieldMapperError';
  }
}

// ============================================================================
// Airtable → Sheets Conversion
// ============================================================================

/**
 * Converts an Airtable field value to a Google Sheets-compatible value
 */
export async function airtableToSheets(
  value: AirtableFieldValue,
  fieldType: AirtableFieldType,
  context?: FieldMappingContext
): Promise<FieldConversionResult> {
  const result: FieldConversionResult = { value: null, errors: [], warnings: [] };

  try {
    // Handle null/undefined values
    if (value === null || value === undefined) {
      result.value = '';
      return result;
    }

    switch (fieldType) {
      // Text fields → string
      case 'singleLineText':
      case 'multilineText':
      case 'richText':
      case 'email':
      case 'emailAddress': // Alternative email field type
      case 'url':
      case 'phoneNumber':
      case 'phone': // Alternative phone field type
        result.value = String(value);
        break;

      // Number fields → number
      case 'number':
      case 'currency':
      case 'percent':
      case 'duration':
      case 'rating':
      case 'autoNumber':
        result.value = typeof value === 'number' ? value : Number(value) || 0;
        break;

      // Checkbox → "TRUE"/"FALSE"
      case 'checkbox':
        result.value = value ? 'TRUE' : 'FALSE';
        break;

      // Date fields → ISO string or formatted date
      case 'date':
      case 'dateTime':
      case 'createdTime':
      case 'lastModifiedTime':
        if (value instanceof Date) {
          result.value = value.toISOString();
        } else if (typeof value === 'string') {
          // Already a string, validate it's a date
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            result.value = date.toISOString();
          } else {
            result.errors?.push(`Invalid date format: ${value}`);
            result.value = String(value);
          }
        } else {
          result.errors?.push(`Unexpected date value type: ${typeof value}`);
          result.value = String(value);
        }
        break;

      // Single select → string
      case 'singleSelect':
        result.value = String(value);
        break;

      // Multiple selects → comma-separated string
      case 'multipleSelects':
        if (Array.isArray(value)) {
          result.value = value.join(', ');
        } else {
          result.errors?.push(`Expected array for multipleSelects, got ${typeof value}`);
          result.value = String(value);
        }
        break;

      // Linked records → comma-separated names (NOT IDs)
      case 'multipleRecordLinks':
        if (Array.isArray(value)) {
          // If we have access to fetch linked record names
          if (context?.accessToken && context?.baseId && context?.airtableField?.options?.linkedTableId) {
            try {
              const names = await fetchLinkedRecordNames(
                value as Array<{ id: string }>,
                context.accessToken,
                context.baseId,
                context.airtableField.options.linkedTableId
              );
              result.value = names.join(', ');
            } catch (error) {
              result.warnings?.push(
                `Failed to fetch linked record names: ${error instanceof Error ? error.message : String(error)}`
              );
              // Fallback to IDs
              result.value = value.map((record) => (record as { id: string }).id).join(', ');
            }
          } else {
            // Fallback to IDs if we can't fetch names
            result.value = value.map((record) => (record as { id: string }).id).join(', ');
            result.warnings?.push(
              'Linked records exported as IDs (no context provided for name lookup)'
            );
          }
        } else {
          result.errors?.push(`Expected array for multipleRecordLinks, got ${typeof value}`);
          result.value = String(value);
        }
        break;

      // Attachments → comma-separated URLs
      case 'multipleAttachments':
        if (Array.isArray(value)) {
          const attachments = value as AirtableAttachment[];
          result.value = attachments.map((att) => att.url).join(', ');
        } else {
          result.errors?.push(`Expected array for multipleAttachments, got ${typeof value}`);
          result.value = String(value);
        }
        break;

      // Collaborators → comma-separated names or emails
      case 'singleCollaborator':
        if (value && typeof value === 'object' && 'email' in value) {
          const collab = value as { email: string; name?: string };
          result.value = collab.name || collab.email;
        } else {
          result.value = String(value);
        }
        break;

      case 'multipleCollaborators':
        if (Array.isArray(value)) {
          const collabs = value as Array<{ email: string; name?: string }>;
          result.value = collabs.map((c) => c.name || c.email).join(', ');
        } else {
          result.errors?.push(`Expected array for multipleCollaborators, got ${typeof value}`);
          result.value = String(value);
        }
        break;

      // Computed fields → appropriate type
      case 'formula':
      case 'rollup':
      case 'count':
      case 'multipleLookupValues':
        // These can return various types, handle accordingly
        if (Array.isArray(value)) {
          result.value = value.join(', ');
        } else if (typeof value === 'boolean') {
          result.value = value ? 'TRUE' : 'FALSE';
        } else if (value instanceof Date) {
          result.value = value.toISOString();
        } else {
          result.value = value;
        }
        break;

      // Barcode → string representation
      case 'barcode':
        if (value && typeof value === 'object' && 'text' in value) {
          result.value = (value as { text: string }).text;
        } else {
          result.value = String(value);
        }
        break;

      // Button and createdBy → string
      case 'button':
      case 'createdBy':
      case 'lastModifiedBy':
        result.value = String(value);
        break;

      default:
        result.warnings?.push(`Unknown field type: ${fieldType}, converting to string`);
        result.value = String(value);
    }
  } catch (error) {
    result.errors?.push(
      `Conversion error: ${error instanceof Error ? error.message : String(error)}`
    );
    result.value = String(value); // Fallback to string
  }

  return result;
}

/**
 * Helper function to fetch linked record names from Airtable
 */
async function fetchLinkedRecordNames(
  linkedRecords: Array<{ id: string }>,
  accessToken: string,
  baseId: string,
  linkedTableId: string
): Promise<string[]> {
  if (linkedRecords.length === 0) return [];

  // Import here to avoid circular dependencies
  const { listRecords } = await import('../airtable/client');

  // Fetch only the records we need using filterByFormula
  const recordIds = linkedRecords.map((r) => r.id);
  const formula = `OR(${recordIds.map((id) => `RECORD_ID()='${id}'`).join(',')})`;

  const records = await listRecords(accessToken, baseId, linkedTableId, {
    filterByFormula: formula,
    maxRecords: recordIds.length,
  });

  // Get the primary field value for each record
  return linkedRecords.map((linkedRecord) => {
    const record = records.find((r) => r.id === linkedRecord.id);
    if (!record) return linkedRecord.id; // Fallback to ID if not found

    // Get the first field value (primary field) or use ID
    const firstFieldValue = Object.values(record.fields)[0];
    return firstFieldValue ? String(firstFieldValue) : linkedRecord.id;
  });
}

// ============================================================================
// Sheets → Airtable Conversion
// ============================================================================

/**
 * Converts a Google Sheets value to an Airtable-compatible value
 */
export async function sheetsToAirtable(
  value: any,
  targetFieldType: AirtableFieldType,
  context?: FieldMappingContext
): Promise<FieldConversionResult> {
  const result: FieldConversionResult = { value: null, errors: [], warnings: [] };

  try {
    // Handle empty values
    if (value === null || value === undefined || value === '') {
      result.value = null;
      return result;
    }

    // Convert to string first for easier processing
    const stringValue = String(value).trim();

    switch (targetFieldType) {
      // Text fields
      case 'singleLineText':
      case 'multilineText':
      case 'richText':
      case 'email':
      case 'emailAddress': // Alternative email field type
      case 'url':
      case 'phoneNumber':
      case 'phone': // Alternative phone field type
        result.value = stringValue;
        break;

      // Number fields
      case 'number':
      case 'currency':
      case 'percent':
      case 'duration':
      case 'rating':
        const num = Number(stringValue);
        if (isNaN(num)) {
          result.errors?.push(`Cannot convert "${stringValue}" to number`);
          result.value = null;
        } else {
          result.value = num;
        }
        break;

      // Checkbox
      case 'checkbox':
        const upperValue = stringValue.toUpperCase();
        if (upperValue === 'TRUE' || upperValue === '1' || upperValue === 'YES') {
          result.value = true;
        } else if (upperValue === 'FALSE' || upperValue === '0' || upperValue === 'NO') {
          result.value = false;
        } else {
          result.errors?.push(`Cannot convert "${stringValue}" to checkbox (use TRUE/FALSE)`);
          result.value = null;
        }
        break;

      // Date fields
      case 'date':
      case 'dateTime':
        const date = parseDate(stringValue);
        if (date) {
          // Airtable expects ISO 8601 format
          result.value = date.toISOString();
        } else {
          result.errors?.push(`Cannot parse "${stringValue}" as date`);
          result.value = null;
        }
        break;

      // Single select
      case 'singleSelect':
        // Validate against available choices if we have field metadata
        if (context?.airtableField?.options?.choices) {
          const choices = context.airtableField.options.choices;
          const matchingChoice = choices.find(
            (c) => c.name.toLowerCase() === stringValue.toLowerCase()
          );
          if (matchingChoice) {
            result.value = matchingChoice.name;
          } else {
            // Check if this looks like it might be wrong field mapping
            const fieldName = context.airtableField?.name || 'this field';
            result.errors?.push(
              `Value "${stringValue}" is not a valid choice for ${fieldName}. Available options: ${choices.map((c) => c.name).join(', ')}. Check your field mappings - this column may be mapped to the wrong Airtable field.`
            );
            result.value = null;
          }
        } else {
          result.value = stringValue;
        }
        break;

      // Multiple selects
      case 'multipleSelects':
        const values = stringValue.split(',').map((v) => v.trim()).filter((v) => v);

        // Validate against available choices if we have field metadata
        if (context?.airtableField?.options?.choices) {
          const choices = context.airtableField.options.choices;
          const validValues: string[] = [];
          const invalidValues: string[] = [];

          values.forEach((val) => {
            const matchingChoice = choices.find(
              (c) => c.name.toLowerCase() === val.toLowerCase()
            );
            if (matchingChoice) {
              validValues.push(matchingChoice.name);
            } else {
              invalidValues.push(val);
            }
          });

          if (invalidValues.length > 0) {
            result.warnings?.push(
              `Some values are not valid choices: ${invalidValues.join(', ')}. Available: ${choices.map((c) => c.name).join(', ')}`
            );
          }

          result.value = validValues.length > 0 ? validValues : null;
        } else {
          result.value = values.length > 0 ? values : null;
        }
        break;

      // Linked records
      case 'multipleRecordLinks':
        // This requires looking up records by name in the linked table
        if (context?.accessToken && context?.baseId && context?.airtableField?.options?.linkedTableId) {
          try {
            const names = stringValue.split(',').map((v) => v.trim()).filter((v) => v);
            const recordIds = await fetchRecordIdsByNames(
              names,
              context.accessToken,
              context.baseId,
              context.airtableField.options.linkedTableId
            );
            result.value = recordIds.map((id) => ({ id }));

            if (recordIds.length < names.length) {
              result.warnings?.push(
                `Some linked records could not be found: ${names.length - recordIds.length} missing`
              );
            }
          } catch (error) {
            result.errors?.push(
              `Failed to lookup linked records: ${error instanceof Error ? error.message : String(error)}`
            );
            result.value = null;
          }
        } else {
          result.errors?.push(
            'Cannot convert to linked records without context (accessToken, baseId, linkedTableId required)'
          );
          result.value = null;
        }
        break;

      // Read-only fields
      case 'autoNumber':
      case 'createdTime':
      case 'lastModifiedTime':
      case 'createdBy':
      case 'lastModifiedBy':
      case 'formula':
      case 'rollup':
      case 'count':
      case 'multipleLookupValues':
      case 'button':
        result.warnings?.push(`Field type "${targetFieldType}" is read-only, skipping value`);
        result.value = null;
        break;

      // Unsupported write fields (treat as warnings, not errors)
      case 'multipleAttachments':
        result.warnings?.push('Attachment upload from Sheets is not supported - field will be skipped');
        result.value = null;
        break;

      case 'singleCollaborator':
      case 'multipleCollaborators':
        result.warnings?.push('Collaborator assignment from Sheets is not supported - field will be skipped');
        result.value = null;
        break;

      case 'barcode':
        result.warnings?.push('Barcode field type is not supported - field will be skipped');
        result.value = null;
        break;

      default:
        result.warnings?.push(`Unknown field type: ${targetFieldType}, treating as text`);
        result.value = stringValue;
    }
  } catch (error) {
    result.errors?.push(
      `Conversion error: ${error instanceof Error ? error.message : String(error)}`
    );
    result.value = null;
  }

  return result;
}

/**
 * Helper function to parse various date formats
 */
function parseDate(value: string): Date | null {
  // Try ISO 8601 format first
  const isoDate = new Date(value);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try common formats
  const formats = [
    // MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
  ];

  for (const format of formats) {
    const match = value.match(format);
    if (match) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}

/**
 * Helper function to fetch record IDs by their names (primary field values)
 */
async function fetchRecordIdsByNames(
  names: string[],
  accessToken: string,
  baseId: string,
  tableId: string
): Promise<string[]> {
  if (names.length === 0) return [];

  // Import here to avoid circular dependencies
  const { listRecords } = await import('../airtable/client');

  // Fetch records and filter by primary field
  // Note: This is a simplified approach. In production, you might want to:
  // 1. Get the table schema to identify the primary field
  // 2. Use filterByFormula with the primary field name
  const records = await listRecords(accessToken, baseId, tableId);

  const recordIds: string[] = [];
  names.forEach((name) => {
    const record = records.find((r) => {
      // Check if any field value matches (simplified - should check primary field)
      const firstFieldValue = Object.values(r.fields)[0];
      return String(firstFieldValue).toLowerCase() === name.toLowerCase();
    });
    if (record) {
      recordIds.push(record.id);
    }
  });

  return recordIds;
}

// ============================================================================
// Batch Conversion Helpers
// ============================================================================

/**
 * Converts a complete Airtable record to a Sheets row
 */
export async function airtableRecordToSheetsRow(
  record: AirtableRecord,
  fields: AirtableField[],
  context?: FieldMappingContext
): Promise<{
  row: any[];
  errors: string[];
  warnings: string[];
}> {
  const row: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const field of fields) {
    const value = record.fields[field.name];
    const conversionContext = { ...context, airtableField: field };
    const result = await airtableToSheets(value, field.type, conversionContext);

    row.push(result.value);

    if (result.errors?.length) {
      errors.push(`${field.name}: ${result.errors.join(', ')}`);
    }
    if (result.warnings?.length) {
      warnings.push(`${field.name}: ${result.warnings.join(', ')}`);
    }
  }

  return { row, errors, warnings };
}

/**
 * Converts a Sheets row to Airtable record fields
 */
export async function sheetsRowToAirtableFields(
  row: any[],
  fields: AirtableField[],
  context?: FieldMappingContext
): Promise<{
  fields: Record<string, AirtableFieldValue>;
  errors: string[];
  warnings: string[];
}> {
  const recordFields: Record<string, AirtableFieldValue> = {};
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < fields.length && i < row.length; i++) {
    const field = fields[i];
    const value = row[i];
    const conversionContext = { ...context, airtableField: field };
    const result = await sheetsToAirtable(value, field.type, conversionContext);

    // Only include the field if we have a value (skip read-only fields)
    if (result.value !== null && result.value !== undefined) {
      recordFields[field.name] = result.value;
    }

    if (result.errors?.length) {
      errors.push(`${field.name}: ${result.errors.join(', ')}`);
    }
    if (result.warnings?.length) {
      warnings.push(`${field.name}: ${result.warnings.join(', ')}`);
    }
  }

  return { fields: recordFields, errors, warnings };
}

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
export async function sheetsRowToAirtableFieldsWithMapping(
  row: any[],
  fields: AirtableField[],
  fieldMappings: Record<string, number>,
  idColumnIndex: number,
  context?: FieldMappingContext
): Promise<{
  fields: Record<string, AirtableFieldValue>;
  errors: string[];
  warnings: string[];
}> {
  const recordFields: Record<string, AirtableFieldValue> = {};
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const field of fields) {
    const columnIndex = fieldMappings[field.id];

    // Skip if no mapping for this field
    if (columnIndex === undefined) {
      continue;
    }

    // Get value from the mapped column
    const value = row[columnIndex];

    const conversionContext = { ...context, airtableField: field };
    const result = await sheetsToAirtable(value, field.type, conversionContext);

    // Only include the field if we have a value (skip read-only fields)
    if (result.value !== null && result.value !== undefined) {
      recordFields[field.name] = result.value;
    }

    if (result.errors?.length) {
      errors.push(`${field.name}: ${result.errors.join(', ')}`);
    }
    if (result.warnings?.length) {
      warnings.push(`${field.name}: ${result.warnings.join(', ')}`);
    }
  }

  return { fields: recordFields, errors, warnings };
}

// ============================================================================
// Type Guards and Validation
// ============================================================================

/**
 * Checks if an Airtable field type is read-only
 */
export function isReadOnlyField(fieldType: AirtableFieldType): boolean {
  const readOnlyTypes: AirtableFieldType[] = [
    'autoNumber',
    'createdTime',
    'lastModifiedTime',
    'createdBy',
    'lastModifiedBy',
    'formula',
    'rollup',
    'count',
    'multipleLookupValues',
    'button',
  ];
  return readOnlyTypes.includes(fieldType);
}

/**
 * Checks if an Airtable field type supports writing from Sheets
 */
export function isWritableFromSheets(fieldType: AirtableFieldType): boolean {
  const unsupportedTypes: AirtableFieldType[] = [
    'multipleAttachments',
    'singleCollaborator',
    'multipleCollaborators',
    'barcode',
  ];
  return !isReadOnlyField(fieldType) && !unsupportedTypes.includes(fieldType);
}

/**
 * Validates field type compatibility between Airtable and Sheets
 */
export function validateFieldCompatibility(
  airtableField: AirtableField
): {
  compatible: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (isReadOnlyField(airtableField.type)) {
    issues.push('Field is read-only and cannot be synced from Sheets to Airtable');
  }

  if (!isWritableFromSheets(airtableField.type)) {
    issues.push(`Field type "${airtableField.type}" is not supported for Sheets → Airtable sync`);
  }

  return {
    compatible: issues.length === 0,
    issues,
  };
}
