import { prisma } from 'wasp/server'

import { updateUser } from '../../../../../src/server/admin/operations'


export default async function (args, context) {
  return (updateUser as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
    },
  })
}
