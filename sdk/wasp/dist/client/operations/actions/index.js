import { createAction } from './core';
// PUBLIC API
export const updateIsUserAdminById = createAction('operations/update-is-user-admin-by-id', ['User']);
// PUBLIC API
export const updateUsername = createAction('operations/update-username', ['User']);
// PUBLIC API
export const requestEmailChange = createAction('operations/request-email-change', ['User']);
// PUBLIC API
export const confirmEmailChange = createAction('operations/confirm-email-change', ['User']);
// PUBLIC API
export const updateNotificationPreferences = createAction('operations/update-notification-preferences', ['User']);
// PUBLIC API
export const changePassword = createAction('operations/change-password', ['User']);
// PUBLIC API
export const deleteAccount = createAction('operations/delete-account', ['User', 'AirtableConnection', 'GoogleSheetsConnection', 'SyncConfig', 'SyncLog', 'UsageStats']);
// PUBLIC API
export const generateCheckoutSession = createAction('operations/generate-checkout-session', ['User']);
// PUBLIC API
export const updateUser = createAction('operations/update-user', ['User']);
// PUBLIC API
export const deleteUser = createAction('operations/delete-user', ['User', 'AirtableConnection', 'GoogleSheetsConnection', 'SyncConfig', 'SyncLog', 'UsageStats']);
// PUBLIC API
export const pauseResumeSync = createAction('operations/pause-resume-sync', ['SyncConfig']);
// PUBLIC API
export const triggerManualSyncAdmin = createAction('operations/trigger-manual-sync-admin', ['SyncConfig', 'SyncLog', 'User']);
// PUBLIC API
export const forceRefreshUserToken = createAction('operations/force-refresh-user-token', ['AirtableConnection', 'GoogleSheetsConnection']);
// PUBLIC API
export const initiateAirtableAuth = createAction('operations/initiate-airtable-auth', ['User']);
// PUBLIC API
export const completeAirtableAuth = createAction('operations/complete-airtable-auth', ['User', 'AirtableConnection']);
// PUBLIC API
export const disconnectAirtable = createAction('operations/disconnect-airtable', ['User', 'AirtableConnection']);
// PUBLIC API
export const initiateGoogleAuth = createAction('operations/initiate-google-auth', ['User']);
// PUBLIC API
export const completeGoogleAuth = createAction('operations/complete-google-auth', ['User', 'GoogleSheetsConnection']);
// PUBLIC API
export const disconnectGoogle = createAction('operations/disconnect-google', ['User', 'GoogleSheetsConnection']);
// PUBLIC API
export const triggerManualSync = createAction('operations/trigger-manual-sync', ['User', 'AirtableConnection', 'GoogleSheetsConnection', 'SyncConfig', 'SyncLog']);
// PUBLIC API
export const runInitialSync = createAction('operations/run-initial-sync', ['User', 'AirtableConnection', 'GoogleSheetsConnection', 'SyncConfig', 'SyncLog']);
// PUBLIC API
export const createSyncConfig = createAction('operations/create-sync-config', ['User', 'AirtableConnection', 'GoogleSheetsConnection', 'SyncConfig']);
// PUBLIC API
export const updateSyncConfig = createAction('operations/update-sync-config', ['User', 'SyncConfig']);
// PUBLIC API
export const deleteSyncConfig = createAction('operations/delete-sync-config', ['User', 'SyncConfig', 'SyncLog']);
// PUBLIC API
export const toggleSyncActive = createAction('operations/toggle-sync-active', ['User', 'SyncConfig']);
// PUBLIC API
export const runConnectionDiagnostics = createAction('operations/run-connection-diagnostics', ['User', 'AirtableConnection', 'GoogleSheetsConnection']);
// PUBLIC API
export const clearReauthFlags = createAction('operations/clear-reauth-flags', ['User', 'AirtableConnection', 'GoogleSheetsConnection']);
// PUBLIC API
export const sendTestEmails = createAction('operations/send-test-emails', ['User', 'SyncConfig', 'SyncLog', 'UsageStats']);
//# sourceMappingURL=index.js.map