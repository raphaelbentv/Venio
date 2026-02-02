import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import auth from '../../middleware/auth.js'
import requireRole from '../../middleware/role.js'
import Project from '../../models/Project.js'
import ProjectUpdate from '../../models/ProjectUpdate.js'
import User from '../../models/User.js'
import Document from '../../models/Document.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

router.use(auth)
router.use(requireRole('ADMIN'))

router.get('/', async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.clientId) {
      filter.client = req.query.clientId
    }
    const projects = await Project.find(filter).sort({ updatedAt: -1 })
    return res.json({ projects })
  } catch (err) {
    return next(err)
  }
})

router.get('/:id', async (req, res, next) => {
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

router.get('/:id/documents', async (req, res, next) => {
  try {
    const documents = await Document.find({ project: req.params.id }).sort({ uploadedAt: -1 })
    return res.json({ documents })
  } catch (err) {
    return next(err)
  }
})

router.get('/:id/updates', async (req, res, next) => {
  try {
    const updates = await ProjectUpdate.find({ project: req.params.id }).sort({ createdAt: -1 })
    return res.json({ updates })
  } catch (err) {
    return next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { clientId, name, description, status } = req.body || {}
    if (!clientId || !name) {
      return res.status(400).json({ error: 'clientId and name are required' })
    }

    const client = await User.findById(clientId)
    if (!client || client.role !== 'CLIENT') {
      return res.status(400).json({ error: 'Invalid clientId' })
    }

    const project = await Project.create({
      client: clientId,
      name,
      description: description || '',
      status: status || 'EN_COURS',
    })

    return res.status(201).json({ project })
  } catch (err) {
    return next(err)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const { name, description, status } = req.body || {}
    const update = {}
    if (name !== undefined) update.name = name
    if (description !== undefined) update.description = description
    if (status !== undefined) update.status = status

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

router.delete('/:id', async (req, res, next) => {
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

router.post('/:id/updates', async (req, res, next) => {
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

router.post('/:id/documents', upload.single('file'), async (req, res, next) => {
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
