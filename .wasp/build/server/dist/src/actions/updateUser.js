import { prisma } from 'wasp/server';
import { updateUser } from '../../../../../src/server/admin/operations';
export default async function (args, context) {
    return updateUser(args, {
        ...context,
        entities: {
            User: prisma.user,
        },
    });
}
//# sourceMappingURL=updateUser.js.map