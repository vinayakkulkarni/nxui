# Nuxt SEO Best Practices - Complete Reference

> This file is auto-generated. Do not edit directly.
> Edit individual rule files in the `rules/` directory and run `bun run build`.

# Nuxt SEO Best Practices

Comprehensive SEO optimization guide for Nuxt 4 applications deployed to Cloudflare Pages/Workers. Contains 11 rules across 4 categories, prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:

- Generating dynamic OG images on Cloudflare Workers
- Setting up page-level SEO meta tags and composables
- Adding JSON-LD structured data
- Configuring Nitro for Cloudflare Pages deployment
- Handling SSR-incompatible client-only libraries
- Setting up social sharing meta (Open Graph, Twitter Cards)
- Working with Satori for image generation (NEVER use React)

## Rule Categories by Priority

| Priority | Category                  | Impact   | Prefix    |
| -------- | ------------------------- | -------- | --------- |
| 1        | OG Image Generation       | CRITICAL | `og-`     |
| 2        | Page SEO & Meta           | HIGH     | `meta-`   |
| 3        | Structured Data           | MEDIUM   | `schema-` |
| 4        | Cloudflare & Nitro Config | HIGH     | `cf-`     |

## Quick Reference

### 1. OG Image Generation (CRITICAL)

- `og-cf-workers` - Generate dynamic OG images on Cloudflare Workers with @cf-wasm/og
- `og-no-react` - Use plain JS objects for Satori elements, NEVER React
- `og-cache-headers` - Cache OG images with immutable headers for CDN

### 2. Page SEO & Meta (HIGH)

- `meta-use-page-seo` - Reusable composable for consistent page-level SEO
- `meta-social-tags` - Proper Open Graph and Twitter Card meta tags
- `meta-canonical-url` - Canonical URLs and og:url for every page

### 3. Structured Data (MEDIUM)

- `schema-json-ld` - JSON-LD structured data in app.vue for Google Rich Results

### 4. Cloudflare & Nitro Config (HIGH)

- `cf-compatibility-date` - Pin compatibilityDate, never use 'latest'
- `cf-nitro-config` - Nitro config for CF Pages (nodeCompat, process.stdout, WASM)
- `cf-ssr-externals` - SSR external config for client-only libraries
- `cf-wasm-import` - WASM module configuration for Cloudflare Workers

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/og-cf-workers.md
rules/meta-use-page-seo.md
rules/_sections.md
```

Each rule file contains:

- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and Nuxt/Cloudflare-specific notes

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`

---

# Detailed Rules

### Pin compatibilityDate, Never Use 'latest'

**Impact:** HIGH - Prevents unpredictable Nitro behavior changes between builds

## Pin compatibilityDate, Never Use 'latest'

Nuxt's `compatibilityDate` controls which Nitro runtime behaviors are active. Using `'latest'` resolves to a different date on every build, which can silently change how your app behaves in production.

**Incorrect (using 'latest'):**

```typescript
// ❌ WRONG — 'latest' resolves to a different date on each build
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: 'latest',
  // Today it might be 2025-07-18, tomorrow 2025-07-19
  // Each date can change Nitro's internal behavior
});
```

**Correct (pinned date):**

```typescript
// ✅ CORRECT — Pinned to a specific date
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-18',
  // Consistent behavior across all builds
  // Update intentionally when you want new Nitro features
});
```

**When to update:**

- When upgrading Nuxt or Nitro versions
- When you need a specific Nitro feature that requires a newer date
- Always test after updating — some changes are breaking

**How to find the right date:**

