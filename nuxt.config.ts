// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
  ],
  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
  colorMode: {
    preference: 'light',
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://lacarte.lazynerdstudios.com/api',
      tomtomApiKey: process.env.NUXT_PUBLIC_TOMTOM_API_KEY || '',
    },
  },
  router: {
    options: {
      strict: false,
    },
  },
  vite: {
    build: { target: 'esnext' },
    optimizeDeps: { esbuildOptions: { target: 'esnext' } },
  },
  routeRules: {
    '/login': { ssr: false },
    '/forgot-password': { ssr: false },
    '/pay/**': { ssr: false },
    '/tracking/**': { ssr: false },
  },
})
