import { prisma } from 'wasp/server'
import type { JSONValue, JSONObject } from 'wasp/core/serialization'
import { type JobFn, createJobDefinition } from 'wasp/server/jobs/core/pgBoss'

const entities = {
  User: prisma.user,
  AirtableConnection: prisma.airtableConnection,
  GoogleSheetsConnection: prisma.googleSheetsConnection,
  SyncConfig: prisma.syncConfig,
  SyncLog: prisma.syncLog,
}

// PUBLIC API
export type SyncJob<Input extends JSONObject, Output extends JSONValue | void> = JobFn<Input, Output, typeof entities>

const jobSchedule = {
  cron: "*/5 * * * *",
  options: {},
}

// PUBLIC API
export const syncJob = createJobDefinition({
  jobName: 'syncJob',
  defaultJobOptions: {},
  jobSchedule,
  entities,
})
