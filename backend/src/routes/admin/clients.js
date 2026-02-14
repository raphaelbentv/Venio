import express from 'express'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import auth from '../../middleware/auth.js'
import { requireAdmin, requirePermission } from '../../middleware/role.js'
import { PERMISSIONS } from '../../lib/permissions.js'
import User from '../../models/User.js'
import Project from '../../models/Project.js'
import ProjectItem from '../../models/ProjectItem.js'
import ProjectSection from '../../models/ProjectSection.js'
import BillingDocument from '../../models/BillingDocument.js'
import ClientContact from '../../models/ClientContact.js'
import ClientNote from '../../models/ClientNote.js'
import ClientActivity from '../../models/ClientActivity.js'
import { createClientFolders, getClientCloudInfo } from '../../lib/nextcloud.js'

const router = express.Router()

router.use(auth)
router.use(requireAdmin)

function ok(res, data, meta = null, status = 200) {
  const payload = { data }
  if (meta) payload.meta = meta
  return res.status(status).json(payload)
}

function error(res, status, message, code = null) {
  const payload = { error: message }
  if (code) payload.code = code
  return res.status(status).json(payload)
}

function parsePagination(query) {
  const page = Math.max(parseInt(query.page || '1', 10), 1)
  const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 100)
  return { page, limit, skip: (page - 1) * limit }
}

function normalizeClientPayload(body = {}) {
  const payload = {}
  const pickString = (key) => {
    if (body[key] !== undefined) {
      payload[key] = typeof body[key] === 'string' ? body[key].trim() : ''
    }
  }

  pickString('name')
  pickString('companyName')
  pickString('serviceType')
  pickString('phone')
  pickString('website')

  if (body.source !== undefined && ['REFERRAL', 'INBOUND', 'OUTBOUND', 'PARTNER', 'AUTRE'].includes(body.source)) {
    payload.source = body.source
  }

  if (body.status !== undefined && ['PROSPECT', 'ACTIF', 'EN_PAUSE', 'CLOS', 'ARCHIVE'].includes(body.status)) {
    payload.status = body.status
  }

  if (body.onboardingStatus !== undefined && ['A_FAIRE', 'EN_COURS', 'TERMINE'].includes(body.onboardingStatus)) {
    payload.onboardingStatus = body.onboardingStatus
  }

  if (body.healthStatus !== undefined && ['BON', 'ATTENTION', 'CRITIQUE'].includes(body.healthStatus)) {
    payload.healthStatus = body.healthStatus
  }

  if (body.lastContactAt !== undefined) {
    payload.lastContactAt = body.lastContactAt ? new Date(body.lastContactAt) : null
  }

  if (body.tags !== undefined) {
    payload.tags = Array.isArray(body.tags)
      ? body.tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)
      : []
  }

  if (body.address !== undefined) {
    const address = body.address && typeof body.address === 'object' ? body.address : {}
    payload.address = {
      line1: typeof address.line1 === 'string' ? address.line1.trim() : '',
      line2: typeof address.line2 === 'string' ? address.line2.trim() : '',
      city: typeof address.city === 'string' ? address.city.trim() : '',
      postalCode: typeof address.postalCode === 'string' ? address.postalCode.trim() : '',
      country: typeof address.country === 'string' ? address.country.trim() : '',
    }
  }

  if (body.ownerAdminId !== undefined) {
    payload.ownerAdminId = body.ownerAdminId || null
  }

  return payload
}

function isActiveClientStatus(status) {
  return ['PROSPECT', 'ACTIF', 'EN_PAUSE'].includes(status)
}

async function ensureClient(clientId) {
  if (!mongoose.isValidObjectId(clientId)) return null
  return User.findOne({ _id: clientId, role: 'CLIENT' })
}

async function logActivity({ clientId, actorId, type, label, payload = {} }) {
  return ClientActivity.create({
    clientId,
    actorId,
    type,
    label,
    payload,
  })
}

