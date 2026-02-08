import { prisma } from 'wasp/server'

import { updateSyncConfig } from '../../../../../src/server/actions/syncConfig'


export default async function (args, context) {
  return (updateSyncConfig as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      SyncConfig: prisma.syncConfig,
    },
  })
}
