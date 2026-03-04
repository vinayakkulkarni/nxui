---
title: Set Complete Open Graph and Twitter Card Meta Tags
impact: HIGH
impactDescription: Ensures rich social media previews on all platforms
tags: seo, open-graph, twitter-card, meta-tags, social-sharing
---

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
