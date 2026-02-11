import { prisma } from 'wasp/server';
import { updateUsername } from '../../../../../src/user/accountSettings';
export default async function (args, context) {
    return updateUsername(args, {
        ...context,
        entities: {
            User: prisma.user,
        },
    });
}
//# sourceMappingURL=updateUsername.js.map