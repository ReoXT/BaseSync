import { prisma } from 'wasp/server';
import { updateSyncConfig } from '../../../../../src/server/actions/syncConfig';
export default async function (args, context) {
    return updateSyncConfig(args, {
        ...context,
        entities: {
            User: prisma.user,
            SyncConfig: prisma.syncConfig,
        },
    });
}
//# sourceMappingURL=updateSyncConfig.js.map