export const useAuthStore = defineStore('auth', () => {
  const user = ref<Record<string, any> | null>(null)
  const token = ref<string | null>(null)
  let sessionCheckInterval: NodeJS.Timeout | null = null

  const isAuthenticated = computed(() => !!token.value)

  function setAuth(userData: Record<string, any>, authToken: string) {
    user.value = userData
    token.value = authToken
    startSessionCheck()
  }

  async function checkSession() {
    if (!token.value) return false
    
    try {
      const config = useRuntimeConfig()
      const res = await fetch(`${config.public.apiBase}/auth/session`, {
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (res.ok) {
        const data = await res.json()
        user.value = data.user
        return true
      } else {
        console.log('[auth] Session expired or invalid')
        await logout()
        return false
      }
    } catch (error) {
      console.error('[auth] Session check failed:', error)
      await logout()
      return false
    }
  }

  function startSessionCheck() {
    // Clear any existing interval
    if (sessionCheckInterval) {
      clearInterval(sessionCheckInterval)
    }
    
    // Check session every 5 minutes
    sessionCheckInterval = setInterval(async () => {
      console.log('[auth] Periodic session check')
      const isValid = await checkSession()
      if (!isValid) {
        const router = useRouter()
        router.push('/login')
      }
    }, 5 * 60 * 1000) // 5 minutes
  }

  function stopSessionCheck() {
    if (sessionCheckInterval) {
      clearInterval(sessionCheckInterval)
      sessionCheckInterval = null
    }
  }

  async function logout() {
    stopSessionCheck()
    
    if (token.value) {
      try {
        const config = useRuntimeConfig()
        await fetch(`${config.public.apiBase}/auth/sign-out`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.value}`,
            'Content-Type': 'application/json',
          },
        })
      } catch (error) {
        console.error('[auth] Sign out failed:', error)
      }
    }
    
    user.value = null
    token.value = null
  }

  // Initialize session check if already authenticated
  if (token.value) {
    startSessionCheck()
  }

  return { user, token, isAuthenticated, setAuth, checkSession, logout }
}, {
  persist: true,
})
