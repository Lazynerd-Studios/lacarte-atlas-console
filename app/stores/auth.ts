export const useAuthStore = defineStore('auth', () => {
  const user = ref<Record<string, any> | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  function setAuth(userData: Record<string, any>, authToken: string) {
    user.value = userData
    token.value = authToken
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
        logout()
        return false
      }
    } catch (error) {
      console.error('[auth] Session check failed:', error)
      logout()
      return false
    }
  }

  async function logout() {
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

  return { user, token, isAuthenticated, setAuth, checkSession, logout }
}, {
  persist: true,
})
