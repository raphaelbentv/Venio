import LeadActivity from '../models/LeadActivity.js'
import Lead from '../models/Lead.js'
import User from '../models/User.js'
import { ADMIN_ROLES } from './permissions.js'
import { sendLeadAssignmentEmail } from './email.js'

// Round-robin state (in-memory, resets on server restart)
// For production, consider storing in DB or Redis
let lastAssignedIndex = -1

/**
 * Get the next admin in round-robin rotation for lead assignment
 * @returns {Promise<string|null>} Admin ID or null if no admins
 */
export async function getRoundRobinAssignee() {
  const admins = await User.find({ role: { $in: ADMIN_ROLES } }).sort({ createdAt: 1 })
  if (admins.length === 0) return null

  lastAssignedIndex = (lastAssignedIndex + 1) % admins.length
  return admins[lastAssignedIndex]._id
}

/**
 * Log a lead activity
 * @param {string} leadId - Lead ID
 * @param {string} type - Activity type (CREATED, STATUS_CHANGE, ASSIGNED, AUTO_QUALIFIED, etc.)
 * @param {string} label - Human-readable description
 * @param {object} payload - Additional data
 * @param {string|null} actorId - User who performed the action
 * @returns {Promise<object>} Created activity
 */
export async function logLeadActivity(leadId, type, label, payload = {}, actorId = null) {
  return LeadActivity.create({
    leadId,
    type,
    label,
    payload,
    actorId,
  })
}

/**
 * Send assignment email to commercial (wrapper)
 * @param {object} lead - Lead document
 * @param {object} assignee - User document
 */
export async function notifyAssignment(lead, assignee) {
  if (!assignee?.email) return { sent: false, error: 'No email' }
  return sendLeadAssignmentEmail({
    to: assignee.email,
    assigneeName: assignee.name,
    lead: {
      company: lead.company,
      contactName: lead.contactName,
      contactEmail: lead.contactEmail,
      contactPhone: lead.contactPhone,
      source: lead.source,
      priority: lead.priority,
      budget: lead.budget,
    },
  })
}

/**
 * Check if a lead should be auto-qualified (has budget AND source)
 * @param {object} lead - Lead data
 * @returns {boolean}
 */
export function shouldAutoQualify(lead) {
  return lead.budget != null && lead.budget > 0 && lead.source && lead.source.trim() !== ''
}

/**
 * Check if a lead is "cold" (no contact for X days)
 * @param {object} lead - Lead document
 * @param {number} days - Threshold in days (default 7)
 * @returns {boolean}
 */
export function isLeadCold(lead, days = 7) {
  if (!lead.lastContactAt) return false
  if (['WON', 'LOST'].includes(lead.status)) return false
  const threshold = new Date()
  threshold.setDate(threshold.getDate() - days)
  return new Date(lead.lastContactAt) < threshold
}

/**
 * Check if a lead is "stale" (stuck in same status for X days)
 * @param {object} lead - Lead document
 * @param {number} days - Threshold in days (default 14)
 * @returns {boolean}
 */
export function isLeadStale(lead, days = 14) {
  if (!lead.statusChangedAt) return false
  if (['WON', 'LOST'].includes(lead.status)) return false
  const threshold = new Date()
  threshold.setDate(threshold.getDate() - days)
  return new Date(lead.statusChangedAt) < threshold
}

/**
 * Get number of days since last contact
 * @param {object} lead - Lead document
 * @returns {number|null} Days since contact, or null if never contacted
 */
export function getDaysSinceContact(lead) {
  if (!lead.lastContactAt) return null
  const now = new Date()
  const lastContact = new Date(lead.lastContactAt)
  return Math.floor((now - lastContact) / (1000 * 60 * 60 * 24))
}

/**
 * Get number of days since status change
 * @param {object} lead - Lead document
 * @returns {number|null} Days since status change, or null if never changed
 */
export function getDaysSinceStatusChange(lead) {
  if (!lead.statusChangedAt) return null
  const now = new Date()
  const statusChanged = new Date(lead.statusChangedAt)
  return Math.floor((now - statusChanged) / (1000 * 60 * 60 * 24))
}

/**
 * Check if lead has overdue next action
 * @param {object} lead - Lead document
 * @returns {boolean}
 */
