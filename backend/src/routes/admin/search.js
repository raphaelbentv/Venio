import express from 'express'
import auth from '../../middleware/auth.js'
import { requireAdmin } from '../../middleware/role.js'
import Project from '../../models/Project.js'
import User from '../../models/User.js'
import Task from '../../models/Task.js'
import Lead from '../../models/Lead.js'

const router = express.Router()

router.use(auth)
router.use(requireAdmin)

// GET /api/admin/search?q=...
router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim()
    if (!q || q.length < 2) {
      return res.json({ results: [] })
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')

    const [projects, clients, tasks, leads] = await Promise.all([
      Project.find({ name: regex })
        .limit(5)
        .select('name status priority')
        .lean(),
      User.find({ $or: [{ name: regex }, { email: regex }], role: 'CLIENT' })
        .limit(5)
        .select('name email status')
        .lean(),
      Task.find({ title: regex })
        .limit(5)
        .populate('project', 'name')
        .select('title status priority project')
        .lean(),
      Lead.find({ $or: [{ company: regex }, { contactName: regex }] })
        .limit(5)
        .select('company contactName status leadTemperature')
        .lean()
        .catch(() => []),
    ])

    const results = [
      ...projects.map((p) => ({
        type: 'project',
        id: p._id,
        title: p.name,
        subtitle: `Projet — ${p.status}`,
        link: `/admin/projects/${p._id}`,
      })),
      ...clients.map((c) => ({
        type: 'client',
        id: c._id,
        title: c.name,
        subtitle: `Client — ${c.email}`,
        link: `/admin/clients/${c._id}`,
      })),
      ...tasks.map((t) => ({
        type: 'task',
        id: t._id,
        title: t.title,
        subtitle: `Tâche — ${t.project?.name || 'Projet'}`,
        link: `/admin/projects/${t.project?._id || t.project}?tab=tasks`,
      })),
      ...leads.map((l) => ({
        type: 'lead',
        id: l._id,
        title: l.company,
        subtitle: `Lead — ${l.contactName || ''}`,
        link: '/admin/crm',
      })),
    ]

    return res.json({ results })
  } catch (err) {
    return next(err)
  }
})

export default router
