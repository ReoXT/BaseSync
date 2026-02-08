/**
 * Wasp actions for managing sync configurations
 */

// @ts-nocheck
// Type checking disabled temporarily until Wasp regenerates types
import type { User, SyncConfig } from 'wasp/entities';
import type {
  CreateSyncConfig,
  UpdateSyncConfig,
  DeleteSyncConfig,
  ToggleSyncActive,
} from 'wasp/server/operations';
import { checkSyncConfigLimit } from '../middleware/usageLimits';
import { trackSyncConfigCreated } from '../utils/usageTracker';

// ============================================================================
// Types
// ============================================================================

type CreateSyncConfigInput = {
  name: string;
  airtableBaseId: string;
  airtableBaseName?: string;
  airtableTableId: string;
  airtableTableName?: string;
  airtableViewId?: string; // Optional: for exact row order matching
  googleSpreadsheetId: string;
  googleSpreadsheetName?: string;
  googleSheetId: string;
  googleSheetName?: string;
  fieldMappings: Record<string, number>; // { airtableFieldId: sheetsColumnIndex }
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

// ============================================================================
// Action: Create Sync Configuration
// ============================================================================

/**
 * Creates a new sync configuration
 * Validates inputs and ensures user has necessary OAuth connections
 */
export const createSyncConfig: CreateSyncConfig<
  CreateSyncConfigInput,
  CreateSyncConfigOutput
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  // Validate required fields
  if (!args.name || args.name.trim().length === 0) {
    throw new Error('Sync name is required');
  }

  if (!args.airtableBaseId || !args.airtableTableId) {
    throw new Error('Airtable base and table are required');
  }

  if (!args.googleSpreadsheetId || !args.googleSheetId) {
    throw new Error('Google Spreadsheet and Sheet are required');
  }

  if (!args.fieldMappings || Object.keys(args.fieldMappings).length === 0) {
    throw new Error('At least one field mapping is required');
  }

  if (!args.syncDirection) {
    throw new Error('Sync direction is required');
  }

  // Validate conflict resolution for bidirectional syncs
  if (args.syncDirection === 'BIDIRECTIONAL' && !args.conflictResolution) {
    throw new Error('Conflict resolution is required for bidirectional syncs');
  }

  // Check if user has Airtable connection
  const airtableConnection = await context.entities.AirtableConnection.findUnique({
    where: { userId: context.user.id },
  });

  if (!airtableConnection) {
    throw new Error(
      'Airtable account not connected. Please connect your Airtable account first.'
    );
  }

  // Check if user has Google Sheets connection
  const googleConnection = await context.entities.GoogleSheetsConnection.findUnique({
    where: { userId: context.user.id },
  });

  if (!googleConnection) {
    throw new Error(
      'Google account not connected. Please connect your Google account first.'
    );
  }

  // Check usage limits - count existing sync configs
  const currentSyncCount = await context.entities.SyncConfig.count({
    where: { userId: context.user.id },
  });

  const limitCheck = checkSyncConfigLimit(context.user, currentSyncCount);
  if (limitCheck.exceeded) {
    throw new Error(limitCheck.message);
  }

  try {
    // Create the sync configuration
    const syncConfig = await context.entities.SyncConfig.create({
      data: {
        userId: context.user.id,
        name: args.name.trim(),
        airtableBaseId: args.airtableBaseId,
        airtableTableId: args.airtableTableId,
        airtableTableName: args.airtableTableName,
        airtableViewId: args.airtableViewId, // Store view ID for exact ordering
        googleSpreadsheetId: args.googleSpreadsheetId,
        googleSheetId: args.googleSheetId,
        googleSheetName: args.googleSheetName,
        fieldMappings: JSON.stringify(args.fieldMappings),
        syncDirection: args.syncDirection,
        conflictResolution: args.conflictResolution || 'NEWEST_WINS',
        isActive: true,
      },
    });

    console.log(`Created sync config: ${syncConfig.id} (${syncConfig.name})`);

    // Track usage for billing/limits
    await trackSyncConfigCreated(context.user.id);

    return {
      id: syncConfig.id,
      name: syncConfig.name,
      isActive: syncConfig.isActive,
    };
  } catch (error) {
    console.error('Failed to create sync configuration:', error);

    if (error instanceof Error) {
      throw new Error(`Failed to create sync configuration: ${error.message}`);
    }

    throw new Error('Failed to create sync configuration. Please try again.');
  }
};

// ============================================================================
// Action: Update Sync Configuration
// ============================================================================

/**
 * Updates an existing sync configuration
 * User must own the sync configuration to update it
 */
