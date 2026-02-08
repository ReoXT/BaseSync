import { prisma } from 'wasp/server'

import { getActiveSyncs } from '../../../../../src/server/admin/operations'


export default async function (args, context) {
  return (getActiveSyncs as any)(args, {
    ...context,
    entities: {
      SyncLog: prisma.syncLog,
      SyncConfig: prisma.syncConfig,
      User: prisma.user,
    },
  })
}
