import express from 'express'
import auth from '../../middleware/auth.js'
import { requireAdmin, requirePermission } from '../../middleware/role.js'
import AuditLog from '../../models/AuditLog.js'
import { PERMISSIONS } from '../../lib/permissions.js'

const router = express.Router()

router.use(auth)
router.use(requireAdmin)

// GET /api/admin/audit — list audit logs (most recent first)
router.get('/', requirePermission(PERMISSIONS.MANAGE_ADMINS), async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const skip = (page - 1) * limit

    const filter = {}
    if (req.query.action) filter.action = req.query.action
    if (req.query.email) filter.email = { $regex: req.query.email, $options: 'i' }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email role'),
      AuditLog.countDocuments(filter),
    ])

    return res.json({ logs, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    return next(err)
  }
})

export default router
