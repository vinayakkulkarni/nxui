---
title: Set Canonical URLs and og:url on Every Page
impact: HIGH
impactDescription: Prevents duplicate content penalties and ensures correct social sharing URLs
tags: seo, canonical, og-url, duplicate-content, useHead
---

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
