import { prisma } from 'wasp/server';
import { disconnectGoogle } from '../../../../../src/server/google/operations';
export default async function (args, context) {
    return disconnectGoogle(args, {
        ...context,
        entities: {
            User: prisma.user,
            GoogleSheetsConnection: prisma.googleSheetsConnection,
        },
    });
}
//# sourceMappingURL=disconnectGoogle.js.map