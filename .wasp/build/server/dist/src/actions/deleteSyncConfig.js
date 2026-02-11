import { prisma } from 'wasp/server';
import { deleteSyncConfig } from '../../../../../src/server/actions/syncConfig';
export default async function (args, context) {
    return deleteSyncConfig(args, {
        ...context,
        entities: {
            User: prisma.user,
            SyncConfig: prisma.syncConfig,
            SyncLog: prisma.syncLog,
        },
    });
}
//# sourceMappingURL=deleteSyncConfig.js.map