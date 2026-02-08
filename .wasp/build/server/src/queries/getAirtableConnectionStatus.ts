import { prisma } from 'wasp/server'

import { getAirtableConnectionStatus } from '../../../../../src/server/airtable/operations'


export default async function (args, context) {
  return (getAirtableConnectionStatus as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
    },
  })
}
