import { prisma } from 'wasp/server';
import { searchUsers } from '../../../../../src/server/admin/operations';
export default async function (args, context) {
    return searchUsers(args, {
        ...context,
        entities: {
            User: prisma.user,
        },
    });
}
//# sourceMappingURL=searchUsers.js.map