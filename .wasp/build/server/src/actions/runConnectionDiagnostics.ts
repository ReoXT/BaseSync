import { prisma } from 'wasp/server'

import { runConnectionDiagnostics } from '../../../../../src/server/actions/diagnostics'


export default async function (args, context) {
  return (runConnectionDiagnostics as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  })
}
