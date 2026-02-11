import { prisma } from 'wasp/server';
import { getActiveSyncs } from '../../../../../src/server/admin/operations';
export default async function (args, context) {
    return getActiveSyncs(args, {
        ...context,
        entities: {
            SyncLog: prisma.syncLog,
            SyncConfig: prisma.syncConfig,
            User: prisma.user,
        },
    });
}
//# sourceMappingURL=getActiveSyncs.js.map