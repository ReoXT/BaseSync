import { prisma } from 'wasp/server'

import { getAirtableTableSchema } from '../../../../../src/server/airtable/queries'


export default async function (args, context) {
  return (getAirtableTableSchema as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
    },
  })
}
