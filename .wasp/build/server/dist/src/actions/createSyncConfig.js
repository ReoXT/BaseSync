import { prisma } from 'wasp/server';
import { createSyncConfig } from '../../../../../src/server/actions/syncConfig';
export default async function (args, context) {
    return createSyncConfig(args, {
        ...context,
        entities: {
            User: prisma.user,
            AirtableConnection: prisma.airtableConnection,
            GoogleSheetsConnection: prisma.googleSheetsConnection,
            SyncConfig: prisma.syncConfig,
        },
    });
}
//# sourceMappingURL=createSyncConfig.js.map