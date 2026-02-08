import { prisma } from 'wasp/server'

import { getSyncLogs } from '../../../../../src/server/queries/syncConfig'


export default async function (args, context) {
  return (getSyncLogs as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      SyncConfig: prisma.syncConfig,
      SyncLog: prisma.syncLog,
    },
  })
}