export const updateSyncConfig: UpdateSyncConfig<
  UpdateSyncConfigInput,
  UpdateSyncConfigOutput
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { syncConfigId, ...updates } = args;

  if (!syncConfigId) {
    throw new Error('Sync configuration ID is required');
  }

  // Check if sync config exists and user owns it
  const existingConfig = await context.entities.SyncConfig.findUnique({
    where: { id: syncConfigId },
  });

  if (!existingConfig) {
    throw new Error('Sync configuration not found');
  }

  if (existingConfig.userId !== context.user.id) {
    throw new Error('You do not have permission to update this sync configuration');
  }

  // Validate conflict resolution for bidirectional syncs
  const finalSyncDirection = updates.syncDirection || existingConfig.syncDirection;
  if (finalSyncDirection === 'BIDIRECTIONAL') {
    const finalConflictResolution =
      updates.conflictResolution ||
      (existingConfig.conflictResolution as 'AIRTABLE_WINS' | 'SHEETS_WINS' | 'NEWEST_WINS');
    if (!finalConflictResolution) {
      throw new Error('Conflict resolution is required for bidirectional syncs');
    }
  }

  try {
    // Prepare update data
    const updateData: any = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }

    if (updates.fieldMappings !== undefined) {
      if (Object.keys(updates.fieldMappings).length === 0) {
        throw new Error('At least one field mapping is required');
      }
      updateData.fieldMappings = JSON.stringify(updates.fieldMappings);
    }

    if (updates.syncDirection !== undefined) {
      updateData.syncDirection = updates.syncDirection;
    }

    if (updates.conflictResolution !== undefined) {
      updateData.conflictResolution = updates.conflictResolution;
    }

    // Update the sync configuration
    const updatedConfig = await context.entities.SyncConfig.update({
      where: { id: syncConfigId },
      data: updateData,
    });

    console.log(`Updated sync config: ${updatedConfig.id} (${updatedConfig.name})`);

    return {
      id: updatedConfig.id,
      name: updatedConfig.name,
      isActive: updatedConfig.isActive,
    };
  } catch (error) {
    console.error('Failed to update sync configuration:', error);

    if (error instanceof Error) {
      throw new Error(`Failed to update sync configuration: ${error.message}`);
    }

    throw new Error('Failed to update sync configuration. Please try again.');
  }
};

// ============================================================================
// Action: Delete Sync Configuration
// ============================================================================

/**
 * Deletes a sync configuration and all associated sync logs
 * User must own the sync configuration to delete it
 */
export const deleteSyncConfig: DeleteSyncConfig<
  DeleteSyncConfigInput,
  DeleteSyncConfigOutput
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { syncConfigId } = args;

  if (!syncConfigId) {
    throw new Error('Sync configuration ID is required');
  }

  // Check if sync config exists and user owns it
  const existingConfig = await context.entities.SyncConfig.findUnique({
    where: { id: syncConfigId },
  });

  if (!existingConfig) {
    throw new Error('Sync configuration not found');
  }

  if (existingConfig.userId !== context.user.id) {
    throw new Error('You do not have permission to delete this sync configuration');
  }

  try {
    // Delete the sync configuration (sync logs will be cascade deleted due to schema)
    await context.entities.SyncConfig.delete({
      where: { id: syncConfigId },
    });

    console.log(`Deleted sync config: ${syncConfigId} (${existingConfig.name})`);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to delete sync configuration:', error);

    if (error instanceof Error) {
      throw new Error(`Failed to delete sync configuration: ${error.message}`);
    }

    throw new Error('Failed to delete sync configuration. Please try again.');
  }
};

// ============================================================================
// Action: Toggle Sync Active Status
// ============================================================================

/**
 * Pauses or resumes a sync configuration
 * User must own the sync configuration to toggle it
 */
export const toggleSyncActive: ToggleSyncActive<
  ToggleSyncActiveInput,
  ToggleSyncActiveOutput
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { syncConfigId, isActive } = args;

  if (!syncConfigId) {
    throw new Error('Sync configuration ID is required');
  }

  if (typeof isActive !== 'boolean') {
    throw new Error('isActive must be a boolean value');
  }

  // Check if sync config exists and user owns it
  const existingConfig = await context.entities.SyncConfig.findUnique({
    where: { id: syncConfigId },
  });

  if (!existingConfig) {
    throw new Error('Sync configuration not found');
  }

  if (existingConfig.userId !== context.user.id) {
    throw new Error('You do not have permission to modify this sync configuration');
  }

  try {
    // Update the active status
    const updatedConfig = await context.entities.SyncConfig.update({
      where: { id: syncConfigId },
      data: { isActive },
    });

    const statusText = isActive ? 'resumed' : 'paused';
    console.log(`Sync config ${statusText}: ${updatedConfig.id} (${updatedConfig.name})`);

    return {
      id: updatedConfig.id,
      isActive: updatedConfig.isActive,
    };
  } catch (error) {
    console.error('Failed to toggle sync configuration status:', error);

    if (error instanceof Error) {
      throw new Error(`Failed to toggle sync configuration: ${error.message}`);
    }

    throw new Error('Failed to toggle sync configuration. Please try again.');
  }
};
