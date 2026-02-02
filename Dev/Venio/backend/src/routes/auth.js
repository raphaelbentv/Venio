import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import auth from '../middleware/auth.js'

const router = express.Router()

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = signToken(user)
    return res.json({ token })
  } catch (err) {
    return next(err)
  }
})

router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash')
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    return res.json({ user })
  } catch (err) {
    return next(err)
  }
})

router.post('/bootstrap-admin', async (req, res, next) => {
  try {
    const existingAdmin = await User.exists({ role: 'ADMIN' })
    if (existingAdmin) {
      return res.status(403).json({ error: 'Admin already exists' })
    }

    const { email, password, name } = req.body || {}
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const admin = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'ADMIN',
      name,
    })

    const token = signToken(admin)
    return res.status(201).json({ token })
  } catch (err) {
    return next(err)
  }
})

export default router
