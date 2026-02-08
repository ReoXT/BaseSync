import { prisma } from 'wasp/server'

import { updateNotificationPreferences } from '../../../../../src/user/accountSettings'


export default async function (args, context) {
  return (updateNotificationPreferences as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
    },
  })
}
