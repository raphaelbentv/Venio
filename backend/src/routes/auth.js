import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import User from '../models/User.js'
import { ADMIN_ROLES, getPermissionsForRole } from '../lib/permissions.js'
import auth from '../middleware/auth.js'

const router = express.Router()

const MIN_PASSWORD_LENGTH = 6

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// POST /api/auth/login
router.post(
  '/login',
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').notEmpty().withMessage('Mot de passe requis'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() })
      }

      const { email, password } = req.body

      const user = await User.findOne({ email: email.toLowerCase().trim() })
      if (!user) {
        return res.status(401).json({ error: 'Identifiants invalides' })
      }

      const isValid = await bcrypt.compare(password, user.passwordHash)
      if (!isValid) {
        return res.status(401).json({ error: 'Identifiants invalides' })
      }

      const token = signToken(user)
      return res.json({ token })
    } catch (err) {
      return next(err)
    }
  }
)

// GET /api/auth/me
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash')
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    const permissions = getPermissionsForRole(user.role)
    return res.json({ user: { ...user.toObject(), permissions } })
  } catch (err) {
    return next(err)
  }
})

// PATCH /api/auth/profile — update own profile
router.patch(
  '/profile',
  auth,
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Le nom ne peut pas être vide'),
  body('phone').optional().trim(),
  body('companyName').optional().trim(),
  body('website').optional().trim(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() })
      }

      const user = await User.findById(req.user.id)
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur introuvable' })
      }

      const { name, phone, companyName, website } = req.body || {}
      if (name !== undefined) user.name = name
      if (phone !== undefined) user.phone = phone
      if (companyName !== undefined) user.companyName = companyName
      if (website !== undefined) user.website = website

      await user.save()

      const safeUser = await User.findById(user._id).select('-passwordHash')
      return res.json({ user: safeUser })
    } catch (err) {
      return next(err)
    }
  }
)

// POST /api/auth/change-password — change own password
router.post(
  '/change-password',
  auth,
  body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
  body('newPassword').isLength({ min: MIN_PASSWORD_LENGTH }).withMessage(`Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() })
      }

      const user = await User.findById(req.user.id)
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur introuvable' })
      }

      const { currentPassword, newPassword } = req.body

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!isValid) {
        return res.status(400).json({ error: 'Mot de passe actuel incorrect' })
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10)
      await user.save()

      return res.json({ message: 'Mot de passe modifié avec succès' })
    } catch (err) {
      return next(err)
    }
  }
)

// POST /api/auth/bootstrap-admin
router.post(
  '/bootstrap-admin',
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').isLength({ min: MIN_PASSWORD_LENGTH }).withMessage(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`),
  body('name').trim().notEmpty().withMessage('Le nom est requis'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() })
      }

      const existingAdmin = await User.exists({ role: { $in: ADMIN_ROLES } })
      if (existingAdmin) {
        return res.status(403).json({ error: 'Admin already exists' })
      }

      const { email, password, name } = req.body

      const passwordHash = await bcrypt.hash(password, 10)
      const admin = await User.create({
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'SUPER_ADMIN',
        name,
      })

      const token = signToken(admin)
      return res.status(201).json({ token })
    } catch (err) {
      return next(err)
    }
  }
)

export default router
