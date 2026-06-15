---
title: Ensure AI Crawlers Receive SSR HTML, Not a JavaScript Shell
impact: CRITICAL
impactDescription: Many AI crawlers don't execute JavaScript — a CSR/SPA Nuxt build returns an empty shell and gets zero AI citations
tags: ssr, csr, ai-crawlers, hydration, nitro, prerender, nuxt
---

## Ensure AI Crawlers Receive SSR HTML, Not a JavaScript Shell

Unlike Googlebot (which renders JS), most AI crawlers — GPTBot, ClaudeBot, PerplexityBot, Bytespider — **do not execute JavaScript**. They fetch the raw HTML response and ingest whatever text is present at that moment. If your Nuxt app is configured for client-side rendering (CSR/SPA mode), those crawlers see this:

```html
<!-- What an AI crawler sees on a CSR Nuxt build -->
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
  </head>
  <body>
    <div id="__nuxt"></div>
    <script src="/_nuxt/entry.js"></script>
  </body>
</html>
```

That is **zero indexable content**. Your AI citation rate will be zero.

**Incorrect (SPA mode or accidentally disabled SSR):**

```ts
// ❌ WRONG — SPA mode disables SSR globally
export default defineNuxtConfig({
  ssr: false, // <- KILLS GEO. AI crawlers see empty <div id="__nuxt"></div>.
});
```

```ts
// ❌ ALSO WRONG — large client-only sections wipe out the SSR'd HTML on hydration
// (less common, but happens when developers wrap the entire page in <ClientOnly>)
```

```vue
<!-- pages/index.vue — ❌ WRONG -->
<template>
  <ClientOnly>
    <!-- Entire page content client-only — AI crawlers see nothing -->
    <HomeHero />
    <HomeFeatures />
    <HomePricing />
  </ClientOnly>
</template>
```

**Correct (SSR enabled, content rendered server-side):**

```ts
// ✅ CORRECT — SSR is the Nuxt 4 default, leave it on
export default defineNuxtConfig({
  // ssr: true is the default — don't override unless you have a strong reason
  ssr: true,

  // Better: prerender your most important pages at build time so AI crawlers
  // get a static HTML response (zero cold-start latency, zero render cost)
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/docs', '/pricing', '/blog'],
    },
  },

  // Hybrid rendering for the rest (per-route control)
  routeRules: {
    '/': { prerender: true },
    '/blog/**': { prerender: true },
    '/docs/**': { prerender: true },
    '/pricing': { prerender: true },
    '/dashboard/**': { ssr: false }, // app shell — AI crawlers don't need this
    '/api/**': { cors: true },
  },
});
```

```vue
<!-- ✅ CORRECT — only narrow widgets are <ClientOnly>, rest is SSR'd -->
<template>
  <article>
    <h1>{{ post.title }}</h1>
    <p class="lede">{{ post.summary }}</p>

    <!-- This text is SSR'd → AI crawlers see it -->
    <ContentRenderer :value="post" />

    <!-- Only the comment widget is client-only -->
    <ClientOnly>
      <CommentWidget :post-id="post.id" />
    </ClientOnly>
  </article>
</template>
```

### Quick test — what does an AI crawler actually see?

```bash
# Simulate a JS-disabled crawler (what GPTBot/ClaudeBot see)
curl -s -A "GPTBot/1.0" https://your-site.com/blog/my-post | \
  pup 'article text{}' | \
  head -50

# If this returns your article body → ✅ SSR is working
# If this returns "" or a one-line title only → ❌ content is JS-rendered
```

```bash
# Inspect raw HTML byte size — empty SPA shells are typically < 5KB
curl -s https://your-site.com/blog/my-post | wc -c
# Healthy SSR'd page: 30,000 - 200,000 bytes
# Empty SPA shell:     < 5,000 bytes
```

### When SSR isn't enough — add prerender for AI crawler perf

Even with SSR, an AI crawler hitting a cold Cloudflare Worker may time out (some crawlers give up at 5 seconds). Prerender your top pages so the response is a pre-baked HTML file:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
      routes: ['/sitemap.xml', '/llms.txt', '/llms-full.txt'],
    },
  },
});
```

### `useFetch` SSR safety — make sure server-fetched data renders

A subtle bug: if you use `useFetch` with `{ server: false }`, the data is only fetched on the client — AI crawlers see no content:

```vue
<!-- ❌ WRONG — { server: false } means SSR has no data → empty page for AI -->
<script setup lang="ts">
  const { data } = await useFetch('/api/posts', { server: false });
</script>
```

```vue
<!-- ✅ CORRECT — default behavior fetches on server, hydrates on client -->
<script setup lang="ts">
  const { data: posts } = await useFetch('/api/posts');
  // posts is populated server-side → AI crawler sees the rendered list
</script>

<template>
  <ul>
    <li v-for="p in posts" :key="p.id">
      <NuxtLink :to="`/posts/${p.slug}`">{{ p.title }}</NuxtLink>
    </li>
  </ul>
</template>
```

### `<ClientOnly>` is fine for widgets — bad for content

| Component type                               | `<ClientOnly>` OK?              |
| -------------------------------------------- | ------------------------------- |
| Article body, product description, FAQ       | **No** — must be SSR'd          |
| Headings, navigation, footer links           | **No** — must be SSR'd          |
| Pricing tables, feature comparisons          | **No** — must be SSR'd          |
| Comment widget, live chat, analytics         | **Yes** — AI doesn't need these |
| Date/time pickers, charts that need `window` | **Yes**                         |
| Auth-gated dashboard widgets                 | **Yes**                         |

### What about prerender + ISR?

Cloudflare Pages and Vercel both support hybrid prerender + ISR. AI crawlers benefit because they hit a CDN-cached HTML response with sub-50ms TTFB, which means crawlers don't time out and they get the **freshest** version (revalidated periodically).

```ts
routeRules: {
  '/blog/**': {
    prerender: true,        // build-time HTML
    swr: 3600,              // serve stale for 1h, revalidate
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  },
},
```

Reference: [Nuxt 4 Rendering Modes](https://nuxt.com/docs/4.x/guide/concepts/rendering) · [Nitro Prerender](https://nitro.unjs.io/config#prerender) · [Nuxt `<ClientOnly>`](https://nuxt.com/docs/4.x/api/components/client-only) · [Nuxt SEO docs](https://nuxt.com/docs/4.x/getting-started/seo-meta) · sibling skill `nuxt-best-practices` (rendering modes section)