- Use the date of your current Nuxt release
- Check [Nitro changelog](https://github.com/unjs/nitro/releases) for what changed
- Pin to the latest date that works with your deployment target

**Real-world impact:** A `compatibilityDate` change can affect:

- How `process.env` is handled in server routes
- WASM module loading behavior
- Node.js API compatibility layer
- Response header defaults

---

### Configure Nitro for Cloudflare Pages Deployment

**Impact:** HIGH - Ensures WASM support, Node.js compatibility, and proper builds on CF Pages

## Configure Nitro for Cloudflare Pages Deployment

Cloudflare Pages/Workers have specific requirements for WASM modules, Node.js APIs, and global objects. Without proper Nitro configuration, builds fail or runtime errors occur.

**Incorrect (minimal config):**

```typescript
// ❌ WRONG — Missing critical CF Workers config
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-pages',
  },
});
```

**Correct (full CF Pages config):**

```typescript
// ✅ CORRECT — Full Cloudflare Pages configuration
export default defineNuxtConfig({
  compatibilityDate: '2025-07-18',

  nitro: {
    preset: 'cloudflare-pages',
  },

  cloudflare: {
    // Enable Node.js API compatibility (Buffer, crypto, etc.)
    nodeCompat: true,
  },

  vite: {
    // Replace process.stdout (not available in CF Workers)
    define: {
      'process.stdout': 'undefined',
    },
    ssr: {
      // Externalize client-only libraries from server bundle
      external: ['posthog-js'],
    },
  },

  // WASM module support for @cf-wasm/og and similar packages
  nitro: {
    wasm: {
      esmImport: true,
      lazy: true,
    },
  },
});
```

**Configuration breakdown:**

| Setting                           | Why                                                                     |
| --------------------------------- | ----------------------------------------------------------------------- |
| `compatibilityDate: '2025-07-18'` | Pinned date — never use `'latest'`                                      |
| `cloudflare.nodeCompat: true`     | Enables `Buffer`, `crypto`, and other Node.js APIs on Workers           |
| `process.stdout: 'undefined'`     | `process.stdout` doesn't exist on Workers — some libraries reference it |
| `vite.ssr.external`               | Keeps client-only libraries out of the server bundle                    |
| `wasm.esmImport: true`            | Allows `import wasm from './file.wasm'` syntax                          |
| `wasm.lazy: true`                 | Lazy-loads WASM modules (required for CF Workers dynamic instantiation) |

**Common errors these settings fix:**

```
# Without nodeCompat:
ReferenceError: Buffer is not defined

# Without process.stdout replace:
TypeError: Cannot read properties of undefined (reading 'write')

# Without wasm config:
CompileError: WebAssembly.instantiate() is not allowed

# Without ssr.external for posthog-js:
Error: symbol 'a' already declared (esbuild on Linux CI)
```

**Note:** The `process.stdout` replacement and `wasm` config may need to be in the top-level `vite` and `nitro` keys respectively — check your Nuxt version for the correct placement.

Reference: [Nuxt Cloudflare Deployment](https://nuxt.com/deploy/cloudflare) | [Nitro Cloudflare Preset](https://nitro.unjs.io/deploy/providers/cloudflare)

---

### Externalize Client-Only Libraries from SSR Bundle

**Impact:** HIGH - Prevents server bundle contamination and esbuild errors on CI

## Externalize Client-Only Libraries from SSR Bundle

Client-only libraries (analytics, tracking, browser APIs) should never be bundled into the Nitro server entry. When they leak into the server bundle, they cause esbuild errors on CI (especially Linux) due to duplicate symbol declarations from minified code.

**Incorrect (client-only library leaks into server bundle):**

```typescript
// ❌ WRONG — @posthog/nuxt registers its vue-plugin for both client AND server
// This leaks ~4500 lines of minified posthog-js into the Nitro server bundle
// On Linux CI, esbuild@0.27+ errors with "symbol 'a' already declared"

export default defineNuxtConfig({
  modules: ['@posthog/nuxt'],
  // No vite.ssr.external — posthog-js is bundled into server entry
});
```

**Correct (externalize with vite.ssr.external):**

```typescript
// ✅ CORRECT — Externalize client-only libraries from server bundle
export default defineNuxtConfig({
  modules: ['@posthog/nuxt'],

  vite: {
    ssr: {
      // Keep posthog-js out of the Nitro server bundle
      // The module bug registers the vue-plugin without { mode: 'client' }
      external: ['posthog-js'],
    },
  },
});
```

**How to identify leaking libraries:**

1. **Build error on CI but not locally:** Different esbuild binaries (macOS vs Linux) have different strictness levels for duplicate declarations
2. **Check server entry size:** `wc -l .output/server/chunks/nitro/...` — if it's thousands of lines larger than expected, something leaked
3. **Search the server bundle:** `grep 'posthog' .output/server/` — if a client-only library appears, it leaked

**Common client-only libraries to externalize:**

```typescript
vite: {
  ssr: {
    external: [
      'posthog-js',       // PostHog analytics
      'hotjar',           // Hotjar tracking
      'intercom-client',  // Intercom chat widget
      // Add any library that uses window, document, or browser APIs
    ],
  },
},
```

**Root cause:** Some Nuxt modules register their Vue plugins for both client and server instead of using `{ mode: 'client' }`. This is a module bug, but the `vite.ssr.external` workaround is safe and reliable.

**Real error example:**

```
✘ [ERROR] The symbol "a" has already been declared
   .output/server/chunks/nitro/nitro.mjs:12345:6
```

This error appears on Linux CI (esbuild is stricter there) when minified client-only code with single-letter variables is merged into the Rollup server output.

---

### Configure WASM Module Imports for Cloudflare Workers

**Impact:** MEDIUM - Enables WASM-dependent packages like @cf-wasm/og to work on CF Workers

## Configure WASM Module Imports for Cloudflare Workers

WASM modules on Cloudflare Workers require specific Nitro configuration. Without it, `WebAssembly.instantiate()` calls fail because CF Workers restrict dynamic WASM compilation for security reasons. The `@cf-wasm/og` package (used for OG image generation) needs ESM WASM imports with lazy loading.

**Incorrect (no WASM config):**

```typescript
// ❌ WRONG — WASM modules fail with "WebAssembly.instantiate() is not allowed"
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-pages',
    // Missing wasm config
  },
});
```

**Correct (WASM ESM imports with lazy loading):**

```typescript
// ✅ CORRECT — Enable WASM for CF Workers
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-pages',
    wasm: {
      // Allow import wasm from './module.wasm' syntax
      esmImport: true,
      // Lazy-load WASM modules (required for CF Workers)
      lazy: true,
    },
  },
});
```

**Why lazy loading matters:**

Cloudflare Workers don't allow `WebAssembly.instantiate()` at the top level during cold start. With `lazy: true`, WASM modules are loaded on first use, which is allowed by the Workers runtime. Without it, the module tries to instantiate at import time and fails.

**Packages that require this config:**

- `@cf-wasm/og` — OG image generation (Satori + Resvg WASM)
- `@cf-wasm/photon` — Image manipulation
- Any package that ships `.wasm` files

**Combined with dynamic import:**

```typescript
// The WASM config enables this pattern in server routes:
const { ImageResponse } = await import('@cf-wasm/og/workerd');
// The 'workerd' subpath uses CF Workers-compatible WASM loading
```

**Testing note:** WASM-dependent routes won't work in local `nuxt dev` (Node.js runtime). Test on Cloudflare Workers preview (`wrangler pages dev`) or production deployment.

Reference: [Nitro WASM Support](https://nitro.unjs.io/guide/wasm) | [Cloudflare Workers WASM](https://developers.cloudflare.com/workers/runtime-apis/webassembly/)

---

### Set Canonical URLs and og:url on Every Page

**Impact:** HIGH - Prevents duplicate content penalties and ensures correct social sharing URLs

## Set Canonical URLs and og:url on Every Page

Every public page must have a `<link rel="canonical">` tag and an `og:url` meta tag pointing to the authoritative URL. Without these, search engines may index duplicate URLs (with/without trailing slashes, query params, etc.) and social platforms may display wrong URLs.

**Incorrect (missing canonical):**

```vue
<script setup lang="ts">
  // ❌ WRONG — No canonical URL, no og:url
  useSeoMeta({
    title: 'About Us',
    description: 'Learn about our team.',
    ogTitle: 'About Us',
    // Missing: ogUrl, canonical link
  });
</script>
```

**Correct (canonical + og:url):**

```vue
<script setup lang="ts">
  // ✅ CORRECT — Both canonical link and og:url
  const config = useRuntimeConfig();
  const baseUrl = config.public.baseUrl || 'https://example.com';
  const canonicalUrl = `${baseUrl}/about`;

  useHead({
    link: [{ rel: 'canonical', href: canonicalUrl }],
  });

  useSeoMeta({
    title: 'About Us',
    description: 'Learn about our team.',
    ogUrl: canonicalUrl,
    ogTitle: 'About Us',
    ogDescription: 'Learn about our team.',
    // ... rest of meta
  });
</script>
```

**Best practice — use the `usePageSeo` composable:**

```vue
<script setup lang="ts">
  // ✅ BEST — usePageSeo handles canonical and og:url automatically
  usePageSeo({
    title: 'About Us',
    description: 'Learn about our team.',
    path: '/about',
  });
</script>
```

**Runtime config setup:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || 'https://example.com',
    },
  },
});
```

**Key rules:**

- Canonical URL must be **absolute** (full URL with protocol and domain)
- Canonical URL should **not** include query parameters unless they change the page content
- Canonical URL should be **consistent** — pick either with or without trailing slash, never both
- `og:url` should match the canonical URL exactly

Reference: [Google Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)

---

### Set Complete Open Graph and Twitter Card Meta Tags

**Impact:** HIGH - Ensures rich social media previews on all platforms

## Set Complete Open Graph and Twitter Card Meta Tags

Social media platforms (Twitter, Facebook, LinkedIn, Discord, Slack) use Open Graph and Twitter Card meta tags to render link previews. Incomplete tags result in plain text links with no image or description.

**Incorrect (incomplete meta tags):**

```vue
<script setup lang="ts">
  // ❌ WRONG — Missing OG image dimensions, Twitter card, og:type
  useSeoMeta({
    title: 'My Page',
    ogTitle: 'My Page',
    ogImage: '/og/my-page.png',
    // Missing: ogType, ogUrl, ogDescription, ogImageWidth, ogImageHeight
    // Missing: twitterCard, twitterTitle, twitterDescription, twitterImage
  });
