import { prisma } from 'wasp/server';
import { runInitialSync } from '../../../../../src/server/actions/sync';
export default async function (args, context) {
    return runInitialSync(args, {
        ...context,
        entities: {
            User: prisma.user,
            AirtableConnection: prisma.airtableConnection,
            GoogleSheetsConnection: prisma.googleSheetsConnection,
            SyncConfig: prisma.syncConfig,
            SyncLog: prisma.syncLog,
        },
    });
}
//# sourceMappingURL=runInitialSync.js.map