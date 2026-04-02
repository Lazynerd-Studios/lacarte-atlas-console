export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware for public routes
  const publicRoutes = ['/login', '/forgot-password']
  if (publicRoutes.includes(to.path)) {
    return
  }

  const authStore = useAuthStore()

  // If not authenticated, redirect to login
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  // Check if user exists and has necessary data
  if (!authStore.user) {
    return navigateTo('/login')
  }

  // Admin and Super Admin have access to everything (case-insensitive)
  const userRole = (authStore.user.role?.name || authStore.user.role || '').toLowerCase()
  if (userRole === 'super admin' || userRole === 'admin') {
    return
  }

  // Helper function to check permission
  const hasPermission = (permission: string): boolean => {
    const permissions = authStore.user?.permissions || []
    return permissions.includes(permission)
  }

  // Define route permission mappings
  const routePermissions: Record<string, string> = {
    '/customers': 'customers.view',
    '/drivers': 'drivers.view',
    '/trucks': 'drivers.view',
    '/pickups': 'pickups.view',
    '/tracking': 'tracking.view',
    '/billing': 'billing.view',
    '/shop': 'shop.view',
    '/inventory': 'inventory.view',
    '/support': 'support.view',
    '/team': 'team.view',
    '/reports': 'reports.view',
    '/management': 'management.view',
    '/comms': 'communications.send',
  }

  // Check if route requires permission
  for (const [route, permission] of Object.entries(routePermissions)) {
    if (to.path.startsWith(route)) {
      if (!hasPermission(permission)) {
        // Redirect to dashboard with error message
        return navigateTo('/')
      }
    }
  }
})
