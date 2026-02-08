import { prisma } from 'wasp/server'

import { triggerManualSync } from '../../../../../src/server/actions/sync'


export default async function (args, context) {
  return (triggerManualSync as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
      SyncConfig: prisma.syncConfig,
      SyncLog: prisma.syncLog,
    },
  })
}
