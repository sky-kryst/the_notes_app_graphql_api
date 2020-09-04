import bcrypt from 'bcryptjs'

const hashPassword = (password) => {
  if (password.length < 8)
    throw Error('The password should be 8 characters or more')
  if (password.length > 15)
    throw Error('The password should be less than 15 characters')

  return bcrypt.hash(password, 12)
}

export { hashPassword as default }
