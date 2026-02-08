import { prisma } from 'wasp/server'

import { getGoogleConnectionStatus } from '../../../../../src/server/google/operations'


export default async function (args, context) {
  return (getGoogleConnectionStatus as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
    },
  })
}
