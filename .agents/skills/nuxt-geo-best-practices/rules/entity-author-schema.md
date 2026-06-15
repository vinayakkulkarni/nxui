---
title: Person Schema with Credentials and sameAs for E-E-A-T
impact: HIGH
impactDescription: Author entity reinforces authority signals that Google AI Overviews and Perplexity weight heavily in YMYL topics
tags: person, author, schema-org, eeat, ymyl, json-ld, entity-clarity
---

## Person Schema with Credentials and `sameAs` for E-E-A-T

Author identity is the single biggest E-E-A-T (Experience, Expertise, Authoritativeness, Trust) lever for AI search. Generative engines are conservative about citing anonymous content for YMYL (Your Money, Your Life) topics — health, finance, legal, security. They preferentially cite content where the author is a verifiable named entity with credentials.

Adding `Person` JSON-LD with `sameAs` cross-references (LinkedIn, Twitter/X, GitHub, ORCID, scholar profiles) tells the LLM exactly who wrote the content and lets it corroborate that person's expertise from multiple sources.

**Incorrect (no author entity):**

```vue
<!-- ❌ WRONG — article with anonymous author or "by Admin" -->
<template>
  <article>
    <h1>How to Mitigate XSS in Nuxt 4</h1>
    <p class="byline">By Admin · Published April 1, 2026</p>
    <!-- ... -->
  </article>
</template>
```

**Correct (article + author Person schema):**

```vue
<!-- ✅ CORRECT — full author entity with credentials and sameAs -->
<script setup lang="ts">
  const post = {
    title: 'How to Mitigate XSS in Nuxt 4',
    description:
      "Practical guide to preventing cross-site scripting in Nuxt 4 apps using CSP, sanitization, and Vue's built-in defenses.",
    datePublished: '2026-04-01T10:00:00Z',
    dateModified: '2026-04-15T14:30:00Z',
    url: 'https://example.com/blog/xss-in-nuxt-4',
  };

  const author = {
    name: 'Jane Doe',
    jobTitle: 'Principal Security Engineer',
    worksFor: 'My App, Inc.',
    url: 'https://janedoe.dev',
    description:
      'Web security engineer with 12 years at Cloudflare and Google. Author of "Practical Web Security" (O\'Reilly, 2024).',
    sameAs: [
      'https://www.linkedin.com/in/janedoe',
      'https://twitter.com/janedoe',
      'https://github.com/janedoe',
      'https://scholar.google.com/citations?user=ABC123',
      'https://orcid.org/0000-0002-1825-0097',
      'https://www.oreilly.com/people/jane-doe/',
    ],
    knowsAbout: [
      'Web security',
      'Cross-site scripting (XSS)',
      'Content Security Policy',
      'Cloudflare Workers security',
      'Vue.js',
      'Nuxt',
    ],
  };

  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.description,
          datePublished: post.datePublished,
          dateModified: post.dateModified,
          url: post.url,
          mainEntityOfPage: post.url,
          author: {
            '@type': 'Person',
            '@id': `${author.url}#person`,
            ...author,
          },
          publisher: {
            '@type': 'Organization',
            '@id': 'https://example.com/#organization',
          },
        }),
      },
    ],
  });
</script>

<template>
  <article>
    <h1>{{ post.title }}</h1>
    <p class="byline">
      By
      <a :href="author.url" rel="author">{{ author.name }}</a
      >, {{ author.jobTitle }} at {{ author.worksFor }}
      ·
      <time :datetime="post.datePublished">
        Published {{ new Date(post.datePublished).toLocaleDateString() }}
      </time>
      <template v-if="post.dateModified !== post.datePublished">
        ·
        <time :datetime="post.dateModified">
          Updated {{ new Date(post.dateModified).toLocaleDateString() }}
        </time>
      </template>
    </p>
    <!-- article body -->
  </article>
</template>
```

### Module-based — `nuxt-schema-org`

```vue
<script setup lang="ts">
  useSchemaOrg([
    defineArticle({
      headline: post.title,
      description: post.description,
      datePublished: post.datePublished,
      dateModified: post.dateModified,
      author: definePerson({
        name: author.name,
        jobTitle: author.jobTitle,
        url: author.url,
        sameAs: author.sameAs,
        knowsAbout: author.knowsAbout,
      }),
    }),
  ]);
</script>
```

### Author bio page — the canonical Person URL

Each author should have a dedicated `/about/jane-doe` page that **also** emits the full `Person` schema. This becomes the canonical entity URL that other articles reference via `@id`:

```vue
<!-- pages/about/[author].vue -->
<script setup lang="ts">
  const route = useRoute();
  const author = await fetchAuthor(route.params.author as string);

  useSchemaOrg([
    definePerson({
      '@id': `https://example.com/about/${author.slug}#person`,
      name: author.name,
      jobTitle: author.jobTitle,
      url: `https://example.com/about/${author.slug}`,
      image: author.headshot,
      description: author.bio,
      sameAs: author.sameAs,
      knowsAbout: author.expertiseAreas,
      alumniOf: author.education,
      award: author.awards,
    }),
  ]);
</script>
```

### What goes in `knowsAbout`

This is the LLM's strongest topical authority signal for an author. Be specific:

| Vague (low GEO value) | Specific (high GEO value)                                                       |
| --------------------- | ------------------------------------------------------------------------------- |
| "Programming"         | "Vue.js", "Nuxt 4", "TypeScript", "Vite plugin development"                     |
| "Marketing"           | "B2B SaaS positioning", "PLG conversion optimization", "developer relations"    |
| "AI"                  | "Retrieval-augmented generation", "transformer architecture", "LLM fine-tuning" |

### YMYL extra requirements

For health, finance, legal, security topics — go further:

- Add `hasCredential` with the actual certification:
  ```ts
  hasCredential: {
    '@type': 'EducationalOccupationalCredential',
    credentialCategory: 'Professional Certification',
    name: 'CISSP',
    recognizedBy: { '@type': 'Organization', name: 'ISC²' },
  }
  ```
- Link to a published bio with photo on a separate URL
- Cross-reference at minimum: LinkedIn, primary employer page, one third-party publication (book, peer-reviewed paper, named industry talk)
- For health/medical: link to PubMed author profile or NPI registry

### Verify

```bash
# 1. Schema validates
curl -s https://example.com/blog/your-post | \
  pup 'script[type="application/ld+json"] text{}' | \
  jq '.author'

# 2. Cross-references resolve and link back
# Manually verify: does janedoe.dev mention "My App, Inc."?
# Does linkedin.com/in/janedoe list "My App" as employer?
# These two-way links are what AI systems corroborate.
```

### Anti-patterns

- **Pen names without identity verification** — LLMs heavily downrank pseudonymous YMYL content. Use real names or accept the cost.
- **Multiple aliases for the same author across articles** — pick one canonical name per author and stick to it
- **AI-written content attributed to a human** — when LLMs detect the mismatch (perplexity, sentence-length distribution, Burstiness), they downrank the entire site

Reference: [Schema.org `Person`](https://schema.org/Person) · [Google E-E-A-T](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) · [`nuxt-schema-org`](https://nuxtseo.com/docs/schema-org) · sibling skill `nuxt-seo-best-practices`
