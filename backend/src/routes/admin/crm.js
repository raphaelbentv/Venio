import express from 'express'
import auth from '../../middleware/auth.js'
import { requireAdmin, requirePermission } from '../../middleware/role.js'
import Lead from '../../models/Lead.js'
import User from '../../models/User.js'
import { ADMIN_ROLES, PERMISSIONS } from '../../lib/permissions.js'

const router = express.Router()

router.use(auth)
router.use(requireAdmin)

const CRM_STATUSES = ['LEAD', 'QUALIFIED', 'CONTACTED', 'DEMO', 'PROPOSAL', 'WON', 'LOST']

async function getDefaultAssignee() {
  const admin = await User.findOne({ role: { $in: ADMIN_ROLES } }).sort({ createdAt: 1 })
  return admin ? admin._id : null
}

function normalizeLeadPayload(body = {}) {
  const payload = {}
  if (body.company !== undefined) payload.company = String(body.company || '').trim()
  if (body.contactName !== undefined) payload.contactName = String(body.contactName || '')
  if (body.contactEmail !== undefined) payload.contactEmail = String(body.contactEmail || '')
  if (body.contactPhone !== undefined) payload.contactPhone = String(body.contactPhone || '')
  if (body.source !== undefined) payload.source = String(body.source || '')
  if (body.status !== undefined && CRM_STATUSES.includes(body.status)) payload.status = body.status
  if (body.priority !== undefined && ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'].includes(body.priority)) {
    payload.priority = body.priority
  }
  if (body.budget !== undefined) {
    const value = Number(body.budget)
    payload.budget = Number.isNaN(value) ? null : value
  }
  if (body.nextActionAt !== undefined) payload.nextActionAt = body.nextActionAt ? new Date(body.nextActionAt) : null
  if (body.lastContactAt !== undefined) payload.lastContactAt = body.lastContactAt ? new Date(body.lastContactAt) : null
  if (body.notes !== undefined) payload.notes = String(body.notes || '')
  if (body.assignedTo !== undefined) payload.assignedTo = body.assignedTo || null
  return payload
}

// List leads with filters
router.get('/leads', requirePermission(PERMISSIONS.VIEW_CRM), async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.status && CRM_STATUSES.includes(req.query.status)) filter.status = req.query.status
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo
    if (req.query.search) {
      const q = String(req.query.search).trim()
      filter.$or = [
        { company: { $regex: q, $options: 'i' } },
        { contactName: { $regex: q, $options: 'i' } },
        { contactEmail: { $regex: q, $options: 'i' } },
      ]
    }
    const leads = await Lead.find(filter).sort({ updatedAt: -1 })
    return res.json({ leads })
  } catch (err) {
    return next(err)
  }
})

// Pipeline grouped by status
router.get('/pipeline', requirePermission(PERMISSIONS.VIEW_CRM), async (_req, res, next) => {
  try {
    const leads = await Lead.find({}).sort({ updatedAt: -1 })
    const columns = CRM_STATUSES.map((status) => ({
      status,
      leads: leads.filter((lead) => lead.status === status),
    }))
    return res.json({ columns })
  } catch (err) {
    return next(err)
  }
})

// Create lead
router.post('/leads', requirePermission(PERMISSIONS.MANAGE_CRM), async (req, res, next) => {
  try {
    const payload = normalizeLeadPayload(req.body || {})
    if (!payload.company) {
      return res.status(400).json({ error: 'company is required' })
    }
    if (!payload.assignedTo) {
      payload.assignedTo = await getDefaultAssignee()
    }
    payload.createdBy = req.user.id

    // Automations de base
    if (payload.status === 'CONTACTED' && !payload.lastContactAt) {
      payload.lastContactAt = new Date()
    }
    if (payload.status === 'PROPOSAL' && !payload.nextActionAt) {
      const next = new Date()
      next.setDate(next.getDate() + 3)
      payload.nextActionAt = next
    }
    if (['WON', 'LOST'].includes(payload.status)) {
      payload.nextActionAt = null
    }

    const lead = await Lead.create(payload)
    return res.status(201).json({ lead })
  } catch (err) {
    return next(err)
  }
})

// Update lead
router.patch('/leads/:id', requirePermission(PERMISSIONS.MANAGE_CRM), async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' })
    }

    const payload = normalizeLeadPayload(req.body || {})
    Object.assign(lead, payload)

    // Automations de base sur changement de statut
    if (payload.status) {
      if (payload.status === 'CONTACTED' && !lead.lastContactAt) {
        lead.lastContactAt = new Date()
      }
      if (payload.status === 'PROPOSAL' && !lead.nextActionAt) {
        const next = new Date()
        next.setDate(next.getDate() + 3)
        lead.nextActionAt = next
      }
      if (['WON', 'LOST'].includes(payload.status)) {
        lead.nextActionAt = null
      }
    }

    await lead.save()
    return res.json({ lead })
  } catch (err) {
    return next(err)
  }
})

// Get single lead
router.get('/leads/:id', requirePermission(PERMISSIONS.VIEW_CRM), async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' })
    }
    return res.json({ lead })
  } catch (err) {
    return next(err)
  }
})

// Delete lead
router.delete('/leads/:id', requirePermission(PERMISSIONS.MANAGE_CRM), async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' })
    }
    await lead.deleteOne()
    return res.json({ success: true })
  } catch (err) {
    return next(err)
  }
})

export default router
