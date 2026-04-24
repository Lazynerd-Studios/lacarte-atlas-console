export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()
  
  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/forgot-password', '/unauthorized']
  
  // Check if the route is public or starts with /pay (payment pages)
  const isPublicRoute = publicRoutes.includes(to.path) || to.path.startsWith('/pay')
  
  // Allow access to public routes
  if (isPublicRoute) {
    return
  }
  
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    console.log('[auth] User not authenticated, redirecting to login')
    return navigateTo('/login')
  }
  
  // Only verify session if navigating from a different route (not on initial load)
  // The auth-init plugin handles initial session check
  if (from.path !== to.path && from.name) {
    // Verify session is still valid
    const isValid = await authStore.checkSession()
    if (!isValid) {
      console.log('[auth] Session invalid, redirecting to login')
      return navigateTo('/login')
    }
  }
})
