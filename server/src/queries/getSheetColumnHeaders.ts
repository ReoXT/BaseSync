import { prisma } from 'wasp/server'

import { getSheetColumnHeaders } from '../../../../../src/server/google/queries'


export default async function (args, context) {
  return (getSheetColumnHeaders as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  })
}
