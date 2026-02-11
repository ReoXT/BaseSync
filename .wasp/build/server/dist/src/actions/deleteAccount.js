import { prisma } from 'wasp/server';
import { deleteAccount } from '../../../../../src/user/dangerZone';
export default async function (args, context) {
    return deleteAccount(args, {
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
//# sourceMappingURL=deleteAccount.js.map