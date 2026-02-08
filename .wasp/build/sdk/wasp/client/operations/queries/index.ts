import { type QueryFor, createQuery } from './core'
import { GetPaginatedUsers_ext } from 'wasp/server/operations/queries'
import { ExportUserData_ext } from 'wasp/server/operations/queries'
import { GetCustomerPortalUrl_ext } from 'wasp/server/operations/queries'
import { GetDailyStats_ext } from 'wasp/server/operations/queries'
import { GetAdminOverviewStats_ext } from 'wasp/server/operations/queries'
import { GetRecentActivity_ext } from 'wasp/server/operations/queries'
import { SearchUsers_ext } from 'wasp/server/operations/queries'
import { GetOnlineUsers_ext } from 'wasp/server/operations/queries'
import { GetUserDetail_ext } from 'wasp/server/operations/queries'
import { GetActiveSyncs_ext } from 'wasp/server/operations/queries'
import { GetFailedSyncs_ext } from 'wasp/server/operations/queries'
import { GetSyncMonitor_ext } from 'wasp/server/operations/queries'
import { GetAirtableConnectionStatus_ext } from 'wasp/server/operations/queries'
import { ListUserAirtableBases_ext } from 'wasp/server/operations/queries'
import { GetAirtableTableSchema_ext } from 'wasp/server/operations/queries'
import { GetAirtableBaseTables_ext } from 'wasp/server/operations/queries'
import { GetGoogleConnectionStatus_ext } from 'wasp/server/operations/queries'
import { ListUserSpreadsheets_ext } from 'wasp/server/operations/queries'
import { GetSpreadsheetSheets_ext } from 'wasp/server/operations/queries'
import { GetSheetColumnHeaders_ext } from 'wasp/server/operations/queries'
import { GetUserSyncConfigs_ext } from 'wasp/server/operations/queries'
import { GetSyncConfigById_ext } from 'wasp/server/operations/queries'
import { GetSyncLogs_ext } from 'wasp/server/operations/queries'
import { GetUserUsage_ext } from 'wasp/server/operations/queries'

// PUBLIC API
export const getPaginatedUsers: QueryFor<GetPaginatedUsers_ext> = createQuery<GetPaginatedUsers_ext>(
  'operations/get-paginated-users',
  ['User'],
)

// PUBLIC API
export const exportUserData: QueryFor<ExportUserData_ext> = createQuery<ExportUserData_ext>(
  'operations/export-user-data',
  ['User', 'AirtableConnection', 'GoogleSheetsConnection', 'SyncConfig', 'SyncLog', 'UsageStats'],
)

// PUBLIC API
export const getCustomerPortalUrl: QueryFor<GetCustomerPortalUrl_ext> = createQuery<GetCustomerPortalUrl_ext>(
  'operations/get-customer-portal-url',
  ['User'],
)

// PUBLIC API
export const getDailyStats: QueryFor<GetDailyStats_ext> = createQuery<GetDailyStats_ext>(
  'operations/get-daily-stats',
  ['User', 'DailyStats'],
)

// PUBLIC API
export const getAdminOverviewStats: QueryFor<GetAdminOverviewStats_ext> = createQuery<GetAdminOverviewStats_ext>(
  'operations/get-admin-overview-stats',
  ['User', 'SyncLog', 'SyncConfig', 'AirtableConnection', 'GoogleSheetsConnection'],
)

// PUBLIC API
export const getRecentActivity: QueryFor<GetRecentActivity_ext> = createQuery<GetRecentActivity_ext>(
  'operations/get-recent-activity',
  ['User', 'SyncLog', 'SyncConfig'],
)

// PUBLIC API
export const searchUsers: QueryFor<SearchUsers_ext> = createQuery<SearchUsers_ext>(
  'operations/search-users',
  ['User'],
)

// PUBLIC API
export const getOnlineUsers: QueryFor<GetOnlineUsers_ext> = createQuery<GetOnlineUsers_ext>(
  'operations/get-online-users',
  ['User'],
)

