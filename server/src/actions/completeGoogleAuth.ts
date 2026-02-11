import { prisma } from 'wasp/server'

import { completeGoogleAuth } from '../../../../../src/server/google/operations'


export default async function (args, context) {
  return (completeGoogleAuth as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  })
}
