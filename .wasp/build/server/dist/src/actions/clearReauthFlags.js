import { prisma } from 'wasp/server';
import { clearReauthFlags } from '../../../../../src/server/actions/diagnostics';
export default async function (args, context) {
    return clearReauthFlags(args, {
        ...context,
        entities: {
            User: prisma.user,
            AirtableConnection: prisma.airtableConnection,
            GoogleSheetsConnection: prisma.googleSheetsConnection,
        },
    });
}
//# sourceMappingURL=clearReauthFlags.js.map