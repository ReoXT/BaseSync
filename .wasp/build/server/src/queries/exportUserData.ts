import { prisma } from 'wasp/server'

import { exportUserData } from '../../../../../src/user/dangerZone'


export default async function (args, context) {
  return (exportUserData as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
      AirtableConnection: prisma.airtableConnection,
      GoogleSheetsConnection: prisma.googleSheetsConnection,
      SyncConfig: prisma.syncConfig,
      SyncLog: prisma.syncLog,
      UsageStats: prisma.usageStats,
    },
  })
}
