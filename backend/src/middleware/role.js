import { hasPermission, isAdminRole } from '../lib/permissions.js'

export default function requireRole(role) {
  return function roleMiddleware(req, res, next) {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    return next()
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || !isAdminRole(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  return next()
}

export function requirePermission(permission) {
  return function permissionMiddleware(req, res, next) {
    if (!req.user || !hasPermission(req.user.role, permission)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    return next()
  }
}

export function requireAnyPermission(permissions = []) {
  return function permissionMiddleware(req, res, next) {
    if (!req.user || !permissions.some((permission) => hasPermission(req.user.role, permission))) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    return next()
  }
}
