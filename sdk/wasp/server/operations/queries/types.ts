
import {
  type _User,
  type _AirtableConnection,
  type _GoogleSheetsConnection,
  type _SyncConfig,
  type _SyncLog,
  type _UsageStats,
  type _DailyStats,
  type AuthenticatedQueryDefinition,
  type Payload,
} from 'wasp/server/_types'

// PUBLIC API
export type GetPaginatedUsers<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type ExportUserData<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
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
export type GetCustomerPortalUrl<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetDailyStats<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _DailyStats,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetAdminOverviewStats<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _SyncLog,
      _SyncConfig,
      _AirtableConnection,
      _GoogleSheetsConnection,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetRecentActivity<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _SyncLog,
      _SyncConfig,
    ],
    Input,
    Output
  >

// PUBLIC API
export type SearchUsers<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetOnlineUsers<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetUserDetail<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
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
export type GetActiveSyncs<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _SyncLog,
      _SyncConfig,
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetFailedSyncs<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _SyncLog,
      _SyncConfig,
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetSyncMonitor<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _SyncLog,
      _SyncConfig,
      _User,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetAirtableConnectionStatus<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _AirtableConnection,
    ],
    Input,
    Output
  >

// PUBLIC API
export type ListUserAirtableBases<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _AirtableConnection,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetAirtableTableSchema<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _AirtableConnection,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetAirtableBaseTables<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _AirtableConnection,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetGoogleConnectionStatus<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _GoogleSheetsConnection,
    ],
    Input,
    Output
  >

// PUBLIC API
export type ValidateSpreadsheetUrl<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _GoogleSheetsConnection,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetSpreadsheetSheets<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _GoogleSheetsConnection,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetSheetColumnHeaders<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _GoogleSheetsConnection,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetUserSyncConfigs<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _SyncConfig,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetSyncConfigById<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _SyncConfig,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetSyncLogs<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _SyncConfig,
      _SyncLog,
    ],
    Input,
    Output
  >

// PUBLIC API
export type GetUserUsage<Input extends Payload = never, Output extends Payload = Payload> = 
  AuthenticatedQueryDefinition<
    [
      _User,
      _SyncConfig,
      _UsageStats,
    ],
    Input,
    Output
  >

