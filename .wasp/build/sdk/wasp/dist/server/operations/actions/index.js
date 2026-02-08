import { prisma } from 'wasp/server';
import { createAuthenticatedOperation, } from '../wrappers.js';
import { updateIsUserAdminById as updateIsUserAdminById_ext } from 'wasp/src/user/operations';
import { updateUsername as updateUsername_ext } from 'wasp/src/user/accountSettings';
import { requestEmailChange as requestEmailChange_ext } from 'wasp/src/user/accountSettings';
import { confirmEmailChange as confirmEmailChange_ext } from 'wasp/src/user/accountSettings';
import { updateNotificationPreferences as updateNotificationPreferences_ext } from 'wasp/src/user/accountSettings';
import { changePassword as changePassword_ext } from 'wasp/src/user/security';
import { deleteAccount as deleteAccount_ext } from 'wasp/src/user/dangerZone';
import { generateCheckoutSession as generateCheckoutSession_ext } from 'wasp/src/payment/operations';
import { updateUser as updateUser_ext } from 'wasp/src/server/admin/operations';
import { deleteUser as deleteUser_ext } from 'wasp/src/server/admin/operations';
import { pauseResumeSync as pauseResumeSync_ext } from 'wasp/src/server/admin/operations';
import { triggerManualSyncAdmin as triggerManualSyncAdmin_ext } from 'wasp/src/server/admin/operations';
import { forceRefreshUserToken as forceRefreshUserToken_ext } from 'wasp/src/server/admin/operations';
import { initiateAirtableAuth as initiateAirtableAuth_ext } from 'wasp/src/server/airtable/operations';
import { completeAirtableAuth as completeAirtableAuth_ext } from 'wasp/src/server/airtable/operations';
import { disconnectAirtable as disconnectAirtable_ext } from 'wasp/src/server/airtable/operations';
import { initiateGoogleAuth as initiateGoogleAuth_ext } from 'wasp/src/server/google/operations';
import { completeGoogleAuth as completeGoogleAuth_ext } from 'wasp/src/server/google/operations';
import { disconnectGoogle as disconnectGoogle_ext } from 'wasp/src/server/google/operations';
import { triggerManualSync as triggerManualSync_ext } from 'wasp/src/server/actions/sync';
import { runInitialSync as runInitialSync_ext } from 'wasp/src/server/actions/sync';
import { createSyncConfig as createSyncConfig_ext } from 'wasp/src/server/actions/syncConfig';
import { updateSyncConfig as updateSyncConfig_ext } from 'wasp/src/server/actions/syncConfig';
import { deleteSyncConfig as deleteSyncConfig_ext } from 'wasp/src/server/actions/syncConfig';
import { toggleSyncActive as toggleSyncActive_ext } from 'wasp/src/server/actions/syncConfig';
import { runConnectionDiagnostics as runConnectionDiagnostics_ext } from 'wasp/src/server/actions/diagnostics';
import { clearReauthFlags as clearReauthFlags_ext } from 'wasp/src/server/actions/diagnostics';
import { sendTestEmails as sendTestEmails_ext } from 'wasp/src/server/emails/testSender';
// PUBLIC API
export const updateIsUserAdminById = createAuthenticatedOperation(updateIsUserAdminById_ext, {
    User: prisma.user,
});
// PUBLIC API
export const updateUsername = createAuthenticatedOperation(updateUsername_ext, {
    User: prisma.user,
});
// PUBLIC API
export const requestEmailChange = createAuthenticatedOperation(requestEmailChange_ext, {
    User: prisma.user,
});
// PUBLIC API
export const confirmEmailChange = createAuthenticatedOperation(confirmEmailChange_ext, {
    User: prisma.user,
});
// PUBLIC API
export const updateNotificationPreferences = createAuthenticatedOperation(updateNotificationPreferences_ext, {
    User: prisma.user,
});
// PUBLIC API
export const changePassword = createAuthenticatedOperation(changePassword_ext, {
    User: prisma.user,
});
// PUBLIC API
export const deleteAccount = createAuthenticatedOperation(deleteAccount_ext, {
    User: prisma.user,
    AirtableConnection: prisma.airtableConnection,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
    SyncConfig: prisma.syncConfig,
    SyncLog: prisma.syncLog,
    UsageStats: prisma.usageStats,
});
// PUBLIC API
export const generateCheckoutSession = createAuthenticatedOperation(generateCheckoutSession_ext, {
    User: prisma.user,
});
// PUBLIC API
export const updateUser = createAuthenticatedOperation(updateUser_ext, {
    User: prisma.user,
});
// PUBLIC API
export const deleteUser = createAuthenticatedOperation(deleteUser_ext, {
    User: prisma.user,
    AirtableConnection: prisma.airtableConnection,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
    SyncConfig: prisma.syncConfig,
    SyncLog: prisma.syncLog,
    UsageStats: prisma.usageStats,
});
// PUBLIC API
export const pauseResumeSync = createAuthenticatedOperation(pauseResumeSync_ext, {
    SyncConfig: prisma.syncConfig,
});
// PUBLIC API
export const triggerManualSyncAdmin = createAuthenticatedOperation(triggerManualSyncAdmin_ext, {
    SyncConfig: prisma.syncConfig,
    SyncLog: prisma.syncLog,
    User: prisma.user,
});
// PUBLIC API
export const forceRefreshUserToken = createAuthenticatedOperation(forceRefreshUserToken_ext, {
    AirtableConnection: prisma.airtableConnection,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
});
// PUBLIC API
export const initiateAirtableAuth = createAuthenticatedOperation(initiateAirtableAuth_ext, {
    User: prisma.user,
});
// PUBLIC API
export const completeAirtableAuth = createAuthenticatedOperation(completeAirtableAuth_ext, {
    User: prisma.user,
    AirtableConnection: prisma.airtableConnection,
});
// PUBLIC API
export const disconnectAirtable = createAuthenticatedOperation(disconnectAirtable_ext, {
    User: prisma.user,
    AirtableConnection: prisma.airtableConnection,
});
// PUBLIC API
export const initiateGoogleAuth = createAuthenticatedOperation(initiateGoogleAuth_ext, {
    User: prisma.user,
});
// PUBLIC API
export const completeGoogleAuth = createAuthenticatedOperation(completeGoogleAuth_ext, {
    User: prisma.user,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
});
// PUBLIC API
export const disconnectGoogle = createAuthenticatedOperation(disconnectGoogle_ext, {
    User: prisma.user,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
});
// PUBLIC API
export const triggerManualSync = createAuthenticatedOperation(triggerManualSync_ext, {
    User: prisma.user,
    AirtableConnection: prisma.airtableConnection,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
    SyncConfig: prisma.syncConfig,
    SyncLog: prisma.syncLog,
});
// PUBLIC API
export const runInitialSync = createAuthenticatedOperation(runInitialSync_ext, {
    User: prisma.user,
    AirtableConnection: prisma.airtableConnection,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
    SyncConfig: prisma.syncConfig,
    SyncLog: prisma.syncLog,
});
// PUBLIC API
export const createSyncConfig = createAuthenticatedOperation(createSyncConfig_ext, {
    User: prisma.user,
    AirtableConnection: prisma.airtableConnection,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
    SyncConfig: prisma.syncConfig,
});
// PUBLIC API
export const updateSyncConfig = createAuthenticatedOperation(updateSyncConfig_ext, {
    User: prisma.user,
    SyncConfig: prisma.syncConfig,
});
// PUBLIC API
export const deleteSyncConfig = createAuthenticatedOperation(deleteSyncConfig_ext, {
    User: prisma.user,
    SyncConfig: prisma.syncConfig,
    SyncLog: prisma.syncLog,
});
// PUBLIC API
export const toggleSyncActive = createAuthenticatedOperation(toggleSyncActive_ext, {
    User: prisma.user,
    SyncConfig: prisma.syncConfig,
});
// PUBLIC API
export const runConnectionDiagnostics = createAuthenticatedOperation(runConnectionDiagnostics_ext, {
    User: prisma.user,
    AirtableConnection: prisma.airtableConnection,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
});
// PUBLIC API
export const clearReauthFlags = createAuthenticatedOperation(clearReauthFlags_ext, {
    User: prisma.user,
    AirtableConnection: prisma.airtableConnection,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
});
// PUBLIC API
export const sendTestEmails = createAuthenticatedOperation(sendTestEmails_ext, {
    User: prisma.user,
    SyncConfig: prisma.syncConfig,
    SyncLog: prisma.syncLog,
    UsageStats: prisma.usageStats,
});
//# sourceMappingURL=index.js.map