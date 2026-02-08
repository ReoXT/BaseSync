import {
  type _User,
  type _AirtableConnection,
  type _GoogleSheetsConnection,
  type _SyncConfig,
  type _SyncLog,
  type _UsageStats,
  type AuthenticatedActionDefinition,
  type Payload,
} from 'wasp/server/_types'

// PUBLIC API
export type UpdateIsUserAdminById<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateUsername<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type RequestEmailChange<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type ConfirmEmailChange<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateNotificationPreferences<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type ChangePassword<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DeleteAccount<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _AirtableConnection,
      _GoogleSheetsConnection,
      _SyncConfig,
      _SyncLog,
      _UsageStats,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GenerateCheckoutSession<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateUser<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DeleteUser<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _AirtableConnection,
      _GoogleSheetsConnection,
      _SyncConfig,
      _SyncLog,
      _UsageStats,
    ],
    Input,
    Output
  >

// PUBLIC API
export type PauseResumeSync<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _SyncConfig,
    ],
    Input,
    Output
  >

// PUBLIC API
export type TriggerManualSyncAdmin<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _SyncConfig,
      _SyncLog,
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type ForceRefreshUserToken<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _AirtableConnection,
      _GoogleSheetsConnection,
    ],
    Input,
    Output
  >

// PUBLIC API
export type InitiateAirtableAuth<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CompleteAirtableAuth<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _AirtableConnection,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DisconnectAirtable<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _AirtableConnection,
    ],
    Input,
    Output
  >

// PUBLIC API
export type InitiateGoogleAuth<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CompleteGoogleAuth<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _GoogleSheetsConnection,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DisconnectGoogle<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _GoogleSheetsConnection,
    ],
    Input,
    Output
  >

// PUBLIC API
export type TriggerManualSync<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _AirtableConnection,
      _GoogleSheetsConnection,
      _SyncConfig,
      _SyncLog,
    ],
    Input,
    Output
  >

// PUBLIC API
export type RunInitialSync<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _AirtableConnection,
      _GoogleSheetsConnection,
      _SyncConfig,
      _SyncLog,
    ],
    Input,
    Output
  >

// PUBLIC API
export type CreateSyncConfig<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _AirtableConnection,
      _GoogleSheetsConnection,
      _SyncConfig,
    ],
    Input,
    Output
  >

// PUBLIC API
export type UpdateSyncConfig<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _SyncConfig,
    ],
    Input,
    Output
  >

// PUBLIC API
export type DeleteSyncConfig<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _SyncConfig,
      _SyncLog,
    ],
    Input,
    Output
  >

// PUBLIC API
export type ToggleSyncActive<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _SyncConfig,
    ],
    Input,
    Output
  >

// PUBLIC API
export type RunConnectionDiagnostics<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _AirtableConnection,
      _GoogleSheetsConnection,
    ],
    Input,
    Output
  >

// PUBLIC API
export type ClearReauthFlags<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _AirtableConnection,
      _GoogleSheetsConnection,
    ],
    Input,
    Output
  >

// PUBLIC API
export type SendTestEmails<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedActionDefinition<
    [
      _User,
      _SyncConfig,
      _SyncLog,
      _UsageStats,
    ],
    Input,
    Output
  >

