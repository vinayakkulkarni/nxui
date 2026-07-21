---
title: Serve Markdown via Accept Content Negotiation
impact: HIGH
impactDescription: The entire Content category on isitagentready — agents that request text/markdown get clean markdown instead of a JS-heavy HTML shell
tags: markdown-negotiation, content, accept-header, nitro, middleware, event-fetch
---

## Serve Markdown via `Accept` Content Negotiation

Agents send `Accept: text/markdown` to ask for a clean markdown rendering of a page. Return markdown for those requests while HTML stays the default for browsers. This is the whole **Content** category on isitagentready and follows [Cloudflare's Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/).

### The critical Nitro/Workers trap

To render markdown you re-fetch the page's own HTML. On a deployed Worker an **absolute-URL** `$fetch('https://origin/path')` becomes a real edge subrequest that returns **empty** on the same-zone self-loopback — but works on `wrangler dev`, so the bug is invisible until production. Use relative **`event.$fetch(path)`** (in-process, no network hop).

**Incorrect (absolute URL — empty in prod, works on dev):**

```ts
// ❌ Returns '' on the deployed Worker's self-loopback
const html = await $fetch(`https://your-site.com${path}`, {
  headers: { Accept: 'text/html' },
});
```

**Correct (relative in-process fetch + Vary header):**

```ts
// server/middleware/agent-ready.ts (same middleware as the Link-header rule)
import type { H3Event } from 'h3';

const MARKDOWN_ROUTES = new Set(['/', '/pricing', '/about', '/how-it-works']);

export default defineEventHandler(async (event: H3Event) => {
  if (event.method !== 'GET') return;

  const path = getRequestURL(event).pathname;
  const accept = getHeader(event, 'accept') ?? '';

  // Only intercept when the agent explicitly prefers markdown AND it's a known
  // prose page. The Accept:text/html subrequest below re-enters this middleware
  // but skips this branch, so there is no loop — the Accept guard is load-bearing.
  if (!accept.includes('text/markdown') || !MARKDOWN_ROUTES.has(path)) return;

  const html = await event
    .$fetch<string>(path, { headers: { Accept: 'text/html' } })
    .catch(() => '');
  const markdown = htmlToMarkdown(html);
  if (!markdown) return;

  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8');
  setHeader(event, 'Vary', 'Accept'); // so CDN caches HTML and markdown separately
  return `# ${path}\n\n${markdown}\n`;
});
```

Scope the HTML to `<main>` and convert headings/lists before stripping tags so the markdown keeps structure. Set `Vary: Accept` or a CDN may serve markdown to a browser (or vice-versa).

### Verify (BOTH dev and prod)

```bash
# agent gets markdown
curl -s https://your-site.com/pricing -H 'Accept: text/markdown' -o /dev/null -w '%{content_type}\n'
# text/markdown; charset=utf-8

# browser still gets HTML
curl -s https://your-site.com/pricing -H 'Accept: text/html' -o /dev/null -w '%{content_type}\n'
# text/html; charset=utf-8
```

The self-`$fetch` bug ONLY shows in production — always verify on the live Worker, not just `wrangler dev`.

Reference: [Cloudflare Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/) · [Nitro `event.$fetch`](https://nitro.build/guide/fetch)
