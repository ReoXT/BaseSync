import { prisma } from 'wasp/server'

import { pauseResumeSync } from '../../../../../src/server/admin/operations'


export default async function (args, context) {
  return (pauseResumeSync as any)(args, {
    ...context,
    entities: {
      SyncConfig: prisma.syncConfig,
    },
  })
}
