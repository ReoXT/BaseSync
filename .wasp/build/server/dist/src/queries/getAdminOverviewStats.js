import { prisma } from 'wasp/server';
import { getAdminOverviewStats } from '../../../../../src/server/admin/operations';
export default async function (args, context) {
    return getAdminOverviewStats(args, {
        ...context,
        entities: {
            User: prisma.user,
            SyncLog: prisma.syncLog,
            SyncConfig: prisma.syncConfig,
            AirtableConnection: prisma.airtableConnection,
            GoogleSheetsConnection: prisma.googleSheetsConnection,
        },
    });
}
//# sourceMappingURL=getAdminOverviewStats.js.map