function computeProjectProgress(project, items = []) {
  const deliverableItems = items.filter((item) => ['LIVRABLE', 'MAQUETTE', 'DOCUMENTATION', 'LIEN', 'NOTE'].includes(item.type))
  const milestoneItems = items.filter((item) => item.type === 'LIVRABLE')
  const completedStatuses = new Set(['TERMINE', 'VALIDE'])

  const milestoneRatio = milestoneItems.length === 0
    ? 0
    : milestoneItems.filter((item) => completedStatuses.has(item.status)).length / milestoneItems.length

  const deliverableRatio = deliverableItems.length === 0
    ? 0
    : deliverableItems.filter((item) => completedStatuses.has(item.status)).length / deliverableItems.length

  const statusBonus = project.status === 'TERMINE' ? 1 : project.status === 'EN_COURS' ? 0.55 : 0.25

  const value = ((milestoneRatio * 0.45) + (deliverableRatio * 0.35) + (statusBonus * 0.2)) * 100
  return Math.max(0, Math.min(100, Math.round(value)))
}

router.get('/', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    const { q, status, owner, health, sort = 'updatedAt_desc' } = req.query
    const { page, limit, skip } = parsePagination(req.query)

    const filter = { role: 'CLIENT' }

    if (q) {
      const regex = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [
        { name: regex },
        { companyName: regex },
        { email: regex },
      ]
    }

    if (status) filter.status = status
    if (health) filter.healthStatus = health

    if (owner === 'unassigned') {
      filter.ownerAdminId = null
    } else if (owner && mongoose.isValidObjectId(owner)) {
      filter.ownerAdminId = owner
    }

    const sortMap = {
      updatedAt_desc: { updatedAt: -1 },
      updatedAt_asc: { updatedAt: 1 },
      createdAt_desc: { createdAt: -1 },
      createdAt_asc: { createdAt: 1 },
      name_asc: { name: 1 },
      status_asc: { status: 1, updatedAt: -1 },
      health_asc: { healthStatus: 1, updatedAt: -1 },
    }

    const [clients, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .populate('ownerAdminId', 'name email role')
        .sort(sortMap[sort] || sortMap.updatedAt_desc)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ])

    return ok(
      res,
      { clients },
      {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      }
    )
  } catch (err) {
    return next(err)
  }
})

router.post('/', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    const { email, password, name } = req.body || {}
    if (!email || !password || !name) {
      return error(res, 400, 'name, email and password are required', 'VALIDATION_ERROR')
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    const existing = await User.findOne({ email: normalizedEmail })
    if (existing) {
      return error(res, 409, 'Email already exists', 'EMAIL_ALREADY_EXISTS')
    }

    const payload = normalizeClientPayload(req.body)

    if (payload.ownerAdminId && !mongoose.isValidObjectId(payload.ownerAdminId)) {
      return error(res, 422, 'Invalid ownerAdminId', 'INVALID_OWNER')
    }

    if (payload.ownerAdminId) {
      const owner = await User.findOne({ _id: payload.ownerAdminId, role: { $in: ['SUPER_ADMIN', 'ADMIN', 'VIEWER'] } })
      if (!owner) {
        return error(res, 422, 'ownerAdminId must reference an admin account', 'INVALID_OWNER')
      }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const client = await User.create({
      email: normalizedEmail,
      passwordHash,
      role: 'CLIENT',
      name: String(name).trim(),
      ...payload,
    })

    await logActivity({
      clientId: client._id,
      actorId: req.user.id,
      type: 'CLIENT_CREATED',
      label: 'Compte client créé',
      payload: { email: normalizedEmail },
    })

    // Create Nextcloud folders for the client (fire-and-forget)
    createClientFolders(client.companyName || client.name, client._id.toString()).catch((err) => {
      console.error('[Nextcloud] Error creating client folders:', err.message || err)
    })

    const fullClient = await User.findById(client._id).select('-passwordHash').populate('ownerAdminId', 'name email role').lean()
    return ok(res, { client: fullClient }, null, 201)
  } catch (err) {
    return next(err)
  }
})

router.get('/:id', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    const client = await ensureClient(req.params.id)
    if (!client) {
      return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')
    }

    const fullClient = await User.findById(client._id).select('-passwordHash').populate('ownerAdminId', 'name email role').lean()
    return ok(res, { client: fullClient })
  } catch (err) {
    return next(err)
  }
})

