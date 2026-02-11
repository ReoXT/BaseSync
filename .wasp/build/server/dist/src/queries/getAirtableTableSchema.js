import { prisma } from 'wasp/server';
import { getAirtableTableSchema } from '../../../../../src/server/airtable/queries';
export default async function (args, context) {
    return getAirtableTableSchema(args, {
        ...context,
        entities: {
            User: prisma.user,
            AirtableConnection: prisma.airtableConnection,
        },
    });
}
//# sourceMappingURL=getAirtableTableSchema.js.map