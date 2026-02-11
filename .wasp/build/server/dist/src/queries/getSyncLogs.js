import { prisma } from 'wasp/server';
import { getSyncLogs } from '../../../../../src/server/queries/syncConfig';
export default async function (args, context) {
    return getSyncLogs(args, {
        ...context,
        entities: {
            User: prisma.user,
            SyncConfig: prisma.syncConfig,
            SyncLog: prisma.syncLog,
        },
    });
}
//# sourceMappingURL=getSyncLogs.js.map