import { prisma } from 'wasp/server'

import { disconnectAirtable } from '../../../../../src/server/airtable/operations'


export default async function (args, context) {
  return (disconnectAirtable as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
    },
  })
}
