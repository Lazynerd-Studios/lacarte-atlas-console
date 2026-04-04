export const usePermissions = () => {
  const authStore = useAuthStore()

  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!authStore.user) return false
    
    // Admin and Super Admin have all permissions (case-insensitive, handle underscores)
    const userRole = (authStore.user.role?.name || authStore.user.role || '').toLowerCase().replace(/_/g, ' ')
    if (userRole === 'super admin' || userRole === 'admin') {
      return true
    }

    // Check if user has the specific permission
    const permissions = authStore.user.permissions || []
    return permissions.includes(permission)
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
    if (!authStore.user) return false
    const userRole = (authStore.user.role?.name || authStore.user.role || '').toLowerCase().replace(/_/g, ' ')
    const checkRole = roleName.toLowerCase().replace(/_/g, ' ')
    return userRole === checkRole
  }

  // Check if user has any of the specified roles
  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role))
  }

  // Check if user is super admin or admin
  const isSuperAdmin = computed(() => hasRole('Super Admin') || hasRole('Admin'))

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
  }
}
