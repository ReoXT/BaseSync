import { prisma } from 'wasp/server';
import { getPaginatedUsers } from '../../../../../src/user/operations';
export default async function (args, context) {
    return getPaginatedUsers(args, {
        ...context,
        entities: {
            User: prisma.user,
        },
    });
}
//# sourceMappingURL=getPaginatedUsers.js.map