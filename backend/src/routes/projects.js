import express from 'express'
import auth from '../middleware/auth.js'
import Project from '../models/Project.js'
import Document from '../models/Document.js'
import ProjectUpdate from '../models/ProjectUpdate.js'

const router = express.Router()

router.use(auth)

router.get('/', async (req, res, next) => {
  try {
    if (req.user.role !== 'CLIENT') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const projects = await Project.find({ client: req.user.id }).sort({ updatedAt: -1 })
    return res.json({ projects })
  } catch (err) {
    return next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    if (req.user.role !== 'CLIENT') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const project = await Project.findOne({ _id: req.params.id, client: req.user.id })
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const [documents, updates] = await Promise.all([
      Document.find({ project: project._id }).sort({ uploadedAt: -1 }),
      ProjectUpdate.find({ project: project._id }).sort({ createdAt: -1 }),
    ])

    return res.json({ project, documents, updates })
  } catch (err) {
    return next(err)
  }
})

router.get('/:id/documents', async (req, res, next) => {
  try {
    if (req.user.role !== 'CLIENT') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const project = await Project.findOne({ _id: req.params.id, client: req.user.id })
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const documents = await Document.find({ project: project._id }).sort({ uploadedAt: -1 })
    return res.json({ documents })
  } catch (err) {
    return next(err)
  }
})

export default router
