import type { AuthUser, AuthRole } from '~/types/auth'

/**
 * Normalize a user's role to a lowercase, underscore-free string.
 * Handles both `string` and `AuthRole` object shapes.
 */
export function normalizeRole(role: string | AuthRole | undefined): string {
  const raw = typeof role === 'string' ? role : role?.name ?? ''
  return raw.toLowerCase().replace(/_/g, ' ').trim()
}

/**
 * Check if the given normalized role is an admin-level role.
 */
export function isAdminRole(normalizedRole: string): boolean {
  return normalizedRole === 'super admin' || normalizedRole === 'admin'
}

/**
 * Check whether a user is an admin (Super Admin or Admin).
 */
export function userIsAdmin(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  return isAdminRole(normalizeRole(user.role))
}

/**
 * Extract permission strings from a user object.
 */
export function getUserPermissions(user: AuthUser | null | undefined): string[] {
  if (!user) return []
  return user.permissions ?? []
}

/**
 * Check if a user has a specific permission.
 * Admins implicitly have all permissions.
 */
export function userHasPermission(
  user: AuthUser | null | undefined,
  permission: string,
): boolean {
  if (!user) return false
  if (userIsAdmin(user)) return true
  return getUserPermissions(user).includes(permission)
}

/**
 * Check if a user has a specific role (case-insensitive, handles underscores).
 */
export function userHasRole(
  user: AuthUser | null | undefined,
  roleName: string,
): boolean {
  if (!user) return false
  return normalizeRole(user.role) === roleName.toLowerCase().replace(/_/g, ' ').trim()
}
