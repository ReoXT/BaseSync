import { prisma } from 'wasp/server'

import { toggleSyncActive } from '../../../../../src/server/actions/syncConfig'


export default async function (args, context) {
  return (toggleSyncActive as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      SyncConfig: prisma.syncConfig,
    },
  })
}
