import { type _User, type _AirtableConnection, type _GoogleSheetsConnection, type _SyncConfig, type _SyncLog, type _UsageStats, type _DailyStats, type AuthenticatedQueryDefinition, type Payload } from 'wasp/server/_types';
export type GetPaginatedUsers<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User
], Input, Output>;
export type ExportUserData<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User,
    _AirtableConnection,
    _GoogleSheetsConnection,
    _SyncConfig,
    _SyncLog,
    _UsageStats
], Input, Output>;
export type GetCustomerPortalUrl<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User
], Input, Output>;
export type GetDailyStats<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User,
    _DailyStats
], Input, Output>;
export type GetAdminOverviewStats<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User,
    _SyncLog,
    _SyncConfig,
    _AirtableConnection,
    _GoogleSheetsConnection
], Input, Output>;
export type GetRecentActivity<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User,
    _SyncLog,
    _SyncConfig
], Input, Output>;
export type SearchUsers<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User
], Input, Output>;
export type GetOnlineUsers<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User
], Input, Output>;
export type GetUserDetail<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User,
    _AirtableConnection,
    _GoogleSheetsConnection,
    _SyncConfig,
    _SyncLog,
    _UsageStats
], Input, Output>;
export type GetActiveSyncs<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _SyncLog,
    _SyncConfig,
    _User
], Input, Output>;
export type GetFailedSyncs<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _SyncLog,
    _SyncConfig,
    _User
], Input, Output>;
export type GetSyncMonitor<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _SyncLog,
    _SyncConfig,
    _User
], Input, Output>;
export type GetAirtableConnectionStatus<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User,
    _AirtableConnection
], Input, Output>;
export type ListUserAirtableBases<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User,
    _AirtableConnection
], Input, Output>;
export type GetAirtableTableSchema<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User,
    _AirtableConnection
], Input, Output>;
export type GetAirtableBaseTables<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User,
    _AirtableConnection
], Input, Output>;
export type GetGoogleConnectionStatus<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User,
    _GoogleSheetsConnection
], Input, Output>;
export type ListUserSpreadsheets<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User,
    _GoogleSheetsConnection
], Input, Output>;
export type GetSpreadsheetSheets<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User,
    _GoogleSheetsConnection
], Input, Output>;
export type GetSheetColumnHeaders<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User,
    _GoogleSheetsConnection
], Input, Output>;
export type GetUserSyncConfigs<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User,
    _SyncConfig
], Input, Output>;
export type GetSyncConfigById<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User,
    _SyncConfig
], Input, Output>;
export type GetSyncLogs<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User,
    _SyncConfig,
    _SyncLog
], Input, Output>;
export type GetUserUsage<Input extends Payload = never, Output extends Payload = Payload> = AuthenticatedQueryDefinition<[
    _User,
    _SyncConfig,
    _UsageStats
], Input, Output>;
//# sourceMappingURL=types.d.ts.map