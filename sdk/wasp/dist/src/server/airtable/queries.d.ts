/**
 * Wasp queries for Airtable data access
 * These functions fetch data from Airtable on behalf of authenticated users
 */
import type { ListUserAirtableBases, GetAirtableTableSchema, GetAirtableBaseTables } from 'wasp/server/operations';
type ListUserAirtableBasesInput = void;
type ListUserAirtableBasesOutput = Array<{
    id: string;
    name: string;
    permissionLevel: string;
}>;
type GetAirtableTableSchemaInput = {
    baseId: string;
    tableId: string;
};
type GetAirtableTableSchemaOutput = {
    id: string;
    name: string;
    description?: string;
    primaryFieldId: string;
    fields: Array<{
        id: string;
        name: string;
        type: string;
        description?: string;
        options?: Record<string, any>;
    }>;
};
type GetAirtableBaseTablesInput = {
    baseId: string;
};
type GetAirtableBaseTablesOutput = Array<{
    id: string;
    name: string;
    description?: string;
    primaryFieldId: string;
}>;
/**
 * Lists all Airtable bases accessible to the authenticated user
 * Automatically refreshes token if expired
 */
export declare const listUserAirtableBases: ListUserAirtableBases<ListUserAirtableBasesInput, ListUserAirtableBasesOutput>;
/**
 * Gets the schema (fields) for a specific Airtable table
 * Automatically refreshes token if expired
 */
export declare const getAirtableTableSchema: GetAirtableTableSchema<GetAirtableTableSchemaInput, GetAirtableTableSchemaOutput>;
/**
 * Gets the list of tables in a specific Airtable base
 * Automatically refreshes token if expired
 */
export declare const getAirtableBaseTables: GetAirtableBaseTables<GetAirtableBaseTablesInput, GetAirtableBaseTablesOutput>;
export {};
//# sourceMappingURL=queries.d.ts.map