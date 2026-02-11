import { prisma } from 'wasp/server';
import { createAuthenticatedOperation, } from '../wrappers.js';
import { getPaginatedUsers as getPaginatedUsers_ext } from 'wasp/src/user/operations';
import { exportUserData as exportUserData_ext } from 'wasp/src/user/dangerZone';
import { getCustomerPortalUrl as getCustomerPortalUrl_ext } from 'wasp/src/payment/operations';
import { getDailyStats as getDailyStats_ext } from 'wasp/src/analytics/operations';
import { getAdminOverviewStats as getAdminOverviewStats_ext } from 'wasp/src/server/admin/operations';
import { getRecentActivity as getRecentActivity_ext } from 'wasp/src/server/admin/operations';
import { searchUsers as searchUsers_ext } from 'wasp/src/server/admin/operations';
import { getOnlineUsers as getOnlineUsers_ext } from 'wasp/src/server/admin/operations';
import { getUserDetail as getUserDetail_ext } from 'wasp/src/server/admin/operations';
import { getActiveSyncs as getActiveSyncs_ext } from 'wasp/src/server/admin/operations';
import { getFailedSyncs as getFailedSyncs_ext } from 'wasp/src/server/admin/operations';
import { getSyncMonitor as getSyncMonitor_ext } from 'wasp/src/server/admin/operations';
import { getAirtableConnectionStatus as getAirtableConnectionStatus_ext } from 'wasp/src/server/airtable/operations';
import { listUserAirtableBases as listUserAirtableBases_ext } from 'wasp/src/server/airtable/queries';
import { getAirtableTableSchema as getAirtableTableSchema_ext } from 'wasp/src/server/airtable/queries';
import { getAirtableBaseTables as getAirtableBaseTables_ext } from 'wasp/src/server/airtable/queries';
import { getGoogleConnectionStatus as getGoogleConnectionStatus_ext } from 'wasp/src/server/google/operations';
import { validateSpreadsheetUrl as validateSpreadsheetUrl_ext } from 'wasp/src/server/google/queries';
import { getSpreadsheetSheets as getSpreadsheetSheets_ext } from 'wasp/src/server/google/queries';
import { getSheetColumnHeaders as getSheetColumnHeaders_ext } from 'wasp/src/server/google/queries';
import { getUserSyncConfigs as getUserSyncConfigs_ext } from 'wasp/src/server/queries/syncConfig';
import { getSyncConfigById as getSyncConfigById_ext } from 'wasp/src/server/queries/syncConfig';
import { getSyncLogs as getSyncLogs_ext } from 'wasp/src/server/queries/syncConfig';
import { getUserUsage as getUserUsage_ext } from 'wasp/src/server/queries/usage';
// PUBLIC API
export const getPaginatedUsers = createAuthenticatedOperation(getPaginatedUsers_ext, {
    User: prisma.user,
});
// PUBLIC API
export const exportUserData = createAuthenticatedOperation(exportUserData_ext, {
    User: prisma.user,
    AirtableConnection: prisma.airtableConnection,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
    SyncConfig: prisma.syncConfig,
    SyncLog: prisma.syncLog,
    UsageStats: prisma.usageStats,
});
// PUBLIC API
export const getCustomerPortalUrl = createAuthenticatedOperation(getCustomerPortalUrl_ext, {
    User: prisma.user,
});
// PUBLIC API
export const getDailyStats = createAuthenticatedOperation(getDailyStats_ext, {
    User: prisma.user,
    DailyStats: prisma.dailyStats,
});
// PUBLIC API
export const getAdminOverviewStats = createAuthenticatedOperation(getAdminOverviewStats_ext, {
    User: prisma.user,
    SyncLog: prisma.syncLog,
    SyncConfig: prisma.syncConfig,
    AirtableConnection: prisma.airtableConnection,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
});
// PUBLIC API
export const getRecentActivity = createAuthenticatedOperation(getRecentActivity_ext, {
    User: prisma.user,
    SyncLog: prisma.syncLog,
    SyncConfig: prisma.syncConfig,
});
// PUBLIC API
export const searchUsers = createAuthenticatedOperation(searchUsers_ext, {
    User: prisma.user,
});
// PUBLIC API
export const getOnlineUsers = createAuthenticatedOperation(getOnlineUsers_ext, {
    User: prisma.user,
});
// PUBLIC API
export const getUserDetail = createAuthenticatedOperation(getUserDetail_ext, {
    User: prisma.user,
    AirtableConnection: prisma.airtableConnection,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
    SyncConfig: prisma.syncConfig,
    SyncLog: prisma.syncLog,
    UsageStats: prisma.usageStats,
});
// PUBLIC API
export const getActiveSyncs = createAuthenticatedOperation(getActiveSyncs_ext, {
    SyncLog: prisma.syncLog,
    SyncConfig: prisma.syncConfig,
    User: prisma.user,
});
// PUBLIC API
export const getFailedSyncs = createAuthenticatedOperation(getFailedSyncs_ext, {
    SyncLog: prisma.syncLog,
    SyncConfig: prisma.syncConfig,
    User: prisma.user,
});
// PUBLIC API
export const getSyncMonitor = createAuthenticatedOperation(getSyncMonitor_ext, {
    SyncLog: prisma.syncLog,
    SyncConfig: prisma.syncConfig,
    User: prisma.user,
});
// PUBLIC API
export const getAirtableConnectionStatus = createAuthenticatedOperation(getAirtableConnectionStatus_ext, {
    User: prisma.user,
    AirtableConnection: prisma.airtableConnection,
});
// PUBLIC API
export const listUserAirtableBases = createAuthenticatedOperation(listUserAirtableBases_ext, {
    User: prisma.user,
    AirtableConnection: prisma.airtableConnection,
});
// PUBLIC API
export const getAirtableTableSchema = createAuthenticatedOperation(getAirtableTableSchema_ext, {
    User: prisma.user,
    AirtableConnection: prisma.airtableConnection,
});
// PUBLIC API
export const getAirtableBaseTables = createAuthenticatedOperation(getAirtableBaseTables_ext, {
    User: prisma.user,
    AirtableConnection: prisma.airtableConnection,
});
// PUBLIC API
export const getGoogleConnectionStatus = createAuthenticatedOperation(getGoogleConnectionStatus_ext, {
    User: prisma.user,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
});
// PUBLIC API
export const validateSpreadsheetUrl = createAuthenticatedOperation(validateSpreadsheetUrl_ext, {
    User: prisma.user,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
});
// PUBLIC API
export const getSpreadsheetSheets = createAuthenticatedOperation(getSpreadsheetSheets_ext, {
    User: prisma.user,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
});
// PUBLIC API
export const getSheetColumnHeaders = createAuthenticatedOperation(getSheetColumnHeaders_ext, {
    User: prisma.user,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
});
// PUBLIC API
export const getUserSyncConfigs = createAuthenticatedOperation(getUserSyncConfigs_ext, {
    User: prisma.user,
    SyncConfig: prisma.syncConfig,
});
// PUBLIC API
export const getSyncConfigById = createAuthenticatedOperation(getSyncConfigById_ext, {
    User: prisma.user,
    SyncConfig: prisma.syncConfig,
});
// PUBLIC API
export const getSyncLogs = createAuthenticatedOperation(getSyncLogs_ext, {
    User: prisma.user,
    SyncConfig: prisma.syncConfig,
    SyncLog: prisma.syncLog,
});
// PUBLIC API
export const getUserUsage = createAuthenticatedOperation(getUserUsage_ext, {
    User: prisma.user,
    SyncConfig: prisma.syncConfig,
    UsageStats: prisma.usageStats,
});
//# sourceMappingURL=index.js.map