import { prisma } from 'wasp/server';
import { disconnectAirtable } from '../../../../../src/server/airtable/operations';
export default async function (args, context) {
    return disconnectAirtable(args, {
        ...context,
        entities: {
            User: prisma.user,
            AirtableConnection: prisma.airtableConnection,
        },
    });
}
//# sourceMappingURL=disconnectAirtable.js.map