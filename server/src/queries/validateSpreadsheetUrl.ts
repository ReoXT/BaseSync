import { prisma } from 'wasp/server'

import { validateSpreadsheetUrl } from '../../../../../src/server/google/queries'


export default async function (args, context) {
  return (validateSpreadsheetUrl as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  })
}
