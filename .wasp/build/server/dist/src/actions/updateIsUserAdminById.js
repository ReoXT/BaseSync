import { prisma } from 'wasp/server';
import { updateIsUserAdminById } from '../../../../../src/user/operations';
export default async function (args, context) {
    return updateIsUserAdminById(args, {
        ...context,
        entities: {
            User: prisma.user,
        },
    });
}
//# sourceMappingURL=updateIsUserAdminById.js.map