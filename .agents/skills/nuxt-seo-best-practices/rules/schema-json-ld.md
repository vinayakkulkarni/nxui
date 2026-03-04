---
title: Add JSON-LD Structured Data for Google Rich Results
impact: MEDIUM
impactDescription: Enables Google Rich Results and improves search visibility
tags: seo, json-ld, structured-data, schema-org, rich-results
---

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
