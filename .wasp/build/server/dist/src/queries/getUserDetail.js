import { prisma } from 'wasp/server';
import { getUserDetail } from '../../../../../src/server/admin/operations';
export default async function (args, context) {
    return getUserDetail(args, {
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
//# sourceMappingURL=getUserDetail.js.map