/**
 * Wasp queries for fetching sync configurations
 */
import type { GetUserSyncConfigs, GetSyncConfigById } from 'wasp/server/operations';
type GetSyncLogs<Input, Output> = (args: Input, context: any) => Promise<Output>;
type GetUserSyncConfigsInput = void;
type GetUserSyncConfigsOutput = Array<{
    id: string;
    name: string;
    airtableBaseId: string;
    airtableTableId: string;
    airtableTableName: string | null;
    googleSpreadsheetId: string;
    googleSheetId: string;
    googleSheetName: string | null;
    fieldMappings: Record<string, number>;
    syncDirection: 'AIRTABLE_TO_SHEETS' | 'SHEETS_TO_AIRTABLE' | 'BIDIRECTIONAL';
    conflictResolution: 'AIRTABLE_WINS' | 'SHEETS_WINS' | 'NEWEST_WINS';
    isActive: boolean;
    lastSyncAt: Date | null;
    lastSyncStatus: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
type GetSyncConfigByIdInput = {
    syncConfigId: string;
};
type GetSyncConfigByIdOutput = {
    id: string;
    name: string;
    airtableBaseId: string;
    airtableTableId: string;
    airtableTableName: string | null;
    googleSpreadsheetId: string;
    googleSheetId: string;
    googleSheetName: string | null;
    fieldMappings: Record<string, number>;
    syncDirection: 'AIRTABLE_TO_SHEETS' | 'SHEETS_TO_AIRTABLE' | 'BIDIRECTIONAL';
    conflictResolution: 'AIRTABLE_WINS' | 'SHEETS_WINS' | 'NEWEST_WINS';
    isActive: boolean;
    lastSyncAt: Date | null;
    lastSyncStatus: string | null;
    createdAt: Date;
    updatedAt: Date;
};
/**
 * Fetches all sync configurations for the authenticated user
 * Sorted by most recently updated first
 */
export declare const getUserSyncConfigs: GetUserSyncConfigs<GetUserSyncConfigsInput, GetUserSyncConfigsOutput>;
/**
 * Fetches a specific sync configuration by ID
 * User must own the sync configuration to view it
 */
export declare const getSyncConfigById: GetSyncConfigById<GetSyncConfigByIdInput, GetSyncConfigByIdOutput>;
type GetSyncLogsInput = {
    syncConfigId: string;
    limit?: number;
};
type GetSyncLogsOutput = Array<{
    id: string;
    syncConfigId: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    recordsSynced: number;
    recordsFailed: number;
    errors: string | null;
    triggeredBy: string | null;
    direction: string | null;
}>;
/**
 * Fetches sync logs for a specific sync configuration
 * User must own the sync configuration to view its logs
 */
export declare const getSyncLogs: GetSyncLogs<GetSyncLogsInput, GetSyncLogsOutput>;
export {};
//# sourceMappingURL=syncConfig.d.ts.map