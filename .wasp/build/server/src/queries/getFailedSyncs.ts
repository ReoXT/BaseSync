import { prisma } from 'wasp/server'

import { getFailedSyncs } from '../../../../../src/server/admin/operations'


export default async function (args, context) {
  return (getFailedSyncs as any)(args, {
    ...context,
    entities: {
      SyncLog: prisma.syncLog,
      SyncConfig: prisma.syncConfig,
      User: prisma.user,
    },
  })
}
