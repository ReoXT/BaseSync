import { prisma } from 'wasp/server';
import { runConnectionDiagnostics } from '../../../../../src/server/actions/diagnostics';
export default async function (args, context) {
    return runConnectionDiagnostics(args, {
        ...context,
        entities: {
            User: prisma.user,
            AirtableConnection: prisma.airtableConnection,
            GoogleSheetsConnection: prisma.googleSheetsConnection,
        },
    });
}
//# sourceMappingURL=runConnectionDiagnostics.js.map