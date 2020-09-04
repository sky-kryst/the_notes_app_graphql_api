import authorizeUser from '../utils/authorizeUser'
const User = {
  createdPosts: {
    fragment: 'fragment userId on User {id}',
    resolve({ id }, args, { prisma, request }, info) {
      const userId = authorizeUser(request)

      if (id === userId) {
        return prisma.query.notes({ where: { creator: { id } } }, info)
      }
      return prisma.query.notes(
        {
          where: {
            AND: [
              { published: true },
              {
                creator: {
                  id,
                },
              },
            ],
          },
        },
        info
      )
    },
  },
  /* email: {
    fragment: 'fragment userId on User {id}',
    resolve(parent, args, { request }, info) {
      const id = authorizeUser(request, null)
      if (id && id === parent.id) return parent.email
      return null
    },
  }, */
}
export default User
