import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import auth from '../../middleware/auth.js'
import { requireAdmin, requirePermission } from '../../middleware/role.js'
import Project from '../../models/Project.js'
import ProjectUpdate from '../../models/ProjectUpdate.js'
import User from '../../models/User.js'
import Document from '../../models/Document.js'
import { getNextSequence } from '../../models/Sequence.js'
import { PERMISSIONS } from '../../lib/permissions.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

router.use(auth)
router.use(requireAdmin)

router.get('/', requirePermission(PERMISSIONS.VIEW_PROJECTS), async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.clientId) {
      filter.client = req.query.clientId
    }
    if (req.query.archived === 'all') {
      // no filter on isArchived
    } else if (req.query.archived === 'true') {
      filter.isArchived = true
    } else {
      filter.$or = [{ isArchived: false }, { isArchived: { $exists: false } }]
    }
    const query = Project.find(filter).sort({ updatedAt: -1 })
    if (req.query.includeClient === 'true') {
      query.populate('client', 'name email')
    }
    const projects = await query
    return res.json({ projects })
  } catch (err) {
    return next(err)
  }
})

router.get('/:id', requirePermission(PERMISSIONS.VIEW_PROJECTS), async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    return res.json({ project })
  } catch (err) {
    return next(err)
  }
})

router.get('/:id/documents', requirePermission(PERMISSIONS.VIEW_PROJECTS), async (req, res, next) => {
  try {
    const documents = await Document.find({ project: req.params.id }).sort({ uploadedAt: -1 })
    return res.json({ documents })
  } catch (err) {
    return next(err)
  }
})

router.get('/:id/updates', requirePermission(PERMISSIONS.VIEW_PROJECTS), async (req, res, next) => {
  try {
    const updates = await ProjectUpdate.find({ project: req.params.id }).sort({ createdAt: -1 })
    return res.json({ updates })
  } catch (err) {
    return next(err)
  }
})

