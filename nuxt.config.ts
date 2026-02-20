export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxt/icon',
    '@nuxtjs/color-mode',
    [
      '@nuxtjs/plausible',
      {
        domain: 'nxui.geoql.in',
        apiHost: 'https://analytics.geoql.in',
        autoOutboundTracking: true,
      },
    ],
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    'motion-v/nuxt',
    'nuxt-og-image',
  ],

  colorMode: {
    preference: 'dark',
    classSuffix: '',
  },

  icon: {
    provider: 'iconify',
  },

  css: ['~/assets/css/main.css'],

  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  alias: {
    '@registry': '../registry',
  },

  ogImage: {
    defaults: {
      component: 'NxuiDoc',
    },
  },

  site: {
    name: 'nxui',
    description:
      'Beautiful animated components for Vue. Built with Tailwind CSS and motion-v.',
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
          langs: [
            'bash',
            'json',
            'js',
            'ts',
            'html',
            'css',
            'vue',
            'shell',
            'md',
            'yaml',
          ],
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
    prerender: {
      crawlLinks: true,
      routes: ['/'],
    },
    cloudflare: {
      nodeCompat: true,
      pages: {
        routes: {
          exclude: ['/docs/*'],
        },
      },
    },
    experimental: {
      wasm: true,
    },
    wasm: {
      esmImport: true,
      lazy: true,
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
