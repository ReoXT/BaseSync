import { prisma } from 'wasp/server'

import { clearReauthFlags } from '../../../../../src/server/actions/diagnostics'


export default async function (args, context) {
  return (clearReauthFlags as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  })
}
