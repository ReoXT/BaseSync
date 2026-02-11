import { prisma } from 'wasp/server'

import { updateUsername } from '../../../../../src/user/accountSettings'


export default async function (args, context) {
  return (updateUsername as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
    },
  })
}