// Get Nextcloud cloud folder info for a client
router.get('/:id/cloud', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    const client = await ensureClient(req.params.id)
    if (!client) {
      return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')
    }

    const cloudInfo = getClientCloudInfo(client.companyName || client.name, client._id.toString())
    return ok(res, { cloud: cloudInfo })
  } catch (err) {
    return next(err)
  }
})

router.patch('/:id', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    const client = await ensureClient(req.params.id)
    if (!client) {
      return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')
    }

    const payload = normalizeClientPayload(req.body || {})

    if (req.body?.email !== undefined) {
      const nextEmail = String(req.body.email || '').toLowerCase().trim()
      if (!nextEmail) {
        return error(res, 422, 'email cannot be empty', 'VALIDATION_ERROR')
      }
      const duplicate = await User.findOne({ email: nextEmail, _id: { $ne: client._id } })
      if (duplicate) {
        return error(res, 409, 'Email already exists', 'EMAIL_ALREADY_EXISTS')
      }
      payload.email = nextEmail
    }

    if (payload.ownerAdminId !== undefined) {
      if (req.user.role !== 'SUPER_ADMIN') {
        return error(res, 403, 'Only SUPER_ADMIN can reassign owner', 'FORBIDDEN_OWNER_REASSIGN')
      }

      if (payload.ownerAdminId && !mongoose.isValidObjectId(payload.ownerAdminId)) {
        return error(res, 422, 'Invalid ownerAdminId', 'INVALID_OWNER')
      }

      if (payload.ownerAdminId) {
        const owner = await User.findOne({ _id: payload.ownerAdminId, role: { $in: ['SUPER_ADMIN', 'ADMIN', 'VIEWER'] } })
        if (!owner) {
          return error(res, 422, 'ownerAdminId must reference an admin account', 'INVALID_OWNER')
        }
      }
    }

    if (req.body?.password) {
      payload.passwordHash = await bcrypt.hash(String(req.body.password), 10)
    }

    const updated = await User.findByIdAndUpdate(client._id, payload, { new: true }).select('-passwordHash').populate('ownerAdminId', 'name email role').lean()

    await logActivity({
      clientId: client._id,
      actorId: req.user.id,
      type: 'CLIENT_UPDATED',
      label: 'Compte client modifié',
      payload: Object.keys(payload),
    })

    return ok(res, { client: updated })
  } catch (err) {
    return next(err)
  }
})

router.post('/:id/archive', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return error(res, 403, 'Only SUPER_ADMIN can archive a client', 'FORBIDDEN_ARCHIVE')
    }

    const client = await ensureClient(req.params.id)
    if (!client) {
      return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')
    }

    client.status = 'ARCHIVE'
    client.archivedAt = new Date()
    await client.save()

    await logActivity({
      clientId: client._id,
      actorId: req.user.id,
      type: 'CLIENT_ARCHIVED',
      label: 'Compte client archivé',
    })

    const safeClient = await User.findById(client._id).select('-passwordHash').populate('ownerAdminId', 'name email role').lean()
    return ok(res, { client: safeClient })
  } catch (err) {
    return next(err)
  }
})

router.post('/:id/reactivate', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return error(res, 403, 'Only SUPER_ADMIN can reactivate a client', 'FORBIDDEN_REACTIVATE')
    }

    const client = await ensureClient(req.params.id)
    if (!client) {
      return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')
    }

    client.status = 'ACTIF'
    client.archivedAt = null
    await client.save()

    await logActivity({
      clientId: client._id,
      actorId: req.user.id,
      type: 'CLIENT_REACTIVATED',
      label: 'Compte client réactivé',
    })

    const safeClient = await User.findById(client._id).select('-passwordHash').populate('ownerAdminId', 'name email role').lean()
    return ok(res, { client: safeClient })
  } catch (err) {
    return next(err)
  }
})

router.get('/:id/contacts', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    const client = await ensureClient(req.params.id)
    if (!client) return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')

    const contacts = await ClientContact.find({ clientId: client._id }).sort({ isMain: -1, updatedAt: -1 }).lean()
    return ok(res, { contacts })
  } catch (err) {
    return next(err)
  }
})

