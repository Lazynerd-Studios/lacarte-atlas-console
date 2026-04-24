export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware for public routes, payment pages, and unauthorized page
  const publicRoutes = ['/login', '/forgot-password', '/unauthorized']
  const isPublicRoute = publicRoutes.includes(to.path) || to.path.startsWith('/pay')
  
  if (isPublicRoute) {
    return
  }

  const authStore = useAuthStore()

  // Auth middleware handles authentication, so we only check permissions here
  if (!authStore.isAuthenticated || !authStore.user) {
    // Let auth middleware handle this
    return
  }

  // Admin and Super Admin have access to everything (case-insensitive, handle underscores)
  const userRole = (authStore.user.role?.name || authStore.user.role || '').toLowerCase().replace(/_/g, ' ')
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
        console.log(`[permissions] Access denied to ${to.path} - missing permission: ${permission}`)
        // Redirect to unauthorized page
        return navigateTo('/unauthorized')
      }
    }
  }
})
