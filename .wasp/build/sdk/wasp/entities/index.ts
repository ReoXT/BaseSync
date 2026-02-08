import {
  type User,
  type GptResponse,
  type Task,
  type File,
  type DailyStats,
  type PageViewSource,
  type Logs,
  type ContactFormMessage,
  type AirtableConnection,
  type GoogleSheetsConnection,
  type SyncConfig,
  type SyncLog,
  type UsageStats,
} from "@prisma/client"

export {
  type User,
  type GptResponse,
  type Task,
  type File,
  type DailyStats,
  type PageViewSource,
  type Logs,
  type ContactFormMessage,
  type AirtableConnection,
  type GoogleSheetsConnection,
  type SyncConfig,
  type SyncLog,
  type UsageStats,
  type Auth,
  type AuthIdentity,
} from "@prisma/client"

export type Entity = 
  | User
  | GptResponse
  | Task
  | File
  | DailyStats
  | PageViewSource
  | Logs
  | ContactFormMessage
  | AirtableConnection
  | GoogleSheetsConnection
  | SyncConfig
  | SyncLog
  | UsageStats
  | never

export type EntityName = 
  | "User"
  | "GptResponse"
  | "Task"
  | "File"
  | "DailyStats"
  | "PageViewSource"
  | "Logs"
  | "ContactFormMessage"
  | "AirtableConnection"
  | "GoogleSheetsConnection"
  | "SyncConfig"
  | "SyncLog"
  | "UsageStats"
  | never
