---
title: Site-Wide Organization JSON-LD with sameAs Cross-References
impact: HIGH
impactDescription: Lets AI systems disambiguate your brand from similarly-named entities and corroborate identity from multiple sources
tags: organization, schema-org, json-ld, entity-clarity, sameAs, eeat
---

## Site-Wide Organization JSON-LD with `sameAs` Cross-References

Generative engines build an entity model of your brand by cross-referencing signals from multiple sources (your site, LinkedIn, Crunchbase, Wikipedia, GitHub, Twitter/X). The `sameAs` property in your `Organization` JSON-LD is the explicit link that tells the LLM "these accounts all refer to the same entity." Without it, the model has to guess — and may merge or split your identity unpredictably.

The Search Engine Land GEO playbook calls this out directly: _"When these signals are consistent across sources, AI systems can categorize and reference your brand with greater confidence. When they conflict, confidence drops, and your brand is less likely to be mentioned."_

**Incorrect (no Organization schema):**

```vue
<!-- ❌ WRONG — app.vue with no entity schema -->
<script setup lang="ts">
  // Search engines have no canonical entity definition for your brand
  // AI systems may confuse "monday" the SaaS with the day of the week
</script>
```

**Correct (Organization with `sameAs` array):**

```vue
<!-- ✅ CORRECT — app.vue or default layout — site-wide Organization entity -->
<script setup lang="ts">
  const config = useRuntimeConfig();
  const baseUrl = config.public.baseUrl || 'https://example.com';

  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          '@id': `${baseUrl}/#organization`,
          name: 'My App',
          legalName: 'My App, Inc.',
          url: baseUrl,
          logo: `${baseUrl}/logo-512.png`,
          description:
            'My App helps Nuxt developers ship faster by automating X for B2B SaaS teams.',
          foundingDate: '2024-01-15',
          founders: [
            { '@type': 'Person', name: 'Jane Doe', url: 'https://janedoe.dev' },
          ],
          // Cross-references — the magic GEO ingredient
          sameAs: [
            'https://www.linkedin.com/company/my-app',
            'https://twitter.com/myapp',
            'https://x.com/myapp',
            'https://github.com/my-app',
            'https://www.crunchbase.com/organization/my-app',
            'https://www.wikipedia.org/wiki/My_App',
            'https://www.youtube.com/@myapp',
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: 'support@example.com',
            availableLanguage: ['en'],
          },
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'San Francisco',
            addressRegion: 'CA',
            addressCountry: 'US',
          },
        }),
      },
    ],
  });
</script>
```

### Module-based (recommended) — `nuxt-schema-org`

Hand-rolling JSON-LD is error-prone (no type safety, easy to forget required fields). [`nuxt-schema-org`](https://nuxtseo.com/docs/schema-org) gives you typed builders and auto-resolves cross-references between schemas:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-schema-org'], // or ['@nuxtjs/seo']

  site: {
    url: 'https://example.com',
    name: 'My App',
  },

  schemaOrg: {
    identity: 'Organization',
  },
});
```

```vue
<!-- app.vue — typed, auto-cross-referenced -->
<script setup lang="ts">
  useSchemaOrg([
    defineOrganization({
      name: 'My App',
      legalName: 'My App, Inc.',
      logo: '/logo-512.png',
      description:
        'My App helps Nuxt developers ship faster by automating X for B2B SaaS teams.',
      foundingDate: '2024-01-15',
      sameAs: [
        'https://www.linkedin.com/company/my-app',
        'https://twitter.com/myapp',
        'https://github.com/my-app',
        'https://www.crunchbase.com/organization/my-app',
      ],
    }),
    defineWebSite({
      name: 'My App',
      inLanguage: 'en-US',
    }),
    defineWebPage(), // auto-attached to the current route
  ]);
</script>
```

### `sameAs` — what to include

Aim for 5+ high-quality cross-references. Quality > quantity.

| Tier          | Examples                                                           |
| ------------- | ------------------------------------------------------------------ |
| **Must-have** | LinkedIn company page, X/Twitter, GitHub org (if dev tool)         |
| **Strong**    | Crunchbase, Wikipedia, official YouTube channel                    |
| **Good**      | Product Hunt, AngelList, G2, Capterra (verified profiles only)     |
| **Skip**      | Personal social accounts, defunct profiles, unverified directories |

**Critical:** every `sameAs` URL must be **two-way verifiable** — the LinkedIn page should link back to your domain, the GitHub org should have your domain in the website field, etc. AI systems penalize one-way claims.

### Disambiguate ambiguous brand names

If your brand shares a name with anything common (e.g., "Apple", "Monday", "Notion", "Linear"), use the `description` field to **explicitly state the category** in the first sentence:

```ts
defineOrganization({
  name: 'Linear',
  description:
    'Linear is a project management software company for engineering teams. Not to be confused with linear algebra or Linear A script.',
  // ...
});
```

### Verify with Google's Rich Results Test

```bash
# Check your page renders the schema correctly
open "https://search.google.com/test/rich-results?url=$(node -e 'process.stdout.write(encodeURIComponent("https://example.com"))')"
```

Or programmatically:

```bash
curl -s https://example.com | \
  pup 'script[type="application/ld+json"] text{}' | \
  jq .
```

Should return a clean JSON object with no missing required fields.

### Combine with `WebSite` schema for the site search action

The `WebSite` schema unlocks the SearchAction (Google Sitelinks Search Box) and signals to AI systems that your site has internal search:

```ts
defineWebSite({
  name: 'My App',
  url: baseUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${baseUrl}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});
```

Reference: [Schema.org `Organization`](https://schema.org/Organization) · [Schema.org `sameAs`](https://schema.org/sameAs) · [`nuxt-schema-org`](https://nuxtseo.com/docs/schema-org) · [Google's Organization markup guide](https://developers.google.com/search/docs/appearance/structured-data/organization) · sibling skill `nuxt-seo-best-practices` rule `schema-json-ld`
