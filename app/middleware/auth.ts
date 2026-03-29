export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const publicRoutes = ['/login', '/forgot-password']
  
  // If trying to access protected route
  if (!publicRoutes.includes(to.path)) {
    if (!authStore.isAuthenticated) {
      return navigateTo('/login')
    }
    
    // Verify session is still valid
    const isValid = await authStore.checkSession()
    if (!isValid) {
      return navigateTo('/login')
    }
  }
})
