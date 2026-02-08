/**
 * Wasp queries for fetching sync configurations
 */

// @ts-nocheck
// Type checking disabled temporarily until Wasp regenerates types
import type { User, SyncConfig, SyncLog } from 'wasp/entities';
import type { GetUserSyncConfigs, GetSyncConfigById } from 'wasp/server/operations';
// GetSyncLogs will be available after Wasp regenerates types
type GetSyncLogs<Input, Output> = (args: Input, context: any) => Promise<Output>;

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Query: Get User's Sync Configurations
// ============================================================================

/**
 * Fetches all sync configurations for the authenticated user
 * Sorted by most recently updated first
 */
export const getUserSyncConfigs: GetUserSyncConfigs<
  GetUserSyncConfigsInput,
  GetUserSyncConfigsOutput
> = async (_args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  try {
    const syncConfigs = await context.entities.SyncConfig.findMany({
      where: {
        userId: context.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return syncConfigs.map((config) => ({
      id: config.id,
      name: config.name,
      airtableBaseId: config.airtableBaseId,
      airtableTableId: config.airtableTableId,
      airtableTableName: config.airtableTableName,
      googleSpreadsheetId: config.googleSpreadsheetId,
      googleSheetId: config.googleSheetId,
      googleSheetName: config.googleSheetName,
      fieldMappings: JSON.parse(config.fieldMappings),
      syncDirection: config.syncDirection as
        | 'AIRTABLE_TO_SHEETS'
        | 'SHEETS_TO_AIRTABLE'
        | 'BIDIRECTIONAL',
      conflictResolution: config.conflictResolution as
        | 'AIRTABLE_WINS'
        | 'SHEETS_WINS'
        | 'NEWEST_WINS',
      isActive: config.isActive,
      lastSyncAt: config.lastSyncAt,
      lastSyncStatus: config.lastSyncStatus,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }));
  } catch (error) {
    console.error('Failed to fetch sync configurations:', error);

    if (error instanceof Error) {
      throw new Error(`Failed to fetch sync configurations: ${error.message}`);
    }

    throw new Error('Failed to fetch sync configurations. Please try again.');
  }
};

// ============================================================================
// Query: Get Sync Configuration by ID
// ============================================================================

/**
 * Fetches a specific sync configuration by ID
 * User must own the sync configuration to view it
 */
export const getSyncConfigById: GetSyncConfigById<
  GetSyncConfigByIdInput,
  GetSyncConfigByIdOutput
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { syncConfigId } = args;

  if (!syncConfigId) {
    throw new Error('Sync configuration ID is required');
  }

  try {
    const syncConfig = await context.entities.SyncConfig.findUnique({
      where: {
        id: syncConfigId,
      },
    });

    if (!syncConfig) {
      throw new Error('Sync configuration not found');
    }

    // Verify user owns this sync config
    if (syncConfig.userId !== context.user.id) {
      throw new Error('You do not have permission to view this sync configuration');
    }

    return {
      id: syncConfig.id,
      name: syncConfig.name,
      airtableBaseId: syncConfig.airtableBaseId,
      airtableTableId: syncConfig.airtableTableId,
      airtableTableName: syncConfig.airtableTableName,
      googleSpreadsheetId: syncConfig.googleSpreadsheetId,
      googleSheetId: syncConfig.googleSheetId,
      googleSheetName: syncConfig.googleSheetName,
      fieldMappings: JSON.parse(syncConfig.fieldMappings),
      syncDirection: syncConfig.syncDirection as
        | 'AIRTABLE_TO_SHEETS'
        | 'SHEETS_TO_AIRTABLE'
        | 'BIDIRECTIONAL',
      conflictResolution: syncConfig.conflictResolution as
        | 'AIRTABLE_WINS'
        | 'SHEETS_WINS'
        | 'NEWEST_WINS',
      isActive: syncConfig.isActive,
      lastSyncAt: syncConfig.lastSyncAt,
      lastSyncStatus: syncConfig.lastSyncStatus,
      createdAt: syncConfig.createdAt,
      updatedAt: syncConfig.updatedAt,
    };
  } catch (error) {
    console.error('Failed to fetch sync configuration:', error);

    if (error instanceof Error) {
      // Re-throw known errors
      if (
        error.message.includes('not found') ||
        error.message.includes('permission')
      ) {
        throw error;
      }
      throw new Error(`Failed to fetch sync configuration: ${error.message}`);
    }

    throw new Error('Failed to fetch sync configuration. Please try again.');
  }
};

// ============================================================================
// Query: Get Sync Logs for Configuration
// ============================================================================

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
export const getSyncLogs: GetSyncLogs<
  GetSyncLogsInput,
  GetSyncLogsOutput
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { syncConfigId, limit = 50 } = args;

  if (!syncConfigId) {
    throw new Error('Sync configuration ID is required');
  }

  try {
    // First verify the sync config exists and user owns it
    const syncConfig = await context.entities.SyncConfig.findUnique({
      where: { id: syncConfigId },
    });

    if (!syncConfig) {
      throw new Error('Sync configuration not found');
    }

    if (syncConfig.userId !== context.user.id) {
      throw new Error('You do not have permission to view logs for this sync configuration');
    }

    // Fetch sync logs, most recent first
    const logs = await context.entities.SyncLog.findMany({
      where: {
        syncConfigId: syncConfigId,
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
    });

    return logs.map((log) => ({
      id: log.id,
      syncConfigId: log.syncConfigId,
      status: log.status,
      startedAt: log.startedAt,
      completedAt: log.completedAt,
      recordsSynced: log.recordsSynced || 0,
      recordsFailed: log.recordsFailed || 0,
      errors: log.errors,
      triggeredBy: log.triggeredBy,
      direction: log.direction,
    }));
  } catch (error) {
    console.error('Failed to fetch sync logs:', error);

    if (error instanceof Error) {
      // Re-throw known errors
      if (
        error.message.includes('not found') ||
        error.message.includes('permission')
      ) {
        throw error;
      }
      throw new Error(`Failed to fetch sync logs: ${error.message}`);
    }

    throw new Error('Failed to fetch sync logs. Please try again.');
  }
};
