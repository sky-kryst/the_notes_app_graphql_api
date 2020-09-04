import authorizeUser from '../utils/authorizeUser'

const Query = {
  users(parent, { query, first, skip, after, orderBy }, { prisma }, info) {
    let opArgs = {
      first,
      skip,
      after,
      orderBy,
      where: {
        active: true,
      },
    }
    if (query) {
      const OR = [
        {
          firstName_contains: query,
        },
        {
          lastName_contains: query,
        },
      ]
      opArgs.where = { AND: [{ ...opArgs.where }, { OR }] }
    }
    return prisma.query.users(opArgs, info)
  },
  notes(parents, { query, first, skip, after, orderBy }, { prisma }, info) {
    let opArgs = {
      first,
      skip,
      after,
      orderBy,
      where: {
        AND: [{ creator: { active: true } }, { published: true }],
      },
    }
    if (query) {
      const OR = [
        {
          title_contains: query,
        },
        {
          body_contains: query,
        },
      ]
      opArgs.where.AND.push({ OR })
    }
    return prisma.query.notes(opArgs, info)
  },
  requests(parents, { query, first, skip, after, orderBy }, { prisma }, info) {
    let opArgs = {
      first,
      skip,
      after,
      orderBy,
    }
    if (query) {
      opArgs.where.OR = [
        {
          type: query,
        },
        {
          user: {
            AND: [
              { active: true },
              {
                OR: [{ id: query }, { email: query }, { username: query }],
              },
            ],
          },
        },
        {
          note: {
            AND: [
              { published: true },
              {
                OR: [{ id: query }, { title: query }, { body: query }],
              },
            ],
          },
        },
        ,
      ]
    }
    return prisma.query.requests(opArgs, info)
  },
  me(parents, args, { prisma, request }, info) {
    const id = authorizeUser(request)
    return prisma.query.user(
      {
        where: {
          id,
        },
      },
      info
    )
  },
  async getNotificationToken(parents, args, { prisma, request }, info) {
    const id = authorizeUser(request)
    const notificationToken = await prisma.query.user({ where: { id } }, info)
    return {
      notificationToken,
    }
  },
  async note(parents, { id }, { prisma, request }, info) {
    const Id = authorizeUser(request, null)
    const note = await prisma.query.notes(
      {
        where: {
          AND: [
            { id },
            {
              OR: [
                {
                  published: true,
                },
                {
                  creator: { id: Id },
                },
              ],
            },
          ],
        },
      },
      info
    )
    if (note.length < 1) throw Error('Note not found')
    return note[0]
  },
  myNotes(
    parents,
    { query, first, skip, after, orderBy },
    { prisma, request },
    info
  ) {
    const id = authorizeUser(request)
    let opArgs = {
      first,
      skip,
      after,
      orderBy,
      where: {
        creator: { id },
      },
    }
    if (query) {
      const OR = [
        {
          title_contains: query,
        },
        {
          body_contains: query,
        },
      ]
      opArgs.where = { AND: [{ ...opArgs.where }, { OR }] }
    }
    return prisma.query.notes(opArgs, info)
  },
  myCollaborations(
    parents,
    { query, first, skip, after, orderBy },
    { prisma, request },
    info
  ) {
    const id = authorizeUser(request)
    const opArgs = {
      first,
      skip,
      after,
      orderBy,
      where: {
        AND: [{ collaborator_some: { id } }, { published: true }],
      },
    }
    if (query) {
      const OR = [
        {
          title_contains: query,
        },
        {
          body_contains: query,
        },
      ]
      opArgs.where.AND.push({ OR })
    }
    return prisma.query.notes(opArgs, info)
  },
  myReceivedRequests(
    parents,
    { query, first, skip, after, orderBy },
    { prisma, request },
    info
  ) {
    const id = authorizeUser(request)
    const opArgs = {
      first,
      skip,
      after,
      orderBy,
      where: {
        AND: [{ note: { creator: { id } } }, { accepted: false }],
      },
    }
    if (query) {
      opArgs.where.OR = [
        {
          note: {
            OR: [
              {
                title_contains: query,
              },
              {
                body_contains: query,
              },
            ],
          },
        },
        {
          user: {
            OR: [
              { firstName_contains: query },
              { lastName_contains: query },
              { username_contains: query },
              { email_contains: query },
            ],
          },
        },
      ]
    }
    return prisma.query.requests(opArgs, info)
  },
  mySentRequests(
    parents,
    { query, first, skip, after, orderBy },
    { prisma, request },
    info
  ) {
    const id = authorizeUser(request)
    const opArgs = {
      first,
      skip,
      after,
      orderBy,
      where: {
        AND: [{ user: { id } }, { accepted: true }],
      },
    }
    if (query) {
      opArgs.where.OR = [
        {
          note: {
            OR: [
              {
                title_contains: query,
              },
              {
                body_contains: query,
              },
            ],
          },
        },
        {
          user: {
            OR: [
              { firstName_contains: query },
              { lastName_contains: query },
              { username_contains: query },
              { email_contains: query },
            ],
          },
        },
      ]
    }
    return prisma.query.requests(opArgs, info)
  },
}
export default Query
