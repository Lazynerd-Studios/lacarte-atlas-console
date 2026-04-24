export default defineNuxtPlugin(async (nuxtApp) => {
  const authStore = useAuthStore()
  const router = useRouter()

  // Add loading state
  const isCheckingAuth = ref(true)
  nuxtApp.provide('isCheckingAuth', isCheckingAuth)

  // Check session on app load if user is authenticated
  if (authStore.isAuthenticated) {
    console.log('[auth-init] Checking session on app load')
    const isValid = await authStore.checkSession()
    
    if (!isValid) {
      console.log('[auth-init] Session invalid, redirecting to login')
      await router.push('/login')
    } else {
      console.log('[auth-init] Session valid')
    }
  }

  // Mark auth check as complete
  isCheckingAuth.value = false
})
