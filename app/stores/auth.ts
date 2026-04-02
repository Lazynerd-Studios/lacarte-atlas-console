export const useAuthStore = defineStore('auth', () => {
  const user = ref<Record<string, any> | null>(null)
  const token = ref<string | null>(null)
  const teamMember = ref<Record<string, any> | null>(null)
  let sessionCheckInterval: NodeJS.Timeout | null = null

  const isAuthenticated = computed(() => !!token.value)

  async function fetchTeamMemberProfile() {
    if (!token.value || !user.value) return
    
    // Check if user has a team member ID
    const teamMemberId = user.value.teamMemberId || user.value.id
    if (!teamMemberId) {
      console.warn('[auth] No team member ID found, skipping profile fetch')
      return
    }
    
    try {
      const config = useRuntimeConfig()
      const res = await fetch(`${config.public.apiBase}/team/${teamMemberId}`, {
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (res.ok) {
        const data = await res.json()
        teamMember.value = data
        // Merge team member role and permissions into user object
        if (user.value) {
          user.value.role = data.role || user.value.role
          user.value.permissions = data.permissions || []
        }
      }
    } catch (error) {
      console.error('[auth] Failed to fetch team member profile:', error)
    }
  }

  async function setAuth(userData: Record<string, any>, authToken: string) {
    user.value = userData
    token.value = authToken
    
    // Fetch team member profile to get role and permissions
    await fetchTeamMemberProfile()
    
    startSessionCheck()
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
          body: JSON.stringify({}),
        })
      } catch (error) {
        console.error('[auth] Sign out failed:', error)
      }
    }
    
    user.value = null
    token.value = null
    teamMember.value = null
  }

  // Initialize session check if already authenticated
  if (token.value) {
    startSessionCheck()
    // Fetch team member profile on store initialization
    fetchTeamMemberProfile()
  }

  return { user, token, teamMember, isAuthenticated, setAuth, checkSession, logout, fetchTeamMemberProfile }
}, {
  persist: true,
})
