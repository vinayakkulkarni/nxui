---
title: Advertise Resources with RFC 8288 Link Headers
impact: HIGH
impactDescription: Lets agents discover llms.txt, sitemap, and your API catalog from any HTML response without guessing well-known paths
tags: link-headers, rfc-8288, discovery, nitro, middleware
---

## Advertise Resources with RFC 8288 `Link` Headers

The isitagentready scanner checks for [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288) `Link` response headers on your homepage. They let an agent discover your machine-readable resources (`llms.txt`, sitemap, API catalog) from _any_ response, instead of probing well-known paths one by one.

Implement once in a Nitro **server middleware** so every response carries them.

**Incorrect (no discovery hint — agent must guess):**

```
$ curl -sI https://your-site.com/ | grep -i '^link:'
# (nothing) — the agent has to blindly try /llms.txt, /sitemap.xml, /.well-known/...
```

**Correct (server middleware appends a `Link` header to every response):**

```ts
// server/middleware/agent-ready.ts
import type { H3Event } from 'h3';

const ORIGIN = 'https://your-site.com';

const LINK_HEADER = [
  `<${ORIGIN}/llms.txt>; rel="llms"; type="text/plain"`,
  `<${ORIGIN}/sitemap.xml>; rel="sitemap"; type="application/xml"`,
  `<${ORIGIN}/.well-known/api-catalog>; rel="api-catalog"`,
].join(', ');

export default defineEventHandler((event: H3Event) => {
  appendHeader(event, 'Link', LINK_HEADER);
});
```

Use `appendHeader` (not `setHeader`) so you never clobber a `Link` header another handler set.

### Verify

```bash
curl -sI https://your-site.com/ | grep -i '^link:'
# link: <https://your-site.com/llms.txt>; rel="llms"; type="text/plain", ...
```

Reference: [RFC 8288 (Web Linking)](https://www.rfc-editor.org/rfc/rfc8288) · [IANA Link Relations](https://www.iana.org/assignments/link-relations/link-relations.xhtml)
