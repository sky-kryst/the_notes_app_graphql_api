import '@babel/polyfill/noConflict'
import { GraphQLServer, PubSub } from 'graphql-yoga'
import prisma from './prisma'
import { fragmentReplacements, resolvers } from './Resolvers'

const pubsub = new PubSub()

export const server = new GraphQLServer({
  typeDefs: 'src/schema.graphql',
  resolvers,
  context(request) {
    return {
      pubsub,
      prisma,
      request,
    }
  },
  fragmentReplacements,
})

server.start({ port: process.env.PORT || 4000 }, () =>
  console.log('Server running on 4000')
)
