import { prisma } from 'wasp/server';
import { validateSpreadsheetUrl } from '../../../../../src/server/google/queries';
export default async function (args, context) {
    return validateSpreadsheetUrl(args, {
        ...context,
        entities: {
            User: prisma.user,
            GoogleSheetsConnection: prisma.googleSheetsConnection,
        },
    });
}
//# sourceMappingURL=validateSpreadsheetUrl.js.map