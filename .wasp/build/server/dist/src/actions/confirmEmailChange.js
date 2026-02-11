import { prisma } from 'wasp/server';
import { confirmEmailChange } from '../../../../../src/user/accountSettings';
export default async function (args, context) {
    return confirmEmailChange(args, {
        ...context,
        entities: {
            User: prisma.user,
        },
    });
}
//# sourceMappingURL=confirmEmailChange.js.map