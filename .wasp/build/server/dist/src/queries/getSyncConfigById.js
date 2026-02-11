import { prisma } from 'wasp/server';
import { getSyncConfigById } from '../../../../../src/server/queries/syncConfig';
export default async function (args, context) {
    return getSyncConfigById(args, {
        ...context,
        entities: {
            User: prisma.user,
            SyncConfig: prisma.syncConfig,
        },
    });
}
//# sourceMappingURL=getSyncConfigById.js.map