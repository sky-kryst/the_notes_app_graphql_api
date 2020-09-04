import authorizeUser from '../utils/authorizeUser'
const Subscription = {
  notes: {
    subscribe(parents, args, { prisma }, info) {
      return prisma.subscription.note(
        {
          where: {
            node: {
              published: true,
            },
          },
        },
        info
      )
    },
  },
  note: {
    subscribe(parents, { id }, { prisma }, info) {
      return prisma.subscription.note(
        {
          where: {
            AND: [{ mutation_in: ['UPDATED'] }, { node: { id } }],
          },
        },
        info
      )
    },
  },
  myNotes: {
    subscribe(parents, args, { prisma, request }, info) {
      const id = authorizeUser(request)
      return prisma.subscription.note(
        {
          where: {
            node: {
              creator: {
                id,
              },
            },
          },
        },
        info
      )
    },
  },
  receivedRequests: {
    subscribe(parents, args, { prisma, request }, info) {
      const id = authorizeUser(request)
      return prisma.subscription.request(
        {
          where: {
            AND: [
              { mutation_in: 'CREATED' },
              {
                node: {
                  AND: [
                    { user: { active: true } },
                    {
                      note: {
                        AND: [
                          { published: true },
                          { creator: { AND: [{ id }, { active: true }] } },
                        ],
                      },
                    },
                    { accepted: false },
                  ],
                },
              },
            ],
          },
        },
        info
      )
    },
  },
  sentRequests: {
    subscribe(parents, args, { prisma, request }, info) {
      const id = authorizeUser(request)
      return prisma.subscription.request(
        {
          where: {
            AND: [
              { mutation_in: 'UPDATED' },
              {
                node: {
                  OR: [
                    {
                      AND: [
                        { user: { id } },
                        {
                          note: {
                            AND: [
                              { published: true },
                              {
                                collaborator_some: {
                                  AND: [{ id }, { active: true }],
                                },
                              },
                            ],
                          },
                        },
                        { accepted: true },
                        { type: 'EDIT' },
                      ],
                    },
                    {
                      AND: [
                        { user: { id } },
                        {
                          note: {
                            AND: [
                              { published: true },
                              {
                                consumer_some: {
                                  AND: [{ id }, { active: true }],
                                },
                              },
                            ],
                          },
                        },
                        { accepted: true },
                        { type: 'VIEW' },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        },
        info
      )
    },
  },
}

export default Subscription