</script>
```

**Correct (complete social meta):**

```vue
<script setup lang="ts">
  // ✅ CORRECT — Full OG + Twitter Card meta
  useSeoMeta({
    title: 'My Page',
    description: 'Page description for search engines.',
    // Open Graph (Facebook, LinkedIn, Discord, Slack)
    ogType: 'website',
    ogUrl: 'https://example.com/my-page',
    ogTitle: 'My Page',
    ogDescription: 'Page description for social sharing.',
    ogImage: 'https://example.com/og/my-page.png',
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: 'My Page preview',
    ogSiteName: 'My App',
    // Twitter Card
    twitterCard: 'summary_large_image',
    twitterTitle: 'My Page',
    twitterDescription: 'Page description for Twitter.',
    twitterImage: 'https://example.com/og/my-page.png',
    twitterImageAlt: 'My Page preview',
  });
</script>
```

**Required meta tags checklist:**

| Tag                  | Purpose                             | Required    |
| -------------------- | ----------------------------------- | ----------- |
| `ogType`             | Content type (`website`, `article`) | Yes         |
| `ogUrl`              | Canonical URL                       | Yes         |
| `ogTitle`            | Title for social cards              | Yes         |
| `ogDescription`      | Description for social cards        | Yes         |
| `ogImage`            | **Full URL** to OG image            | Yes         |
| `ogImageWidth`       | Image width (1200)                  | Yes         |
| `ogImageHeight`      | Image height (630)                  | Yes         |
| `ogImageAlt`         | Image alt text                      | Recommended |
| `ogSiteName`         | Site name                           | Recommended |
| `twitterCard`        | Card type (`summary_large_image`)   | Yes         |
| `twitterTitle`       | Title for Twitter                   | Yes         |
| `twitterDescription` | Description for Twitter             | Yes         |
| `twitterImage`       | **Full URL** to image               | Yes         |

**Important notes:**

- OG image URL must be **absolute** (full URL with protocol and domain), not relative
- Use `summary_large_image` for Twitter cards — it shows the full-width image
- `ogImageWidth` and `ogImageHeight` help platforms render the correct aspect ratio without fetching the image first
- Use the `usePageSeo` composable (see `meta-use-page-seo` rule) to avoid duplicating this across pages

**Head meta that should be set globally in `nuxt.config.ts`:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0f0e17' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
});
```

