---
title: Generate an AI-Friendly XML Sitemap with Freshness Signals
impact: HIGH
impactDescription: Sitemaps with accurate lastmod help AI crawlers prioritize fresh content and avoid stale citations
tags: sitemap, lastmod, freshness, ai-crawlers, nitro, nuxt
---

## Generate an AI-Friendly XML Sitemap with Freshness Signals

AI crawlers respect `sitemap.xml` the same way classic search crawlers do, with one extra emphasis: **`<lastmod>` is a strong freshness signal**. Generative engines prefer to cite recent content (especially for time-sensitive queries like "best X in 2026"), so an accurate, well-maintained sitemap directly improves citation rate.

**Incorrect (no sitemap or stale `lastmod`):**

```xml
<!-- ❌ WRONG — no sitemap means AI crawlers rely on link discovery only -->
<!-- /sitemap.xml → 404 -->
```

```xml
<!-- ❌ ALSO WRONG — every URL has the same hardcoded lastmod -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-01</lastmod> <!-- stale by 2 years -->
  </url>
  <url>
    <loc>https://example.com/blog/post-1</loc>
    <lastmod>2024-01-01</lastmod> <!-- same date for everything -->
  </url>
</urlset>
```

**Correct (module-based, per-URL accurate `lastmod`):**

```ts
// nuxt.config.ts — using @nuxtjs/sitemap (bundled in @nuxtjs/seo)
export default defineNuxtConfig({
  modules: ['@nuxtjs/sitemap'], // or ['@nuxtjs/seo'] for the umbrella

  site: {
    url: 'https://example.com',
  },

  sitemap: {
    // Auto-discovered routes from your pages/ + content/ directories
    autoLastmod: true, // uses file mtime / Content frontmatter as fallback

    // Exclude private routes
    exclude: ['/admin/**', '/preview/**', '/api/**'],

    // Group large sites into a sitemap_index.xml + per-section sitemaps
    sitemaps: {
      pages: {
        include: ['/'],
        exclude: ['/blog/**', '/docs/**'],
      },
      blog: {
        include: ['/blog/**'],
      },
      docs: {
        include: ['/docs/**'],
      },
    },

    // For dynamic routes, provide a fetcher that emits accurate lastmod
    sources: ['/api/__sitemap__/blog'],
  },
});
```

```ts
// server/api/__sitemap__/blog.ts
// Provide per-post URLs with accurate lastmod from your CMS / DB
export default defineEventHandler(async () => {
  const posts = await fetchAllPosts();

  return posts.map((post) => ({
    loc: `/blog/${post.slug}`,
    lastmod: post.updatedAt, // ISO 8601, e.g. "2026-04-15T10:30:00Z"
    changefreq: 'monthly',
    priority: 0.8,
  }));
});
```

### Hand-rolled (no module) — use only if you have an unusual setup

If you can't install the module, you can still emit a sitemap from a Nitro route:

```ts
// server/routes/sitemap.xml.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.baseUrl || 'https://example.com';

  const posts = await fetchAllPosts(); // your CMS / DB fetcher

  const urls = [
    { loc: '/', lastmod: new Date().toISOString(), priority: 1.0 },
    { loc: '/pricing', lastmod: new Date().toISOString(), priority: 0.9 },
    ...posts.map((p) => ({
      loc: `/blog/${p.slug}`,
      lastmod: p.updatedAt,
      priority: 0.8,
    })),
  ];

  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8');
  setResponseHeader(
    event,
    'Cache-Control',
    'public, max-age=3600, s-maxage=3600',
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;
});
```

### `lastmod` accuracy matters — don't fake it

| Behavior                                        | Effect                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| Accurate per-URL `lastmod` from CMS/DB          | **Best** — crawlers prioritize fresh content correctly              |
| File mtime (auto-detected by `@nuxtjs/sitemap`) | **Good** — works for static content, slightly noisy if you reformat |
| `lastmod = build time` for everything           | **Bad** — every URL looks "fresh", crawlers ignore the signal       |
| No `lastmod` at all                             | **Bad** — crawlers fall back to their own heuristics                |

### Reference the sitemap from `robots.txt`

Already covered in `ai-robots-allowlist`, but worth re-stating:

```
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap_index.xml
```

### Verify

```bash
# 1. Sitemap is reachable and well-formed
curl -s https://example.com/sitemap.xml | xmllint --noout - && echo "✓ valid XML"

# 2. lastmod values are recent for content you just edited
curl -s https://example.com/sitemap.xml | grep -A1 'blog/your-recent-post' | grep lastmod

# 3. URL count matches your published content
curl -s https://example.com/sitemap.xml | grep -c '<loc>'
```

### Submit to AI crawlers (where supported)

- **Google**: Search Console → Sitemaps → submit `https://example.com/sitemap.xml`. Google-Extended uses the same sitemap as Googlebot.
- **Bing**: Bing Webmaster Tools → submit (powers ChatGPT for some web queries via the Bing index).
- **Perplexity/Anthropic/OpenAI**: No public submission portals; they discover via `robots.txt` `Sitemap:` directive.

Reference: [`@nuxtjs/sitemap`](https://nuxtseo.com/docs/sitemap) · [Sitemap Protocol 0.9](https://www.sitemaps.org/protocol.html) · [Google sitemap docs](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
