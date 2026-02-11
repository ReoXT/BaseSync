import { prisma } from 'wasp/server';
import { initiateAirtableAuth } from '../../../../../src/server/airtable/operations';
export default async function (args, context) {
    return initiateAirtableAuth(args, {
        ...context,
        entities: {
            User: prisma.user,
        },
    });
}
//# sourceMappingURL=initiateAirtableAuth.js.map