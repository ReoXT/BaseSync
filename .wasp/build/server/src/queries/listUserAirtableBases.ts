import { prisma } from 'wasp/server'

import { listUserAirtableBases } from '../../../../../src/server/airtable/queries'


export default async function (args, context) {
  return (listUserAirtableBases as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
    },
  })
}
