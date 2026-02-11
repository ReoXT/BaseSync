import { prisma } from 'wasp/server';
import { sendTestEmails } from '../../../../../src/server/emails/testSender';
export default async function (args, context) {
    return sendTestEmails(args, {
        ...context,
        entities: {
            User: prisma.user,
            SyncConfig: prisma.syncConfig,
            SyncLog: prisma.syncLog,
            UsageStats: prisma.usageStats,
        },
    });
}
//# sourceMappingURL=sendTestEmails.js.map