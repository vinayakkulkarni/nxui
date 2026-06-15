# Nuxt GEO Best Practices - Complete Reference

> This file is auto-generated. Do not edit directly.
> Edit individual rule files in the `rules/` directory and run `bun run build`.

# Nuxt GEO Best Practices

Comprehensive Generative Engine Optimization guide for Nuxt 4 applications. Designed to maximize your brand's citation rate inside AI-generated answers from ChatGPT, Google AI Overviews / AI Mode, Perplexity, Claude, and Gemini. Contains 14 rules across 4 categories, prioritized by evidence-backed impact.

## When to Apply

Reference these guidelines when:

- Setting up `llms.txt` and `llms-full.txt` for AI agent discovery
- Allowlisting (or blocking) AI crawlers in `robots.txt` (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.)
- Structuring page content for retrieval-augmented generation (RAG) extractability
- Adding entity clarity via Organization, Person, FAQPage, or HowTo JSON-LD schemas
- Applying the GEO arxiv paper's evidence-backed levers: **statistics, citations, quotations** (+30-40% visibility lift)
- Building a `usePageGeo` composable for per-page AI-friendly meta
- Ensuring AI crawlers see SSR-rendered HTML (not a JavaScript shell)
- Generating an AI-friendly XML sitemap and `sitemap_index.xml`

## Recommended Nuxt Modules

This skill is built for **Nuxt 4** apps. Several rules below show both a "from-scratch" Nitro-route implementation and the equivalent module-based shortcut. Strongly consider installing these — they remove a lot of boilerplate and stay in sync with Nuxt's official patterns:

