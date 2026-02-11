import { createQuery } from './core';
// PUBLIC API
export const getPaginatedUsers = createQuery('operations/get-paginated-users', ['User']);
// PUBLIC API
export const exportUserData = createQuery('operations/export-user-data', ['User', 'AirtableConnection', 'GoogleSheetsConnection', 'SyncConfig', 'SyncLog', 'UsageStats']);
// PUBLIC API
export const getCustomerPortalUrl = createQuery('operations/get-customer-portal-url', ['User']);
// PUBLIC API
export const getDailyStats = createQuery('operations/get-daily-stats', ['User', 'DailyStats']);
// PUBLIC API
export const getAdminOverviewStats = createQuery('operations/get-admin-overview-stats', ['User', 'SyncLog', 'SyncConfig', 'AirtableConnection', 'GoogleSheetsConnection']);
// PUBLIC API
export const getRecentActivity = createQuery('operations/get-recent-activity', ['User', 'SyncLog', 'SyncConfig']);
// PUBLIC API
export const searchUsers = createQuery('operations/search-users', ['User']);
// PUBLIC API
export const getOnlineUsers = createQuery('operations/get-online-users', ['User']);
// PUBLIC API
export const getUserDetail = createQuery('operations/get-user-detail', ['User', 'AirtableConnection', 'GoogleSheetsConnection', 'SyncConfig', 'SyncLog', 'UsageStats']);
// PUBLIC API
export const getActiveSyncs = createQuery('operations/get-active-syncs', ['SyncLog', 'SyncConfig', 'User']);
// PUBLIC API
export const getFailedSyncs = createQuery('operations/get-failed-syncs', ['SyncLog', 'SyncConfig', 'User']);
// PUBLIC API
export const getSyncMonitor = createQuery('operations/get-sync-monitor', ['SyncLog', 'SyncConfig', 'User']);
// PUBLIC API
export const getAirtableConnectionStatus = createQuery('operations/get-airtable-connection-status', ['User', 'AirtableConnection']);
// PUBLIC API
export const listUserAirtableBases = createQuery('operations/list-user-airtable-bases', ['User', 'AirtableConnection']);
// PUBLIC API
export const getAirtableTableSchema = createQuery('operations/get-airtable-table-schema', ['User', 'AirtableConnection']);
// PUBLIC API
export const getAirtableBaseTables = createQuery('operations/get-airtable-base-tables', ['User', 'AirtableConnection']);
// PUBLIC API
export const getGoogleConnectionStatus = createQuery('operations/get-google-connection-status', ['User', 'GoogleSheetsConnection']);
// PUBLIC API
export const validateSpreadsheetUrl = createQuery('operations/validate-spreadsheet-url', ['User', 'GoogleSheetsConnection']);
// PUBLIC API
export const getSpreadsheetSheets = createQuery('operations/get-spreadsheet-sheets', ['User', 'GoogleSheetsConnection']);
// PUBLIC API
export const getSheetColumnHeaders = createQuery('operations/get-sheet-column-headers', ['User', 'GoogleSheetsConnection']);
// PUBLIC API
export const getUserSyncConfigs = createQuery('operations/get-user-sync-configs', ['User', 'SyncConfig']);
// PUBLIC API
export const getSyncConfigById = createQuery('operations/get-sync-config-by-id', ['User', 'SyncConfig']);
// PUBLIC API
export const getSyncLogs = createQuery('operations/get-sync-logs', ['User', 'SyncConfig', 'SyncLog']);
// PUBLIC API
export const getUserUsage = createQuery('operations/get-user-usage', ['User', 'SyncConfig', 'UsageStats']);
// PRIVATE API (used in SDK)
export { buildAndRegisterQuery } from './core';
//# sourceMappingURL=index.js.map