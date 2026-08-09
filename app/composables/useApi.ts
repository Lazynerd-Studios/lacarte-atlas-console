import type { SignInResponse } from '~/types/auth'

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

    // no-store: admin data (KPIs, stats, lists) must always be fresh —
    // heuristic browser caching of repeated GET URLs otherwise serves
    // stale values after creates/status updates.
    const res = await fetch(fullUrl, {
      cache: 'no-store',
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

    // Read response body once
    const text = await res.text()

    // Treat 200, 201, and 204 as success responses
    const isSuccess = res.status === 200 || res.status === 201 || res.status === 204

    if (!isSuccess) {
      let detail: string | undefined
      if (text) {
        try { detail = JSON.parse(text)?.message } catch {}
      }
      console.error('[useApi] Request failed', {
        path,
        status: res.status,
        detail,
      })
      throw new Error(detail ?? `Request failed (${res.status})`)
    }

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
    // Typed auth helper
    signIn: (email: string, password: string, rememberMe = false) =>
      request<SignInResponse>('/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe }),
      }),
    // Raw request for cases where the caller wants to handle errors themselves
    request,
  }
}
