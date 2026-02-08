import { prisma } from 'wasp/server'

import { listUserSpreadsheets } from '../../../../../src/server/google/queries'


export default async function (args, context) {
  return (listUserSpreadsheets as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  })
}
