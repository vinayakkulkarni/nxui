---
title: Add Inline Citations to Credible Sources
impact: CRITICAL
impactDescription: Boosts AI citation rate by ~30-40% per the GEO arxiv paper; signals authority to LLM rerankers
tags: citations, content, authority, eeat, rag, arxiv, evidence-backed
---

## Add Inline Citations to Credible Sources

The GEO paper's "Cite Sources" method produced one of the largest visibility lifts measured (close to +40%) — and the effect compounds with statistics. LLMs reward content that cites primary sources because:

1. It mirrors the citation pattern the LLM itself wants to produce in its answer (LLMs are trained on academic and journalistic text)
2. It signals authority/E-E-A-T, which downstream rerankers (Perplexity, AI Overviews) score on
3. Cited claims are easier for the model to attribute back to your URL with confidence

**Incorrect (uncited claims, no source trail):**

```vue
<!-- ❌ WRONG — claims with no provenance, low LLM trust score -->
<template>
  <article>
    <p>
      Studies show that page speed correlates with conversion rate. Most
      e-commerce sites lose customers due to slow loading. Mobile users are
      especially impatient.
    </p>
  </article>
</template>
```

**Correct (every claim has a citation):**

```vue
<!-- ✅ CORRECT — citations turn opinion into evidence the LLM will surface -->
<script setup lang="ts">
  const sources = [
    {
      id: 'google-cwv',
      title: 'Core Web Vitals & Conversion Rate',
      publisher: 'Google',
      url: 'https://web.dev/vitals-business-impact/',
      accessed: '2026-04-15',
    },
    {
      id: 'akamai-2024',
      title: 'State of Online Retail Performance',
      publisher: 'Akamai',
      url: 'https://www.akamai.com/state-of-online-retail',
      accessed: '2026-04-15',
    },
  ];
</script>

<template>
  <article>
    <p>
      A <strong>100ms reduction in LCP</strong> corresponds to a
      <strong>1.0% lift in conversion rate</strong> on retail sites
      <a href="#src-google-cwv">[1]</a>. Mobile shoppers abandon
      <strong>53% of sessions</strong> when load time exceeds 3 seconds
      <a href="#src-akamai-2024">[2]</a>.
    </p>

    <GeoSources :sources="sources" />
  </article>
</template>
```

### Reusable `<GeoSources>` component

Standardize citation rendering and emit JSON-LD `citation` properties so AI crawlers can parse them structurally:

```vue
<!-- app/components/Geo/Sources.vue -->
<script setup lang="ts">
  interface Source {
    id: string;
    title: string;
    publisher?: string;
    author?: string;
    url: string;
    accessed?: string;
    datePublished?: string;
  }

  const props = defineProps<{ sources: Source[] }>();

  // Emit Schema.org Article citations for the LLMs that parse JSON-LD
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          citation: props.sources.map((s) => ({
            '@type': 'CreativeWork',
            name: s.title,
            url: s.url,
            publisher: s.publisher
              ? { '@type': 'Organization', name: s.publisher }
              : undefined,
            author: s.author
              ? { '@type': 'Person', name: s.author }
              : undefined,
            datePublished: s.datePublished,
          })),
        }),
      },
    ],
  });
</script>

<template>
  <section class="geo-sources" aria-label="Sources">
    <h2>Sources</h2>
    <ol>
      <li v-for="(s, i) in sources" :id="`src-${s.id}`" :key="s.id">
        <a :href="s.url" rel="noopener external">
          {{ s.title }}<span v-if="s.publisher"> — {{ s.publisher }}</span>
        </a>
        <span v-if="s.accessed" class="accessed">
          (accessed {{ s.accessed }})</span
        >
      </li>
    </ol>
  </section>
</template>
```

### What makes a "credible source" for GEO

LLMs weight sources differently. From most to least preferred (observed via Semrush AI Visibility Index, Oct 2025):

| Tier            | Examples                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **S** (highest) | Peer-reviewed papers (arXiv, PubMed, IEEE), official docs (MDN, Nuxt, Vue), government data (`.gov`, EU Open Data)        |
| **A**           | Established news (Reuters, AP, FT, NYT), Wikipedia (with cited sources), industry incumbents (Google, Cloudflare, Vercel) |
| **B**           | Reddit (subreddit-dependent), Stack Overflow accepted answers, GitHub README of 1000+ star repos, conference talks        |
| **C**           | Personal blogs without citations, Medium without author credentials, marketing pages                                      |

Cite from S/A tier whenever possible. **Self-citation also helps** — link to your own past articles to build a topical authority cluster the LLM can navigate.

### Module-based shortcut

If using `nuxt-schema-org`, prefer the typed helper over hand-rolled JSON-LD:

```ts
// app/components/Geo/Sources.vue (with nuxt-schema-org installed)
useSchemaOrg([
  defineArticle({
    citation: props.sources.map((s) => ({
      '@type': 'CreativeWork',
      name: s.title,
      url: s.url,
    })),
  }),
]);
```

### Verification

```bash
# Confirm citations are reachable (404 citations hurt trust signals)
curl -sI https://web.dev/vitals-business-impact/ | head -1
# HTTP/2 200
```

Reference: [GEO Paper §3.3 "GEO Methods"](https://arxiv.org/abs/2311.09735) · [Schema.org `citation`](https://schema.org/citation) · [`nuxt-schema-org`](https://nuxtseo.com/docs/schema-org)
