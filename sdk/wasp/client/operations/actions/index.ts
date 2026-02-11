import { type ActionFor, createAction } from './core'
import { UpdateIsUserAdminById_ext } from 'wasp/server/operations/actions'
import { UpdateUsername_ext } from 'wasp/server/operations/actions'
import { RequestEmailChange_ext } from 'wasp/server/operations/actions'
import { ConfirmEmailChange_ext } from 'wasp/server/operations/actions'
import { UpdateNotificationPreferences_ext } from 'wasp/server/operations/actions'
import { ChangePassword_ext } from 'wasp/server/operations/actions'
import { DeleteAccount_ext } from 'wasp/server/operations/actions'
import { GenerateCheckoutSession_ext } from 'wasp/server/operations/actions'
import { UpdateUser_ext } from 'wasp/server/operations/actions'
import { DeleteUser_ext } from 'wasp/server/operations/actions'
import { PauseResumeSync_ext } from 'wasp/server/operations/actions'
import { TriggerManualSyncAdmin_ext } from 'wasp/server/operations/actions'
import { ForceRefreshUserToken_ext } from 'wasp/server/operations/actions'
import { InitiateAirtableAuth_ext } from 'wasp/server/operations/actions'
import { CompleteAirtableAuth_ext } from 'wasp/server/operations/actions'
import { DisconnectAirtable_ext } from 'wasp/server/operations/actions'
import { InitiateGoogleAuth_ext } from 'wasp/server/operations/actions'
import { CompleteGoogleAuth_ext } from 'wasp/server/operations/actions'
import { DisconnectGoogle_ext } from 'wasp/server/operations/actions'
import { TriggerManualSync_ext } from 'wasp/server/operations/actions'
import { RunInitialSync_ext } from 'wasp/server/operations/actions'
import { CreateSyncConfig_ext } from 'wasp/server/operations/actions'
import { UpdateSyncConfig_ext } from 'wasp/server/operations/actions'
import { DeleteSyncConfig_ext } from 'wasp/server/operations/actions'
import { ToggleSyncActive_ext } from 'wasp/server/operations/actions'
import { RunConnectionDiagnostics_ext } from 'wasp/server/operations/actions'
import { ClearReauthFlags_ext } from 'wasp/server/operations/actions'
import { SendTestEmails_ext } from 'wasp/server/operations/actions'

// PUBLIC API
export const updateIsUserAdminById: ActionFor<UpdateIsUserAdminById_ext> = createAction<UpdateIsUserAdminById_ext>(
  'operations/update-is-user-admin-by-id',
  ['User'],
)

// PUBLIC API
export const updateUsername: ActionFor<UpdateUsername_ext> = createAction<UpdateUsername_ext>(
  'operations/update-username',
  ['User'],
)

// PUBLIC API
export const requestEmailChange: ActionFor<RequestEmailChange_ext> = createAction<RequestEmailChange_ext>(
  'operations/request-email-change',
  ['User'],
)

// PUBLIC API
export const confirmEmailChange: ActionFor<ConfirmEmailChange_ext> = createAction<ConfirmEmailChange_ext>(
  'operations/confirm-email-change',
  ['User'],
)

// PUBLIC API
export const updateNotificationPreferences: ActionFor<UpdateNotificationPreferences_ext> = createAction<UpdateNotificationPreferences_ext>(
  'operations/update-notification-preferences',
  ['User'],
)

// PUBLIC API
export const changePassword: ActionFor<ChangePassword_ext> = createAction<ChangePassword_ext>(
  'operations/change-password',
  ['User'],
)

// PUBLIC API
export const deleteAccount: ActionFor<DeleteAccount_ext> = createAction<DeleteAccount_ext>(
  'operations/delete-account',
  ['User', 'AirtableConnection', 'GoogleSheetsConnection', 'SyncConfig', 'SyncLog', 'UsageStats'],
)

// PUBLIC API
export const generateCheckoutSession: ActionFor<GenerateCheckoutSession_ext> = createAction<GenerateCheckoutSession_ext>(
  'operations/generate-checkout-session',
  ['User'],
)

// PUBLIC API
export const updateUser: ActionFor<UpdateUser_ext> = createAction<UpdateUser_ext>(
  'operations/update-user',
  ['User'],
)

// PUBLIC API
export const deleteUser: ActionFor<DeleteUser_ext> = createAction<DeleteUser_ext>(
  'operations/delete-user',
  ['User', 'AirtableConnection', 'GoogleSheetsConnection', 'SyncConfig', 'SyncLog', 'UsageStats'],
)