Reference: [Open Graph Protocol](https://ogp.me/) | [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards)

---

### Create a Reusable usePageSeo Composable for Consistent Page SEO

**Impact:** HIGH - Ensures every page has consistent SEO meta without duplication

## Create a Reusable usePageSeo Composable for Consistent Page SEO

Instead of calling `useSeoMeta` and `useHead` separately on every page, create a single `usePageSeo` composable that sets canonical URL, Open Graph, Twitter Card, and OG image URL consistently.

**Incorrect (duplicating SEO logic on every page):**

```vue
<script setup lang="ts">
  // ❌ WRONG — Duplicated across every page, inconsistent, error-prone
  const config = useRuntimeConfig();
  const baseUrl = config.public.baseUrl;

  useSeoMeta({
    title: 'About Us',
    description: 'Learn about our team.',
    ogType: 'website',
    ogUrl: `${baseUrl}/about`,
    ogTitle: 'About Us',
    ogDescription: 'Learn about our team.',
    ogImage: `${baseUrl}/og/about.png?title=About%20Us`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    twitterCard: 'summary_large_image',
    twitterTitle: 'About Us',
    twitterDescription: 'Learn about our team.',
    twitterImage: `${baseUrl}/og/about.png?title=About%20Us`,
  });

  useHead({
    link: [{ rel: 'canonical', href: `${baseUrl}/about` }],
  });
</script>
```

**Correct (usePageSeo composable):**

```typescript
// ✅ CORRECT — app/composables/seo/use-page-seo.ts

export function usePageSeo(options: {
  title: string;
  description: string;
  path: string;
  ogDescription?: string;
  ogImageAlt?: string;
  robots?: string;
}) {
  const config = useRuntimeConfig();
  const baseUrl = config.public.baseUrl || 'https://example.com';

  const canonicalUrl = `${baseUrl}${options.path}`;
  const ogDesc = options.ogDescription ?? options.description;
  const ogImageAlt = options.ogImageAlt ?? options.title;

  // Dynamic OG image URL — served by server/routes/og/[...path].png.ts
  const ogImageUrl = `${baseUrl}/og${options.path}.png?title=${encodeURIComponent(options.title)}&description=${encodeURIComponent(ogDesc)}`;

  // Canonical link
  useHead({
    link: [{ rel: 'canonical', href: canonicalUrl }],
  });

  // Full SEO meta
  useSeoMeta({
    title: options.title,
    description: options.description,
    ...(options.robots ? { robots: options.robots } : {}),
    // Open Graph
    ogType: 'website',
    ogUrl: canonicalUrl,
    ogTitle: options.title,
    ogDescription: ogDesc,
    ogImage: ogImageUrl,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: ogImageAlt,
    ogSiteName: 'My App',
    // Twitter Card
    twitterCard: 'summary_large_image',
    twitterTitle: options.title,
    twitterDescription: ogDesc,
    twitterImage: ogImageUrl,
    twitterImageAlt: ogImageAlt,
  });
}
```

**Usage on pages:**

```vue
<script setup lang="ts">
  // ✅ Clean, consistent, one line per page
  usePageSeo({
    title: 'About Us',
    description: 'Learn about our team and mission.',
    path: '/about',
  });
</script>
```

**Composable file organization:**

```
app/composables/seo/
  use-page-seo.ts     # The composable
  index.ts             # Barrel export: export { usePageSeo } from './use-page-seo'
```

**Key features:**

- `ogDescription` defaults to `description` if not provided
- `ogImageAlt` defaults to `title` if not provided
- `robots` is optional — only set when needed (e.g., `'noindex'` for private pages)
- OG image URL is auto-generated from the path, pointing to the OG server route
- Canonical URL prevents duplicate content issues

Reference: [Nuxt useSeoMeta](https://nuxt.com/docs/api/composables/use-seo-meta)

---

### Cache OG Images with Immutable Headers

**Impact:** HIGH - Reduces server load and ensures fast social media card rendering

## Cache OG Images with Immutable Headers

OG images are fetched by social media crawlers (Twitter, Facebook, LinkedIn, Discord) every time a link is shared. Without caching, each share triggers a new image generation — expensive on Cloudflare Workers. Set immutable cache headers for CDN-level caching.

**Incorrect (no cache headers):**

```typescript
// ❌ WRONG — No cache headers, every request generates a new image
export default defineEventHandler(async (event) => {
  const { ImageResponse } = await import('@cf-wasm/og/workerd');
  const response = await ImageResponse.async(element, {
    width: 1200,
    height: 630,
  });
  const buffer = await response.arrayBuffer();

  setResponseHeaders(event, {
    'Content-Type': 'image/png',
    // Missing Cache-Control — image regenerated on every request
  });

  return Buffer.from(buffer);
});
```

**Correct (immutable caching):**

```typescript
// ✅ CORRECT — CDN caches for 1 year, immutable
export default defineEventHandler(async (event) => {
  const { ImageResponse } = await import('@cf-wasm/og/workerd');
  const response = await ImageResponse.async(element, {
    width: 1200,
    height: 630,
  });
  const buffer = await response.arrayBuffer();

  setResponseHeaders(event, {
    'Content-Type': 'image/png',
    'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
  });

  return Buffer.from(buffer);
});
```

**Cache header breakdown:**

- `public` — Cacheable by CDN and browsers
- `max-age=31536000` — Browser cache: 1 year (365 × 24 × 60 × 60)
- `s-maxage=31536000` — CDN/shared cache: 1 year
- `immutable` — Content will never change at this URL — no revalidation needed

**When to invalidate:** If OG image content changes (e.g., title update), change the URL by appending a version query parameter:

```typescript
const ogImageUrl = `${baseUrl}/og${path}.png?v=2&title=${encodeURIComponent(title)}`;
```

**Important:** OG image URLs include query params (title, description), so each unique combination gets its own cached entry. This is the correct behavior — different content = different cache key.

---

### Generate Dynamic OG Images on Cloudflare Workers with @cf-wasm/og

**Impact:** CRITICAL - Enables dynamic OG image generation that actually works on Cloudflare Workers

## Generate Dynamic OG Images on Cloudflare Workers with @cf-wasm/og

The standard `nuxt-og-image` module uses Satori WASM via `WebAssembly.instantiate()`, which is blocked on Cloudflare Workers (see [nuxt-og-image issue #434](https://github.com/nuxt-modules/og-image/issues/434)). Use `@cf-wasm/og/workerd` with a dynamic import instead.

**Incorrect (nuxt-og-image on Cloudflare Workers):**

```typescript
// ❌ WRONG — nuxt-og-image's Satori WASM fails on CF Workers
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-og-image'],
  ogImage: {
    // This will fail with "WebAssembly.instantiate() is not allowed" on CF Workers
  },
});
```

**Correct (custom server route with @cf-wasm/og):**

```typescript
// ✅ CORRECT — server/routes/og/[...path].png.ts

// Satori element helper — plain JS objects, no React
function el(
  type: string,
  style: Record<string, unknown>,
  ...children: unknown[]
) {
  const flat = children.flat().filter((c) => c != null && c !== false);
  const props: Record<string, unknown> = { style };
  if (flat.length === 1 && typeof flat[0] === 'string') {
    props.children = flat[0];
  } else if (flat.length > 0) {
    props.children = flat;
  }
  return { type, props };
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const title = (query.title as string) || 'My App';
  const description = (query.description as string) || 'App description';

  const element = el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      background:
        'linear-gradient(145deg, #0f0e17 0%, #161229 50%, #1a0f2e 100%)',
      fontFamily: 'sans-serif',
      padding: '60px 64px',
    },
    el('div', { fontSize: '64px', fontWeight: 800, color: '#fafafa' }, title),
    el(
      'div',
      { fontSize: '24px', color: '#a1a1aa', marginTop: '20px' },
      description,
    ),
  );

  try {
    // Dynamic import — @cf-wasm/og/workerd only works on CF Workers, not Node.js dev
    const { ImageResponse } = await import('@cf-wasm/og/workerd');
    const response = await ImageResponse.async(element, {
      width: 1200,
      height: 630,
    });

    const buffer = await response.arrayBuffer();

    setResponseHeaders(event, {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
    });

    return Buffer.from(buffer);
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: `OG generation failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
});
```

**Key points:**

- Use `await import('@cf-wasm/og/workerd')` — dynamic import is required for the Workerd runtime
- Use `ImageResponse.async()` (not `new ImageResponse()`) for the async WASM initialization
- Standard dimensions: `1200x630` pixels for OG images
- The `el()` helper creates plain JS objects that Satori understands — see `og-no-react` rule
- This route won't work in local `nuxt dev` (Node.js) — test on CF Workers preview or production
- Add proper error handling with `createError` for debugging failed generations

Reference: [@cf-wasm/og](https://github.com/nicepkg/cf-wasm)

---

### Use Plain JS Objects for Satori Elements, NEVER React

**Impact:** CRITICAL - Prevents React dependency contamination in Vue projects

## Use Plain JS Objects for Satori Elements, NEVER React

Satori (the library that renders OG images) accepts plain JavaScript objects with `{ type, props }` shape. The `@cf-wasm/og` package exports an `html-to-react` utility, but **NEVER use it in Vue projects**. It imports React, which is a hard violation in Vue codebases. Instead, use a simple `el()` helper function.

**Incorrect (importing React utilities):**

```typescript
// ❌ WRONG — NEVER import React or React-related utilities in a Vue project
import { t } from '@cf-wasm/og/html-to-react';

export default defineEventHandler(async (event) => {
  // This pulls in React as a dependency — FORBIDDEN in Vue projects
  const element = t('<div style="display:flex">Hello</div>');
  // ...
});
```

**Correct (plain JS objects via el() helper):**

```typescript
// ✅ CORRECT — Plain JS objects, zero React dependency

// Satori element helper — creates { type, props } objects
// Satori requires display:flex on divs with 2+ children, and chokes on children:[]
function el(
  type: string,
  style: Record<string, unknown>,
  ...children: unknown[]
) {
  const flat = children.flat().filter((c) => c != null && c !== false);
  const props: Record<string, unknown> = { style };
  if (flat.length === 1 && typeof flat[0] === 'string') {
    props.children = flat[0];
  } else if (flat.length > 0) {
    props.children = flat;
  }
  return { type, props };
}

// Usage — composable like JSX but pure JS
const element = el(
  'div',
  { display: 'flex', flexDirection: 'column', width: '100%', height: '100%' },
  el('div', { fontSize: '64px', fontWeight: 800, color: '#fafafa' }, 'Title'),
  el('div', { fontSize: '24px', color: '#a1a1aa' }, 'Description'),
);
// Output: { type: 'div', props: { style: {...}, children: [...] } }
```

**el() helper details:**

1. **`children.flat()`** — Allows passing arrays and nested elements
2. **`.filter(c => c != null && c !== false)`** — Enables conditional rendering like `...(condition ? [el(...)] : [])`
3. **Single string child** — `props.children = 'text'` (not wrapped in array)
4. **Multiple children** — `props.children = [child1, child2, ...]`
5. **No children** — `props` has no `children` key (Satori chokes on `children: []`)

**Conditional rendering pattern:**

```typescript
el(
  'div',
  { display: 'flex', flexDirection: 'column' },
  // Always shown
  el('div', { fontSize: '64px' }, title),
  // Conditionally shown
  ...(description
    ? [el('div', { fontSize: '24px', color: '#a1a1aa' }, description)]
    : []),
);
```

**HARD RULE: No React in Vue projects. Ever. Not even for OG image generation.**

---

### Add JSON-LD Structured Data for Google Rich Results

**Impact:** MEDIUM - Enables Google Rich Results and improves search visibility

## Add JSON-LD Structured Data for Google Rich Results

JSON-LD structured data helps search engines understand your site's content. Add a `WebApplication` or `WebSite` schema to `app.vue` for site-wide structured data.

**Incorrect (no structured data):**

```vue
<!-- ❌ WRONG — app.vue with no structured data -->
<script setup lang="ts">
  // No JSON-LD — search engines have less context about the site
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

**Correct (JSON-LD in app.vue):**

```vue
<!-- ✅ CORRECT — app.vue with WebApplication structured data -->
<script setup lang="ts">
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'My App',
          url: 'https://example.com',
          description: 'Description of what the app does.',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Web',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          author: {
            '@type': 'Organization',
            name: 'My Company',
            url: 'https://example.com',
          },
        }),
      },
    ],
  });
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

**For a documentation or content site, use `WebSite` schema:**

```typescript
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'My Docs',
        url: 'https://docs.example.com',
        description: 'Documentation for My App.',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate:
              'https://docs.example.com/search?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      }),
    },
  ],
});
```

**Common schema types:**

| Type                 | Use Case                                  |
| -------------------- | ----------------------------------------- |
| `WebApplication`     | SaaS apps, tools, platforms               |
| `WebSite`            | Documentation sites, blogs, content sites |
| `Organization`       | Company/team pages                        |
| `SoftwareSourceCode` | Open source project landing pages         |
| `BreadcrumbList`     | Navigation breadcrumbs (per-page)         |

**Validation:** Use [Google's Rich Results Test](https://search.google.com/test/rich-results) to verify structured data.

Reference: [Schema.org](https://schema.org/) | [Google Structured Data](https://developers.google.com/search/docs/appearance/structured-data)
