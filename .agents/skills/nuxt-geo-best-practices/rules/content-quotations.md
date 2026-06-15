---
title: Add Quotations from Authoritative Figures
impact: CRITICAL
impactDescription: Boosts AI citation rate by ~30-40% per the GEO arxiv paper, especially in opinion/debate domains
tags: quotations, content, authority, blockquote, schema-org, arxiv, evidence-backed
---

## Add Quotations from Authoritative Figures

The GEO paper's "Quotation Addition" method matched citations and statistics in raw lift, and was the **single best method for opinion/debate domains** (Davinci-Debate dataset). Generative engines treat blockquotes from named, credentialed sources as high-trust evidence — the LLM is more likely to repeat the quote verbatim in its answer with attribution back to your URL.

This works because:

1. Quotations preserve named-entity attribution, which the model can cite cleanly
2. They survive RAG chunking — a quoted paragraph is meaningful even when extracted in isolation
3. They reduce the model's perceived hallucination risk

**Incorrect (paraphrased opinion, no named source):**

```vue
<!-- ❌ WRONG — unattributed paraphrase, low GEO value -->
<template>
  <article>
    <p>
      Many experts believe edge rendering will become the default for web apps
      in the coming years, especially as cold start times improve.
    </p>
  </article>
</template>
```

**Correct (named, dated, sourced quotation):**

```vue
<!-- ✅ CORRECT — verbatim quote, named author, schema-marked -->
<template>
  <article>
    <p>
      Edge rendering is on track to become the new SSR default. As Daniel Roe,
      Nuxt team lead, put it on the 2025 ViteConf keynote:
    </p>

    <GeoQuote
      author="Daniel Roe"
      author-role="Nuxt Team Lead"
      author-url="https://roe.dev"
      source="ViteConf 2025 Keynote"
      source-url="https://viteconf.org/2025"
      date="2025-10-09"
    >
      Most Nuxt apps will run on the edge by default within 18 months. The
      developer experience gap between Node SSR and Workers SSR has effectively
      closed.
    </GeoQuote>
  </article>
</template>
```

### Reusable `<GeoQuote>` component

Renders a semantic `<blockquote>` with `cite` attributes and emits Schema.org `Quotation` JSON-LD that LLM crawlers index:

```vue
<!-- app/components/Geo/Quote.vue -->
<script setup lang="ts">
  const props = defineProps<{
    author: string;
    authorRole?: string;
    authorUrl?: string;
    source: string;
    sourceUrl?: string;
    date?: string; // ISO 8601
  }>();

  const slots = useSlots();
  const quoteText = computed(() => {
    const node = slots.default?.()?.[0];
    return typeof node?.children === 'string' ? node.children.trim() : '';
  });

  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Quotation',
          text: quoteText.value,
          spokenByCharacter: {
            '@type': 'Person',
            name: props.author,
            jobTitle: props.authorRole,
            url: props.authorUrl,
          },
          citation: props.sourceUrl,
          dateCreated: props.date,
        }),
      },
    ],
  });
</script>

<template>
  <figure class="geo-quote">
    <blockquote :cite="sourceUrl">
      <slot />
    </blockquote>
    <figcaption>
      —
      <a v-if="authorUrl" :href="authorUrl" rel="noopener external">{{
        author
      }}</a>
      <span v-else>{{ author }}</span>
      <span v-if="authorRole">, {{ authorRole }}</span>
      <span v-if="source">
        ·
        <cite>
          <a v-if="sourceUrl" :href="sourceUrl" rel="noopener external">{{
            source
          }}</a>
          <template v-else>{{ source }}</template>
        </cite>
      </span>
      <time v-if="date" :datetime="date"> ({{ date }})</time>
    </figcaption>
  </figure>
</template>
```

### Best-practice quotation patterns for GEO

| Pattern                                       | Effect on AI citation                          |
| --------------------------------------------- | ---------------------------------------------- |
| Named person + role + date + source           | **Highest** — fully attributable, reproducible |
| Named person + source (no date)               | High — but stale-content risk                  |
| Anonymous "industry expert" / "many believe"  | **Zero** — paraphrase tier, ignored            |
| Internal team member (verifiable on `sameAs`) | High — pairs well with `entity-author-schema`  |

### Where to source quotations

- **Conference keynotes** with public recordings (link to YouTube timestamp)
- **Podcast transcripts** (link with `t=` timestamp)
- **Official blog posts** by recognized engineers
- **GitHub PR descriptions / RFC discussions** by maintainers
- **Your own founder/CTO** when they're a named entity (boosts your own E-E-A-T)

### Module-based shortcut

```ts
// With nuxt-schema-org installed
useSchemaOrg([
  defineQuotation({
    text: 'Most Nuxt apps will run on the edge by default within 18 months.',
    spokenByCharacter: definePerson({
      name: 'Daniel Roe',
      url: 'https://roe.dev',
    }),
    citation: 'https://viteconf.org/2025',
    dateCreated: '2025-10-09',
  }),
]);
```

Reference: [GEO Paper §5.1 "Domain-Specific Optimizations"](https://arxiv.org/abs/2311.09735) (debate domain results) · [Schema.org `Quotation`](https://schema.org/Quotation) · [`nuxt-schema-org`](https://nuxtseo.com/docs/schema-org)