// PUBLIC API
export const pauseResumeSync: ActionFor<PauseResumeSync_ext> = createAction<PauseResumeSync_ext>(
  'operations/pause-resume-sync',
  ['SyncConfig'],
)

// PUBLIC API
export const triggerManualSyncAdmin: ActionFor<TriggerManualSyncAdmin_ext> = createAction<TriggerManualSyncAdmin_ext>(
  'operations/trigger-manual-sync-admin',
  ['SyncConfig', 'SyncLog', 'User'],
)

// PUBLIC API
export const forceRefreshUserToken: ActionFor<ForceRefreshUserToken_ext> = createAction<ForceRefreshUserToken_ext>(
  'operations/force-refresh-user-token',
  ['AirtableConnection', 'GoogleSheetsConnection'],
)

// PUBLIC API
export const initiateAirtableAuth: ActionFor<InitiateAirtableAuth_ext> = createAction<InitiateAirtableAuth_ext>(
  'operations/initiate-airtable-auth',
  ['User'],
)

// PUBLIC API
export const completeAirtableAuth: ActionFor<CompleteAirtableAuth_ext> = createAction<CompleteAirtableAuth_ext>(
  'operations/complete-airtable-auth',
  ['User', 'AirtableConnection'],
)

// PUBLIC API
export const disconnectAirtable: ActionFor<DisconnectAirtable_ext> = createAction<DisconnectAirtable_ext>(
  'operations/disconnect-airtable',
  ['User', 'AirtableConnection'],
)

// PUBLIC API
export const initiateGoogleAuth: ActionFor<InitiateGoogleAuth_ext> = createAction<InitiateGoogleAuth_ext>(
  'operations/initiate-google-auth',
  ['User'],
)

// PUBLIC API
export const completeGoogleAuth: ActionFor<CompleteGoogleAuth_ext> = createAction<CompleteGoogleAuth_ext>(
  'operations/complete-google-auth',
  ['User', 'GoogleSheetsConnection'],
)

// PUBLIC API
export const disconnectGoogle: ActionFor<DisconnectGoogle_ext> = createAction<DisconnectGoogle_ext>(
  'operations/disconnect-google',
  ['User', 'GoogleSheetsConnection'],
)

// PUBLIC API
export const triggerManualSync: ActionFor<TriggerManualSync_ext> = createAction<TriggerManualSync_ext>(
  'operations/trigger-manual-sync',
  ['User', 'AirtableConnection', 'GoogleSheetsConnection', 'SyncConfig', 'SyncLog'],
)

// PUBLIC API
export const runInitialSync: ActionFor<RunInitialSync_ext> = createAction<RunInitialSync_ext>(
  'operations/run-initial-sync',
  ['User', 'AirtableConnection', 'GoogleSheetsConnection', 'SyncConfig', 'SyncLog'],
)

// PUBLIC API
export const createSyncConfig: ActionFor<CreateSyncConfig_ext> = createAction<CreateSyncConfig_ext>(
  'operations/create-sync-config',
  ['User', 'AirtableConnection', 'GoogleSheetsConnection', 'SyncConfig'],
)

// PUBLIC API
export const updateSyncConfig: ActionFor<UpdateSyncConfig_ext> = createAction<UpdateSyncConfig_ext>(
  'operations/update-sync-config',
  ['User', 'SyncConfig'],
)

// PUBLIC API
export const deleteSyncConfig: ActionFor<DeleteSyncConfig_ext> = createAction<DeleteSyncConfig_ext>(
  'operations/delete-sync-config',
  ['User', 'SyncConfig', 'SyncLog'],
)

// PUBLIC API
export const toggleSyncActive: ActionFor<ToggleSyncActive_ext> = createAction<ToggleSyncActive_ext>(
  'operations/toggle-sync-active',
  ['User', 'SyncConfig'],
)

// PUBLIC API
export const runConnectionDiagnostics: ActionFor<RunConnectionDiagnostics_ext> = createAction<RunConnectionDiagnostics_ext>(
  'operations/run-connection-diagnostics',
  ['User', 'AirtableConnection', 'GoogleSheetsConnection'],
)

// PUBLIC API
export const clearReauthFlags: ActionFor<ClearReauthFlags_ext> = createAction<ClearReauthFlags_ext>(
  'operations/clear-reauth-flags',
  ['User', 'AirtableConnection', 'GoogleSheetsConnection'],
)

// PUBLIC API
export const sendTestEmails: ActionFor<SendTestEmails_ext> = createAction<SendTestEmails_ext>(
  'operations/send-test-emails',
  ['User', 'SyncConfig', 'SyncLog', 'UsageStats'],
)
