import jwt from 'jsonwebtoken'

const generateToken = (userId) => {
  return jwt.sign({ userId }, 'thisisasecret', { expiresIn: '90 days' })
}

export { generateToken as default }
