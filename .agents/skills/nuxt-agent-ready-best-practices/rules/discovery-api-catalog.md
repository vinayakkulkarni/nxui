---
title: Publish an RFC 9727 API Catalog
impact: MEDIUM
impactDescription: Lets agents discover your public API surface and machine-readable resources from one well-known document
tags: api-catalog, rfc-9727, well-known, discovery, linkset, nitro
---

## Publish an RFC 9727 API Catalog

[RFC 9727](https://www.rfc-editor.org/rfc/rfc9727) defines `/.well-known/api-catalog` — an `application/linkset+json` document that lets an agent discover your API surface and machine-readable resources. List **only real endpoints** (see the honesty rule): an agent that follows these links must reach something that works.

**Incorrect (no catalog — agent can't find your API):**

```
$ curl -s https://your-site.com/.well-known/api-catalog
404 Not Found
```

**Correct (Nitro route returning a linkset):**

```ts
// server/routes/.well-known/api-catalog.ts
import type { H3Event } from 'h3';

const ORIGIN = 'https://your-site.com';

export default defineEventHandler((event: H3Event) => {
  setHeader(event, 'Content-Type', 'application/linkset+json; charset=utf-8');
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600');

  return {
    linkset: [
      {
        anchor: `${ORIGIN}/api/v1/free-audit`,
        'service-doc': [{ href: `${ORIGIN}/how-it-works` }],
        describedby: [{ href: `${ORIGIN}/llms.txt`, type: 'text/plain' }],
      },
      {
        anchor: ORIGIN,
        'service-meta': [
          { href: `${ORIGIN}/llms.txt`, type: 'text/plain' },
          { href: `${ORIGIN}/sitemap.xml`, type: 'application/xml' },
        ],
      },
    ],
  };
});
```

Each entry needs an `anchor` (the API/resource URL) plus link relations: `service-desc` (OpenAPI spec), `service-doc` (human docs), `service-meta`, `describedby`, `status` (health).

### Verify

```bash
curl -s https://your-site.com/.well-known/api-catalog -o /dev/null -w '%{http_code} %{content_type}\n'
# 200 application/linkset+json; charset=utf-8
```

Reference: [RFC 9727 (API Catalog)](https://www.rfc-editor.org/rfc/rfc9727) — see Appendix A for full examples.
