---
title: Harden the Agent-Discovery Surfaces Before Publishing
impact: HIGH
impactDescription: Agent-readiness widens your attack surface — a page-embedded API key, request data echoed into markdown, and new well-known routes each need a security pass before they ship
tags: security, hardening, api-key, origin-restriction, xss, error-sanitization, link-header
---

## Harden the Agent-Discovery Surfaces Before Publishing

Making a site agent-operable means advertising a public API key to every page and browser agent, echoing request data into generated markdown, and adding new well-known routes. Each is a new attack surface. Run a security pass on the agent surfaces **before** you publish them — the checks below are the ones a read-only security review (e.g. Oracle) reliably flags on a first agent-ready pass.

### 1. The page-embedded system API key must be origin-restricted AND non-privileged

To render a live basemap (or any authed widget) on public pages, you embed a `NUXT_PUBLIC_*` API key in the client bundle — it's in page source and now handed to browser agents via WebMCP. Two invariants:

- **Origin-restrict it.** A key with empty `allowedOrigins` works from any site and any server-side caller. Lock it to your own origins (`https://your-site.com`, `https://www.your-site.com`).
- **Own it with a non-privileged account.** If the key's owner has an `admin`/superadmin role, your workers likely **skip quota enforcement** for admin-owned keys — so a scraper who lifts the key from page source gets _unlimited, untracked_ calls to expensive endpoints (tiles, geocoding, browser-render). Mint a dedicated, scope-minimal, non-admin key for the public embed.

```ts
// ❌ WRONG — admin-owned, no origin restriction, baked into every page
NUXT_PUBLIC_SYSTEM_API_KEY = adminOwnedKeyWithEmptyAllowedOrigins;

// ✅ RIGHT — non-admin owner, scopes = only what the public widget needs,
//    allowedOrigins locked to your domains
NUXT_PUBLIC_SYSTEM_API_KEY = restrictedKey; // owner role: member; origins: [https://your-site.com]
```

Remember `NUXT_PUBLIC_*` is baked at **build** time. On a local-wrangler deploy it comes from local `.env`; also update the CI secret so a restored pipeline doesn't re-bake the old key.

### 2. Never echo the key in WebMCP tool errors

A WebMCP `execute` callback that does `throw new Error(\`fetch failed: \${err}\`)`can leak the request URL — including`?key=...` — into an error surfaced to the agent/user. Sanitize:

```ts
execute: async (input) => {
  try {
    return await $fetch('/api/v1/geocoding/search', {
      query: { text: input.q },
    });
  } catch {
    // Do NOT interpolate the caught error — it can contain the key-bearing URL.
    throw new Error('Geocoding request failed.');
  }
};
```

### 3. `htmlToMarkdown` must not decode `<>"'` entities (indirect XSS)

The markdown-negotiation transformer converts HTML to markdown. If it decodes `&lt;`/`&gt;`/`&quot;`/`&#39;` back to raw `<>"'`, an attacker-controlled string that was safely escaped in your HTML becomes live markup in the markdown an agent renders. Decode only the safe named entities (`&amp;`, `&nbsp;`) and **leave the angle-bracket/quote entities encoded**.

```ts
// ✅ Keep <>"' encoded; a downstream markdown renderer won't execute them.
md = md.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
// do NOT add: .replace(/&lt;/g,'<').replace(/&gt;/g,'>')...
```

### 4. Skip the `Link` header on `/api/**` responses

The RFC 8288 `Link` header advertising llms.txt/sitemap/api-catalog belongs on **HTML** responses, not on JSON API responses. Emitting it on `/api/**` is noise at best and leaks your discovery topology onto every data response. Guard the middleware:

```ts
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname;
  if (path.startsWith('/api/')) return; // API responses don't advertise discovery
  appendHeader(event, 'Link', LINK_HEADER);
});
```

### 5. Cache-Control + nosniff on the discovery JSON routes

The `/.well-known/*` metadata documents are public and static-ish. Set `X-Content-Type-Options: nosniff` (so a browser can't be tricked into re-typing `application/json` as HTML) and a sane `Cache-Control` (CDN-cacheable, short-ish) on each. Also gate any debug header (e.g. an `x-markdown-tokens` count) behind a non-production check so it doesn't ship to prod.

### Verify

```bash
# key is origin-restricted (fails cross-origin) and non-admin — check via your key store
# Link header present on HTML, absent on /api
curl -sI https://your-site.com/            | grep -ic '^link:'   # 1
curl -sI https://your-site.com/api/v1/ping | grep -ic '^link:'   # 0
# nosniff on discovery docs
curl -sI https://your-site.com/.well-known/oauth-authorization-server \
  | grep -i 'x-content-type-options'                              # nosniff
```

Reference: [RFC 8288 (Web Linking)](https://www.rfc-editor.org/rfc/rfc8288) · [OWASP: Reflected XSS](https://owasp.org/www-community/attacks/xss/) · run a read-only security review (Oracle) over the new surfaces before shipping
