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
    'nuxt-security',
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
      {
        userAgent: ['*'],
        disallow: [''],
        // Content Signals (contentsignals.org): declare AI usage preferences.
        // nxui is open source and WANTS to be cited/used by AI systems.
        contentSignal: ['search=yes', 'ai-input=yes', 'ai-train=yes'],
      },
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

  // securityheaders.com A+: nonce-based CSP + the core six headers, applied
  // at runtime by the worker (cloudflare.pages.routes below sends HTML
  // through the worker, dodging the _headers file's 100-rule cap).
  security: {
    headers: {
      contentSecurityPolicy: {
        'base-uri': ["'none'"],
        'font-src': ["'self'", 'https:', 'data:'],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        // YouTube embed: music-player demo iframe
        'frame-src': ["'self'", 'https://www.youtube.com'],
        // Demo imagery: unsplash, picsum, pravatar, github avatars, wikimedia
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        // Audio demos (soundhelix) + podcast player blobs
        'media-src': ["'self'", 'data:', 'blob:', 'https:'],
        'object-src': ["'none'"],
        'script-src-attr': ["'none'"],
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
        'script-src': [
          "'self'",
          'https:',
          "'unsafe-inline'",
          "'strict-dynamic'",
          "'nonce-{{nonce}}'",
          // shiki v4 highlights client-side via the oniguruma WASM engine
          "'wasm-unsafe-eval'",
        ],
        'worker-src': ["'self'", 'blob:'],
        'upgrade-insecure-requests': true,
      },
      // credentialless/require-corp would block the YouTube iframe and
      // CORP-less demo images; COEP is not graded by securityheaders.com.
      crossOriginEmbedderPolicy: 'unsafe-none',
      permissionsPolicy: {
        // reflective-card demo uses the webcam; model-viewer can fullscreen
        camera: ['self'],
        'display-capture': [],
        fullscreen: ['self'],
        geolocation: [],
        microphone: [],
      },
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubdomains: true,
        preload: true,
      },
    },
    // In-memory rate limiting crashes on Cloudflare Pages (nuxt-security#137)
    // and is meaningless on stateless workers.
    rateLimiter: false,
    // Registry JSON + og assets are fetched cross-origin by external tools
    // (shadcn-vue CLI, social crawlers); locking CORS to the site URL breaks
    // them.
    corsHandler: false,
    // MCP tool-call bodies legitimately contain component source snippets
    // ("<script setup>") that the XSS validator would reject with a 400.
    xssValidator: false,
    // All HTML is worker-routed (cloudflare.pages.routes below), so runtime
    // nonce CSP covers every page; SSG hash CSP would conflict with the
    // per-request nonces and blow Cloudflare's 100-rule _headers cap.
    ssg: false,
    // SRI breaks hydration behind Cloudflare's immutable edge cache: Vite
    // injects __vite__mapDeps after content-hash naming, so a chunk filename
    // can carry different bytes across deploys and the stale cached variant
    // fails the integrity check (resource blocked, app init fails).
    sri: false,
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
    // Static-layer security headers: Nitro bakes routeRules headers into
    // dist/_headers, which Cloudflare Pages applies to static-served
    // responses (prerendered docs pages, assets). Worker-served HTML gets
    // its CSP replaced at runtime by nuxt-security's per-request nonce
    // version; static files keep this 'unsafe-inline' CSP since their
    // build-time inline scripts (and Cloudflare edge-injected challenge
    // scripts) cannot carry a per-request nonce.
    '/**': {
      headers: {
        'Content-Security-Policy':
          "base-uri 'none'; font-src 'self' https: data:; form-action 'self'; frame-ancestors 'none'; frame-src 'self' https://www.youtube.com; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; object-src 'none'; script-src 'self' https: 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' https: 'unsafe-inline'; worker-src 'self' blob:; upgrade-insecure-requests",
        'Permissions-Policy':
          'camera=(self), display-capture=(), fullscreen=(self), geolocation=(), microphone=()',
      },
    },
  },

  nitro: {
    preset: 'cloudflare-pages',
    prerender: {
      crawlLinks: true,
      failOnError: false,
      // Emit docs/foo.html instead of docs/foo/index.html so the static
      // layer serves the exact canonical URL with 200 instead of a 308
      // trailing-slash redirect.
      autoSubfolderIndex: false,
      // '/' intentionally excluded: prerendering it emits a 200 stub that
      // shadows the routeRules 301 above. Let the edge serve the redirect.
      routes: ['/robots.txt', ...docRoutes],
    },
    cloudflare: {
      nodeCompat: true,
      pages: {
        // Explicit include-list instead of the auto-generated exclude list,
        // which overflows Cloudflare's 100-rule cap with 362 prerendered
        // routes and randomly worker-routed most deep pages. Only the
        // homepage (scanner target: Link header, markdown negotiation,
        // nonce CSP) and the agent surfaces need the worker; every other
        // path is served from the prerendered static layer. Keeping
        // [...slug] pages static also sidesteps a workerd isolate-poisoning
        // bug where one catch-all SSR corrupts the unctx app context and
        // every later /docs SSR 500s (useColorMode state lost).
        defaultRoutes: false,
        routes: {
          include: ['/docs', '/docs/', '/mcp', '/.well-known/*', '/raw/*'],
          exclude: [],
        },
      },
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
