/**
 * useErrorHandler — wraps async operations with automatic toast error feedback.
 *
 * Usage:
 *   const { run } = useErrorHandler()
 *   const data = await run(() => api.get('/customers'), 'Failed to load customers')
 *
 * Returns null on failure (after showing a toast) so callers can guard with `if (!data)`.
 */
export function useErrorHandler() {
  const toast = useAppToast()

  async function run<T>(
    fn: () => Promise<T>,
    errorTitle = 'Something went wrong',
    errorMessage?: string,
  ): Promise<T | null> {
    try {
      return await fn()
    } catch (err) {
      const message = errorMessage ?? (err instanceof Error ? err.message : undefined)
      toast.error(errorTitle, message)
      return null
    }
  }

  return { run }
}
