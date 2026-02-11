import { prisma } from 'wasp/server';
import { updateNotificationPreferences } from '../../../../../src/user/accountSettings';
export default async function (args, context) {
    return updateNotificationPreferences(args, {
        ...context,
        entities: {
            User: prisma.user,
        },
    });
}
//# sourceMappingURL=updateNotificationPreferences.js.map