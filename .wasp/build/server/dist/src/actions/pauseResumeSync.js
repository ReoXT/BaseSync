import { prisma } from 'wasp/server';
import { pauseResumeSync } from '../../../../../src/server/admin/operations';
export default async function (args, context) {
    return pauseResumeSync(args, {
        ...context,
        entities: {
            SyncConfig: prisma.syncConfig,
        },
    });
}
//# sourceMappingURL=pauseResumeSync.js.map