import type { AuthUser, AuthRole, AuthTeamMember, ProfileResponse, SessionResponse } from '~/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(null)
  const teamMember = ref<AuthTeamMember | null>(null)
  const sessionExpiresAt = ref<number | null>(null)
  const showSessionWarning = ref(false)
  const sessionWarningTime = ref(0)
  let sessionWarningTimer: ReturnType<typeof setTimeout> | null = null
  let sessionExpiryTimer: ReturnType<typeof setTimeout> | null = null
  let sessionCheckTimer: ReturnType<typeof setTimeout> | null = null
  // Ticks once per second ONLY while the warning banner is visible (bounded
  // to the warning window) so the countdown stays live without always-on polling
  let sessionWarningTicker: ReturnType<typeof setInterval> | null = null

  const publicRoutes = ['/login', '/forgot-password', '/unauthorized']
  const isPublicRoute = (path: string) =>
    publicRoutes.includes(path) || path.startsWith('/pay')

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
        const response = (await res.json()) as ProfileResponse
        const data = response.data

        // Store the full profile data
        teamMember.value = data.admin

        // Merge admin role and permissions into user object
        if (user.value && data.admin) {
          user.value.role = data.admin.role?.name ?? user.value.role
          user.value.permissions = data.admin.permissions ?? []
        }
      }
    } catch (error) {
      console.error('[auth] Failed to fetch user profile:', error)
    }
  }

  function getSessionDurationMs(): number {
    const config = useRuntimeConfig()
    return (config.public.sessionDurationMinutes ?? 30) * 60 * 1000
  }

  function getSessionWarningSecs(): number {
    const config = useRuntimeConfig()
    return config.public.sessionWarningSeconds ?? 120
  }

  function getSessionCheckIntervalMs(): number {
    const config = useRuntimeConfig()
    return (config.public.sessionCheckIntervalMinutes ?? 5) * 60 * 1000
  }

  async function setAuth(userData: AuthUser, authToken: string) {
    // Normalize role to string immediately so all consumers get a consistent type
    user.value = userData
    if (user.value.role && typeof user.value.role !== 'string') {
      user.value.role = (user.value.role as AuthRole).name ?? ''
    }
    token.value = authToken

    // Set session expiry from runtime config
    sessionExpiresAt.value = Date.now() + getSessionDurationMs()

    // Fetch team member profile to get role and permissions
    await fetchTeamMemberProfile()

    startSessionCheck()
    startSessionWarningCheck()
  }

  function updateToken(newToken: string, updatedUser?: AuthUser) {
    token.value = newToken
    if (updatedUser) {
      user.value = updatedUser
      if (user.value.role && typeof user.value.role !== 'string') {
        user.value.role = (user.value.role as AuthRole).name ?? ''
      }
    }
    sessionExpiresAt.value = Date.now() + getSessionDurationMs()
    showSessionWarning.value = false
    startSessionCheck()
    startSessionWarningCheck()
  }

  async function refreshSession() {
    if (!token.value) return false

    try {
      // Use the existing get-session endpoint to refresh
      const isValid = await checkSession()

      if (isValid) {
        // Reset session expiry and reschedule the warning/expiry timers so a
        // stale timer from the previous expiry never logs the user out early
        sessionExpiresAt.value = Date.now() + getSessionDurationMs()
        showSessionWarning.value = false
        stopWarningTicker()
        scheduleSessionWarning()
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
    void refreshSession()
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
        const data = (await res.json()) as SessionResponse
        user.value = data.user
        // Refresh team member profile
        await fetchTeamMemberProfile()
        // Update session expiry and reschedule timers against the new expiry
        sessionExpiresAt.value = Date.now() + getSessionDurationMs()
        scheduleSessionWarning()
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
    scheduleSessionWarning()
  }

  function stopWarningTicker() {
    if (sessionWarningTicker) {
      clearInterval(sessionWarningTicker)
      sessionWarningTicker = null
    }
  }

  /** Live countdown while the warning banner is visible. */
  function startWarningTicker() {
    stopWarningTicker()
    sessionWarningTicker = setInterval(() => {
      if (!sessionExpiresAt.value) {
        stopWarningTicker()
        return
      }
      const remaining = Math.floor((sessionExpiresAt.value - Date.now()) / 1000)
      if (remaining <= 0) {
        // sessionExpiryTimer performs the actual logout; just stop ticking
        stopWarningTicker()
        return
      }
      sessionWarningTime.value = remaining
    }, 1000)
  }

  /** Shared expiry handler: log out and redirect unless on a public route. */
  function handleSessionExpiry() {
    stopWarningTicker()
    showSessionWarning.value = false
    void logout()
    if (import.meta.client) {
      const router = useRouter()
      const current = router.currentRoute.value.path
      if (!isPublicRoute(current)) router.push('/login')
    }
  }

  /** Schedules a single setTimeout for the warning and another for expiry. */
  function scheduleSessionWarning() {
    if (sessionWarningTimer) {
      clearTimeout(sessionWarningTimer)
      sessionWarningTimer = null
    }
    if (sessionExpiryTimer) {
      clearTimeout(sessionExpiryTimer)
      sessionExpiryTimer = null
    }
    stopWarningTicker()

    if (!sessionExpiresAt.value) return

    const now = Date.now()
    const timeUntilExpiry = sessionExpiresAt.value - now
    const warningSecs = getSessionWarningSecs()

    if (timeUntilExpiry <= 0) {
      // Already expired
      handleSessionExpiry()
      return
    }

    // Show warning `warningSecs` before expiry
    const timeUntilWarning = timeUntilExpiry - warningSecs * 1000

    if (timeUntilWarning <= 0) {
      // Already within warning window — show immediately and set expiry timer
      showSessionWarning.value = true
      sessionWarningTime.value = Math.floor(timeUntilExpiry / 1000)
      startWarningTicker()
      sessionExpiryTimer = setTimeout(handleSessionExpiry, timeUntilExpiry)
    } else {
      // Schedule warning to appear later
      sessionWarningTimer = setTimeout(() => {
        showSessionWarning.value = true
        sessionWarningTime.value = warningSecs
        startWarningTicker()
        // Once warning appears, schedule expiry
        sessionExpiryTimer = setTimeout(handleSessionExpiry, warningSecs * 1000)
      }, timeUntilWarning)
    }
  }

  function startSessionCheck() {
    // Clear any existing timer
    if (sessionCheckTimer) {
      clearTimeout(sessionCheckTimer)
      sessionCheckTimer = null
    }

    schedulePeriodicSessionCheck()
  }

  function schedulePeriodicSessionCheck() {
    // Use the first check to schedule the next one — avoids persistent interval
    const interval = getSessionCheckIntervalMs()
    sessionCheckTimer = setTimeout(function check() {
      console.log('[auth] Periodic session check')
      checkSession().finally(() => {
        if (token.value) {
          sessionCheckTimer = setTimeout(check, interval)
        }
      })
    }, interval)
  }

  function stopSessionCheck() {
    if (sessionCheckTimer) {
      clearTimeout(sessionCheckTimer)
      sessionCheckTimer = null
    }
    if (sessionWarningTimer) {
      clearTimeout(sessionWarningTimer)
      sessionWarningTimer = null
    }
    if (sessionExpiryTimer) {
      clearTimeout(sessionExpiryTimer)
      sessionExpiryTimer = null
    }
    stopWarningTicker()
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

    if (import.meta.client) {
      const router = useRouter()
      const current = router.currentRoute.value.path
      if (!isPublicRoute(current)) router.push('/login')
    }
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
    updateToken,
    checkSession,
    refreshSession,
    extendSession,
    dismissSessionWarning,
    logout,
    fetchTeamMemberProfile,
  }
}, {
  persist: {
    // sessionStorage keeps the token out of long-lived localStorage (XSS surface)
    // and the guard keeps SSR safe where sessionStorage does not exist
    storage: typeof sessionStorage !== 'undefined' ? sessionStorage : undefined,
  },
})
