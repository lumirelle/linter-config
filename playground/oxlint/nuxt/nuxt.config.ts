// The Nuxt build config, kept for the shape the example simulates. Neither Nuxt nor `@nuxt/eslint`
// is installed here, and the root dogfood config ignores this file, so nothing resolves or lints it.
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/test-utils/module',
    '@unocss/nuxt',
  ],

  app: {
    head: {
      htmlAttrs: { lang: 'en-US' },
      title: 'Nuxt playground example',
    },
  },

  compatibilityDate: '2026-10-18',
  future: { compatibilityVersion: 5 },
})