function normalizeOptions(body) {
  const opts = {}
  if (Array.isArray(body.serviceTypes)) {
    opts.serviceTypes = body.serviceTypes.filter((s) => typeof s === 'string' && s.trim())
  }
  if (Array.isArray(body.deliverableTypes)) {
    opts.deliverableTypes = body.deliverableTypes.filter((s) => typeof s === 'string' && s.trim())
  }
  if (Array.isArray(body.deadlines)) {
    opts.deadlines = body.deadlines
      .filter((d) => d && (d.label != null || d.dueAt != null))
      .map((d) => ({
        label: typeof d.label === 'string' ? d.label : '',
        dueAt: d.dueAt ? new Date(d.dueAt) : null,
      }))
  }
  if (body.budget && typeof body.budget === 'object') {
    const b = body.budget
    opts.budget = {
      amount: typeof b.amount === 'number' && !Number.isNaN(b.amount) ? b.amount : null,
      currency: typeof b.currency === 'string' ? (b.currency || 'EUR') : 'EUR',
      note: typeof b.note === 'string' ? b.note : '',
    }
  }
  if (body.startDate != null) opts.startDate = body.startDate ? new Date(body.startDate) : null
  if (body.endDate != null) opts.endDate = body.endDate ? new Date(body.endDate) : null
  if (body.deliveredAt != null) opts.deliveredAt = body.deliveredAt ? new Date(body.deliveredAt) : null
  if (body.projectNumber !== undefined) opts.projectNumber = typeof body.projectNumber === 'string' ? body.projectNumber : ''
  if (body.priority !== undefined && ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'].includes(body.priority)) opts.priority = body.priority
  if (body.responsible !== undefined) opts.responsible = typeof body.responsible === 'string' ? body.responsible : ''
  if (body.internalNotes !== undefined) opts.internalNotes = typeof body.internalNotes === 'string' ? body.internalNotes : ''
  if (body.isArchived !== undefined) opts.isArchived = Boolean(body.isArchived)
  if (Array.isArray(body.tags)) opts.tags = body.tags.filter((s) => typeof s === 'string' && s.trim())
  if (body.summary !== undefined) opts.summary = typeof body.summary === 'string' ? body.summary : ''
  if (body.reminderAt != null) opts.reminderAt = body.reminderAt ? new Date(body.reminderAt) : null
  if (body.billing && typeof body.billing === 'object') {
    const bil = body.billing
    opts.billing = {
      amountInvoiced: typeof bil.amountInvoiced === 'number' && !Number.isNaN(bil.amountInvoiced) ? bil.amountInvoiced : null,
      billingStatus: ['NON_FACTURE', 'PARTIEL', 'FACTURE'].includes(bil.billingStatus) ? bil.billingStatus : 'NON_FACTURE',
      quoteReference: typeof bil.quoteReference === 'string' ? bil.quoteReference : '',
    }
  }
  return opts
}

router.post('/', requirePermission(PERMISSIONS.EDIT_PROJECTS), async (req, res, next) => {
  try {
    const { clientId, name, description, status } = req.body || {}
    if (!clientId || !name) {
      return res.status(400).json({ error: 'clientId and name are required' })
    }

    const client = await User.findById(clientId)
    if (!client || client.role !== 'CLIENT') {
      return res.status(400).json({ error: 'Invalid clientId' })
    }

    const options = normalizeOptions(req.body || {})

    if (!options.projectNumber || String(options.projectNumber).trim() === '') {
      const { formatted } = await getNextSequence('projectNumber', { prefix: 'PROJ-', padding: 4 })
      options.projectNumber = formatted
    }

    const project = await Project.create({
      client: clientId,
      name,
      description: description || '',
      status: status || 'EN_COURS',
      ...options,
    })

    return res.status(201).json({ project })
  } catch (err) {
    return next(err)
  }
})

router.patch('/:id', requirePermission(PERMISSIONS.EDIT_PROJECTS), async (req, res, next) => {
  try {
    const body = req.body || {}
    const { name, description, status } = body
    const update = {}
    if (name !== undefined) update.name = name
    if (description !== undefined) update.description = description
    if (status !== undefined) update.status = status

    const options = normalizeOptions(body)
    if (body.serviceTypes !== undefined) update.serviceTypes = options.serviceTypes !== undefined ? options.serviceTypes : body.serviceTypes
    if (body.deliverableTypes !== undefined) update.deliverableTypes = options.deliverableTypes !== undefined ? options.deliverableTypes : body.deliverableTypes
    if (body.deadlines !== undefined) update.deadlines = options.deadlines !== undefined ? options.deadlines : body.deadlines
    if (body.budget !== undefined) update.budget = options.budget !== undefined ? options.budget : body.budget
    if (body.startDate !== undefined) update.startDate = options.startDate !== undefined ? options.startDate : (body.startDate ? new Date(body.startDate) : null)
    if (body.endDate !== undefined) update.endDate = options.endDate !== undefined ? options.endDate : (body.endDate ? new Date(body.endDate) : null)
    if (body.deliveredAt !== undefined) update.deliveredAt = options.deliveredAt !== undefined ? options.deliveredAt : (body.deliveredAt ? new Date(body.deliveredAt) : null)
    if (body.projectNumber !== undefined) update.projectNumber = options.projectNumber !== undefined ? options.projectNumber : body.projectNumber
    if (body.priority !== undefined) update.priority = options.priority !== undefined ? options.priority : body.priority
    if (body.responsible !== undefined) update.responsible = options.responsible !== undefined ? options.responsible : body.responsible
    if (body.internalNotes !== undefined) update.internalNotes = options.internalNotes !== undefined ? options.internalNotes : body.internalNotes
    if (body.isArchived !== undefined) update.isArchived = options.isArchived !== undefined ? options.isArchived : body.isArchived
    if (body.tags !== undefined) update.tags = options.tags !== undefined ? options.tags : body.tags
    if (body.summary !== undefined) update.summary = options.summary !== undefined ? options.summary : body.summary
    if (body.reminderAt !== undefined) update.reminderAt = options.reminderAt !== undefined ? options.reminderAt : (body.reminderAt ? new Date(body.reminderAt) : null)
    if (body.billing !== undefined) update.billing = options.billing !== undefined ? options.billing : body.billing

    const project = await Project.findByIdAndUpdate(req.params.id, update, {
      new: true,
    })
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    return res.json({ project })
  } catch (err) {
    return next(err)
  }
})

router.delete('/:id', requirePermission(PERMISSIONS.EDIT_PROJECTS), async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id)
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    return res.json({ success: true })
  } catch (err) {
    return next(err)
  }
})

router.post('/:id/updates', requirePermission(PERMISSIONS.EDIT_PROJECTS), async (req, res, next) => {
  try {
    const { title, description } = req.body || {}
    if (!title) {
      return res.status(400).json({ error: 'title is required' })
    }

    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const update = await ProjectUpdate.create({
      project: project._id,
      title,
      description: description || '',
      createdBy: req.user.id,
    })

    return res.status(201).json({ update })
  } catch (err) {
    return next(err)
  }
})

router.post('/:id/documents', requirePermission(PERMISSIONS.EDIT_PROJECTS), upload.single('file'), async (req, res, next) => {
  try {
    const { type } = req.body || {}
    if (!type || !['DEVIS', 'FACTURE', 'FICHIER_PROJET'].includes(type)) {
      return res.status(400).json({ error: 'Invalid document type' })
    }

    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' })
    }

    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${Date.now()}-${safeName}`
    const relativePath = path.join('uploads', 'projects', project._id.toString(), type, filename)
    const absolutePath = path.resolve(process.cwd(), relativePath)

    await fs.mkdir(path.dirname(absolutePath), { recursive: true })
    await fs.writeFile(absolutePath, req.file.buffer)

    const document = await Document.create({
      project: project._id,
      type,
      originalName: req.file.originalname,
      storagePath: relativePath,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
    })

    return res.status(201).json({ document })
  } catch (err) {
    return next(err)
  }
})

export default router
