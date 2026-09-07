// Augment Nuxt runtime config types so consumers don't need `as any` casts.
export {}

declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    apiBase: string
    tomtomApiKey: string
    sessionDurationMinutes: number
    sessionWarningSeconds: number
    sessionCheckIntervalMinutes: number
  }
}
