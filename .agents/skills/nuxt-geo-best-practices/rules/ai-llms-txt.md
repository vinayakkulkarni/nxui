---
title: Generate llms.txt and llms-full.txt via Nitro Server Routes
impact: CRITICAL
impactDescription: Direct discovery hint for ChatGPT, Claude, Perplexity agents that look for /llms.txt before crawling
tags: llms-txt, ai-discovery, nitro, server-routes, nuxt
---

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
