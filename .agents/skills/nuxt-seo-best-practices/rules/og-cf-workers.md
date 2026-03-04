---
title: Generate Dynamic OG Images on Cloudflare Workers with @cf-wasm/og
impact: CRITICAL
impactDescription: Enables dynamic OG image generation that actually works on Cloudflare Workers
tags: og-image, cloudflare, satori, cf-wasm, server-route, workers
---

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
