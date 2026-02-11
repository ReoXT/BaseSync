import { prisma } from 'wasp/server';
import { triggerManualSyncAdmin } from '../../../../../src/server/admin/operations';
export default async function (args, context) {
    return triggerManualSyncAdmin(args, {
        ...context,
        entities: {
            SyncConfig: prisma.syncConfig,
            SyncLog: prisma.syncLog,
            User: prisma.user,
        },
    });
}
//# sourceMappingURL=triggerManualSyncAdmin.js.map