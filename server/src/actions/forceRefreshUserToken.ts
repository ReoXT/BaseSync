import { prisma } from 'wasp/server'

import { forceRefreshUserToken } from '../../../../../src/server/admin/operations'


export default async function (args, context) {
  return (forceRefreshUserToken as any)(args, {
    ...context,
    entities: {
      AirtableConnection: prisma.airtableConnection,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  })
}
