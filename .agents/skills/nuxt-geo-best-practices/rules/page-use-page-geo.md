---
title: Create a Reusable usePageGeo Composable for Per-Page GEO Meta
impact: HIGH
impactDescription: Single source of truth for canonical URL, freshness, content type, and entity references on every page
tags: composable, useseometa, useschemaorg, page-geo, dx, nuxt
---

## Create a Reusable `usePageGeo` Composable for Per-Page GEO Meta

Just like `usePageSeo` (sibling skill `nuxt-seo-best-practices`) standardizes per-page SEO, `usePageGeo` should be the **one-line API** that every page calls to set GEO-specific signals: canonical URL, freshness (`dateModified`), content type (`Article` / `FAQPage` / `HowTo`), and author entity reference.

This wraps Nuxt's official primitives — [`useSeoMeta`](https://nuxt.com/docs/4.x/api/composables/use-seo-meta), [`useHead`](https://nuxt.com/docs/4.x/api/composables/use-head) (and optionally `useSchemaOrg` from `nuxt-schema-org`) — so authors don't reinvent the wheel per page.

**Incorrect (every page hand-rolls its own meta + JSON-LD):**

```vue
<!-- ❌ WRONG — duplicated across every page, easy to forget fields -->
<script setup lang="ts">
  const config = useRuntimeConfig();
  const baseUrl = config.public.baseUrl;

  useSeoMeta({
    title: 'How to Deploy Nuxt to Cloudflare',
    description: 'Step-by-step guide.',
    ogTitle: 'How to Deploy Nuxt to Cloudflare',
    ogUrl: `${baseUrl}/blog/cloudflare-deploy`,
  });

  useHead({
    link: [{ rel: 'canonical', href: `${baseUrl}/blog/cloudflare-deploy` }],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'How to Deploy Nuxt to Cloudflare',
          // ...lots of repetitive JSON-LD per page...
        }),
      },
    ],
  });
</script>
```

**Correct (`usePageGeo` composable handles everything consistently):**

```ts
// app/composables/geo/use-page-geo.ts
type ContentType =
  | 'Article'
  | 'BlogPosting'
  | 'NewsArticle'
  | 'TechArticle'
  | 'FAQPage'
  | 'HowTo'
  | 'WebPage';

interface PageGeoOptions {
  /** Page title — used for <title>, og:title, twitter:title, JSON-LD headline */
  title: string;
  /** Search/meta description — keep under 160 chars */
  description: string;
  /** Path on this site (e.g. '/blog/my-post') */
  path: string;
  /** Schema.org content type */
  type?: ContentType;
  /** ISO 8601 publish date — used for `datePublished` */
  datePublished?: string;
  /** ISO 8601 last-modified date — used for `dateModified` (freshness signal!) */
  dateModified?: string;
  /** Author Person entity (referenced by @id ideally) */
  author?: {
    name: string;
    url?: string;
    sameAs?: string[];
  };
  /** Robots directive — only set for noindex/nofollow pages */
  robots?: string;
  /** Optional FAQs — auto-emits FAQPage schema */
  faqs?: { q: string; a: string }[];
  /** Optional HowTo steps */
  howToSteps?: { name: string; text: string }[];
}

export function usePageGeo(options: PageGeoOptions) {
  const config = useRuntimeConfig();
  const baseUrl = config.public.baseUrl || 'https://example.com';

  const canonicalUrl = `${baseUrl}${options.path}`;
  const type = options.type ?? 'WebPage';
  const dateModified =
    options.dateModified ?? options.datePublished ?? new Date().toISOString();

  // 1. Canonical link (avoid duplicate-content downranking)
  useHead({
    link: [{ rel: 'canonical', href: canonicalUrl }],
  });

  // 2. Standard SEO meta — Nuxt's official typed wrapper
  useSeoMeta({
    title: options.title,
    description: options.description,
    ...(options.robots ? { robots: options.robots } : {}),
    // OG / Twitter handled by usePageSeo (sibling skill) — not duplicated here
  });

  // 3. JSON-LD content entity — the GEO core
  const ldEntity: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${canonicalUrl}#${type.toLowerCase()}`,
    headline: options.title,
    name: options.title,
    description: options.description,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    dateModified,
    ...(options.datePublished ? { datePublished: options.datePublished } : {}),
    ...(options.author
      ? {
          author: {
            '@type': 'Person',
            name: options.author.name,
            ...(options.author.url ? { url: options.author.url } : {}),
            ...(options.author.sameAs ? { sameAs: options.author.sameAs } : {}),
          },
        }
      : {}),
    publisher: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
    },
  };

  const ldScripts: Array<{ type: string; innerHTML: string }> = [
    { type: 'application/ld+json', innerHTML: JSON.stringify(ldEntity) },
  ];

  // 4. Optional FAQ schema
  if (options.faqs && options.faqs.length > 0) {
    ldScripts.push({
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: options.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }),
    });
  }

  // 5. Optional HowTo schema
  if (options.howToSteps && options.howToSteps.length > 0) {
    ldScripts.push({
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: options.title,
        description: options.description,
        step: options.howToSteps.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.name,
          text: s.text,
        })),
      }),
    });
  }

  useHead({ script: ldScripts });
}
```

```vue
<!-- ✅ Usage on a page — one composable call -->
<script setup lang="ts">
  usePageGeo({
    title: 'How to Deploy a Nuxt 4 App to Cloudflare Workers in 5 Minutes',
    description:
      'Step-by-step deployment guide. Cold start ~50ms, free tier 100k req/day, custom domain in <60s DNS propagation.',
    path: '/blog/cloudflare-deploy',
    type: 'TechArticle',
    datePublished: '2026-04-01T10:00:00Z',
    dateModified: '2026-04-15T14:30:00Z',
    author: {
      name: 'Jane Doe',
      url: 'https://janedoe.dev',
      sameAs: [
        'https://www.linkedin.com/in/janedoe',
        'https://github.com/janedoe',
      ],
    },
  });

  // Pair with usePageSeo (sibling skill) for OG/Twitter
  usePageSeo({
    title: 'How to Deploy a Nuxt 4 App to Cloudflare Workers in 5 Minutes',
    description:
      'Step-by-step deployment guide. Cold start ~50ms, free tier 100k req/day.',
    path: '/blog/cloudflare-deploy',
  });