router.post('/:id/contacts', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    const client = await ensureClient(req.params.id)
    if (!client) return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')

    const { firstName, lastName, email, phone, role, isMain, notes } = req.body || {}
    if (!firstName || !String(firstName).trim()) {
      return error(res, 422, 'firstName is required', 'VALIDATION_ERROR')
    }

    if (isMain === true) {
      await ClientContact.updateMany({ clientId: client._id, isMain: true }, { $set: { isMain: false } })
    }

    const contact = await ClientContact.create({
      clientId: client._id,
      firstName: String(firstName).trim(),
      lastName: typeof lastName === 'string' ? lastName.trim() : '',
      email: typeof email === 'string' ? email.toLowerCase().trim() : '',
      phone: typeof phone === 'string' ? phone.trim() : '',
      role: typeof role === 'string' ? role.trim() : '',
      isMain: Boolean(isMain),
      notes: typeof notes === 'string' ? notes.trim() : '',
    })

    await logActivity({
      clientId: client._id,
      actorId: req.user.id,
      type: 'CONTACT_CREATED',
      label: 'Contact client ajouté',
      payload: { contactId: contact._id },
    })

    return ok(res, { contact }, null, 201)
  } catch (err) {
    return next(err)
  }
})

router.patch('/:id/contacts/:contactId', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    const client = await ensureClient(req.params.id)
    if (!client) return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')

    const contact = await ClientContact.findOne({ _id: req.params.contactId, clientId: client._id })
    if (!contact) {
      return error(res, 404, 'Contact not found', 'CONTACT_NOT_FOUND')
    }

    const fields = ['firstName', 'lastName', 'phone', 'role', 'notes']
    for (const field of fields) {
      if (req.body?.[field] !== undefined) {
        contact[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : ''
      }
    }

    if (req.body?.email !== undefined) {
      contact.email = typeof req.body.email === 'string' ? req.body.email.toLowerCase().trim() : ''
    }

    if (req.body?.isMain !== undefined) {
      const isMain = Boolean(req.body.isMain)
      if (isMain) {
        await ClientContact.updateMany({ clientId: client._id, _id: { $ne: contact._id }, isMain: true }, { $set: { isMain: false } })
      }
      contact.isMain = isMain
    }

    await contact.save()

    await logActivity({
      clientId: client._id,
      actorId: req.user.id,
      type: 'CONTACT_UPDATED',
      label: 'Contact client modifié',
      payload: { contactId: contact._id },
    })

    return ok(res, { contact })
  } catch (err) {
    return next(err)
  }
})

router.delete('/:id/contacts/:contactId', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    const client = await ensureClient(req.params.id)
    if (!client) return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')

    const contact = await ClientContact.findOneAndDelete({ _id: req.params.contactId, clientId: client._id })
    if (!contact) {
      return error(res, 404, 'Contact not found', 'CONTACT_NOT_FOUND')
    }

    await logActivity({
      clientId: client._id,
      actorId: req.user.id,
      type: 'CONTACT_DELETED',
      label: 'Contact client supprimé',
      payload: { contactId: contact._id },
    })

    return ok(res, { success: true })
  } catch (err) {
    return next(err)
  }
})

router.get('/:id/notes', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    const client = await ensureClient(req.params.id)
    if (!client) return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')

    const notes = await ClientNote.find({ clientId: client._id })
      .sort({ pinned: -1, createdAt: -1 })
      .populate('createdBy', 'name email')
      .lean()

    return ok(res, { notes })
  } catch (err) {
    return next(err)
  }
})

router.post('/:id/notes', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    const client = await ensureClient(req.params.id)
    if (!client) return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')

    const { content, pinned } = req.body || {}
    if (!content || !String(content).trim()) {
      return error(res, 422, 'content is required', 'VALIDATION_ERROR')
    }

    const note = await ClientNote.create({
      clientId: client._id,
      content: String(content).trim(),
      createdBy: req.user.id,
      pinned: Boolean(pinned),
      visibility: 'INTERNE',
    })

    await logActivity({
      clientId: client._id,
      actorId: req.user.id,
      type: 'NOTE_CREATED',
      label: 'Note interne ajoutée',
      payload: { noteId: note._id },
    })

    const populatedNote = await ClientNote.findById(note._id).populate('createdBy', 'name email').lean()
    return ok(res, { note: populatedNote }, null, 201)
  } catch (err) {
    return next(err)
  }
})

