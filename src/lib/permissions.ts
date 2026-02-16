import type { Permission, User, UserRole } from '../types/auth.types'

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'VIEWER'] as const

export const PERMISSIONS = {
  MANAGE_ADMINS: 'manage_admins',
  MANAGE_CLIENTS: 'manage_clients',
  VIEW_CRM: 'view_crm',
  MANAGE_CRM: 'manage_crm',
  VIEW_PROJECTS: 'view_projects',
  EDIT_PROJECTS: 'edit_projects',
  VIEW_CONTENT: 'view_content',
  EDIT_CONTENT: 'edit_content',
  VIEW_BILLING: 'view_billing',
  MANAGE_BILLING: 'manage_billing',
} as const

const ROLE_PERMISSIONS: Record<string, Set<string>> = {
  SUPER_ADMIN: new Set(Object.values(PERMISSIONS)),
  ADMIN: new Set([
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CRM,
    PERMISSIONS.MANAGE_CRM,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.EDIT_PROJECTS,
    PERMISSIONS.VIEW_CONTENT,
    PERMISSIONS.EDIT_CONTENT,
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.MANAGE_BILLING,
  ]),
  VIEWER: new Set([PERMISSIONS.VIEW_PROJECTS, PERMISSIONS.VIEW_CONTENT, PERMISSIONS.VIEW_BILLING]),
  CLIENT: new Set([]),
}

export function isAdminRole(role: string): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role)
}

export function getPermissionsForRole(role: string): string[] {
  const rolePermissions = ROLE_PERMISSIONS[role]
  if (!rolePermissions) return []
  return Array.from(rolePermissions)
}

export function resolveUserPermissions(user: User | null): string[] {
  if (!user) return []
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions
  }
  return getPermissionsForRole(user.role)
}

export function hasPermission(user: User | null, permission: string): boolean {
  const permissions = resolveUserPermissions(user)
  return permissions.includes(permission)
}
