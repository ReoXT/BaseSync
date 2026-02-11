import { prisma } from 'wasp/server';
import { getUserSyncConfigs } from '../../../../../src/server/queries/syncConfig';
export default async function (args, context) {
    return getUserSyncConfigs(args, {
        ...context,
        entities: {
            User: prisma.user,
            SyncConfig: prisma.syncConfig,
        },
    });
}
//# sourceMappingURL=getUserSyncConfigs.js.map