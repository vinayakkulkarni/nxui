---
title: Write Self-Contained Paragraphs That Survive RAG Chunking
impact: CRITICAL
impactDescription: Determines whether your passage gets retrieved at all by RAG-based engines (Perplexity, AI Overviews, ChatGPT browse)
tags: rag, extractability, content, structure, chunking, retrieval
---

## Write Self-Contained Paragraphs That Survive RAG Chunking

Generative engines that ground answers in real-time retrieval (Google AI Mode, Perplexity, ChatGPT with browsing) **do not read your page top-to-bottom**. They split your HTML into ~200-500 token chunks, vectorize each chunk, and retrieve only the chunks that semantically match the user's query. The retrieved chunk is then synthesized into the answer **without the surrounding paragraphs**.

This means a paragraph that depends on context above it ("As mentioned earlier...", "This is why...", "The above approach...") becomes meaningless when extracted, and the LLM will skip it.

**Incorrect (paragraphs that depend on prior context):**

```vue
<!-- ❌ WRONG — every paragraph references something that won't be in the chunk -->
<template>
  <article>
    <h1>Choosing a Database for Your Nuxt App</h1>

    <p>Let's look at three common options.</p>

    <p>
      The first one is great for low-latency reads. As mentioned, it scales
      horizontally without much config.
    </p>

    <p>
      The second one, however, has a different tradeoff. This makes it better
      for the use case described above.
    </p>

    <p>That's why most teams pick the third option, which we'll cover next.</p>
  </article>
</template>
```

**Correct (each paragraph stands alone):**

```vue
<!-- ✅ CORRECT — every paragraph names entities and survives chunk extraction -->
<template>
  <article>
    <h1>Choosing a Database for Your Nuxt App</h1>

    <h2>Cloudflare D1 — best for edge-first Nuxt apps under 10GB</h2>
    <p>
      Cloudflare D1 is a SQLite-based database that runs at the edge with
      sub-10ms read latency from any Cloudflare Worker. It's the best fit for
      Nuxt apps deployed to Cloudflare Pages with under 10GB of data and
      read-heavy workloads. D1 supports SQL and integrates with Drizzle ORM.
    </p>

    <h2>Neon — best for serverless Postgres with branching</h2>
    <p>
      Neon is a serverless Postgres provider with database branching, which lets
      each Git branch in your Nuxt app get its own isolated DB copy. Cold start
      is ~300ms; sustained queries match traditional Postgres. Neon is the best
      choice when you need full Postgres features (extensions, JSON, PostGIS)
      and a Git-style workflow for schema changes.
    </p>

    <h2>Turso — best for global multi-region SQLite replication</h2>
    <p>
      Turso is a managed libSQL (SQLite fork) with multi-region replication.
      Reads are served from the nearest replica with single-digit-millisecond
      latency globally. Turso suits Nuxt apps with a worldwide audience and
      strong read-after-write consistency requirements per region.
    </p>
  </article>
</template>
```

### The "stand-alone test"

Before publishing, copy each paragraph into a fresh document with no surrounding context. Ask: **"If an LLM only saw this paragraph, would the answer to the user's likely question still be complete and attributable?"**

If no → rewrite to:

1. **Name the entity** in the first sentence (not "it", "this", "the framework")
2. **State the conclusion first**, then explain
3. **Drop conversational scaffolding** ("Let's", "As we said", "Here's why")
4. **Include the question's keywords** naturally — but never stuff (see `content-no-keyword-stuffing`)

### Front-load the answer (inverted pyramid)

| Position in section            | What to put                      | Why                                   |
| ------------------------------ | -------------------------------- | ------------------------------------- |
| First sentence of `<h2>` block | The direct answer                | Highest retrieval probability         |
| Second sentence                | Supporting statistic             | Pairs with `content-statistics`       |
| Third sentence onward          | Nuance, edge cases, alternatives | Read by humans, often dropped by LLMs |

### Heading hierarchy matters

LLMs use heading text as a strong signal of which chunk is "about" what. Make headings **descriptive declaratives**, not teasers:

| Heading style                                            | GEO friendly?                  |
| -------------------------------------------------------- | ------------------------------ |
| `## Cloudflare D1 — best for edge-first apps under 10GB` | Yes — entity + verdict         |
| `## Why we picked D1`                                    | No — pronoun, no entity        |
| `## A surprising choice`                                 | No — clickbait, no information |

### Use semantic HTML, not just `<div>`

AI crawlers parse HTML structurally. `<article>`, `<section>`, `<h1>`-`<h6>`, `<dl>`/`<dt>`/`<dd>`, `<table>` all give the chunker stronger boundaries than nested `<div>`s do.

```vue
<!-- ✅ Best — semantic structure -->
<article>
  <header>
    <h1>...</h1>
    <p class="lede">One-sentence summary that answers the page-level question.</p>
  </header>

  <section>
    <h2>Descriptive heading</h2>
    <p>Self-contained paragraph...</p>
  </section>
</article>
```

### Verification

Use a simple chunker to sanity-check your own content:

```bash
# Quick split-by-paragraph test
curl -s https://your-site.com/blog/post | \
  pup 'article p text{}' | \
  awk 'NF {print NR": "$0; print ""}'
```

If any line starts with "It", "This", "The above", or "As mentioned" — rewrite.

Reference: [Search Engine Land — Generative Engine Optimization Guide](https://searchengineland.com/what-is-generative-engine-optimization-geo-444418) (extractability section) · [GEO Paper §2.2](https://arxiv.org/abs/2311.09735) (visibility metrics)
