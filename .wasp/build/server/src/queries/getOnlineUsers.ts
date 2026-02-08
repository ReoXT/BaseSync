import { prisma } from 'wasp/server'

import { getOnlineUsers } from '../../../../../src/server/admin/operations'


export default async function (args, context) {
  return (getOnlineUsers as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
    },
  })
}
