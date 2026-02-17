import express from 'express'
import { body, validationResult } from 'express-validator'
import auth from '../../middleware/auth.js'
import { requireAdmin, requirePermission } from '../../middleware/role.js'
import Task from '../../models/Task.js'
import Project from '../../models/Project.js'
import { PERMISSIONS } from '../../lib/permissions.js'
import { createNotification } from '../../lib/notifications.js'

const router = express.Router()

router.use(auth)
router.use(requireAdmin)

const TASK_STATUSES = ['A_FAIRE', 'EN_COURS', 'EN_REVIEW', 'TERMINE']
const TASK_PRIORITIES = ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']

// GET /api/admin/projects/:projectId/tasks
router.get('/:projectId/tasks', requirePermission(PERMISSIONS.VIEW_PROJECTS), async (req, res, next) => {
  try {
    const { projectId } = req.params
    const project = await Project.findById(projectId)
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' })
    }

    const tasks = await Task.find({ project: projectId })
      .sort({ status: 1, order: 1 })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')

    return res.json({ tasks })
  } catch (err) {
    return next(err)
  }
})

// POST /api/admin/projects/:projectId/tasks
router.post(
  '/:projectId/tasks',
  requirePermission(PERMISSIONS.MANAGE_TASKS),
  body('title').trim().notEmpty().withMessage('Le titre est requis'),
  body('status').optional().isIn(TASK_STATUSES).withMessage('Statut invalide'),
  body('priority').optional().isIn(TASK_PRIORITIES).withMessage('Priorité invalide'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() })
      }

      const { projectId } = req.params
      const project = await Project.findById(projectId)
      if (!project) {
        return res.status(404).json({ error: 'Projet non trouvé' })
      }

      const { title, description, status, priority, assignee, dueDate, tags } = req.body

      // Auto-order: put at end of the target column
      const targetStatus = status || 'A_FAIRE'
      const lastTask = await Task.findOne({ project: projectId, status: targetStatus }).sort({ order: -1 })
      const order = lastTask ? lastTask.order + 1 : 0

      const task = await Task.create({
        project: projectId,
        title,
        description: description || '',
        status: targetStatus,
        priority: priority || 'NORMALE',
        assignee: assignee || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: Array.isArray(tags) ? tags.filter((t) => typeof t === 'string' && t.trim()) : [],
        order,
        createdBy: req.user.id,
      })

      await task.populate('assignee', 'name email')
      await task.populate('createdBy', 'name email')

      // Notify assignee if set and different from creator
      if (assignee && String(assignee) !== String(req.user.id)) {
        await createNotification({
          recipient: assignee,
          type: 'TASK_ASSIGNED',
          title: `Nouvelle tâche : ${title}`,
          message: `Vous avez été assigné à la tâche "${title}" sur le projet "${project.name}"`,
          link: `/admin/projects/${projectId}?tab=tasks`,
        })
      }

      return res.status(201).json({ task })
    } catch (err) {
      return next(err)
    }
  }
)

// PATCH /api/admin/projects/:projectId/tasks/:taskId
router.patch(
  '/:projectId/tasks/:taskId',
  requirePermission(PERMISSIONS.MANAGE_TASKS),
  body('title').optional().trim().notEmpty().withMessage('Le titre ne peut pas être vide'),
  body('status').optional().isIn(TASK_STATUSES).withMessage('Statut invalide'),
  body('priority').optional().isIn(TASK_PRIORITIES).withMessage('Priorité invalide'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() })
      }

      const { projectId, taskId } = req.params
      const task = await Task.findOne({ _id: taskId, project: projectId })
      if (!task) {
        return res.status(404).json({ error: 'Tâche non trouvée' })
      }

      const { title, description, status, priority, assignee, dueDate, tags } = req.body
      const oldAssignee = task.assignee ? String(task.assignee) : null

      if (title !== undefined) task.title = title
      if (description !== undefined) task.description = description
      if (status !== undefined) task.status = status
      if (priority !== undefined) task.priority = priority
      if (assignee !== undefined) task.assignee = assignee || null
      if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null
      if (tags !== undefined) task.tags = Array.isArray(tags) ? tags.filter((t) => typeof t === 'string' && t.trim()) : []

      await task.save()
      await task.populate('assignee', 'name email')
      await task.populate('createdBy', 'name email')

      // Notify new assignee if changed
      const newAssignee = task.assignee ? String(task.assignee._id || task.assignee) : null
      if (newAssignee && newAssignee !== oldAssignee && newAssignee !== String(req.user.id)) {
        const project = await Project.findById(projectId)
        await createNotification({
          recipient: newAssignee,
          type: 'TASK_ASSIGNED',
          title: `Tâche assignée : ${task.title}`,
          message: `Vous avez été assigné à la tâche "${task.title}" sur le projet "${project?.name || ''}"`,
          link: `/admin/projects/${projectId}?tab=tasks`,
        })
      }

      return res.json({ task })
    } catch (err) {
      return next(err)
    }
  }
)

// PATCH /api/admin/projects/:projectId/tasks/:taskId/move — drag-drop
router.patch('/:projectId/tasks/:taskId/move', requirePermission(PERMISSIONS.MANAGE_TASKS), async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params
    const { status, order } = req.body

    if (!TASK_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' })
    }

    const task = await Task.findOne({ _id: taskId, project: projectId })
    if (!task) {
      return res.status(404).json({ error: 'Tâche non trouvée' })
    }

    task.status = status
    task.order = typeof order === 'number' ? order : 0
    await task.save()
    await task.populate('assignee', 'name email')
    await task.populate('createdBy', 'name email')

    return res.json({ task })
  } catch (err) {
    return next(err)
  }
})

// DELETE /api/admin/projects/:projectId/tasks/:taskId
router.delete('/:projectId/tasks/:taskId', requirePermission(PERMISSIONS.MANAGE_TASKS), async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params
    const task = await Task.findOneAndDelete({ _id: taskId, project: projectId })
    if (!task) {
      return res.status(404).json({ error: 'Tâche non trouvée' })
    }
    return res.json({ success: true })
  } catch (err) {
    return next(err)
  }
})

export default router
