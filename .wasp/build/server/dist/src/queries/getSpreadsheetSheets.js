import { prisma } from 'wasp/server';
import { getSpreadsheetSheets } from '../../../../../src/server/google/queries';
export default async function (args, context) {
    return getSpreadsheetSheets(args, {
        ...context,
        entities: {
            User: prisma.user,
            GoogleSheetsConnection: prisma.googleSheetsConnection,
        },
    });
}
//# sourceMappingURL=getSpreadsheetSheets.js.map