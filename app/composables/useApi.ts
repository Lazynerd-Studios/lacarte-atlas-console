export function useApi() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const router = useRouter()
  const { run } = useErrorHandler()

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`
    }

    const fullUrl = `${config.public.apiBase}${path}`
    console.log('[useApi] Making request', {
      method: options.method || 'GET',
      path,
      fullUrl,
      hasAuth: !!authStore.token,
    })

    const res = await fetch(fullUrl, {
      ...options,
      headers,
    })

    console.log('[useApi] Response received', {
      path,
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
    })

    if (res.status === 401) {
      console.log('[useApi] 401 Unauthorized - logging out and redirecting to login')
      await authStore.logout()
      await router.push('/login')
      throw new Error('Session expired. Please log in again.')
    }

    if (!res.ok) {
      let detail: string | undefined
      try { detail = (await res.clone().json()).message } catch {}
      console.error('[useApi] Request failed', {
        path,
        status: res.status,
        detail,
      })
      throw new Error(detail ?? `Request failed (${res.status})`)
    }

    const text = await res.text()
    const result = text ? JSON.parse(text) : (null as unknown as T)
    console.log('[useApi] Request successful', {
      path,
      hasData: !!result,
    })
    return result
  }

  // Wrapped versions auto-show error toasts on failure and return null
  return {
    get:  <T>(path: string, title?: string) =>
      run(() => request<T>(path), title ?? 'Failed to load data'),
    post: <T>(path: string, body: unknown, title?: string) =>
      run(() => request<T>(path, { method: 'POST', body: JSON.stringify(body) }), title ?? 'Request failed'),
    put:  <T>(path: string, body: unknown, title?: string) =>
      run(() => request<T>(path, { method: 'PUT',  body: JSON.stringify(body) }), title ?? 'Update failed'),
    patch: <T>(path: string, body: unknown, title?: string) =>
      run(() => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }), title ?? 'Update failed'),
    del:  <T>(path: string, title?: string) =>
      run(() => request<T>(path, { method: 'DELETE' }), title ?? 'Delete failed'),
    // Raw request for cases where the caller wants to handle errors themselves
    request,
  }
}
