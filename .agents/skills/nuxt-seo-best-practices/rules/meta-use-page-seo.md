---
title: Create a Reusable usePageSeo Composable for Consistent Page SEO
impact: HIGH
impactDescription: Ensures every page has consistent SEO meta without duplication
tags: seo, composable, useSeoMeta, useHead, meta-tags, open-graph, twitter-card
---

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
