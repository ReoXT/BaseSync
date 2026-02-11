import { prisma } from 'wasp/server'

import { getUserSyncConfigs } from '../../../../../src/server/queries/syncConfig'


export default async function (args, context) {
  return (getUserSyncConfigs as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      SyncConfig: prisma.syncConfig,
    },
  })
}