- **[`@nuxtjs/seo`](https://github.com/harlan-zw/nuxt-seo)** by Harlan Wilton — meta-module that bundles `@nuxtjs/sitemap`, `@nuxtjs/robots`, `nuxt-schema-org`, `nuxt-og-image`, `nuxt-link-checker`, and `nuxt-seo-utils`. Covers most GEO infrastructure (robots.txt, sitemap, JSON-LD, meta) with one install.
- **[`@nuxtjs/sitemap`](https://nuxtseo.com/docs/sitemap)** — auto-generated sitemap with per-page `lastmod`, hreflang, and exclusions.
- **[`@nuxtjs/robots`](https://nuxtseo.com/docs/robots)** — programmatic `robots.txt` with per-route control and AI bot allow/disallow rules.
- **[`nuxt-schema-org`](https://nuxtseo.com/docs/schema-org)** — type-safe JSON-LD via `defineOrganization`, `defineWebSite`, `defineFaqPage`, `defineHowTo`, `definePerson`, `defineArticle`.
- **[`nuxt-og-image`](https://nuxtseo.com/docs/og-image)** — for OG/share images (covered in the sibling `nuxt-seo-best-practices` skill — note CF Workers caveat there).

### Official Nuxt SEO Meta docs

Nuxt 4 ships first-class SEO/meta primitives. Read these before reinventing anything:

- **[Nuxt 4 SEO & Meta](https://nuxt.com/docs/4.x/getting-started/seo-meta)** — `useSeoMeta`, `useHead`, `useServerSeoMeta`, `definePageMeta`, the `<Head>` / `<Title>` / `<Meta>` components, and route-level `head` config.
- **[`useSeoMeta`](https://nuxt.com/docs/4.x/api/composables/use-seo-meta)** — typed wrapper around `useHead({ meta: [...] })` with full IntelliSense for OG/Twitter tags.
- **[`useHead`](https://nuxt.com/docs/4.x/api/composables/use-head)** — generic head manager (used here for JSON-LD `script` injection).

The `usePageGeo` composable in `page-use-page-geo.md` is a thin wrapper over these primitives; it is **not** a replacement for them.

## Evidence Base

These rules synthesize:

1. **GEO: Generative Engine Optimization** (Aggarwal et al., KDD 2024, arXiv:2311.09735) — the foundational paper that benchmarked 9 optimization methods across 10K queries. Key findings adopted here:
   - Statistics, Citations, and Quotations boost visibility **by up to 40%**
   - Authoritative tone and Fluency optimization show moderate gains
   - **Keyword stuffing (classic SEO) FAILS on generative engines** — do not bring SEO keyword density habits into GEO
2. **Industry GEO playbooks** (Search Engine Land, Semrush AI Visibility Index, Backlinko) — entity clarity, multi-platform presence, sentiment, and measurement frameworks observed across 2,500+ tracked prompts on Google AI Mode and ChatGPT.

## Rule Categories by Priority

| Priority | Category                                 | Impact   | Prefix     |
| -------- | ---------------------------------------- | -------- | ---------- |
| 1        | Content Extractability (the +40% levers) | CRITICAL | `content-` |
| 2        | AI Crawler & Discovery                   | CRITICAL | `ai-`      |
| 3        | Entity Clarity                           | HIGH     | `entity-`  |
| 4        | Page-Level GEO                           | HIGH     | `page-`    |

## Quick Reference

### 1. Content Extractability (CRITICAL)

These are the evidence-backed +30-40% visibility levers from the GEO arxiv paper. If you only do three things, do these three.

- `content-statistics` — Add quantitative statistics (the single highest-lift change measured)
- `content-citations` — Add inline citations to credible sources (Sources component pattern)
- `content-quotations` — Add quotations from authoritative figures
- `content-self-contained-chunks` — Write paragraphs that retain meaning when extracted (RAG retrieval)
- `content-no-keyword-stuffing` — DO NOT bring SEO keyword stuffing into GEO; it actively hurts visibility

### 2. AI Crawler & Discovery (CRITICAL)

If AI crawlers can't access your content, none of the other rules matter.

- `ai-llms-txt` — Generate `llms.txt` and `llms-full.txt` via Nitro server routes
- `ai-robots-allowlist` — Explicitly allow GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.
- `ai-ssr-for-crawlers` — Ensure AI crawlers receive rendered HTML, not a JS shell
- `ai-sitemap` — Generate AI-friendly XML sitemap with `lastmod` for fresh-content signals

### 3. Entity Clarity (HIGH)

Help AI systems disambiguate WHO you are, WHAT category you belong to, and WHAT you're authoritative for.

- `entity-organization-schema` — Site-wide Organization JSON-LD with `sameAs` cross-references
- `entity-faq-howto-schema` — FAQPage and HowTo schemas for the question-shaped queries LLMs love
- `entity-author-schema` — Person schema with credentials and `sameAs` for E-E-A-T

### 4. Page-Level GEO (HIGH)

- `page-use-page-geo` — Reusable `usePageGeo` composable for per-page GEO meta
- `page-canonical-and-fresh` — Canonical URL + `dateModified` for content freshness signals

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/content-statistics.md
rules/ai-llms-txt.md
rules/_sections.md
```

Each rule file contains:

- Brief explanation of why it matters (with arxiv evidence where applicable)
- Incorrect code example with explanation
- Correct Nuxt-specific code example
- Additional context, measurement notes, and references

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`

---

# Detailed Rules

### Generate llms.txt and llms-full.txt via Nitro Server Routes

**Impact:** CRITICAL - Direct discovery hint for ChatGPT, Claude, Perplexity agents that look for /llms.txt before crawling

## Generate `llms.txt` and `llms-full.txt` via Nitro Server Routes

[`llms.txt`](https://llmstxt.org) is a fast-emerging standard (proposed by Jeremy Howard, Sept 2024) that gives LLMs and AI agents a **curated, markdown-formatted index** of your site's most important content. ChatGPT (with browse), Claude (with web search), and Perplexity all increasingly check for `/llms.txt` before falling back to general crawling.

Two files are recommended:

- **`/llms.txt`** — short index (links to your most important pages, with one-line descriptions)
- **`/llms-full.txt`** — full plaintext content of your most important pages (so the LLM can ingest in one round trip)

**Incorrect (no llms.txt — relying on general crawl):**

```
# ❌ WRONG — site has no /llms.txt; AI agents have to crawl your full HTML and JS.
# Result: agents may miss your best pages or hit JS-rendering issues.
$ curl https://your-site.com/llms.txt
404 Not Found
```

**Correct (Nitro server routes that emit both files):**

```ts
// server/routes/llms.txt.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.baseUrl || 'https://example.com';

  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8');
  setResponseHeader(
    event,
    'Cache-Control',
    'public, max-age=3600, s-maxage=3600',
  );

  return `# My App

> One-sentence value proposition. What you do, for whom, and the standout fact.

My App helps Nuxt developers ship faster by [doing X]. Founded 2024. Serving 12,000+ teams.

## Docs

- [Getting Started](${baseUrl}/docs/getting-started): 5-minute setup guide for Nuxt 4 + My App
- [API Reference](${baseUrl}/docs/api): Full TypeScript-typed API surface
- [Migration from v1](${baseUrl}/docs/migration): Breaking changes and upgrade path

## Guides

- [Authentication patterns](${baseUrl}/guides/auth): JWT, session, OAuth, and Better Auth integration
- [Deployment to Cloudflare](${baseUrl}/guides/cloudflare): Production-ready Workers config
- [SEO and GEO setup](${baseUrl}/guides/seo-geo): Both classic SEO and AI-search optimization

## Reference

- [Pricing](${baseUrl}/pricing): Plans, limits, and per-seat costs
- [Changelog](${baseUrl}/changelog): All releases since 2024-01

## Optional

- [Blog](${baseUrl}/blog): Engineering posts, case studies
- [Community](${baseUrl}/community): Discord, GitHub Discussions
`;
});
```

```ts
// server/routes/llms-full.txt.ts
// Full plaintext dump of your most important pages — what an LLM ingests
// in a single round trip. Build at request time from your CMS or
// pre-generate at build time for performance.

import { renderToString } from 'vue/server-renderer';

const PRIORITY_ROUTES = [
  '/',
  '/docs/getting-started',
  '/docs/api',
  '/guides/auth',
  '/guides/cloudflare',
  '/pricing',
];

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8');
  setResponseHeader(
    event,
    'Cache-Control',
    'public, max-age=3600, s-maxage=3600',
  );

  const config = useRuntimeConfig();
  const baseUrl = config.public.baseUrl || 'https://example.com';

  const sections = await Promise.all(
    PRIORITY_ROUTES.map(async (path) => {
      // Fetch each route's rendered HTML, then strip to plaintext.
      // Replace this with your CMS / content store lookup if available.
      const html = await $fetch<string>(`${baseUrl}${path}`, {
        headers: { Accept: 'text/html' },
      }).catch(() => '');

      const plain = htmlToPlaintext(html);
      return `# ${baseUrl}${path}\n\n${plain}\n\n---\n`;
    }),
  );

  return `# My App — Full Content Index for LLMs\n\nGenerated: ${new Date().toISOString()}\n\n${sections.join('\n')}`;
});

function htmlToPlaintext(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
```

### Module-based shortcut

If you don't want to hand-roll the Nitro routes, the [`nuxt-llms`](https://github.com/nuxt-modules/llms) module (and similar community modules) auto-generate both files from your Nuxt Content collections. It also integrates cleanly with the `@nuxtjs/seo` umbrella.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-llms'],
  llms: {
    domain: 'https://example.com',
    title: 'My App',
    description: 'Short value prop sentence.',
    full: { title: 'My App — Full Content' },
  },
});
```

### `llms.txt` formatting rules (per spec)

1. **`# Title`** — site name (H1, exactly one)
2. **`> Summary`** — one-paragraph blockquote
3. Free prose (optional)
4. **`## Section`** headers grouping links
5. Each link line: `- [Title](URL): one-line description`
6. **`## Optional`** — last section, links here can be skipped if context budget is tight

Spec: <https://llmstxt.org>

### Verify it's reachable

```bash
curl -sI https://your-site.com/llms.txt | head -3
# HTTP/2 200
# content-type: text/plain; charset=utf-8
# cache-control: public, max-age=3600

curl -s https://your-site.com/llms-full.txt | wc -c
# Should be 50,000-500,000 bytes for a small-to-mid site
```

### Test that ChatGPT/Claude can fetch it

Open ChatGPT and prompt: _"Fetch https://your-site.com/llms.txt and summarize the most important pages."_ If it returns the structured index, you're set.

### When to update

- After every meaningful content addition (new doc page, new product launch)
- Set `lastmod`-style timestamps in `llms-full.txt` so freshness signals propagate
- Don't overdo it — `llms.txt` is meant to be **curated**, not a sitemap dump (use `ai-sitemap` for that)

Reference: [llms.txt spec](https://llmstxt.org) · [`nuxt-llms` module](https://github.com/nuxt-modules/llms) · [Nuxt server routes](https://nuxt.com/docs/4.x/guide/directory-structure/server)

---

### Explicitly Allowlist (or Block) AI Crawlers in robots.txt

**Impact:** CRITICAL - Without explicit allow rules, conservative AI crawlers (Google-Extended, Applebot-Extended) won't index your site for AI answers

## Explicitly Allowlist (or Block) AI Crawlers in `robots.txt`

AI crawlers fall into two camps:

1. **Aggressive** — index unless explicitly blocked (GPTBot, PerplexityBot)
2. **Conservative** — only index when explicitly allowed, separate from regular search crawlers (Google-Extended, Applebot-Extended)

If you do nothing, you'll be in **GPTBot/PerplexityBot but invisible to Google AI Overviews and Apple Intelligence**. You need explicit policy for both groups.

**Incorrect (no AI crawler policy):**

```
# ❌ WRONG — public/robots.txt with only generic rules
User-agent: *
Allow: /

# Result:
# - Google-Extended: BLOCKED by default (Google's separation of AI vs Search)
# - Applebot-Extended: BLOCKED by default
# - GPTBot, ClaudeBot, PerplexityBot: allowed (which may or may not be what you want)
```

**Correct (explicit policy for every major AI crawler):**

```
# ✅ CORRECT — public/robots.txt with explicit AI crawler rules
# Or generate this dynamically via @nuxtjs/robots (see below)

# Default for all crawlers
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/internal/

# === AI / LLM crawlers — explicitly allow ===

# OpenAI ChatGPT (browse + GPTs)
User-agent: GPTBot
Allow: /
Disallow: /admin/
Disallow: /api/internal/

# OpenAI ChatGPT user-initiated browsing
User-agent: ChatGPT-User
Allow: /

# Anthropic Claude (web search, browsing, training)
User-agent: ClaudeBot
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: Claude-Web
Allow: /

# Perplexity
User-agent: PerplexityBot
Allow: /
User-agent: Perplexity-User
Allow: /

# Google AI (separate from Googlebot — required for AI Overviews / AI Mode / Gemini)
User-agent: Google-Extended
Allow: /

# Apple Intelligence / Apple AI
User-agent: Applebot-Extended
Allow: /

# Common Crawl (training data for many LLMs)
User-agent: CCBot
Allow: /

# Bytedance / Doubao
User-agent: Bytespider
Allow: /

# Meta AI
User-agent: meta-externalagent
Allow: /
User-agent: FacebookBot
Allow: /

# Cohere
User-agent: cohere-ai
Allow: /

# === Sitemaps ===
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap_index.xml
```

### Module-based (recommended) — `@nuxtjs/robots`

Hand-editing `public/robots.txt` is fragile (no per-environment control, no per-route rules). Use [`@nuxtjs/robots`](https://nuxtseo.com/docs/robots) — included in the `@nuxtjs/seo` umbrella:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/robots'], // or ['@nuxtjs/seo'] for the full bundle

  site: {
    url: 'https://example.com',
  },

  robots: {
    // Block crawling on staging/preview deployments automatically
    enabled: process.env.NUXT_PUBLIC_ENV === 'production',

    // Default rule for all bots
    disallow: ['/admin', '/api/internal'],

    // Per-bot rules for AI crawlers
    groups: [
      {
        userAgent: ['GPTBot', 'ChatGPT-User'],
        allow: ['/'],
        disallow: ['/admin', '/api/internal'],
      },
      {
        userAgent: ['ClaudeBot', 'anthropic-ai', 'Claude-Web'],
        allow: ['/'],
      },
      {
        userAgent: ['PerplexityBot', 'Perplexity-User'],
        allow: ['/'],
      },
      {
        userAgent: ['Google-Extended', 'Applebot-Extended'],
        allow: ['/'],
      },
      {
        userAgent: ['CCBot', 'Bytespider', 'meta-externalagent', 'cohere-ai'],
        allow: ['/'],
      },
    ],

    sitemap: ['https://example.com/sitemap.xml'],
  },
});
```

### Per-route blocking with `defineRobotMeta` / `useRobotsRule`

Block specific pages from AI crawlers without touching `robots.txt`:

```vue
<!-- pages/private-internal-doc.vue -->
<script setup lang="ts">
  // With @nuxtjs/robots installed — emits <meta name="robots" content="noindex">
  useRobotsRule({ index: false, follow: false });
</script>
```

### Decision matrix — should you allow AI crawlers?

| Site type                            | Recommendation                                            |
| ------------------------------------ | --------------------------------------------------------- |
| Marketing site, docs, blog           | **Allow all** — being cited in AI answers is the goal     |
| Open-source project                  | **Allow all** — drives developer adoption                 |
| Paywalled content (news, research)   | **Allow GPTBot/Claude only on free pages**, disallow paid |
| Internal tool, customer dashboard    | **Disallow all** AI crawlers + classic crawlers           |
| User-generated content with PII risk | **Disallow** until you've audited what's exposed          |

### Verify the policy is live

```bash
# Check the served file
curl -s https://your-site.com/robots.txt

# Check a specific bot's view (some servers vary by User-Agent)
curl -s -A "GPTBot" https://your-site.com/robots.txt
curl -s -A "Google-Extended" https://your-site.com/robots.txt

# Confirm AI crawlers are actually visiting (after 1-2 weeks)
# Cloudflare: Analytics → Bots → AI Bots tab
# Vercel: Logs filter by user-agent
```

### Crawler reference list (current as of 2026)

| Crawler            | User-Agent                                | What it powers                                          |
| ------------------ | ----------------------------------------- | ------------------------------------------------------- |
| GPTBot             | `GPTBot`                                  | ChatGPT browse + training                               |
| ChatGPT-User       | `ChatGPT-User`                            | User-initiated ChatGPT browsing                         |
| ClaudeBot          | `ClaudeBot`, `anthropic-ai`, `Claude-Web` | Claude web search + training                            |
| PerplexityBot      | `PerplexityBot`, `Perplexity-User`        | Perplexity search                                       |
| Google-Extended    | `Google-Extended`                         | Gemini, AI Overviews, AI Mode (separate from Googlebot) |
| Applebot-Extended  | `Applebot-Extended`                       | Apple Intelligence (separate from Applebot)             |
| CCBot              | `CCBot`                                   | Common Crawl (used by many LLMs)                        |
| Bytespider         | `Bytespider`                              | ByteDance / Doubao                                      |
| meta-externalagent | `meta-externalagent`, `FacebookBot`       | Meta AI                                                 |
| cohere-ai          | `cohere-ai`                               | Cohere                                                  |

Reference: [`@nuxtjs/robots`](https://nuxtseo.com/docs/robots) · [OpenAI GPTBot docs](https://platform.openai.com/docs/gptbot) · [Google-Extended announcement](https://blog.google/technology/ai/an-update-on-web-publisher-controls/) · [darkvisitors.com](https://darkvisitors.com) (live AI crawler list)

---

### Generate an AI-Friendly XML Sitemap with Freshness Signals

**Impact:** HIGH - Sitemaps with accurate lastmod help AI crawlers prioritize fresh content and avoid stale citations

## Generate an AI-Friendly XML Sitemap with Freshness Signals

AI crawlers respect `sitemap.xml` the same way classic search crawlers do, with one extra emphasis: **`<lastmod>` is a strong freshness signal**. Generative engines prefer to cite recent content (especially for time-sensitive queries like "best X in 2026"), so an accurate, well-maintained sitemap directly improves citation rate.

**Incorrect (no sitemap or stale `lastmod`):**

```xml
<!-- ❌ WRONG — no sitemap means AI crawlers rely on link discovery only -->
<!-- /sitemap.xml → 404 -->
```

```xml
<!-- ❌ ALSO WRONG — every URL has the same hardcoded lastmod -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-01</lastmod> <!-- stale by 2 years -->
  </url>
  <url>
    <loc>https://example.com/blog/post-1</loc>
    <lastmod>2024-01-01</lastmod> <!-- same date for everything -->
  </url>
</urlset>
```

**Correct (module-based, per-URL accurate `lastmod`):**

```ts
// nuxt.config.ts — using @nuxtjs/sitemap (bundled in @nuxtjs/seo)
export default defineNuxtConfig({
  modules: ['@nuxtjs/sitemap'], // or ['@nuxtjs/seo'] for the umbrella

  site: {
    url: 'https://example.com',
  },

  sitemap: {
    // Auto-discovered routes from your pages/ + content/ directories
    autoLastmod: true, // uses file mtime / Content frontmatter as fallback

    // Exclude private routes
    exclude: ['/admin/**', '/preview/**', '/api/**'],

    // Group large sites into a sitemap_index.xml + per-section sitemaps
    sitemaps: {
      pages: {
        include: ['/'],
        exclude: ['/blog/**', '/docs/**'],
      },
      blog: {
        include: ['/blog/**'],
      },
      docs: {
        include: ['/docs/**'],
      },
    },

    // For dynamic routes, provide a fetcher that emits accurate lastmod
    sources: ['/api/__sitemap__/blog'],
  },
});
```

```ts
// server/api/__sitemap__/blog.ts
// Provide per-post URLs with accurate lastmod from your CMS / DB
export default defineEventHandler(async () => {
  const posts = await fetchAllPosts();

  return posts.map((post) => ({
    loc: `/blog/${post.slug}`,
    lastmod: post.updatedAt, // ISO 8601, e.g. "2026-04-15T10:30:00Z"
    changefreq: 'monthly',
    priority: 0.8,
  }));
});
```

### Hand-rolled (no module) — use only if you have an unusual setup

If you can't install the module, you can still emit a sitemap from a Nitro route:

```ts
// server/routes/sitemap.xml.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.baseUrl || 'https://example.com';

  const posts = await fetchAllPosts(); // your CMS / DB fetcher

  const urls = [
    { loc: '/', lastmod: new Date().toISOString(), priority: 1.0 },
    { loc: '/pricing', lastmod: new Date().toISOString(), priority: 0.9 },
    ...posts.map((p) => ({
      loc: `/blog/${p.slug}`,
      lastmod: p.updatedAt,
      priority: 0.8,
    })),
  ];

  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8');
  setResponseHeader(
    event,
    'Cache-Control',
    'public, max-age=3600, s-maxage=3600',
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;
});
```

### `lastmod` accuracy matters — don't fake it

| Behavior                                        | Effect                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| Accurate per-URL `lastmod` from CMS/DB          | **Best** — crawlers prioritize fresh content correctly              |
| File mtime (auto-detected by `@nuxtjs/sitemap`) | **Good** — works for static content, slightly noisy if you reformat |
| `lastmod = build time` for everything           | **Bad** — every URL looks "fresh", crawlers ignore the signal       |
| No `lastmod` at all                             | **Bad** — crawlers fall back to their own heuristics                |

### Reference the sitemap from `robots.txt`

Already covered in `ai-robots-allowlist`, but worth re-stating:

```
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap_index.xml
```

### Verify

```bash
# 1. Sitemap is reachable and well-formed
curl -s https://example.com/sitemap.xml | xmllint --noout - && echo "✓ valid XML"

# 2. lastmod values are recent for content you just edited
curl -s https://example.com/sitemap.xml | grep -A1 'blog/your-recent-post' | grep lastmod

# 3. URL count matches your published content
curl -s https://example.com/sitemap.xml | grep -c '<loc>'
```

### Submit to AI crawlers (where supported)

- **Google**: Search Console → Sitemaps → submit `https://example.com/sitemap.xml`. Google-Extended uses the same sitemap as Googlebot.
- **Bing**: Bing Webmaster Tools → submit (powers ChatGPT for some web queries via the Bing index).
- **Perplexity/Anthropic/OpenAI**: No public submission portals; they discover via `robots.txt` `Sitemap:` directive.

Reference: [`@nuxtjs/sitemap`](https://nuxtseo.com/docs/sitemap) · [Sitemap Protocol 0.9](https://www.sitemaps.org/protocol.html) · [Google sitemap docs](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)

---

### Ensure AI Crawlers Receive SSR HTML, Not a JavaScript Shell

**Impact:** CRITICAL - Many AI crawlers don't execute JavaScript — a CSR/SPA Nuxt build returns an empty shell and gets zero AI citations

## Ensure AI Crawlers Receive SSR HTML, Not a JavaScript Shell

Unlike Googlebot (which renders JS), most AI crawlers — GPTBot, ClaudeBot, PerplexityBot, Bytespider — **do not execute JavaScript**. They fetch the raw HTML response and ingest whatever text is present at that moment. If your Nuxt app is configured for client-side rendering (CSR/SPA mode), those crawlers see this:

```html
<!-- What an AI crawler sees on a CSR Nuxt build -->
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
  </head>
  <body>
    <div id="__nuxt"></div>
    <script src="/_nuxt/entry.js"></script>
  </body>
</html>
```

That is **zero indexable content**. Your AI citation rate will be zero.

**Incorrect (SPA mode or accidentally disabled SSR):**

```ts
// ❌ WRONG — SPA mode disables SSR globally
export default defineNuxtConfig({
  ssr: false, // <- KILLS GEO. AI crawlers see empty <div id="__nuxt"></div>.
});
```

```ts
// ❌ ALSO WRONG — large client-only sections wipe out the SSR'd HTML on hydration
// (less common, but happens when developers wrap the entire page in <ClientOnly>)
```

```vue
<!-- pages/index.vue — ❌ WRONG -->
<template>
  <ClientOnly>
    <!-- Entire page content client-only — AI crawlers see nothing -->
    <HomeHero />
    <HomeFeatures />
    <HomePricing />
  </ClientOnly>
</template>
```

**Correct (SSR enabled, content rendered server-side):**

```ts
// ✅ CORRECT — SSR is the Nuxt 4 default, leave it on
export default defineNuxtConfig({
  // ssr: true is the default — don't override unless you have a strong reason
  ssr: true,

  // Better: prerender your most important pages at build time so AI crawlers
  // get a static HTML response (zero cold-start latency, zero render cost)
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/docs', '/pricing', '/blog'],
    },
  },

  // Hybrid rendering for the rest (per-route control)
  routeRules: {
    '/': { prerender: true },
    '/blog/**': { prerender: true },
    '/docs/**': { prerender: true },
    '/pricing': { prerender: true },
    '/dashboard/**': { ssr: false }, // app shell — AI crawlers don't need this
    '/api/**': { cors: true },
  },
});
```

```vue
<!-- ✅ CORRECT — only narrow widgets are <ClientOnly>, rest is SSR'd -->
<template>
  <article>
    <h1>{{ post.title }}</h1>
    <p class="lede">{{ post.summary }}</p>

    <!-- This text is SSR'd → AI crawlers see it -->
    <ContentRenderer :value="post" />

    <!-- Only the comment widget is client-only -->
    <ClientOnly>
      <CommentWidget :post-id="post.id" />
    </ClientOnly>
  </article>
</template>
```

### Quick test — what does an AI crawler actually see?

```bash
# Simulate a JS-disabled crawler (what GPTBot/ClaudeBot see)
curl -s -A "GPTBot/1.0" https://your-site.com/blog/my-post | \
  pup 'article text{}' | \
  head -50

# If this returns your article body → ✅ SSR is working
# If this returns "" or a one-line title only → ❌ content is JS-rendered
```

```bash
# Inspect raw HTML byte size — empty SPA shells are typically < 5KB
curl -s https://your-site.com/blog/my-post | wc -c
# Healthy SSR'd page: 30,000 - 200,000 bytes
# Empty SPA shell:     < 5,000 bytes
```

### When SSR isn't enough — add prerender for AI crawler perf

Even with SSR, an AI crawler hitting a cold Cloudflare Worker may time out (some crawlers give up at 5 seconds). Prerender your top pages so the response is a pre-baked HTML file:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
      routes: ['/sitemap.xml', '/llms.txt', '/llms-full.txt'],
    },
  },
});
```

### `useFetch` SSR safety — make sure server-fetched data renders

A subtle bug: if you use `useFetch` with `{ server: false }`, the data is only fetched on the client — AI crawlers see no content:

```vue
<!-- ❌ WRONG — { server: false } means SSR has no data → empty page for AI -->
<script setup lang="ts">
  const { data } = await useFetch('/api/posts', { server: false });
</script>
```

```vue
<!-- ✅ CORRECT — default behavior fetches on server, hydrates on client -->
<script setup lang="ts">
  const { data: posts } = await useFetch('/api/posts');
  // posts is populated server-side → AI crawler sees the rendered list
</script>

<template>
  <ul>
    <li v-for="p in posts" :key="p.id">
      <NuxtLink :to="`/posts/${p.slug}`">{{ p.title }}</NuxtLink>
    </li>
  </ul>
</template>
```

### `<ClientOnly>` is fine for widgets — bad for content

| Component type                               | `<ClientOnly>` OK?              |
| -------------------------------------------- | ------------------------------- |
| Article body, product description, FAQ       | **No** — must be SSR'd          |
| Headings, navigation, footer links           | **No** — must be SSR'd          |
| Pricing tables, feature comparisons          | **No** — must be SSR'd          |
| Comment widget, live chat, analytics         | **Yes** — AI doesn't need these |
| Date/time pickers, charts that need `window` | **Yes**                         |
| Auth-gated dashboard widgets                 | **Yes**                         |

### What about prerender + ISR?

Cloudflare Pages and Vercel both support hybrid prerender + ISR. AI crawlers benefit because they hit a CDN-cached HTML response with sub-50ms TTFB, which means crawlers don't time out and they get the **freshest** version (revalidated periodically).

```ts
routeRules: {
  '/blog/**': {
    prerender: true,        // build-time HTML
    swr: 3600,              // serve stale for 1h, revalidate
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  },
},
```

Reference: [Nuxt 4 Rendering Modes](https://nuxt.com/docs/4.x/guide/concepts/rendering) · [Nitro Prerender](https://nitro.unjs.io/config#prerender) · [Nuxt `<ClientOnly>`](https://nuxt.com/docs/4.x/api/components/client-only) · [Nuxt SEO docs](https://nuxt.com/docs/4.x/getting-started/seo-meta) · sibling skill `nuxt-best-practices` (rendering modes section)

---

### Add Inline Citations to Credible Sources

**Impact:** CRITICAL - Boosts AI citation rate by ~30-40% per the GEO arxiv paper; signals authority to LLM rerankers

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

---

### NEVER Bring Classic SEO Keyword Stuffing into GEO

**Impact:** CRITICAL - Keyword Stuffing was empirically shown to FAIL on generative engines per the GEO arxiv paper — it can actively reduce visibility

## NEVER Bring Classic SEO Keyword Stuffing into GEO

The GEO paper (arXiv:2311.09735) explicitly tested **Keyword Stuffing** as one of its 9 optimization methods. The result: it was **one of the worst-performing strategies**, often producing **negative or near-zero lift** on visibility. This is a **hard reversal** of one of classical SEO's oldest tactics.

Why it fails on generative engines:

1. **LLMs read semantically, not lexically.** Repeating "best Nuxt hosting" 14 times doesn't increase semantic relevance — it just creates a chunk the embedding model treats as low-information.
2. **Stuffed text breaks the "self-contained chunk" principle** (`content-self-contained-chunks`) — the chunk loses meaning when extracted because it's all keyword padding.
3. **Anti-spam classifiers in retrieval pipelines actively downrank** keyword-stuffed pages. Both Perplexity and Google AI Overviews surface this as a quality signal.

**Incorrect (SEO-era keyword stuffing — DO NOT DO THIS):**

```vue
<!-- ❌ WRONG — reads like 2012 SEO; LLMs ignore or downrank this -->
<script setup lang="ts">
  usePageSeo({
    title: 'Best Nuxt Hosting | Cheap Nuxt Hosting | Nuxt Hosting Reviews',
    description:
      'Looking for the best Nuxt hosting? Compare cheap Nuxt hosting providers. Find affordable Nuxt hosting solutions and Nuxt hosting deals.',
    path: '/best-nuxt-hosting',
  });
</script>

<template>
  <article>
    <h1>Best Nuxt Hosting in 2026</h1>
    <p>
      When choosing the best Nuxt hosting, you need a Nuxt hosting provider that
      offers cheap Nuxt hosting with great Nuxt hosting features. Our Nuxt
      hosting reviews compare top Nuxt hosting solutions for Nuxt hosting buyers
      looking for affordable Nuxt hosting in 2026.
    </p>
    <h2>Top 10 Nuxt Hosting Providers</h2>
    <!-- ...repeated keyword soup... -->
  </article>
</template>
```

**Correct (entity-rich, statistic-backed, naturally varied language):**

```vue
<!-- ✅ CORRECT — names entities once, uses statistics, varies vocabulary -->
<script setup lang="ts">
  usePageGeo({
    title:
      'Where to Deploy a Nuxt 4 App in 2026 — Cloudflare, Vercel, Netlify, AWS Compared',
    description:
      'Cold-start latency, pricing per million requests, and DX comparison for the four most-used deployment targets for Nuxt 4 apps.',
    path: '/blog/nuxt-deployment-comparison',
    type: 'Article',
    datePublished: '2026-04-01',
  });
</script>

<template>
  <article>
    <h1>Where to Deploy a Nuxt 4 App in 2026</h1>

    <p class="lede">
      Cloudflare Pages leads on cold-start latency (<strong>~50ms</strong>) and
      free-tier generosity. Vercel leads on DX and Nuxt-team coordination.
      Netlify and AWS Amplify trail on both axes for typical Nuxt 4 workloads.
    </p>

    <h2>Cloudflare Pages — best cold-start latency under load</h2>
    <p>
      Cloudflare Pages serves Nuxt 4 apps from
      <strong>300+ edge locations</strong> with median cold starts of
      <strong>~50ms</strong> measured across 1,000 synthetic invocations. The
      free tier includes <strong>100,000 daily requests</strong> and unmetered
      bandwidth.
    </p>

    <h2>Vercel — best DX, tightest Nuxt integration</h2>
    <p>
      Vercel ships first-party Nuxt presets and is co-maintained with the Nuxt
      core team. Cold starts average <strong>~120ms</strong> on the Edge
      Runtime; the Hobby tier covers
      <strong>100GB-h serverless function execution</strong> per month.
    </p>
  </article>
</template>
```

### What replaces keyword stuffing for GEO

Classic SEO obsessed over keyword density (1-3%). GEO rewards different signals:

| Old (SEO)                                             | New (GEO)                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| Repeat target keyword 10-15 times                     | Mention each entity **once**, use synonyms naturally                            |
| Long-tail keyword variants in headings                | Descriptive declarative headings (see `content-self-contained-chunks`)          |
| Keyword in alt text, URL, meta description, H1, H2... | Entity in JSON-LD `Organization` / `Product` (see `entity-organization-schema`) |
| Latent Semantic Indexing (LSI) keyword stuffing       | Statistics + citations + quotations (the +40% trio)                             |

### Lexical variety is good — keyword obsession is bad

LLMs reward varied phrasing because it shows the content addresses the topic from multiple angles. Use synonyms:

| Stuffed             | Varied (GEO-friendly)                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| "Nuxt hosting" × 14 | "deploying Nuxt", "Nuxt deployment targets", "where to host a Nuxt 4 app", "production Nuxt infrastructure" |
| "best CRM" × 10     | "leading CRM platforms", "CRM tools for B2B sales", "customer relationship management software"             |

### Verification — count keyword density

```bash
# Quick density check — anything over 2-3% on a single phrase is suspect
curl -s https://your-site.com/post | \
  pup 'article text{}' | \
  tr '[:upper:]' '[:lower:]' | \
  grep -oE '\bnuxt hosting\b' | \
  wc -l
```

If a single 2-3 word phrase appears more than 3-4 times in a 1,000-word article, rewrite.

### Related anti-patterns to also avoid

- **Doorway pages** (one page per keyword variation) — LLMs deduplicate aggressively; you'll lose all of them
- **Hidden text / `display: none` keyword padding** — modern crawlers strip these
- **AI-generated keyword filler paragraphs** — LLMs detect their own slop and downrank it (yes, really)

Reference: [GEO Paper §3.3 + Table 2](https://arxiv.org/abs/2311.09735) (Keyword Stuffing row, near-zero or negative lift across most domains)

---

### Add Quotations from Authoritative Figures

**Impact:** CRITICAL - Boosts AI citation rate by ~30-40% per the GEO arxiv paper, especially in opinion/debate domains

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

---

### Write Self-Contained Paragraphs That Survive RAG Chunking

**Impact:** CRITICAL - Determines whether your passage gets retrieved at all by RAG-based engines (Perplexity, AI Overviews, ChatGPT browse)

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

---

### Add Quantitative Statistics — The Single Highest-Lift GEO Change

**Impact:** CRITICAL - Boosts AI citation rate by up to ~40% per the GEO arxiv paper (Aggarwal et al., KDD 2024)

## Add Quantitative Statistics — The Single Highest-Lift GEO Change

The GEO paper (arXiv:2311.09735) benchmarked 9 optimization methods across 10K queries. **"Statistics Addition"** — replacing qualitative discussion with concrete numbers wherever possible — was among the top-performing methods, with visibility boosts up to **40%** in generative engine responses. This effect was strongest in factual domains (science, history, finance, health).

LLMs preferentially extract specific, quotable numerical claims because they reduce hallucination risk for the model, anchor the answer to verifiable facts, and provide attribution-friendly snippets the model can cite back to your URL.

**Incorrect (qualitative-only content):**

```vue
<!-- ❌ WRONG — vague, not extractable, no numbers AI can lift -->
<script setup lang="ts">
  usePageGeo({
    title: 'Why Nuxt is Fast',
    description: 'Nuxt is one of the fastest frameworks.',
    path: '/blog/nuxt-performance',
  });
</script>

<template>
  <article>
    <h1>Why Nuxt is Fast</h1>
    <p>
      Nuxt has become significantly faster in recent years. Many developers
      report better performance and faster builds. The hydration story has
      improved a lot.
    </p>
  </article>
</template>
```

**Correct (statistic-rich content with verifiable numbers):**

```vue
<!-- ✅ CORRECT — every claim has a number an LLM can extract and cite -->
<script setup lang="ts">
  usePageGeo({
    title: 'Why Nuxt is Fast',
    description:
      'Nuxt 4 ships ~30% smaller hydration payloads and 3-5x faster cold starts on Cloudflare Workers compared to Nuxt 3.',
    path: '/blog/nuxt-performance',
    type: 'Article',
    datePublished: '2026-04-01',
  });
</script>

<template>
  <article>
    <h1>Why Nuxt is Fast</h1>
    <p>
      Nuxt 4 ships <strong>~30% smaller hydration payloads</strong> than Nuxt 3
      thanks to selective hydration. On Cloudflare Workers, cold starts dropped
      from <strong>~250ms (Nuxt 3.10)</strong> to
      <strong>~50-80ms (Nuxt 4.0)</strong> — a
      <strong>3-5x improvement</strong> measured across 1,000 cold invocations.
    </p>
    <p>
      Build times improved by <strong>40-60%</strong> for medium-sized apps
      (200-500 components) after switching from Webpack to Vite + Rolldown.
    </p>
  </article>
</template>
```

### Reusable `<GeoStat>` component (recommended)

Make statistics first-class in your design system so authors stop writing fluff:

```vue
<!-- app/components/Geo/Stat.vue -->
<script setup lang="ts">
  defineProps<{
    value: string; // e.g. "40%", "3.5x", "$2.1B"
    label: string; // e.g. "visibility lift"
    source?: string; // e.g. "arXiv:2311.09735"
    sourceUrl?: string;
  }>();
</script>

<template>
  <figure class="geo-stat" itemscope itemtype="https://schema.org/Observation">
    <strong itemprop="value">{{ value }}</strong>
    <figcaption itemprop="description">
      {{ label }}
      <a v-if="sourceUrl" :href="sourceUrl" itemprop="citation"
        >— {{ source }}</a
      >
    </figcaption>
  </figure>
</template>
```

```vue
<!-- Usage in any page -->
<GeoStat
  value="40%"
  label="visibility lift from adding statistics"
  source="GEO Paper, KDD 2024"
  source-url="https://arxiv.org/abs/2311.09735"
/>
```

### What counts as a "statistic" for GEO

| Good                                  | Bad                              |
| ------------------------------------- | -------------------------------- |
| `~40%`, `3.5x`, `$2.1B`, `127ms`      | "significantly", "a lot", "many" |
| `7 of 10 developers`                  | "most developers"                |
| `Released 2024-11-15`                 | "recently released"              |
| `Reduced bundle size by 312KB (gzip)` | "smaller bundle"                 |

### Verification checklist

- [ ] Every paragraph in evergreen content contains at least one concrete number
- [ ] Numbers have units (%, ms, KB, $, x, year)
- [ ] Every statistic has a verifiable source (link or footnote) — see `content-citations`
- [ ] Statistics appear in the **first paragraph** of each section (front-loading helps RAG retrieval)

Reference: [GEO: Generative Engine Optimization (arXiv:2311.09735)](https://arxiv.org/abs/2311.09735) · Section 3.3 "GEO Methods" and Table 2 "Results"

---

### Person Schema with Credentials and sameAs for E-E-A-T

**Impact:** HIGH - Author entity reinforces authority signals that Google AI Overviews and Perplexity weight heavily in YMYL topics

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

---

### FAQPage and HowTo Schemas for the Question-Shaped Queries LLMs Love

**Impact:** HIGH - Question-format JSON-LD maps directly onto LLM prompt patterns; massively boosts AI Overview / AI Mode citation rate

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

---

### Site-Wide Organization JSON-LD with sameAs Cross-References

**Impact:** HIGH - Lets AI systems disambiguate your brand from similarly-named entities and corroborate identity from multiple sources

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

---

### Canonical URL + dateModified for Content Freshness Signals

**Impact:** HIGH - Freshness is a top-3 ranking signal for AI Overviews and Perplexity on time-sensitive queries

## Canonical URL + `dateModified` for Content Freshness Signals

Generative engines treat **content freshness as a major ranking signal**, especially for queries that imply currency:

- "best X in 2026"
- "latest version of Y"
- "what changed in Z"
- "current pricing for W"

Two signals together drive freshness perception:

1. **`dateModified` in JSON-LD** (`Article`, `BlogPosting`, `WebPage`) — the LLM reads this directly
2. **`<lastmod>` in sitemap.xml** — the crawler revisit signal

If your content is genuinely fresh but doesn't expose these, the LLM treats it as stale and prefers competitors with explicit `dateModified`.

**Incorrect (no freshness signals):**

```vue
<!-- ❌ WRONG — page may be updated weekly, but AI sees no signal -->
<script setup lang="ts">
  useSeoMeta({
    title: 'Best Vector Databases for RAG in 2026',
    description: 'Updated comparison of vector DBs.',
  });
  // No JSON-LD, no dateModified, no canonical
</script>
```

**Correct (canonical + dateModified + visible date):**

```vue
<!-- ✅ CORRECT — three layers of freshness signal -->
<script setup lang="ts">
  const post = await useFetch('/api/posts/best-vector-databases-2026').then(
    (r) => r.data.value,
  );

  usePageGeo({
    title: post.title,
    description: post.description,
    path: '/blog/best-vector-databases-2026',
    type: 'TechArticle',
    datePublished: post.publishedAt, // ISO 8601
    dateModified: post.updatedAt, // ISO 8601 — updated on every meaningful edit
    author: post.author,
  });
</script>

<template>
  <article>
    <h1>{{ post.title }}</h1>
    <p class="byline">
      <time :datetime="post.publishedAt">
        Published {{ formatDate(post.publishedAt) }}
      </time>
      <template v-if="post.updatedAt !== post.publishedAt">
        ·
        <time :datetime="post.updatedAt" class="updated">
          <strong>Updated {{ formatDate(post.updatedAt) }}</strong>
        </time>
      </template>
    </p>
    <!-- ...content... -->
  </article>
</template>
```

### Three layers of freshness — they all matter

| Layer                       | Where                                 | Audience                             |
| --------------------------- | ------------------------------------- | ------------------------------------ |
| 1. JSON-LD `dateModified`   | `<script type="application/ld+json">` | LLMs (GPTBot, ClaudeBot, Perplexity) |
| 2. Visible `<time>` element | Article header                        | Human users + LLMs that parse text   |
| 3. Sitemap `<lastmod>`      | `/sitemap.xml`                        | Crawler revisit scheduling           |

All three should reflect the **same `dateModified`**. Inconsistency confuses the LLM and reduces trust.

### Update `dateModified` on what counts as a "meaningful edit"

| Edit type                                               | Should bump `dateModified`?                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Fix typo, broken link                                   | Optional (no need to mislead crawlers)                                                                 |
| Add new section, update statistics                      | **Yes**                                                                                                |
| Republish with significant rewrite                      | **Yes** — also consider bumping `datePublished` if effectively a new article                           |
| Auto-rendered `formatDate(new Date())` on every request | **NO** — this is the worst anti-pattern; it makes everything look fake-fresh and the LLM will catch on |

### Anti-pattern: faking freshness with build-time timestamps

```vue
<!-- ❌ DO NOT DO THIS -->
<script setup lang="ts">
  usePageGeo({
    // ...
    dateModified: new Date().toISOString(), // every page rebuild "updates" everything
  });
</script>
```

This breaks the freshness signal across your entire site. AI crawlers compare `dateModified` patterns over time; if everything updates simultaneously on every deploy, the signal is treated as noise and discarded.

### Canonical URL — pair with freshness for full effect

Canonical URL prevents AI crawlers from indexing duplicates (`?utm_source=...`, `/post`, `/post/`, `https://www.example.com/post` vs `https://example.com/post`). Already covered in `usePageGeo`, but the basic rule:

```ts
useHead({
  link: [{ rel: 'canonical', href: `${baseUrl}${path}` }],
});
```

- Always **absolute** URL (with protocol + domain)
- Always **without** tracking query params
- Pick one form (with/without trailing slash) and stick to it
- Match this exactly with `og:url` and JSON-LD `url`

### Build-time vs runtime — when to compute `dateModified`

For **prerendered pages** (`routeRules: { prerender: true }`):

- Compute `dateModified` from your CMS / Markdown frontmatter / file mtime at build time
- Rebuild on content change (incremental builds work fine)

For **SSR pages** (live data):

- Pull `dateModified` from the database on each request
- Cache aggressively at the CDN layer (`Cache-Control: s-maxage=300`)

### Verify

```bash
# 1. JSON-LD dateModified matches reality
curl -s https://example.com/blog/your-post | \
  pup 'script[type="application/ld+json"] text{}' | \
  jq '.dateModified'

# 2. Sitemap lastmod matches JSON-LD
curl -s https://example.com/sitemap.xml | \
  xmllint --xpath '//*[local-name()="url"][.//*[local-name()="loc"][contains(text(),"your-post")]]/*[local-name()="lastmod"]/text()' -

# 3. Visible <time> matches both
curl -s https://example.com/blog/your-post | \
  pup 'time.updated attr{datetime}'
```

All three should return the same date. If they diverge, fix the source of truth.

### Special case: "evergreen" content

For pages that should always look current (pricing pages, "Best X" lists), update `dateModified` whenever you actually change the content — but also consider:

- Showing "Last reviewed" instead of "Last updated" if you only verify rather than edit
- Adding `Article.lastReviewed` (a custom but commonly used extension) for editorial review dates separate from edits

```ts
useSchemaOrg([
  defineArticle({
    headline: 'Best Vector Databases for RAG in 2026',
    datePublished: '2025-01-15T00:00:00Z',
    dateModified: '2026-04-15T14:30:00Z', // last actual edit
    // Custom property — Google ignores, some AI engines parse
    lastReviewed: '2026-04-20T00:00:00Z',
  }),
]);
```

Reference: [Schema.org `dateModified`](https://schema.org/dateModified) · [Sitemap `lastmod` spec](https://www.sitemaps.org/protocol.html#lastmoddef) · [Google freshness signals](https://developers.google.com/search/blog/2011/11/giving-you-fresher-more-recent-search) · sibling rule `ai-sitemap` · sibling rule `page-use-page-geo`

---

### Create a Reusable usePageGeo Composable for Per-Page GEO Meta

**Impact:** HIGH - Single source of truth for canonical URL, freshness, content type, and entity references on every page

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
