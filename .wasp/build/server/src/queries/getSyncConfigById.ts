import { prisma } from 'wasp/server'

import { getSyncConfigById } from '../../../../../src/server/queries/syncConfig'


export default async function (args, context) {
  return (getSyncConfigById as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      SyncConfig: prisma.syncConfig,
    },
  })
}
