export const useAuthStore = defineStore('auth', () => {
  const user = ref<Record<string, any> | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  function setAuth(userData: Record<string, any>, authToken: string) {
    user.value = userData
    token.value = authToken
  }

  function logout() {
    user.value = null
    token.value = null
  }

  return { user, token, isAuthenticated, setAuth, logout }
}, {
  persist: true,
})
