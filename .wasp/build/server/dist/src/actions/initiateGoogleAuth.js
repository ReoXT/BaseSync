import { prisma } from 'wasp/server';
import { initiateGoogleAuth } from '../../../../../src/server/google/operations';
export default async function (args, context) {
    return initiateGoogleAuth(args, {
        ...context,
        entities: {
            User: prisma.user,
        },
    });
}
//# sourceMappingURL=initiateGoogleAuth.js.map