import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxt/icon',
    '@nuxtjs/color-mode',
    '@vueuse/nuxt',
    'motion-v/nuxt',
  ],

  colorMode: {
    preference: 'dark',
    classSuffix: '',
  },

  icon: {
    provider: 'iconify',
  },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

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
    url: 'https://nxui.geoql.in',
  },

  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            light: 'material-theme-lighter',
            default: 'material-theme',
            dark: 'material-theme-palenight',
          },
          langs: ['bash', 'json', 'js', 'ts', 'html', 'css', 'vue', 'shell', 'md', 'yaml'],
        },
      },
    },
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
