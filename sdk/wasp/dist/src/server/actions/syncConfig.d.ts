/**
 * Wasp actions for managing sync configurations
 */
import type { CreateSyncConfig, UpdateSyncConfig, DeleteSyncConfig, ToggleSyncActive } from 'wasp/server/operations';
type CreateSyncConfigInput = {
    name: string;
    airtableBaseId: string;
    airtableBaseName?: string;
    airtableTableId: string;
    airtableTableName?: string;
    airtableViewId?: string;
    googleSpreadsheetId: string;
    googleSpreadsheetName?: string;
    googleSheetId: string;
    googleSheetName?: string;
    fieldMappings: Record<string, number>;
    syncDirection: 'AIRTABLE_TO_SHEETS' | 'SHEETS_TO_AIRTABLE' | 'BIDIRECTIONAL';
    conflictResolution?: 'AIRTABLE_WINS' | 'SHEETS_WINS' | 'NEWEST_WINS';
};
type CreateSyncConfigOutput = {
    id: string;
    name: string;
    isActive: boolean;
};
type UpdateSyncConfigInput = {
    syncConfigId: string;
    name?: string;
    fieldMappings?: Record<string, number>;
    syncDirection?: 'AIRTABLE_TO_SHEETS' | 'SHEETS_TO_AIRTABLE' | 'BIDIRECTIONAL';
    conflictResolution?: 'AIRTABLE_WINS' | 'SHEETS_WINS' | 'NEWEST_WINS';
};
type UpdateSyncConfigOutput = {
    id: string;
    name: string;
    isActive: boolean;
};
type DeleteSyncConfigInput = {
    syncConfigId: string;
};
type DeleteSyncConfigOutput = {
    success: boolean;
};
type ToggleSyncActiveInput = {
    syncConfigId: string;
    isActive: boolean;
};
type ToggleSyncActiveOutput = {
    id: string;
    isActive: boolean;
};
/**
 * Creates a new sync configuration
 * Validates inputs and ensures user has necessary OAuth connections
 */
export declare const createSyncConfig: CreateSyncConfig<CreateSyncConfigInput, CreateSyncConfigOutput>;
/**
 * Updates an existing sync configuration
 * User must own the sync configuration to update it
 */
export declare const updateSyncConfig: UpdateSyncConfig<UpdateSyncConfigInput, UpdateSyncConfigOutput>;
/**
 * Deletes a sync configuration and all associated sync logs
 * User must own the sync configuration to delete it
 */
export declare const deleteSyncConfig: DeleteSyncConfig<DeleteSyncConfigInput, DeleteSyncConfigOutput>;
/**
 * Pauses or resumes a sync configuration
 * User must own the sync configuration to toggle it
 */
export declare const toggleSyncActive: ToggleSyncActive<ToggleSyncActiveInput, ToggleSyncActiveOutput>;
export {};
//# sourceMappingURL=syncConfig.d.ts.map