import { prisma } from 'wasp/server';
import { getUserUsage } from '../../../../../src/server/queries/usage';
export default async function (args, context) {
    return getUserUsage(args, {
        ...context,
        entities: {
            User: prisma.user,
            SyncConfig: prisma.syncConfig,
            UsageStats: prisma.usageStats,
        },
    });
}
//# sourceMappingURL=getUserUsage.js.map