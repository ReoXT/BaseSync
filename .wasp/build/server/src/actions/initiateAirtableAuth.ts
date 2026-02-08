import { prisma } from 'wasp/server'

import { initiateAirtableAuth } from '../../../../../src/server/airtable/operations'


export default async function (args, context) {
  return (initiateAirtableAuth as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
    },
  })
}
