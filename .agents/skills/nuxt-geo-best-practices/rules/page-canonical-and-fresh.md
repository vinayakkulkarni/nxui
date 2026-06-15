---
title: Canonical URL + dateModified for Content Freshness Signals
impact: HIGH
impactDescription: Freshness is a top-3 ranking signal for AI Overviews and Perplexity on time-sensitive queries
tags: canonical, datemodified, freshness, content, page-geo
---

## Canonical URL + `dateModified` for Content Freshness Signals

Generative engines treat **content freshness as a major ranking signal**, especially for queries that imply currency:

- "best X in 2026"
- "latest version of Y"
- "what changed in Z"
- "current pricing for W"

Two signals together drive freshness perception:

1. **`dateModified` in JSON-LD** (`Article`, `BlogPosting`, `WebPage`) — the LLM reads this directly
2. **`<lastmod>` in sitemap.xml** — the crawler revisit signal

If your content is genuinely fresh but doesn't expose these, the LLM treats it as stale and prefers competitors with explicit `dateModified`.

**Incorrect (no freshness signals):**

```vue
<!-- ❌ WRONG — page may be updated weekly, but AI sees no signal -->
<script setup lang="ts">
  useSeoMeta({
    title: 'Best Vector Databases for RAG in 2026',
    description: 'Updated comparison of vector DBs.',
  });
  // No JSON-LD, no dateModified, no canonical
</script>
```

**Correct (canonical + dateModified + visible date):**

```vue
<!-- ✅ CORRECT — three layers of freshness signal -->
<script setup lang="ts">
  const post = await useFetch('/api/posts/best-vector-databases-2026').then(
    (r) => r.data.value,
  );

  usePageGeo({
    title: post.title,
    description: post.description,
    path: '/blog/best-vector-databases-2026',
    type: 'TechArticle',
    datePublished: post.publishedAt, // ISO 8601
    dateModified: post.updatedAt, // ISO 8601 — updated on every meaningful edit
    author: post.author,
  });
</script>

<template>
  <article>
    <h1>{{ post.title }}</h1>
    <p class="byline">
      <time :datetime="post.publishedAt">
        Published {{ formatDate(post.publishedAt) }}
      </time>
      <template v-if="post.updatedAt !== post.publishedAt">
        ·
        <time :datetime="post.updatedAt" class="updated">
          <strong>Updated {{ formatDate(post.updatedAt) }}</strong>
        </time>
      </template>
    </p>
    <!-- ...content... -->
  </article>
</template>
```

### Three layers of freshness — they all matter

| Layer                       | Where                                 | Audience                             |
| --------------------------- | ------------------------------------- | ------------------------------------ |
| 1. JSON-LD `dateModified`   | `<script type="application/ld+json">` | LLMs (GPTBot, ClaudeBot, Perplexity) |
| 2. Visible `<time>` element | Article header                        | Human users + LLMs that parse text   |
| 3. Sitemap `<lastmod>`      | `/sitemap.xml`                        | Crawler revisit scheduling           |

All three should reflect the **same `dateModified`**. Inconsistency confuses the LLM and reduces trust.

### Update `dateModified` on what counts as a "meaningful edit"

| Edit type                                               | Should bump `dateModified`?                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Fix typo, broken link                                   | Optional (no need to mislead crawlers)                                                                 |
| Add new section, update statistics                      | **Yes**                                                                                                |
| Republish with significant rewrite                      | **Yes** — also consider bumping `datePublished` if effectively a new article                           |
| Auto-rendered `formatDate(new Date())` on every request | **NO** — this is the worst anti-pattern; it makes everything look fake-fresh and the LLM will catch on |

### Anti-pattern: faking freshness with build-time timestamps

```vue
<!-- ❌ DO NOT DO THIS -->
<script setup lang="ts">
  usePageGeo({
    // ...
    dateModified: new Date().toISOString(), // every page rebuild "updates" everything
  });
</script>
```

This breaks the freshness signal across your entire site. AI crawlers compare `dateModified` patterns over time; if everything updates simultaneously on every deploy, the signal is treated as noise and discarded.

### Canonical URL — pair with freshness for full effect

Canonical URL prevents AI crawlers from indexing duplicates (`?utm_source=...`, `/post`, `/post/`, `https://www.example.com/post` vs `https://example.com/post`). Already covered in `usePageGeo`, but the basic rule:

```ts
useHead({
  link: [{ rel: 'canonical', href: `${baseUrl}${path}` }],
});
```

- Always **absolute** URL (with protocol + domain)
- Always **without** tracking query params
- Pick one form (with/without trailing slash) and stick to it
- Match this exactly with `og:url` and JSON-LD `url`

### Build-time vs runtime — when to compute `dateModified`

For **prerendered pages** (`routeRules: { prerender: true }`):

- Compute `dateModified` from your CMS / Markdown frontmatter / file mtime at build time
- Rebuild on content change (incremental builds work fine)

For **SSR pages** (live data):

- Pull `dateModified` from the database on each request
- Cache aggressively at the CDN layer (`Cache-Control: s-maxage=300`)

### Verify

```bash
# 1. JSON-LD dateModified matches reality
curl -s https://example.com/blog/your-post | \
  pup 'script[type="application/ld+json"] text{}' | \
  jq '.dateModified'

# 2. Sitemap lastmod matches JSON-LD
curl -s https://example.com/sitemap.xml | \
  xmllint --xpath '//*[local-name()="url"][.//*[local-name()="loc"][contains(text(),"your-post")]]/*[local-name()="lastmod"]/text()' -

# 3. Visible <time> matches both
curl -s https://example.com/blog/your-post | \
  pup 'time.updated attr{datetime}'
```

All three should return the same date. If they diverge, fix the source of truth.

### Special case: "evergreen" content

For pages that should always look current (pricing pages, "Best X" lists), update `dateModified` whenever you actually change the content — but also consider:

- Showing "Last reviewed" instead of "Last updated" if you only verify rather than edit
- Adding `Article.lastReviewed` (a custom but commonly used extension) for editorial review dates separate from edits

```ts
useSchemaOrg([
  defineArticle({
    headline: 'Best Vector Databases for RAG in 2026',
    datePublished: '2025-01-15T00:00:00Z',
    dateModified: '2026-04-15T14:30:00Z', // last actual edit
    // Custom property — Google ignores, some AI engines parse
    lastReviewed: '2026-04-20T00:00:00Z',
  }),
]);
```

Reference: [Schema.org `dateModified`](https://schema.org/dateModified) · [Sitemap `lastmod` spec](https://www.sitemaps.org/protocol.html#lastmoddef) · [Google freshness signals](https://developers.google.com/search/blog/2011/11/giving-you-fresher-more-recent-search) · sibling rule `ai-sitemap` · sibling rule `page-use-page-geo`
