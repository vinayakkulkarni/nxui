---
title: Cache OG Images with Immutable Headers
impact: HIGH
impactDescription: Reduces server load and ensures fast social media card rendering
tags: og-image, caching, cdn, cloudflare, cache-control
---

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
