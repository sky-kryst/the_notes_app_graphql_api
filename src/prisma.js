import { Prisma } from 'prisma-binding'
import { fragmentReplacements } from './Resolvers'

const prisma = new Prisma({
  typeDefs: `${__dirname}/generated/prisma.graphql`,
  endpoint: process.env.PRISMA_ENDPOINT,
  secret: 'thisismysupersecrettext',
  fragmentReplacements,
})

export default prisma
