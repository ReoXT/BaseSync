
import { prisma } from 'wasp/server'
import {
  type UnauthenticatedOperationFor,
  createUnauthenticatedOperation,
  type AuthenticatedOperationFor,
  createAuthenticatedOperation,
} from '../wrappers.js'
import { getPaginatedUsers as getPaginatedUsers_ext } from 'wasp/src/user/operations'
import { exportUserData as exportUserData_ext } from 'wasp/src/user/dangerZone'
import { getCustomerPortalUrl as getCustomerPortalUrl_ext } from 'wasp/src/payment/operations'
import { getDailyStats as getDailyStats_ext } from 'wasp/src/analytics/operations'
import { getAdminOverviewStats as getAdminOverviewStats_ext } from 'wasp/src/server/admin/operations'
import { getRecentActivity as getRecentActivity_ext } from 'wasp/src/server/admin/operations'
import { searchUsers as searchUsers_ext } from 'wasp/src/server/admin/operations'
import { getOnlineUsers as getOnlineUsers_ext } from 'wasp/src/server/admin/operations'
import { getUserDetail as getUserDetail_ext } from 'wasp/src/server/admin/operations'
import { getActiveSyncs as getActiveSyncs_ext } from 'wasp/src/server/admin/operations'
import { getFailedSyncs as getFailedSyncs_ext } from 'wasp/src/server/admin/operations'
import { getSyncMonitor as getSyncMonitor_ext } from 'wasp/src/server/admin/operations'
import { getAirtableConnectionStatus as getAirtableConnectionStatus_ext } from 'wasp/src/server/airtable/operations'
import { listUserAirtableBases as listUserAirtableBases_ext } from 'wasp/src/server/airtable/queries'
import { getAirtableTableSchema as getAirtableTableSchema_ext } from 'wasp/src/server/airtable/queries'
import { getAirtableBaseTables as getAirtableBaseTables_ext } from 'wasp/src/server/airtable/queries'
import { getGoogleConnectionStatus as getGoogleConnectionStatus_ext } from 'wasp/src/server/google/operations'
import { validateSpreadsheetUrl as validateSpreadsheetUrl_ext } from 'wasp/src/server/google/queries'
import { getSpreadsheetSheets as getSpreadsheetSheets_ext } from 'wasp/src/server/google/queries'
import { getSheetColumnHeaders as getSheetColumnHeaders_ext } from 'wasp/src/server/google/queries'
import { getUserSyncConfigs as getUserSyncConfigs_ext } from 'wasp/src/server/queries/syncConfig'
import { getSyncConfigById as getSyncConfigById_ext } from 'wasp/src/server/queries/syncConfig'
import { getSyncLogs as getSyncLogs_ext } from 'wasp/src/server/queries/syncConfig'
import { getUserUsage as getUserUsage_ext } from 'wasp/src/server/queries/usage'

// PRIVATE API
export type GetPaginatedUsers_ext = typeof getPaginatedUsers_ext

// PUBLIC API
export const getPaginatedUsers: AuthenticatedOperationFor<GetPaginatedUsers_ext> =
  createAuthenticatedOperation(
    getPaginatedUsers_ext,
    {
      User: prisma.user,
    },
  )


// PRIVATE API
export type ExportUserData_ext = typeof exportUserData_ext

// PUBLIC API
export const exportUserData: AuthenticatedOperationFor<ExportUserData_ext> =
  createAuthenticatedOperation(
    exportUserData_ext,
    {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
      SyncConfig: prisma.syncConfig,
      SyncLog: prisma.syncLog,
      UsageStats: prisma.usageStats,
    },
  )


// PRIVATE API
export type GetCustomerPortalUrl_ext = typeof getCustomerPortalUrl_ext

// PUBLIC API
export const getCustomerPortalUrl: AuthenticatedOperationFor<GetCustomerPortalUrl_ext> =
  createAuthenticatedOperation(
    getCustomerPortalUrl_ext,
    {
      User: prisma.user,
    },
  )


// PRIVATE API
export type GetDailyStats_ext = typeof getDailyStats_ext

