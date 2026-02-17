import ActivityLog from '../models/ActivityLog.js'

export async function logActivity({ project, action, actor, summary = '', metadata = {} }) {
  try {
    await ActivityLog.create({ project, action, actor, summary, metadata })
  } catch (err) {
    console.error('[ActivityLog] Failed to log activity:', err.message)
  }
}
