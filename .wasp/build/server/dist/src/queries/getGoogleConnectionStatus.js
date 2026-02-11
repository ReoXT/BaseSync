import { prisma } from 'wasp/server';
import { getGoogleConnectionStatus } from '../../../../../src/server/google/operations';
export default async function (args, context) {
    return getGoogleConnectionStatus(args, {
        ...context,
        entities: {
            User: prisma.user,
            GoogleSheetsConnection: prisma.googleSheetsConnection,
        },
    });
}
//# sourceMappingURL=getGoogleConnectionStatus.js.map