router.patch('/:id/notes/:noteId', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    const client = await ensureClient(req.params.id)
    if (!client) return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')

    const note = await ClientNote.findOne({ _id: req.params.noteId, clientId: client._id })
    if (!note) {
      return error(res, 404, 'Note not found', 'NOTE_NOT_FOUND')
    }

    if (req.body?.content !== undefined) {
      if (!String(req.body.content).trim()) {
        return error(res, 422, 'content cannot be empty', 'VALIDATION_ERROR')
      }
      note.content = String(req.body.content).trim()
    }

    if (req.body?.pinned !== undefined) {
      note.pinned = Boolean(req.body.pinned)
    }

    await note.save()

    await logActivity({
      clientId: client._id,
      actorId: req.user.id,
      type: 'NOTE_UPDATED',
      label: 'Note interne modifiée',
      payload: { noteId: note._id },
    })

    const populatedNote = await ClientNote.findById(note._id).populate('createdBy', 'name email').lean()
    return ok(res, { note: populatedNote })
  } catch (err) {
    return next(err)
  }
})

router.delete('/:id/notes/:noteId', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    const client = await ensureClient(req.params.id)
    if (!client) return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')

    const note = await ClientNote.findOneAndDelete({ _id: req.params.noteId, clientId: client._id })
    if (!note) {
      return error(res, 404, 'Note not found', 'NOTE_NOT_FOUND')
    }

    await logActivity({
      clientId: client._id,
      actorId: req.user.id,
      type: 'NOTE_DELETED',
      label: 'Note interne supprimée',
      payload: { noteId: note._id },
    })

    return ok(res, { success: true })
  } catch (err) {
    return next(err)
  }
})

router.get('/:id/activities', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    const client = await ensureClient(req.params.id)
    if (!client) return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')

    const activities = await ClientActivity.find({ clientId: client._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('actorId', 'name email role')
      .lean()

    return ok(res, { activities })
  } catch (err) {
    return next(err)
  }
})

router.get('/:id/projects', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    const client = await ensureClient(req.params.id)
    if (!client) return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')

    const includeArchived = req.query.archived === 'true'
    const projectFilter = { client: client._id }
    if (!includeArchived) {
      projectFilter.$or = [{ isArchived: false }, { isArchived: { $exists: false } }]
    }

    const projects = await Project.find(projectFilter).sort({ updatedAt: -1 }).lean()
    const projectIds = projects.map((project) => project._id)
    const items = await ProjectItem.find({ project: { $in: projectIds } }).select('project type status').lean()

    const grouped = new Map()
    for (const item of items) {
      const key = item.project.toString()
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key).push(item)
    }

    const projectsWithMetrics = projects.map((project) => {
      const metricsItems = grouped.get(project._id.toString()) || []
      return {
        ...project,
        progressPercent: computeProjectProgress(project, metricsItems),
        deliverableCount: metricsItems.filter((item) => item.type === 'LIVRABLE').length,
      }
    })

    return ok(res, { projects: projectsWithMetrics })
  } catch (err) {
    return next(err)
  }
})

router.get('/:id/progress', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    const client = await ensureClient(req.params.id)
    if (!client) return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')

    const projects = await Project.find({
      client: client._id,
      $or: [{ isArchived: false }, { isArchived: { $exists: false } }],
    }).lean()

    if (projects.length === 0) {
      return ok(res, {
        progressPercent: 0,
        completedMilestones: 0,
        totalMilestones: 0,
        delayedDeadlines: 0,
        nextDeadlines: [],
      })
    }

    const projectIds = projects.map((project) => project._id)
    const items = await ProjectItem.find({ project: { $in: projectIds } }).select('project type status').lean()

    const groupedItems = new Map()
    for (const item of items) {
      const key = item.project.toString()
      if (!groupedItems.has(key)) groupedItems.set(key, [])
      groupedItems.get(key).push(item)
    }

    const now = new Date()
    let progressTotal = 0
    let totalMilestones = 0
    let completedMilestones = 0
    let delayedDeadlines = 0
    const nextDeadlines = []

    for (const project of projects) {
      const projectItems = groupedItems.get(project._id.toString()) || []
      progressTotal += computeProjectProgress(project, projectItems)

      const milestones = projectItems.filter((item) => item.type === 'LIVRABLE')
      totalMilestones += milestones.length
      completedMilestones += milestones.filter((item) => ['TERMINE', 'VALIDE'].includes(item.status)).length

      for (const deadline of project.deadlines || []) {
        if (!deadline?.dueAt) continue
        const dueDate = new Date(deadline.dueAt)
        if (Number.isNaN(dueDate.getTime())) continue

        if (dueDate < now && project.status !== 'TERMINE') {
          delayedDeadlines += 1
          continue
        }

        if (dueDate >= now) {
          nextDeadlines.push({
            projectId: project._id,
            projectName: project.name,
            label: deadline.label || 'Jalon',
            dueAt: dueDate,
          })
        }
      }
    }

    nextDeadlines.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))

    return ok(res, {
      progressPercent: Math.round(progressTotal / projects.length),
      completedMilestones,
      totalMilestones,
      delayedDeadlines,
      nextDeadlines: nextDeadlines.slice(0, 5),
    })
  } catch (err) {
    return next(err)
  }
})

