import { prisma } from 'wasp/server';
import { requestEmailChange } from '../../../../../src/user/accountSettings';
export default async function (args, context) {
    return requestEmailChange(args, {
        ...context,
        entities: {
            User: prisma.user,
        },
    });
}
//# sourceMappingURL=requestEmailChange.js.map