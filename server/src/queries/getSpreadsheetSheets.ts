import { prisma } from 'wasp/server'

import { getSpreadsheetSheets } from '../../../../../src/server/google/queries'


export default async function (args, context) {
  return (getSpreadsheetSheets as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  })
}
