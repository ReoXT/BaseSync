import { prisma } from 'wasp/server';
import { changePassword } from '../../../../../src/user/security';
export default async function (args, context) {
    return changePassword(args, {
        ...context,
        entities: {
            User: prisma.user,
        },
    });
}
//# sourceMappingURL=changePassword.js.map