</script>
```

### Module-based variant — `usePageGeo` over `nuxt-schema-org`

If you've installed `nuxt-schema-org`, swap the hand-rolled JSON-LD for typed builders:

```ts
// app/composables/geo/use-page-geo.ts (with nuxt-schema-org)
export function usePageGeo(options: PageGeoOptions) {
  const baseUrl = useRuntimeConfig().public.baseUrl;
  const canonicalUrl = `${baseUrl}${options.path}`;

  useHead({ link: [{ rel: 'canonical', href: canonicalUrl }] });

  useSchemaOrg([
    defineArticle({
      headline: options.title,
      description: options.description,
      datePublished: options.datePublished,
      dateModified: options.dateModified,
      author: options.author
        ? definePerson({
            name: options.author.name,
            url: options.author.url,
            sameAs: options.author.sameAs,
          })
        : undefined,
    }),
    ...(options.faqs
      ? [
          defineFaqPage({
            mainEntity: options.faqs.map((f) => ({
              name: f.q,
              acceptedAnswer: f.a,
            })),
          }),
        ]
      : []),
    ...(options.howToSteps
      ? [
          defineHowTo({
            name: options.title,
            step: options.howToSteps,
          }),
        ]
      : []),
  ]);
}
```

### File organization

```
app/composables/
  seo/
    use-page-seo.ts        # OG / Twitter / canonical (sibling SEO skill)
    index.ts
  geo/
    use-page-geo.ts        # JSON-LD / freshness / author / FAQ / HowTo
    use-faq.ts             # standalone FAQ helper (see entity-faq-howto-schema)
    index.ts
```

### Use both `usePageSeo` AND `usePageGeo`

They're complementary — SEO covers social cards and basic meta, GEO covers JSON-LD and freshness:

```vue
<script setup lang="ts">
  const meta = {
    title: 'Why Edge Rendering Wins in 2026',
    description:
      'Cold start <50ms, $0.50/M requests, automatic global distribution.',
    path: '/blog/edge-rendering-2026',
  };

  usePageSeo({ ...meta }); // OG, Twitter, canonical, social images
  usePageGeo({
    ...meta,
    type: 'BlogPosting',
    datePublished: '2026-04-01T10:00:00Z',
    dateModified: '2026-04-15T14:30:00Z',
    author: { name: 'Jane Doe', url: 'https://janedoe.dev' },
  }); // JSON-LD entity, freshness, author
</script>
```

### Verify

```bash
# JSON-LD is well-formed
curl -s https://example.com/blog/your-post | \
  pup 'script[type="application/ld+json"] text{}' | \
  jq .

# Canonical is present and correct
curl -s https://example.com/blog/your-post | grep -i 'rel="canonical"'

# dateModified updates after a content edit
curl -s https://example.com/blog/your-post | \
  pup 'script[type="application/ld+json"] text{}' | \
  jq '.dateModified'
```

Reference: [Nuxt 4 SEO & Meta](https://nuxt.com/docs/4.x/getting-started/seo-meta) · [`useSeoMeta`](https://nuxt.com/docs/4.x/api/composables/use-seo-meta) · [`useHead`](https://nuxt.com/docs/4.x/api/composables/use-head) · [`nuxt-schema-org`](https://nuxtseo.com/docs/schema-org) · sibling skill `nuxt-seo-best-practices` rule `meta-use-page-seo`