router.get('/:id/deliverables', requirePermission(PERMISSIONS.MANAGE_CLIENTS), async (req, res, next) => {
  try {
    const client = await ensureClient(req.params.id)
    if (!client) return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')

    const projects = await Project.find({ client: client._id }).select('_id name').lean()
    const projectIds = projects.map((project) => project._id)
    const projectMap = new Map(projects.map((project) => [project._id.toString(), project]))

    const sections = await ProjectSection.find({ project: { $in: projectIds } }).select('_id title').lean()
    const sectionMap = new Map(sections.map((section) => [section._id.toString(), section.title]))

    const items = await ProjectItem.find({
      project: { $in: projectIds },
      type: { $in: ['LIVRABLE', 'MAQUETTE', 'DOCUMENTATION', 'LIEN', 'NOTE', 'AUTRE'] },
    })
      .sort({ updatedAt: -1 })
      .lean()

    const deliverables = items.map((item) => ({
      _id: item._id,
      projectId: item.project,
      projectName: projectMap.get(item.project.toString())?.name || 'Projet',
      section: item.section ? sectionMap.get(item.section.toString()) || '' : '',
      itemType: item.type,
      title: item.title,
      updatedAt: item.updatedAt,
      visibleToClient: item.isVisible,
      isDownloadable: item.isDownloadable,
      firstViewedAt: item.viewedAt || null,
      downloadedAt: item.downloadedAt || null,
    }))

    return ok(res, { deliverables })
  } catch (err) {
    return next(err)
  }
})

router.get('/:id/billing/summary', requirePermission(PERMISSIONS.VIEW_BILLING), async (req, res, next) => {
  try {
    const client = await ensureClient(req.params.id)
    if (!client) return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')

    const docs = await BillingDocument.find({ client: client._id }).select('type status total currency').lean()

    const summary = {
      totalQuotes: 0,
      totalInvoices: 0,
      amountQuoted: 0,
      amountInvoiced: 0,
      amountPaid: 0,
      amountUnpaid: 0,
      unpaidCount: 0,
      currency: docs[0]?.currency || 'EUR',
    }

    for (const doc of docs) {
      const total = Number(doc.total) || 0
      if (doc.type === 'QUOTE') {
        summary.totalQuotes += 1
        summary.amountQuoted += total
      }
      if (doc.type === 'INVOICE') {
        summary.totalInvoices += 1
        summary.amountInvoiced += total
        if (doc.status === 'PAID') {
          summary.amountPaid += total
        } else {
          summary.amountUnpaid += total
          summary.unpaidCount += 1
        }
      }
    }

    return ok(res, { summary })
  } catch (err) {
    return next(err)
  }
})

router.get('/:id/billing/documents', requirePermission(PERMISSIONS.VIEW_BILLING), async (req, res, next) => {
  try {
    const client = await ensureClient(req.params.id)
    if (!client) return error(res, 404, 'Client not found', 'CLIENT_NOT_FOUND')

    const documents = await BillingDocument.find({ client: client._id })
      .sort({ createdAt: -1 })
      .populate('project', 'name projectNumber')
      .lean()

    return ok(res, { documents })
  } catch (err) {
    return next(err)
  }
})

export default router
