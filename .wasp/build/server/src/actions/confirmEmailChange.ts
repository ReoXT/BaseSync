import { prisma } from 'wasp/server'

import { confirmEmailChange } from '../../../../../src/user/accountSettings'


export default async function (args, context) {
  return (confirmEmailChange as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
    },
  })
}
