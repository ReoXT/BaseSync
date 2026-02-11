import { prisma } from 'wasp/server';
import { generateCheckoutSession } from '../../../../../src/payment/operations';
export default async function (args, context) {
    return generateCheckoutSession(args, {
        ...context,
        entities: {
            User: prisma.user,
        },
    });
}
//# sourceMappingURL=generateCheckoutSession.js.map