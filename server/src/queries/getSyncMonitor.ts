import { prisma } from 'wasp/server'

import { getSyncMonitor } from '../../../../../src/server/admin/operations'


export default async function (args, context) {
  return (getSyncMonitor as any)(args, {
    ...context,
    entities: {
      SyncLog: prisma.syncLog,
      SyncConfig: prisma.syncConfig,
      User: prisma.user,
    },
  })
}
