import { prisma } from 'wasp/server';
import { listUserAirtableBases } from '../../../../../src/server/airtable/queries';
export default async function (args, context) {
    return listUserAirtableBases(args, {
        ...context,
        entities: {
            User: prisma.user,
            AirtableConnection: prisma.airtableConnection,
        },
    });
}
//# sourceMappingURL=listUserAirtableBases.js.map