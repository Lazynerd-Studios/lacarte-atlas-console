export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: number
  type: ToastType
  title: string
  message?: string
  duration?: number
}

export function useAppToast() {
  // useState (not a module-level ref) so SSR renders do not share toast state
  // across requests, and each Nuxt app instance gets its own isolated store.
  // NOTE: keys are namespaced with an `app-` prefix to avoid colliding with
  // @nuxt/ui's built-in useToast(), which stores its queue under the same
  // "toasts" state key. A collision makes Nuxt UI's <Toaster> (mounted by
  // <UApp>) pick up our entries and re-render them as <UToast>, which rejects
  // our `type: 'success' | 'error' | ...` values (Radix expects
  // `foreground | background`) and logs prop-validation warnings.
  const toasts = useState<Toast[]>('app-toasts', () => [])
  const nextId = useState<number>('app-toast-next-id', () => 0)

  function show(type: ToastType, title: string, message?: string, duration = 4000) {
    const id = ++nextId.value
    toasts.value.push({ id, type, title, message, duration })

    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    toasts: readonly(toasts),
    dismiss,
    success: (title: string, message?: string, duration?: number) => show('success', title, message, duration),
    error:   (title: string, message?: string, duration?: number) => show('error',   title, message, duration),
    warning: (title: string, message?: string, duration?: number) => show('warning', title, message, duration),
    info:    (title: string, message?: string, duration?: number) => show('info',    title, message, duration),
  }
}
