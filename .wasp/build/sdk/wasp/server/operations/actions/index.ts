
import { prisma } from 'wasp/server'
import {
  type UnauthenticatedOperationFor,
  createUnauthenticatedOperation,
  type AuthenticatedOperationFor,
  createAuthenticatedOperation,
} from '../wrappers.js'
import { updateIsUserAdminById as updateIsUserAdminById_ext } from 'wasp/src/user/operations'
import { updateUsername as updateUsername_ext } from 'wasp/src/user/accountSettings'
import { requestEmailChange as requestEmailChange_ext } from 'wasp/src/user/accountSettings'
import { confirmEmailChange as confirmEmailChange_ext } from 'wasp/src/user/accountSettings'
import { updateNotificationPreferences as updateNotificationPreferences_ext } from 'wasp/src/user/accountSettings'
import { changePassword as changePassword_ext } from 'wasp/src/user/security'
import { deleteAccount as deleteAccount_ext } from 'wasp/src/user/dangerZone'
import { generateCheckoutSession as generateCheckoutSession_ext } from 'wasp/src/payment/operations'
import { updateUser as updateUser_ext } from 'wasp/src/server/admin/operations'
import { deleteUser as deleteUser_ext } from 'wasp/src/server/admin/operations'
import { pauseResumeSync as pauseResumeSync_ext } from 'wasp/src/server/admin/operations'
import { triggerManualSyncAdmin as triggerManualSyncAdmin_ext } from 'wasp/src/server/admin/operations'
import { forceRefreshUserToken as forceRefreshUserToken_ext } from 'wasp/src/server/admin/operations'
import { initiateAirtableAuth as initiateAirtableAuth_ext } from 'wasp/src/server/airtable/operations'
import { completeAirtableAuth as completeAirtableAuth_ext } from 'wasp/src/server/airtable/operations'
import { disconnectAirtable as disconnectAirtable_ext } from 'wasp/src/server/airtable/operations'
import { initiateGoogleAuth as initiateGoogleAuth_ext } from 'wasp/src/server/google/operations'
import { completeGoogleAuth as completeGoogleAuth_ext } from 'wasp/src/server/google/operations'
import { disconnectGoogle as disconnectGoogle_ext } from 'wasp/src/server/google/operations'
import { triggerManualSync as triggerManualSync_ext } from 'wasp/src/server/actions/sync'
import { runInitialSync as runInitialSync_ext } from 'wasp/src/server/actions/sync'
import { createSyncConfig as createSyncConfig_ext } from 'wasp/src/server/actions/syncConfig'
import { updateSyncConfig as updateSyncConfig_ext } from 'wasp/src/server/actions/syncConfig'
import { deleteSyncConfig as deleteSyncConfig_ext } from 'wasp/src/server/actions/syncConfig'
import { toggleSyncActive as toggleSyncActive_ext } from 'wasp/src/server/actions/syncConfig'
import { runConnectionDiagnostics as runConnectionDiagnostics_ext } from 'wasp/src/server/actions/diagnostics'
import { clearReauthFlags as clearReauthFlags_ext } from 'wasp/src/server/actions/diagnostics'
import { sendTestEmails as sendTestEmails_ext } from 'wasp/src/server/emails/testSender'

// PRIVATE API
export type UpdateIsUserAdminById_ext = typeof updateIsUserAdminById_ext

// PUBLIC API
export const updateIsUserAdminById: AuthenticatedOperationFor<UpdateIsUserAdminById_ext> =
  createAuthenticatedOperation(
    updateIsUserAdminById_ext,
    {
      User: prisma.user,
    },
  )

// PRIVATE API
export type UpdateUsername_ext = typeof updateUsername_ext

// PUBLIC API
export const updateUsername: AuthenticatedOperationFor<UpdateUsername_ext> =
  createAuthenticatedOperation(
    updateUsername_ext,
    {
      User: prisma.user,
    },
  )

// PRIVATE API
export type RequestEmailChange_ext = typeof requestEmailChange_ext

// PUBLIC API
export const requestEmailChange: AuthenticatedOperationFor<RequestEmailChange_ext> =
  createAuthenticatedOperation(
    requestEmailChange_ext,
    {
      User: prisma.user,
    },
  )

// PRIVATE API
export type ConfirmEmailChange_ext = typeof confirmEmailChange_ext