// PUBLIC API
export const getDailyStats: AuthenticatedOperationFor<GetDailyStats_ext> =
  createAuthenticatedOperation(
    getDailyStats_ext,
    {
      User: prisma.user,
      DailyStats: prisma.dailyStats,
    },
  )


// PRIVATE API
export type GetAdminOverviewStats_ext = typeof getAdminOverviewStats_ext

// PUBLIC API
export const getAdminOverviewStats: AuthenticatedOperationFor<GetAdminOverviewStats_ext> =
  createAuthenticatedOperation(
    getAdminOverviewStats_ext,
    {
      User: prisma.user,
      SyncLog: prisma.syncLog,
      SyncConfig: prisma.syncConfig,
      AirtableConnection: prisma.airtableConnection,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  )


// PRIVATE API
export type GetRecentActivity_ext = typeof getRecentActivity_ext

// PUBLIC API
export const getRecentActivity: AuthenticatedOperationFor<GetRecentActivity_ext> =
  createAuthenticatedOperation(
    getRecentActivity_ext,
    {
      User: prisma.user,
      SyncLog: prisma.syncLog,
      SyncConfig: prisma.syncConfig,
    },
  )


// PRIVATE API
export type SearchUsers_ext = typeof searchUsers_ext

// PUBLIC API
export const searchUsers: AuthenticatedOperationFor<SearchUsers_ext> =
  createAuthenticatedOperation(
    searchUsers_ext,
    {
      User: prisma.user,
    },
  )


// PRIVATE API
export type GetOnlineUsers_ext = typeof getOnlineUsers_ext

// PUBLIC API
export const getOnlineUsers: AuthenticatedOperationFor<GetOnlineUsers_ext> =
  createAuthenticatedOperation(
    getOnlineUsers_ext,
    {
      User: prisma.user,
    },
  )


// PRIVATE API
export type GetUserDetail_ext = typeof getUserDetail_ext

// PUBLIC API
export const getUserDetail: AuthenticatedOperationFor<GetUserDetail_ext> =
  createAuthenticatedOperation(
    getUserDetail_ext,
    {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
      SyncConfig: prisma.syncConfig,
      SyncLog: prisma.syncLog,
      UsageStats: prisma.usageStats,
    },
  )


// PRIVATE API
export type GetActiveSyncs_ext = typeof getActiveSyncs_ext

// PUBLIC API
export const getActiveSyncs: AuthenticatedOperationFor<GetActiveSyncs_ext> =
  createAuthenticatedOperation(
    getActiveSyncs_ext,
    {
      SyncLog: prisma.syncLog,
      SyncConfig: prisma.syncConfig,
      User: prisma.user,
    },
  )


// PRIVATE API
export type GetFailedSyncs_ext = typeof getFailedSyncs_ext

// PUBLIC API
export const getFailedSyncs: AuthenticatedOperationFor<GetFailedSyncs_ext> =
  createAuthenticatedOperation(
    getFailedSyncs_ext,
    {
      SyncLog: prisma.syncLog,
      SyncConfig: prisma.syncConfig,
      User: prisma.user,
    },
  )


// PRIVATE API
export type GetSyncMonitor_ext = typeof getSyncMonitor_ext

// PUBLIC API
export const getSyncMonitor: AuthenticatedOperationFor<GetSyncMonitor_ext> =
  createAuthenticatedOperation(
    getSyncMonitor_ext,
    {
      SyncLog: prisma.syncLog,
      SyncConfig: prisma.syncConfig,
      User: prisma.user,
    },
  )


// PRIVATE API
export type GetAirtableConnectionStatus_ext = typeof getAirtableConnectionStatus_ext

// PUBLIC API
export const getAirtableConnectionStatus: AuthenticatedOperationFor<GetAirtableConnectionStatus_ext> =
  createAuthenticatedOperation(
    getAirtableConnectionStatus_ext,
    {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
    },
  )


// PRIVATE API
export type ListUserAirtableBases_ext = typeof listUserAirtableBases_ext

// PUBLIC API
export const listUserAirtableBases: AuthenticatedOperationFor<ListUserAirtableBases_ext> =
  createAuthenticatedOperation(
    listUserAirtableBases_ext,
    {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
    },
  )


// PRIVATE API
export type GetAirtableTableSchema_ext = typeof getAirtableTableSchema_ext

// PUBLIC API
export const getAirtableTableSchema: AuthenticatedOperationFor<GetAirtableTableSchema_ext> =
  createAuthenticatedOperation(
    getAirtableTableSchema_ext,
    {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
    },
  )


// PRIVATE API
export type GetAirtableBaseTables_ext = typeof getAirtableBaseTables_ext

// PUBLIC API
export const getAirtableBaseTables: AuthenticatedOperationFor<GetAirtableBaseTables_ext> =
  createAuthenticatedOperation(
    getAirtableBaseTables_ext,
    {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
    },
  )


// PRIVATE API
export type GetGoogleConnectionStatus_ext = typeof getGoogleConnectionStatus_ext

// PUBLIC API
export const getGoogleConnectionStatus: AuthenticatedOperationFor<GetGoogleConnectionStatus_ext> =
  createAuthenticatedOperation(
    getGoogleConnectionStatus_ext,
    {
      User: prisma.user,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  )


// PRIVATE API
export type ValidateSpreadsheetUrl_ext = typeof validateSpreadsheetUrl_ext

// PUBLIC API
export const validateSpreadsheetUrl: AuthenticatedOperationFor<ValidateSpreadsheetUrl_ext> =
  createAuthenticatedOperation(
    validateSpreadsheetUrl_ext,
    {
      User: prisma.user,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  )


// PRIVATE API
export type GetSpreadsheetSheets_ext = typeof getSpreadsheetSheets_ext

// PUBLIC API
export const getSpreadsheetSheets: AuthenticatedOperationFor<GetSpreadsheetSheets_ext> =
  createAuthenticatedOperation(
    getSpreadsheetSheets_ext,
    {
      User: prisma.user,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  )


// PRIVATE API
export type GetSheetColumnHeaders_ext = typeof getSheetColumnHeaders_ext

// PUBLIC API
export const getSheetColumnHeaders: AuthenticatedOperationFor<GetSheetColumnHeaders_ext> =
  createAuthenticatedOperation(
    getSheetColumnHeaders_ext,
    {
      User: prisma.user,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  )


// PRIVATE API
export type GetUserSyncConfigs_ext = typeof getUserSyncConfigs_ext

// PUBLIC API
export const getUserSyncConfigs: AuthenticatedOperationFor<GetUserSyncConfigs_ext> =
  createAuthenticatedOperation(
    getUserSyncConfigs_ext,
    {
      User: prisma.user,
      SyncConfig: prisma.syncConfig,
    },
  )


// PRIVATE API
export type GetSyncConfigById_ext = typeof getSyncConfigById_ext

// PUBLIC API
export const getSyncConfigById: AuthenticatedOperationFor<GetSyncConfigById_ext> =
  createAuthenticatedOperation(
    getSyncConfigById_ext,
    {
      User: prisma.user,
      SyncConfig: prisma.syncConfig,
    },
  )


// PRIVATE API
export type GetSyncLogs_ext = typeof getSyncLogs_ext

// PUBLIC API
export const getSyncLogs: AuthenticatedOperationFor<GetSyncLogs_ext> =
  createAuthenticatedOperation(
    getSyncLogs_ext,
    {
      User: prisma.user,
      SyncConfig: prisma.syncConfig,
      SyncLog: prisma.syncLog,
    },
  )


// PRIVATE API
export type GetUserUsage_ext = typeof getUserUsage_ext

// PUBLIC API
export const getUserUsage: AuthenticatedOperationFor<GetUserUsage_ext> =
  createAuthenticatedOperation(
    getUserUsage_ext,
    {
      User: prisma.user,
      SyncConfig: prisma.syncConfig,
      UsageStats: prisma.usageStats,
    },
  )

