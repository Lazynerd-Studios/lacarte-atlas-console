/**
 * Normalize an unknown caught value into an `Error`, so `catch (e)` blocks can
 * stay strictly typed (`unknown`) instead of annotating the variable as `any`.
 */
export function asError(e: unknown): Error {
  if (e instanceof Error) return e
  if (typeof e === 'string') return new Error(e)
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return new Error((e as { message: string }).message)
  }
  return new Error('Unknown error')
}
