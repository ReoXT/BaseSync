import { prisma } from 'wasp/server';
import { getAirtableBaseTables } from '../../../../../src/server/airtable/queries';
export default async function (args, context) {
    return getAirtableBaseTables(args, {
        ...context,
        entities: {
            User: prisma.user,
            AirtableConnection: prisma.airtableConnection,
        },
    });
}
//# sourceMappingURL=getAirtableBaseTables.js.map