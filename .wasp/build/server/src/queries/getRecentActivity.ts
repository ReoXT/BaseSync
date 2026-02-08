import { prisma } from 'wasp/server'

import { getRecentActivity } from '../../../../../src/server/admin/operations'


export default async function (args, context) {
  return (getRecentActivity as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      SyncLog: prisma.syncLog,
      SyncConfig: prisma.syncConfig,
    },
  })
}
