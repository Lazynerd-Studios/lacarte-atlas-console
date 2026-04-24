export const useAuthStore = defineStore('auth', () => {
  const user = ref<Record<string, any> | null>(null)
  const token = ref<string | null>(null)
  const teamMember = ref<Record<string, any> | null>(null)
  const sessionExpiresAt = ref<number | null>(null)
  const showSessionWarning = ref(false)
  const sessionWarningTime = ref(0)
  let sessionCheckInterval: NodeJS.Timeout | null = null
  let sessionWarningInterval: NodeJS.Timeout | null = null

  const isAuthenticated = computed(() => !!token.value)

  async function fetchTeamMemberProfile() {
    if (!token.value || !user.value) return
    
    try {
      const config = useRuntimeConfig()
      const res = await fetch(`${config.public.apiBase}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (res.ok) {
        const response = await res.json()
        const data = response.data
        
        // Store the full profile data
        teamMember.value = data.admin
        
        // Merge admin role and permissions into user object
        if (user.value && data.admin) {
          user.value.role = data.admin.role?.name || user.value.role
          user.value.permissions = data.admin.permissions || []
        }
      }
    } catch (error) {
      console.error('[auth] Failed to fetch user profile:', error)
    }
  }

  async function setAuth(userData: Record<string, any>, authToken: string) {
    user.value = userData
    token.value = authToken
    
    // Set session expiry (30 minutes from now)
    sessionExpiresAt.value = Date.now() + (30 * 60 * 1000)
    
    // Fetch team member profile to get role and permissions
    await fetchTeamMemberProfile()
    
    startSessionCheck()
    startSessionWarningCheck()
  }

  async function refreshSession() {
    if (!token.value) return false
    
    try {
      // Use the existing get-session endpoint to refresh
      const isValid = await checkSession()
      
      if (isValid) {
        // Reset session expiry
        sessionExpiresAt.value = Date.now() + (30 * 60 * 1000)
        showSessionWarning.value = false
        console.log('[auth] Session refreshed successfully')
        return true
      } else {
        console.log('[auth] Session refresh failed')
        return false
      }
    } catch (error) {
      console.error('[auth] Session refresh error:', error)
      return false
    }
  }

  function extendSession() {
    refreshSession()
  }

  function dismissSessionWarning() {
    showSessionWarning.value = false
  }

  async function checkSession() {
    if (!token.value) return false
    
    try {
      const config = useRuntimeConfig()
      const res = await fetch(`${config.public.apiBase}/auth/get-session`, {
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (res.ok) {
        const data = await res.json()
        user.value = data.user
        // Refresh team member profile
        await fetchTeamMemberProfile()
        // Update session expiry
        sessionExpiresAt.value = Date.now() + (30 * 60 * 1000)
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

  function startSessionWarningCheck() {
    // Clear any existing interval
    if (sessionWarningInterval) {
      clearInterval(sessionWarningInterval)
    }
    
    // Check every second if we should show warning
    sessionWarningInterval = setInterval(() => {
      if (!sessionExpiresAt.value) return
      
      const timeRemaining = Math.floor((sessionExpiresAt.value - Date.now()) / 1000)
      
      // Show warning 2 minutes before expiry
      if (timeRemaining <= 120 && timeRemaining > 0) {
        showSessionWarning.value = true
        sessionWarningTime.value = timeRemaining
      } else if (timeRemaining <= 0) {
        // Session expired
        showSessionWarning.value = false
        logout()
      } else {
        showSessionWarning.value = false
      }
    }, 1000)
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
    if (sessionWarningInterval) {
      clearInterval(sessionWarningInterval)
      sessionWarningInterval = null
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
          body: JSON.stringify({}),
        })
      } catch (error) {
        console.error('[auth] Sign out failed:', error)
      }
    }
    
    user.value = null
    token.value = null
    teamMember.value = null
    sessionExpiresAt.value = null
    showSessionWarning.value = false
    sessionWarningTime.value = 0
  }

  // Initialize session check if already authenticated
  if (token.value) {
    startSessionCheck()
    startSessionWarningCheck()
    // Fetch team member profile on store initialization
    fetchTeamMemberProfile()
  }

  return { 
    user, 
    token, 
    teamMember, 
    sessionExpiresAt,
    showSessionWarning,
    sessionWarningTime,
    isAuthenticated, 
    setAuth, 
    checkSession, 
    refreshSession,
    extendSession,
    dismissSessionWarning,
    logout, 
    fetchTeamMemberProfile 
  }
}, {
  persist: true,
})
