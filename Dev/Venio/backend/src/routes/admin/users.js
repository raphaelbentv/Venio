import express from 'express'
import bcrypt from 'bcryptjs'
import auth from '../../middleware/auth.js'
import requireRole from '../../middleware/role.js'
import User from '../../models/User.js'
import Project from '../../models/Project.js'

const router = express.Router()

router.use(auth)
router.use(requireRole('ADMIN'))

router.get('/', async (req, res, next) => {
  try {
    const role = req.query.role
    const filter = role ? { role } : {}
    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 })
    return res.json({ users })
  } catch (err) {
    return next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { email, password, name } = req.body || {}
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'CLIENT',
      name,
    })

    const safeUser = await User.findById(user._id).select('-passwordHash')
    return res.status(201).json({ user: safeUser })
  } catch (err) {
    return next(err)
  }
})

router.get('/:userId', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('-passwordHash')
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    return res.json({ user })
  } catch (err) {
    return next(err)
  }
})

router.get('/:userId/projects', async (req, res, next) => {
  try {
    const projects = await Project.find({ client: req.params.userId }).sort({ updatedAt: -1 })
    return res.json({ projects })
  } catch (err) {
    return next(err)
  }
})

export default router
