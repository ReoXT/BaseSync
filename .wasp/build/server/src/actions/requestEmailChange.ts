import { prisma } from 'wasp/server'

import { requestEmailChange } from '../../../../../src/user/accountSettings'


export default async function (args, context) {
  return (requestEmailChange as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
    },
  })
}
