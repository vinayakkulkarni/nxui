---
title: FAQPage and HowTo Schemas for the Question-Shaped Queries LLMs Love
impact: HIGH
impactDescription: Question-format JSON-LD maps directly onto LLM prompt patterns; massively boosts AI Overview / AI Mode citation rate
tags: faqpage, howto, schema-org, json-ld, ai-overviews, ai-mode, content
---

## FAQPage and HowTo Schemas for the Question-Shaped Queries LLMs Love

Most AI search queries are question-shaped: _"how do I X"_, _"what's the best Y for Z"_, _"why does X happen"_. Two Schema.org types — **FAQPage** and **HowTo** — map directly onto this pattern. Pages with these schemas are disproportionately cited in AI Overviews, AI Mode, and Perplexity because the structured Q&A format matches the answer the LLM is trying to assemble.

**Incorrect (FAQ rendered as plain text only):**

```vue
<!-- ❌ WRONG — looks like a FAQ to humans, but no machine-readable signal -->
<template>
  <section>
    <h2>Frequently Asked Questions</h2>
    <h3>How do I deploy a Nuxt 4 app to Cloudflare Workers?</h3>
    <p>
      Run nuxi build with the cloudflare-pages preset, then wrangler deploy.
    </p>

    <h3>Does Nuxt 4 work with Cloudflare D1?</h3>
    <p>
      Yes — use the @cloudflare/workers-types adapter and bind D1 in
      wrangler.toml.
    </p>
  </section>
</template>
```

**Correct (FAQPage JSON-LD + visible markup):**

```vue
<!-- ✅ CORRECT — same content, plus JSON-LD that LLMs ingest as Q&A pairs -->
<script setup lang="ts">
  const faqs = [
    {
      q: 'How do I deploy a Nuxt 4 app to Cloudflare Workers?',
      a: 'Set the Nitro preset to cloudflare-pages, run `nuxi build`, then `wrangler deploy`. The build output in `.output/public` is served as static assets, while `.output/server` runs as the Worker. Cold start averages ~50ms.',
    },
    {
      q: 'Does Nuxt 4 work with Cloudflare D1?',
      a: 'Yes — use the @cloudflare/workers-types package, bind your D1 database in wrangler.toml, and access it via `event.context.cloudflare.env.DB` inside Nitro server routes. Drizzle ORM is the recommended query layer.',
    },
  ];

  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: f.a,
            },
          })),
        }),
      },
    ],
  });
</script>

<template>
  <section>
    <h2>Frequently Asked Questions</h2>
    <details v-for="f in faqs" :key="f.q">
      <summary>{{ f.q }}</summary>
      <p>{{ f.a }}</p>
    </details>
  </section>
</template>
```

### Module-based — `nuxt-schema-org`

```vue
<script setup lang="ts">
  useSchemaOrg([
    defineFaqPage({
      mainEntity: faqs.map((f) => ({
        name: f.q,
        acceptedAnswer: f.a,
      })),
    }),
  ]);
</script>
```

### HowTo schema for tutorial / step-by-step content

```vue
<script setup lang="ts">
  useSchemaOrg([
    defineHowTo({
      name: 'Deploy a Nuxt 4 App to Cloudflare Workers in 5 Minutes',
      description:
        'Step-by-step guide from a fresh Nuxt 4 project to a live Cloudflare Workers deployment with custom domain.',
      totalTime: 'PT5M', // ISO 8601 duration
      estimatedCost: { currency: 'USD', value: '0' },
      supply: ['Cloudflare account', 'Node.js 20+', 'Bun or pnpm'],
      tool: ['Wrangler CLI', 'Nuxi CLI'],
      step: [
        {
          name: 'Set the Nitro preset',
          text: 'In nuxt.config.ts, set nitro.preset to "cloudflare-pages" and pin a compatibilityDate.',
          url: '#step-1',
        },
        {
          name: 'Build the production bundle',
          text: 'Run `nuxi build`. Output appears in .output/public (static) and .output/server (Worker code).',
          url: '#step-2',
        },
        {
          name: 'Configure wrangler.toml',
          text: 'Create wrangler.toml with name, compatibility_date, and pages_build_output_dir = ".output/public".',
          url: '#step-3',
        },
        {
          name: 'Deploy with wrangler',
          text: 'Run `wrangler pages deploy .output/public`. First deploy takes ~30s; subsequent ones ~10s.',
          url: '#step-4',
        },
        {
          name: 'Bind a custom domain',
          text: 'In Cloudflare Dashboard → Pages → your project → Custom Domains, add your domain. DNS propagates in ~60s.',
          url: '#step-5',
        },
      ],
    }),
  ]);
</script>
```

### Pair every FAQ with a `<details>` for human users

The `<details>` / `<summary>` HTML pattern matches the FAQPage schema semantically and renders accessibly without JS. This double-encoding (visible + structured) is what AI crawlers reward most.

### Composable `useFaq()` for reuse

```ts
// app/composables/geo/use-faq.ts
export function useFaq(faqs: { q: string; a: string }[]) {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }),
      },
    ],
  });

  return { faqs };
}
```

```vue
<!-- pages/pricing.vue -->
<script setup lang="ts">
  const { faqs } = useFaq([
    {
      q: 'Is there a free tier?',
      a: 'Yes. Up to 10,000 events/month forever.',
    },
    { q: 'Can I self-host?', a: 'Yes — Docker image at ghcr.io/myapp/myapp.' },
  ]);
</script>
```

### When NOT to use FAQPage schema

Google has been **strict** about FAQPage rich results since 2023:

- Only one FAQPage per page (don't stack)
- Questions and answers must be **visible** to the user (no hidden FAQs)
- Don't use FAQPage for **product Q&A from users** — use `Product.review` for that

Violating these can trigger a manual penalty on classic search. AI crawlers don't penalize, but follow the rules anyway.

### Verify

```bash
# Check structured data is valid
curl -s https://example.com/your-faq-page | pup 'script[type="application/ld+json"] text{}' | jq .

# Test in Google Rich Results
open "https://search.google.com/test/rich-results?url=https://example.com/your-faq-page"
```

Reference: [Schema.org `FAQPage`](https://schema.org/FAQPage) · [Schema.org `HowTo`](https://schema.org/HowTo) · [Google FAQPage guidelines](https://developers.google.com/search/docs/appearance/structured-data/faqpage) · [`nuxt-schema-org`](https://nuxtseo.com/docs/schema-org)
