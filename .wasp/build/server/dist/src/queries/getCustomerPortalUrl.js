import { prisma } from 'wasp/server';
import { getCustomerPortalUrl } from '../../../../../src/payment/operations';
export default async function (args, context) {
    return getCustomerPortalUrl(args, {
        ...context,
        entities: {
            User: prisma.user,
        },
    });
}
//# sourceMappingURL=getCustomerPortalUrl.js.map