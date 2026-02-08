import { prisma } from 'wasp/server'

import { searchUsers } from '../../../../../src/server/admin/operations'


export default async function (args, context) {
  return (searchUsers as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
    },
  })
}
