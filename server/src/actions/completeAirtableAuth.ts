import { prisma } from 'wasp/server'

import { completeAirtableAuth } from '../../../../../src/server/airtable/operations'


export default async function (args, context) {
  return (completeAirtableAuth as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
    },
  })
}