// PUBLIC API
export const confirmEmailChange: AuthenticatedOperationFor<ConfirmEmailChange_ext> =
  createAuthenticatedOperation(
    confirmEmailChange_ext,
    {
      User: prisma.user,
    },
  )

// PRIVATE API
export type UpdateNotificationPreferences_ext = typeof updateNotificationPreferences_ext

// PUBLIC API
export const updateNotificationPreferences: AuthenticatedOperationFor<UpdateNotificationPreferences_ext> =
  createAuthenticatedOperation(
    updateNotificationPreferences_ext,
    {
      User: prisma.user,
    },
  )

// PRIVATE API
export type ChangePassword_ext = typeof changePassword_ext

// PUBLIC API
export const changePassword: AuthenticatedOperationFor<ChangePassword_ext> =
  createAuthenticatedOperation(
    changePassword_ext,
    {
      User: prisma.user,
    },
  )

// PRIVATE API
export type DeleteAccount_ext = typeof deleteAccount_ext

// PUBLIC API
export const deleteAccount: AuthenticatedOperationFor<DeleteAccount_ext> =
  createAuthenticatedOperation(
    deleteAccount_ext,
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
export type GenerateCheckoutSession_ext = typeof generateCheckoutSession_ext

// PUBLIC API
export const generateCheckoutSession: AuthenticatedOperationFor<GenerateCheckoutSession_ext> =
  createAuthenticatedOperation(
    generateCheckoutSession_ext,
    {
      User: prisma.user,
    },
  )

// PRIVATE API
export type UpdateUser_ext = typeof updateUser_ext

// PUBLIC API
export const updateUser: AuthenticatedOperationFor<UpdateUser_ext> =
  createAuthenticatedOperation(
    updateUser_ext,
    {
      User: prisma.user,
    },
  )

// PRIVATE API
export type DeleteUser_ext = typeof deleteUser_ext

// PUBLIC API
export const deleteUser: AuthenticatedOperationFor<DeleteUser_ext> =
  createAuthenticatedOperation(
    deleteUser_ext,
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
export type PauseResumeSync_ext = typeof pauseResumeSync_ext

// PUBLIC API
export const pauseResumeSync: AuthenticatedOperationFor<PauseResumeSync_ext> =
  createAuthenticatedOperation(
    pauseResumeSync_ext,
    {
      SyncConfig: prisma.syncConfig,
    },
  )

// PRIVATE API
export type TriggerManualSyncAdmin_ext = typeof triggerManualSyncAdmin_ext

// PUBLIC API
export const triggerManualSyncAdmin: AuthenticatedOperationFor<TriggerManualSyncAdmin_ext> =
  createAuthenticatedOperation(
    triggerManualSyncAdmin_ext,
    {
      SyncConfig: prisma.syncConfig,
      SyncLog: prisma.syncLog,
      User: prisma.user,
    },
  )

// PRIVATE API
export type ForceRefreshUserToken_ext = typeof forceRefreshUserToken_ext

// PUBLIC API
export const forceRefreshUserToken: AuthenticatedOperationFor<ForceRefreshUserToken_ext> =
  createAuthenticatedOperation(
    forceRefreshUserToken_ext,
    {
      AirtableConnection: prisma.airtableConnection,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  )

// PRIVATE API
export type InitiateAirtableAuth_ext = typeof initiateAirtableAuth_ext

// PUBLIC API
export const initiateAirtableAuth: AuthenticatedOperationFor<InitiateAirtableAuth_ext> =
  createAuthenticatedOperation(
    initiateAirtableAuth_ext,
    {
      User: prisma.user,
    },
  )

// PRIVATE API
export type CompleteAirtableAuth_ext = typeof completeAirtableAuth_ext

// PUBLIC API
export const completeAirtableAuth: AuthenticatedOperationFor<CompleteAirtableAuth_ext> =
  createAuthenticatedOperation(
    completeAirtableAuth_ext,
    {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
    },
  )

// PRIVATE API
export type DisconnectAirtable_ext = typeof disconnectAirtable_ext

// PUBLIC API
export const disconnectAirtable: AuthenticatedOperationFor<DisconnectAirtable_ext> =
  createAuthenticatedOperation(
    disconnectAirtable_ext,
    {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
    },
  )

// PRIVATE API
export type InitiateGoogleAuth_ext = typeof initiateGoogleAuth_ext

// PUBLIC API
export const initiateGoogleAuth: AuthenticatedOperationFor<InitiateGoogleAuth_ext> =
  createAuthenticatedOperation(
    initiateGoogleAuth_ext,
    {
      User: prisma.user,
    },
  )

// PRIVATE API
export type CompleteGoogleAuth_ext = typeof completeGoogleAuth_ext

// PUBLIC API
export const completeGoogleAuth: AuthenticatedOperationFor<CompleteGoogleAuth_ext> =
  createAuthenticatedOperation(
    completeGoogleAuth_ext,
    {
      User: prisma.user,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  )

// PRIVATE API
export type DisconnectGoogle_ext = typeof disconnectGoogle_ext

// PUBLIC API
export const disconnectGoogle: AuthenticatedOperationFor<DisconnectGoogle_ext> =
  createAuthenticatedOperation(
    disconnectGoogle_ext,
    {
      User: prisma.user,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  )

// PRIVATE API
export type TriggerManualSync_ext = typeof triggerManualSync_ext

// PUBLIC API
export const triggerManualSync: AuthenticatedOperationFor<TriggerManualSync_ext> =
  createAuthenticatedOperation(
    triggerManualSync_ext,
    {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
      SyncConfig: prisma.syncConfig,
      SyncLog: prisma.syncLog,
    },
  )

// PRIVATE API
export type RunInitialSync_ext = typeof runInitialSync_ext

// PUBLIC API
export const runInitialSync: AuthenticatedOperationFor<RunInitialSync_ext> =
  createAuthenticatedOperation(
    runInitialSync_ext,
    {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
      SyncConfig: prisma.syncConfig,
      SyncLog: prisma.syncLog,
    },
  )

// PRIVATE API
export type CreateSyncConfig_ext = typeof createSyncConfig_ext

// PUBLIC API
export const createSyncConfig: AuthenticatedOperationFor<CreateSyncConfig_ext> =
  createAuthenticatedOperation(
    createSyncConfig_ext,
    {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
      SyncConfig: prisma.syncConfig,
    },
  )

// PRIVATE API
export type UpdateSyncConfig_ext = typeof updateSyncConfig_ext

// PUBLIC API
export const updateSyncConfig: AuthenticatedOperationFor<UpdateSyncConfig_ext> =
  createAuthenticatedOperation(
    updateSyncConfig_ext,
    {
      User: prisma.user,
      SyncConfig: prisma.syncConfig,
    },
  )

// PRIVATE API
export type DeleteSyncConfig_ext = typeof deleteSyncConfig_ext

// PUBLIC API
export const deleteSyncConfig: AuthenticatedOperationFor<DeleteSyncConfig_ext> =
  createAuthenticatedOperation(
    deleteSyncConfig_ext,
    {
      User: prisma.user,
      SyncConfig: prisma.syncConfig,
      SyncLog: prisma.syncLog,
    },
  )

// PRIVATE API
export type ToggleSyncActive_ext = typeof toggleSyncActive_ext

// PUBLIC API
export const toggleSyncActive: AuthenticatedOperationFor<ToggleSyncActive_ext> =
  createAuthenticatedOperation(
    toggleSyncActive_ext,
    {
      User: prisma.user,
      SyncConfig: prisma.syncConfig,
    },
  )

// PRIVATE API
export type RunConnectionDiagnostics_ext = typeof runConnectionDiagnostics_ext

// PUBLIC API
export const runConnectionDiagnostics: AuthenticatedOperationFor<RunConnectionDiagnostics_ext> =
  createAuthenticatedOperation(
    runConnectionDiagnostics_ext,
    {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  )

// PRIVATE API
export type ClearReauthFlags_ext = typeof clearReauthFlags_ext

// PUBLIC API
export const clearReauthFlags: AuthenticatedOperationFor<ClearReauthFlags_ext> =
  createAuthenticatedOperation(
    clearReauthFlags_ext,
    {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  )

// PRIVATE API
export type SendTestEmails_ext = typeof sendTestEmails_ext

// PUBLIC API
export const sendTestEmails: AuthenticatedOperationFor<SendTestEmails_ext> =
  createAuthenticatedOperation(
    sendTestEmails_ext,
    {
      User: prisma.user,
      SyncConfig: prisma.syncConfig,
      SyncLog: prisma.syncLog,
      UsageStats: prisma.usageStats,
    },
  )
