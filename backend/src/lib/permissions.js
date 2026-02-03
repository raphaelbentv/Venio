export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'VIEWER']

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
}

const ROLE_PERMISSIONS = {
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

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(role)
}

export function hasPermission(role, permission) {
  const rolePermissions = ROLE_PERMISSIONS[role]
  if (!rolePermissions) return false
  return rolePermissions.has(permission)
}

export function getPermissionsForRole(role) {
  const rolePermissions = ROLE_PERMISSIONS[role]
  if (!rolePermissions) return []
  return Array.from(rolePermissions)
}
