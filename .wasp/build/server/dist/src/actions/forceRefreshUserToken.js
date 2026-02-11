import { prisma } from 'wasp/server';
import { forceRefreshUserToken } from '../../../../../src/server/admin/operations';
export default async function (args, context) {
    return forceRefreshUserToken(args, {
        ...context,
        entities: {
            AirtableConnection: prisma.airtableConnection,
            GoogleSheetsConnection: prisma.googleSheetsConnection,
        },
    });
}
//# sourceMappingURL=forceRefreshUserToken.js.map