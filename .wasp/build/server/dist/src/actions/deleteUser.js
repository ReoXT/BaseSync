import { prisma } from 'wasp/server';
import { deleteUser } from '../../../../../src/server/admin/operations';
export default async function (args, context) {
    return deleteUser(args, {
        ...context,
        entities: {
            User: prisma.user,
            AirtableConnection: prisma.airtableConnection,
            GoogleSheetsConnection: prisma.googleSheetsConnection,
            SyncConfig: prisma.syncConfig,
            SyncLog: prisma.syncLog,
            UsageStats: prisma.usageStats,
        },
    });
}
//# sourceMappingURL=deleteUser.js.map