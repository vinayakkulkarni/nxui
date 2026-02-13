export default defineNuxtConfig({
  extends: ['docus'],

  modules: [
    '@vueuse/nuxt',
    'motion-v/nuxt',
  ],

  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  alias: {
    '@registry': '../registry',
  },

  site: {
    name: 'nxui',
    description: 'Beautiful animated components for Vue. Built with Tailwind CSS and motion-v.',
    url: 'https://nxui.dev',
  },

  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  content: {
    database: {
      type: 'd1',
      bindingName: 'DB',
    },
  },

  compatibilityDate: '2025-07-18',

  nitro: {
    preset: 'cloudflare-pages',
    cloudflare: {
      nodeCompat: true,
    },
    rollupConfig: {
      output: {
        generatedCode: {
          constBindings: true,
        },
      },
    },
    replace: {
      'process.stdout': 'undefined',
    },
  },
});