// PUBLIC API
export const getUserDetail: QueryFor<GetUserDetail_ext> = createQuery<GetUserDetail_ext>(
  'operations/get-user-detail',
  ['User', 'AirtableConnection', 'GoogleSheetsConnection', 'SyncConfig', 'SyncLog', 'UsageStats'],
)

// PUBLIC API
export const getActiveSyncs: QueryFor<GetActiveSyncs_ext> = createQuery<GetActiveSyncs_ext>(
  'operations/get-active-syncs',
  ['SyncLog', 'SyncConfig', 'User'],
)

// PUBLIC API
export const getFailedSyncs: QueryFor<GetFailedSyncs_ext> = createQuery<GetFailedSyncs_ext>(
  'operations/get-failed-syncs',
  ['SyncLog', 'SyncConfig', 'User'],
)

// PUBLIC API
export const getSyncMonitor: QueryFor<GetSyncMonitor_ext> = createQuery<GetSyncMonitor_ext>(
  'operations/get-sync-monitor',
  ['SyncLog', 'SyncConfig', 'User'],
)

// PUBLIC API
export const getAirtableConnectionStatus: QueryFor<GetAirtableConnectionStatus_ext> = createQuery<GetAirtableConnectionStatus_ext>(
  'operations/get-airtable-connection-status',
  ['User', 'AirtableConnection'],
)

// PUBLIC API
export const listUserAirtableBases: QueryFor<ListUserAirtableBases_ext> = createQuery<ListUserAirtableBases_ext>(
  'operations/list-user-airtable-bases',
  ['User', 'AirtableConnection'],
)

// PUBLIC API
export const getAirtableTableSchema: QueryFor<GetAirtableTableSchema_ext> = createQuery<GetAirtableTableSchema_ext>(
  'operations/get-airtable-table-schema',
  ['User', 'AirtableConnection'],
)

// PUBLIC API
export const getAirtableBaseTables: QueryFor<GetAirtableBaseTables_ext> = createQuery<GetAirtableBaseTables_ext>(
  'operations/get-airtable-base-tables',
  ['User', 'AirtableConnection'],
)

// PUBLIC API
export const getGoogleConnectionStatus: QueryFor<GetGoogleConnectionStatus_ext> = createQuery<GetGoogleConnectionStatus_ext>(
  'operations/get-google-connection-status',
  ['User', 'GoogleSheetsConnection'],
)

// PUBLIC API
export const listUserSpreadsheets: QueryFor<ListUserSpreadsheets_ext> = createQuery<ListUserSpreadsheets_ext>(
  'operations/list-user-spreadsheets',
  ['User', 'GoogleSheetsConnection'],
)

// PUBLIC API
export const getSpreadsheetSheets: QueryFor<GetSpreadsheetSheets_ext> = createQuery<GetSpreadsheetSheets_ext>(
  'operations/get-spreadsheet-sheets',
  ['User', 'GoogleSheetsConnection'],
)

// PUBLIC API
export const getSheetColumnHeaders: QueryFor<GetSheetColumnHeaders_ext> = createQuery<GetSheetColumnHeaders_ext>(
  'operations/get-sheet-column-headers',
  ['User', 'GoogleSheetsConnection'],
)

// PUBLIC API
export const getUserSyncConfigs: QueryFor<GetUserSyncConfigs_ext> = createQuery<GetUserSyncConfigs_ext>(
  'operations/get-user-sync-configs',
  ['User', 'SyncConfig'],
)

// PUBLIC API
export const getSyncConfigById: QueryFor<GetSyncConfigById_ext> = createQuery<GetSyncConfigById_ext>(
  'operations/get-sync-config-by-id',
  ['User', 'SyncConfig'],
)

// PUBLIC API
export const getSyncLogs: QueryFor<GetSyncLogs_ext> = createQuery<GetSyncLogs_ext>(
  'operations/get-sync-logs',
  ['User', 'SyncConfig', 'SyncLog'],
)

// PUBLIC API
export const getUserUsage: QueryFor<GetUserUsage_ext> = createQuery<GetUserUsage_ext>(
  'operations/get-user-usage',
  ['User', 'SyncConfig', 'UsageStats'],
)

// PRIVATE API (used in SDK)
export { buildAndRegisterQuery } from './core'
