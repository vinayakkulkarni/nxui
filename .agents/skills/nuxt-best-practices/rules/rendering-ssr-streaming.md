---
title: Understand SSR Streaming Before Enabling It (Nuxt 4.5+, Experimental)
impact: MEDIUM
impactDescription: Dramatically improves TTFB but silently drops late response mutations
tags: rendering, ssr, streaming, ttfb, experimental, nuxt-4.5
---

## Understand SSR Streaming Before Enabling It (Nuxt 4.5+, Experimental)

Nuxt 4.5 added experimental SSR streaming. Instead of buffering the fully rendered page, Nuxt flushes the HTML shell (`<head>`, styles, preload hints, entry scripts) immediately and streams the body as Vue renders it — dramatically improving Time to First Byte on content-heavy routes.

The critical constraint: **the first streamed byte commits the HTTP status and headers**. Anything that mutates the response after rendering has begun cannot reach the client.

**Enabling it:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  experimental: {
    // Boolean form
    ssrStreaming: true,

    // Or object form with a custom crawler matcher
    // ssrStreaming: {
    //   botRegex: /googlebot|bingbot|my-internal-crawler/i,
    // },
  },

  routeRules: {
    // Opt individual routes out of streaming
    '/no-stream/**': { streaming: false },
  },
});
```

**Incorrect (response mutation during rendering — silently dropped):**

```vue
<script setup lang="ts">
  // BAD with streaming enabled: by the time this runs, the shell may
  // already be flushed — the 404 status never reaches the client
  const { data: post } = await useFetch(`/api/posts/${route.params.slug}`);

  if (!post.value) {
    setResponseStatus(useRequestEvent()!, 404); // DROPPED mid-stream
  }

  // BAD: cookie writes during render are also dropped
  const visited = useCookie('visited');
  visited.value = 'true'; // DROPPED mid-stream
</script>
```

**Correct (mutate before rendering, or opt the route out):**

```typescript
// GOOD: Nuxt plugins and Nitro plugins run before rendering starts —
// response mutations there always reach the client
export default defineNuxtPlugin(() => {
  const event = useRequestEvent();
  // Safe: runs before the shell is flushed
});
```

```typescript
// GOOD: routes that must set status/cookies late stay buffered
export default defineNuxtConfig({
  experimental: { ssrStreaming: true },
  routeRules: {
    '/account/**': { streaming: false }, // sets cookies during render
  },
});
```

**Automatic buffered fallback** — these are never streamed (no action needed):

| Condition                                      | Why                                     |
| ---------------------------------------------- | --------------------------------------- |
| Route rules: `redirect`, `cache`, `isr`, `swr` | Response must be complete before commit |
| Route rules: `noScripts`, `ssr: false`         | Incompatible render paths               |
| Bot/crawler user agents (per `botRegex`)       | Search engines get fully-rendered HTML  |
| Prerendered routes                             | Already static                          |
| Server-side `navigateTo()` redirects           | Status must change                      |

**Error behavior:** errors thrown after the shell is flushed cannot change the HTTP status — Nuxt completes a well-formed document and hydration renders the error page. Monitoring that relies on 5xx status codes won't see mid-stream failures.

**When to enable:**

- Content-heavy routes where TTFB matters (blogs, docs, marketing)
- Apps whose response mutations all happen in plugins/middleware before render

**When to keep it off (or opt routes out):**

- Routes that set cookies, headers, or status codes inside `<script setup>` after an `await`
- Until you've tested: development logs a warning naming any dropped mutation — watch for those before shipping

Reference: [SSR Streaming — Experimental Features](https://nuxt.com/docs/guide/going-further/experimental-features#ssrstreaming) | [Nuxt 4.5 Release Notes](https://github.com/nuxt/nuxt/releases/tag/v4.5.0)
