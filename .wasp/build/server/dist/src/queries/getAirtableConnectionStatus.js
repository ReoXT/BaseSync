import { prisma } from 'wasp/server';
import { getAirtableConnectionStatus } from '../../../../../src/server/airtable/operations';
export default async function (args, context) {
    return getAirtableConnectionStatus(args, {
        ...context,
        entities: {
            User: prisma.user,
            AirtableConnection: prisma.airtableConnection,
        },
    });
}
//# sourceMappingURL=getAirtableConnectionStatus.js.map