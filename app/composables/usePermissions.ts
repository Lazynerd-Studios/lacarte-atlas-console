import { userIsAdmin, userHasPermission, userHasRole } from '~/utils/auth'

export const usePermissions = () => {
  const authStore = useAuthStore()

  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    return userHasPermission(authStore.user, permission)
  }

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  // Check if user has all of the specified permissions
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  // Check if user has a specific role (case-insensitive, handles underscores)
  const hasRole = (roleName: string): boolean => {
    return userHasRole(authStore.user, roleName)
  }

  // Check if user has any of the specified roles
  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role))
  }

  // Check if user is super admin or admin
  const isSuperAdmin = computed(() => userIsAdmin(authStore.user))

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
  }
}
