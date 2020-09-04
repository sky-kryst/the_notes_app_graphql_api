import bcrypt from 'bcryptjs'
import authorizeUser from '../utils/authorizeUser'
import generateToken from '../utils/generateToken'
import hashPassword from '../utils/hashPassword'

const Mutation = {
  async createUser(parents, { data }, { prisma }, info) {
    if (data.passwordConfirm !== data.password)
      throw Error('Passwords do not match!')
    data.password = await hashPassword(data.password)
    data.photo = 'default.jpg'
    data.header = 'header.jpg'
    data.active = true
    delete data.passwordConfirm
    const user = await prisma.mutation.createUser({ data })
    return {
      user,
      token: generateToken(user.id),
      expiresOn: String(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
    }
  },
  async loginUser(parents, { email, password }, { prisma }, info) {
    const user = await prisma.query.user({ where: { email } })
    const passwordCorrect = await bcrypt.compare(password, user.password)
    if (!user || !passwordCorrect)
      throw Error('The email and the password do not match')
    return {
      user,
      token: generateToken(user.id),
      expiresOn: String(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
    }
  },
  async logoutUser(parents, args, { prisma, request }, info) {
    const id = authorizeUser(request)
    const user = await prisma.query.users({ where: { id } }, info)
    return {
      user,
      token: null,
      expiresOn: null,
    }
  },
  async updateUser(parents, { data, password }, { prisma, request }, info) {
    const id = authorizeUser(request)
    const user = await prisma.query.user({ where: { id } })
    const passwordCorrect = await bcrypt.compare(password, user.password)
    if (!user || !passwordCorrect) throw Error('Wrong password')
    return prisma.mutation.updateUser({ where: { id }, data }, info)
  },
  deleteUser(parents, args, { prisma, request }, info) {
    const id = authorizeUser(request)
    return prisma.mutation.updateUser(
      {
        where: { id },
        data: {
          active: false,
          createdPosts: {
            updateMany: {
              where: { published: true },
              data: { published: false, wasPublished: true },
            },
          },
        },
      },
      info
    )
  },
  async activateUser(parents, { email, password }, { prisma, request }, info) {
    const id = authorizeUser(request)
    let user = await prisma.query.user({ where: { email } })
    const passwordCorrect = await bcrypt.compare(password, user.password)
    if (!user || !passwordCorrect)
      throw Error('The email and the password do not match')
    return prisma.mutation.updateUser(
      {
        where: { id },
        data: {
          active: true,
          createdPosts: {
            updateMany: {
              where: { wasPublished: true },
              data: { published: true, wasPublished: false },
            },
          },
        },
      },
      info
    )
  },
  setNotificationToken(
    parents,
    { notificationToken },
    { prisma, request },
    info
  ) {
    const id = authorizeUser(request)
    return prisma.mutation.updateUser(
      { where: { id }, data: { notificationToken } },
      info
    )
  },
  createNote(parents, { data }, { prisma, request }, info) {
    const id = authorizeUser(request)
    data.wasPublished = false
    return prisma.mutation.createNote(
      { data: { ...data, creator: { connect: { id } } } },
      info
    )
  },
  async deleteNote(parents, args, { request, prisma }, info) {
    const id = authorizeUser(request)
    const postExists = await prisma.exists.Note({
      id: args.id,
      creator: {
        id,
      },
    })
    if (!postExists) throw Error('This note does not exists')
    return prisma.mutation.deleteNote({ where: { id } }, info)
  },
  async updateNote(parents, { id, data }, { prisma, request }, info) {
    const userId = authorizeUser(request)
    const postExists = await prisma.exists.Note({ id })
    if (!postExists) throw Error('This post does not exists')
    const userAuthorized =
      (await prisma.exists.Note({ id, creator: { id: userId } })) ||
      (await prisma.exists.Note({ id, collaborator_some: { id: userId } }))
    if (!userAuthorized)
      throw Error("You don't have permissions to edit this note")
    return prisma.mutation.updateNote({ where: { id }, data }, info)
  },
  async toggleLikes(parents, args, { prisma, request }, info) {
    const id = authorizeUser(request)
    const postExists = await prisma.exists.Note({
      id: args.id,
      likes_some: { id },
    })
    if (postExists)
      return prisma.mutation.updateNote(
        { where: { id: args.id }, data: { likes: { disconnect: { id } } } },
        info
      )
    return prisma.mutation.updateNote(
      { where: { id: args.id }, data: { likes: { connect: { id } } } },
      info
    )
  },
  async sendRequest(
    parents,
    { data: { noteId, type } },
    { prisma, request },
    info
  ) {
    const userId = authorizeUser(request)
    if (
      !(await prisma.exists.Request({
        note: { id: noteId },
        user: { id: userId },
        type,
      }))
    ) {
      return prisma.mutation.createRequest(
        {
          data: {
            type,
            accepted: false,
            user: { connect: { id: userId } },
            note: { connect: { id: noteId } },
          },
        },
        info
      )
    }
  },
  async respondRequest(
    parents,
    { data: { response = null, id } },
    { prisma, request },
    info
  ) {
    authorizeUser(request)
    const { type, user, note } = await prisma.query.request(
      { where: { id } },
      `{ user { id } note { id } type }`
    )
    if (response) {
      if (type === 'EDIT') {
        return prisma.mutation.updateRequest(
          {
            where: { id },
            data: {
              accepted: response,
              note: { update: { collaborator: { connect: { id: user.id } } } },
              user: {
                update: { collaboratedPosts: { connect: { id: note.id } } },
              },
            },
          },
          info
        )
      } else if (type === 'VIEW') {
        return prisma.mutation.updateRequest(
          {
            where: { id },
            data: {
              accepted: response,
              note: { update: { consumer: { connect: { id: user.id } } } },
              user: { update: { consumedPosts: { connect: { id: note.id } } } },
            },
          },
          info
        )
      }
    }
    return prisma.mutation.deleteRequest({ where: { id } }, info)
  },
}
export default Mutation
