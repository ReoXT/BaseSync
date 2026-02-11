/**
 * Typed Airtable API Client
 * Handles API requests to Airtable with rate limiting and proper error handling
 * API Documentation: https://airtable.com/developers/web/api/introduction
 */
export type AirtableFieldType = 'singleLineText' | 'multilineText' | 'richText' | 'email' | 'emailAddress' | 'url' | 'phoneNumber' | 'phone' | 'number' | 'currency' | 'percent' | 'duration' | 'rating' | 'checkbox' | 'date' | 'dateTime' | 'singleSelect' | 'multipleSelects' | 'singleCollaborator' | 'multipleCollaborators' | 'multipleRecordLinks' | 'barcode' | 'button' | 'count' | 'createdBy' | 'createdTime' | 'lastModifiedBy' | 'lastModifiedTime' | 'multipleAttachments' | 'autoNumber' | 'formula' | 'rollup' | 'multipleLookupValues';
export interface AirtableAttachment {
    id: string;
    url: string;
    filename: string;
    size: number;
    type: string;
    width?: number;
    height?: number;
    thumbnails?: {
        small?: {
            url: string;
            width: number;
            height: number;
        };
        large?: {
            url: string;
            width: number;
            height: number;
        };
        full?: {
            url: string;
            width: number;
            height: number;
        };
    };
}
export interface AirtableCollaborator {
    id: string;
    email: string;
    name?: string;
}
export type AirtableFieldValue = string | number | boolean | string[] | AirtableAttachment[] | AirtableCollaborator[] | {
    id: string;
}[] | Date | null;
export interface AirtableRecord {
    id: string;
    createdTime: string;
    fields: Record<string, AirtableFieldValue>;
}
export interface AirtableField {
    id: string;
    name: string;
    type: AirtableFieldType;
    description?: string;
    options?: {
        choices?: Array<{
            id: string;
            name: string;
            color?: string;
        }>;
        linkedTableId?: string;
        isReversed?: boolean;
        prefersSingleRecordLink?: boolean;
        inverseLinkFieldId?: string;
        result?: {
            type: string;
            options?: unknown;
        };
        [key: string]: unknown;
    };
}
export interface AirtableTable {
    id: string;
    name: string;
    description?: string;
    primaryFieldId: string;
    fields: AirtableField[];
}
export interface AirtableBase {
    id: string;
    name: string;
    permissionLevel: 'none' | 'read' | 'comment' | 'edit' | 'create';
}
export interface AirtableBaseSchema {
    tables: AirtableTable[];
}
export interface ListRecordsOptions {
    fields?: string[];
    filterByFormula?: string;
    maxRecords?: number;
    pageSize?: number;
    sort?: Array<{
        field: string;
        direction: 'asc' | 'desc';
    }>;
    view?: string;
    cellFormat?: 'json' | 'string';
    timeZone?: string;
    userLocale?: string;
    offset?: string;
}
export interface CreateRecordData {
    fields: Record<string, AirtableFieldValue>;
}
export interface UpdateRecordData {
    id: string;
    fields: Record<string, AirtableFieldValue>;
}
export declare class AirtableError extends Error {
    statusCode?: number | undefined;
    response?: unknown | undefined;
    constructor(message: string, statusCode?: number | undefined, response?: unknown | undefined);
}
/**
 * Lists all bases the user has access to
 * Requires: data.records:read or schema.bases:read scope
 */
export declare function listBases(accessToken: string): Promise<AirtableBase[]>;
/**
 * Gets the schema (tables and fields) for a specific base
 * Requires: schema.bases:read scope
 */
export declare function getBaseSchema(accessToken: string, baseId: string): Promise<AirtableBaseSchema>;
/**
 * Lists records from a table with optional filtering and pagination
 * Requires: data.records:read scope
 */
export declare function listRecords(accessToken: string, baseId: string, tableId: string, options?: ListRecordsOptions): Promise<AirtableRecord[]>;
/**
 * Creates records in a table (max 10 per request per Airtable limits)
 * Requires: data.records:write scope
 */
export declare function createRecords(accessToken: string, baseId: string, tableId: string, records: CreateRecordData[]): Promise<AirtableRecord[]>;
/**
 * Updates records in a table (max 10 per request per Airtable limits)
 * Requires: data.records:write scope
 */
export declare function updateRecords(accessToken: string, baseId: string, tableId: string, records: UpdateRecordData[]): Promise<AirtableRecord[]>;
/**
 * Deletes records from a table (max 10 per request per Airtable limits)
 * Requires: data.records:write scope
 */
export declare function deleteRecords(accessToken: string, baseId: string, tableId: string, recordIds: string[]): Promise<string[]>;
/**
 * Helper function to batch operations (create/update/delete) into chunks of 10
 */
export declare function batchOperations<T>(items: T[], batchSize?: number): T[][];
//# sourceMappingURL=client.d.ts.map