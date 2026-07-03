import { readdirSync, existsSync } from 'node:fs';
import { docsNav } from './app/config/docs';

const componentCount = readdirSync('registry/new-york', {
  withFileTypes: true,
}).filter((d) => d.isDirectory()).length;

// Build the prerender route list from docsNav, only including paths whose
// backing content/docs/{cat}/{slug}.md actually exists. This avoids
// aborting prerender on missing pages (createError 404 with fatal: true).
const docRoutes = docsNav
  .flatMap((g) => g.items.map((i: { path: string }) => i.path))
  .filter((p) => {
    if (p === '/docs') return true;
    const rel = p.replace(/^\/docs\//, '');
    return existsSync(`content/docs/${rel}.md`);
  });

export default defineNuxtConfig({
  modules: [
    [
      '@nuxt/content',
      {
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
    ],
    [
      '@nuxt/icon',
      {
        provider: 'iconify',
      },
    ],
    [
      '@nuxtjs/color-mode',
      {
        preference: 'dark',
        classSuffix: '',
      },
    ],
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
    // nuxt-og-image removed: Satori WASM crashes on CF Workers (issue #434)
    [
      '@nuxtjs/sitemap',
      {
        name: 'nxui',
        description:
          'Beautiful animated components for Vue. Built with Tailwind CSS and motion-v.',
        url: 'https://nxui.geoql.in',
      },
    ],
    '@nuxtjs/robots',
    'nuxt-schema-org',
    'nuxt-llms',
    [
      'shadcn-nuxt',
      {
        prefix: '',
        componentDir: './app/components/ui',
      },
    ],
  ],

  vite: {
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
    },
    optimizeDeps: {
      include: [
        'clsx',
        'reka-ui',
        'shiki/bundle/web',
        'tailwind-merge',
        'three',
        'v-tweakpane',
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  devtools: { enabled: false },

  future: {
    compatibilityVersion: 5,
  },

  alias: {
    '@registry': '../registry',
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: `Beautiful animated components for Vue. Built with Tailwind CSS and motion-v. ${componentCount}+ interactive, copy-paste components.`,
        },
        { name: 'apple-mobile-web-app-title', content: 'nxui' },
        {
          name: 'theme-color',
          content: '#111119',
          media: '(prefers-color-scheme: dark)',
        },
        {
          name: 'theme-color',
          content: '#ffffff',
          media: '(prefers-color-scheme: light)',
        },
        // Site-wide Open Graph + Twitter defaults: baseline social card for the
        // root + every route. Per-page useSeoMeta overrides title/description.
        {
          property: 'og:title',
          content: 'nxui — Copy-paste animated UI components for Vue',
        },
        {
          property: 'og:description',
          content: `Beautiful animated components for Vue. Built with Tailwind CSS and motion-v. ${componentCount}+ interactive, copy-paste components.`,
        },
        { property: 'og:image', content: 'https://nxui.geoql.in/og.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:url', content: 'https://nxui.geoql.in' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'nxui' },
        { name: 'twitter:card', content: 'summary_large_image' },
        {
          name: 'twitter:title',
          content: 'nxui — Copy-paste animated UI components for Vue',
        },
        {
          name: 'twitter:description',
          content: `Beautiful animated components for Vue. Built with Tailwind CSS and motion-v. ${componentCount}+ interactive, copy-paste components.`,
        },
        { name: 'twitter:image', content: 'https://nxui.geoql.in/og.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      noscript: [{ innerHTML: 'This application requires JavaScript.' }],
    },
  },

  llms: {
    domain: 'https://nxui.geoql.in',
    title: 'nxui',
    description: `Beautiful, interactive UI components you can copy and paste into your Vue apps. ${componentCount}+ animated, copy-paste components built with Vue 3, Tailwind CSS, and motion-v. Open source, free forever.`,
    full: {
      title: 'nxui — Full Component Documentation',
      description: `Complete documentation for all ${componentCount}+ nxui components, with usage, props, and source.`,
    },
  },

  // Shared site config consumed by @nuxtjs/robots, @nuxtjs/sitemap, and
  // nuxt-schema-org — single source of truth for the canonical URL + name.
  site: {
    url: 'https://nxui.geoql.in',
    name: 'nxui',
  },

  // GEO: explicitly allowlist AI crawlers. nxui is open source, so being
  // cited in AI answers is the goal. Google-Extended and Applebot-Extended
  // are block-by-default — without explicit allow rules nxui is invisible to
  // Google AI Overviews / Gemini and Apple Intelligence.
  robots: {
    groups: [
      { userAgent: ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot'], allow: ['/'] },
      {
        userAgent: [
          'ClaudeBot',
          'anthropic-ai',
          'Claude-Web',
          'Claude-User',
          'Claude-SearchBot',
        ],
        allow: ['/'],
      },
      { userAgent: ['PerplexityBot', 'Perplexity-User'], allow: ['/'] },
      { userAgent: ['Google-Extended'], allow: ['/'] },
      { userAgent: ['Applebot-Extended'], allow: ['/'] },
      {
        userAgent: [
          'CCBot',
          'Bytespider',
          'meta-externalagent',
          'FacebookBot',
          'cohere-ai',
        ],
        allow: ['/'],
      },
    ],
  },

  schemaOrg: {
    identity: 'Organization',
  },

  runtimeConfig: {
    public: {
      componentCount,
    },
  },

  compatibilityDate: '2025-07-18',

  // Edge 301 from bare root to /docs. Social crawlers don't run client-side
  // JS redirects, so a prerendered 200 stub at '/' leaves them with no OG
  // card; a real HTTP 301 is followed to the tagged /docs page.
  routeRules: {
    '/': { redirect: { to: '/docs', statusCode: 301 } },
  },

  nitro: {
    preset: 'cloudflare-pages',
    prerender: {
      crawlLinks: true,
      failOnError: false,
      // '/' intentionally excluded: prerendering it emits a 200 stub that
      // shadows the routeRules 301 above. Let the edge serve the redirect.
      routes: ['/robots.txt', ...docRoutes],
    },
    cloudflare: {
      nodeCompat: true,
    },
    experimental: {
      wasm: true,
    },
    wasm: {
      esmImport: true,
      lazy: true,
      silent: true,
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
