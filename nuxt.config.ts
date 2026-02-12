import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  modules: [
    '@nuxtjs/color-mode',
    '@nuxt/icon',
    '@nuxt/content',
    'shadcn-nuxt',
    '@vueuse/nuxt',
    'motion-v/nuxt',
    '@tresjs/nuxt',
  ],
  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  app: {
    head: {
      title: 'nxui - Animated Vue Components',
      meta: [
        {
          name: 'description',
          content:
            'Beautiful animated components for Vue. Built with Tailwind CSS and motion-v. Copy, paste, and ship.',
        },
        { name: 'theme-color', content: '#000000' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'dark',
  },

  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: 'github-dark',
            dark: 'github-dark',
            light: 'github-light',
          },
          langs: ['vue', 'typescript', 'bash', 'json', 'css'],
        },
      },
    },
  },

  compatibilityDate: '2025-01-06',

  nitro: {
    preset: 'cloudflare-pages',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
});
