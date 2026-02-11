import { prisma } from 'wasp/server';
import { getSheetColumnHeaders } from '../../../../../src/server/google/queries';
export default async function (args, context) {
    return getSheetColumnHeaders(args, {
        ...context,
        entities: {
            User: prisma.user,
            GoogleSheetsConnection: prisma.googleSheetsConnection,
        },
    });
}
//# sourceMappingURL=getSheetColumnHeaders.js.map