export function isNextActionOverdue(lead) {
  if (!lead.nextActionAt) return false
  if (['WON', 'LOST'].includes(lead.status)) return false
  return new Date(lead.nextActionAt) < new Date()
}

/**
 * Calculate lead score based on settings weights
 * @param {object} lead - Lead data
 * @param {object} weights - Scoring weights from settings
 * @returns {number} Score between 0-100
 */
export function calculateLeadScore(lead, weights = {}) {
  let score = 0

  // Budget scoring
  if (lead.budget != null) {
    if (lead.budget > 10000) {
      score += weights.budgetHigh || 30
    } else if (lead.budget >= 1000) {
      score += weights.budgetMedium || 15
    } else if (lead.budget > 0) {
      score += weights.budgetLow || 5
    }
  }

  // Source scoring
  if (lead.source) {
    const sourceLower = lead.source.toLowerCase()
    if (sourceLower === 'referral') {
      score += weights.sourceReferral || 25
    } else if (sourceLower === 'ads') {
      score += weights.sourceAds || 15
    } else {
      score += weights.sourceOther || 10
    }
  }

  // Priority scoring
  if (lead.priority) {
    if (lead.priority === 'URGENTE') {
      score += weights.priorityUrgent || 20
    } else if (lead.priority === 'HAUTE') {
      score += weights.priorityHigh || 15
    } else if (lead.priority === 'NORMALE') {
      score += weights.priorityNormal || 5
    }
  }

  // Contact info scoring
  if (lead.contactEmail && lead.contactEmail.trim()) {
    score += weights.hasEmail || 10
  }
  if (lead.contactPhone && lead.contactPhone.trim()) {
    score += weights.hasPhone || 10
  }

  // Cap at 100
  return Math.min(score, 100)
}

/**
 * Check for duplicate leads
 * @param {object} leadData - Lead data to check
 * @param {object} settings - CRM settings
 * @param {string} excludeId - Lead ID to exclude (for updates)
 * @returns {Promise<Array>} Array of potential duplicates
 */
export async function checkDuplicateLead(leadData, settings, excludeId = null) {
  const conditions = []

  if (settings.duplicateCheckEmail && leadData.contactEmail && leadData.contactEmail.trim()) {
    conditions.push({ contactEmail: { $regex: new RegExp(`^${escapeRegex(leadData.contactEmail.trim())}$`, 'i') } })
  }

  if (settings.duplicateCheckCompany && leadData.company && leadData.company.trim()) {
    conditions.push({ company: { $regex: new RegExp(`^${escapeRegex(leadData.company.trim())}$`, 'i') } })
  }

  if (settings.duplicateCheckPhone && leadData.contactPhone && leadData.contactPhone.trim()) {
    // Normalize phone for comparison (remove spaces, dashes, etc.)
    const normalizedPhone = leadData.contactPhone.replace(/[\s\-\.\(\)]/g, '')
    if (normalizedPhone.length >= 8) {
      conditions.push({ 
        contactPhone: { $regex: new RegExp(escapeRegex(normalizedPhone).replace(/^0/, '(0|\\+33)'), 'i') } 
      })
    }
  }

  if (conditions.length === 0) return []

  const query = { $or: conditions }
  if (excludeId) {
    query._id = { $ne: excludeId }
  }

  const duplicates = await Lead.find(query).select('company contactName contactEmail contactPhone status').limit(10)
  return duplicates
}

/**
 * Get days since lead was updated (for escalation)
 * @param {object} lead - Lead document
 * @returns {number} Days since last update
 */
export function getDaysSinceUpdate(lead) {
  if (!lead.updatedAt) return 0
  const now = new Date()
  const updated = new Date(lead.updatedAt)
  return Math.floor((now - updated) / (1000 * 60 * 60 * 24))
}

/**
 * Get days overdue for next action
 * @param {object} lead - Lead document
 * @returns {number} Days overdue (0 if not overdue)
 */
export function getDaysOverdue(lead) {
  if (!lead.nextActionAt) return 0
  const now = new Date()
  const nextAction = new Date(lead.nextActionAt)
  if (nextAction >= now) return 0
  return Math.floor((now - nextAction) / (1000 * 60 * 60 * 24))
}

// Helper to escape regex special characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
