import { prisma } from 'wasp/server';
import { getOnlineUsers } from '../../../../../src/server/admin/operations';
export default async function (args, context) {
    return getOnlineUsers(args, {
        ...context,
        entities: {
            User: prisma.user,
        },
    });
}
//# sourceMappingURL=getOnlineUsers.js.map