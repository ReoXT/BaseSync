import { prisma } from 'wasp/server';
import { createJobDefinition } from 'wasp/server/jobs/core/pgBoss';
const entities = {
    User: prisma.user,
    AirtableConnection: prisma.airtableConnection,
    GoogleSheetsConnection: prisma.googleSheetsConnection,
    SyncConfig: prisma.syncConfig,
    SyncLog: prisma.syncLog,
};
const jobSchedule = {
    cron: "*/5 * * * *",
    options: {},
};
// PUBLIC API
export const syncJob = createJobDefinition({
    jobName: 'syncJob',
    defaultJobOptions: {},
    jobSchedule,
    entities,
});
//# sourceMappingURL=syncJob.js.map