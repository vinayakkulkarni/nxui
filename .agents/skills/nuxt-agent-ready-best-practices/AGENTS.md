# Nuxt Agent-Ready Best Practices - Complete Reference

> This file is auto-generated. Do not edit directly.
> Edit individual rule files in the `rules/` directory and run `pnpm build`.

# Nuxt Agent-Ready Best Practices

Guidelines for making a Nuxt 4 site **operable by autonomous AI agents** — measured by the [isitagentready.com](https://isitagentready.com) scanner (Cloudflare's "Is Your Site Agent-Ready?"). This is a different axis from GEO: GEO is about being _cited_ in AI answers; agent-readiness is about being _operated_ — an agent authenticating, discovering your API, calling your tools, and taking action.

Proven on production Nuxt 4 + Nitro `cloudflare_module` Workers:

- A **marketing site** (only public POST endpoints, no auth/MCP server): **21 → 50+ (Level 1 → Level 4 "Agent-Integrated")** — the auth + MCP surfaces are honesty-gated OFF (see below).
- A **full platform** with a real OAuth server (Better-Auth oauth-provider) + a real remote MCP server: **21 → 100/100 (Level 5 "Agent-Native"), all 14 checks green**. The auth + MCP surfaces are legitimately publishable there, which is what unlocks the last ~40 points.

**The ceiling is set by what you actually run, not by effort.** A marketing site tops out around Level 4 and that is the _correct_ score — do not fabricate an auth server to chase 100 (see THE HONESTY RULE). Only a site with a real authorization server and a real MCP server can honestly reach Level 5.

## GEO vs Agent-Readiness (know the difference)

|          | GEO (`nuxt-geo-best-practices`)                            | Agent-Readiness (this skill)                                           |
| -------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| Goal     | Be **cited** in AI answers                                 | Be **operated** by agents                                              |
| Question | "Will ChatGPT mention me?"                                 | "Can an agent call my tools and act?"                                  |
| Levers   | llms.txt, crawler allowlist, RAG content, JSON-LD entities | MCP/WebMCP, API/skill discovery, agent auth, DNS-AID, agentic commerce |

**Shared primitives live in the GEO skill.** `robots.txt` AI-crawler allowlisting, `llms.txt`/`llms-full.txt`, and the XML sitemap are covered by `nuxt-geo-best-practices` (rules `ai-robots-allowlist`, `ai-llms-txt`, `ai-sitemap`). The isitagentready scanner scores those too — set them up via the GEO skill first, then apply this skill for the agent-operation layer on top.

## When to Apply

- Raising a site's score on `https://isitagentready.com/<domain>`
- Supporting `Accept: text/markdown` content negotiation for agents
- Advertising resources via RFC 8288 `Link` headers
- Publishing an RFC 9727 API catalog (`/.well-known/api-catalog`)
- Publishing an Agent Skills discovery index (`/.well-known/agent-skills/index.json`)
- Exposing site actions to in-browser agents via WebMCP (`navigator.modelContext`)
- Publishing an MCP Server Card (only if you run a real MCP server)
- Publishing OAuth/OIDC discovery for agent auth (only if you run a real auth server)
- Publishing DNS-AID records (`_index._agents.<domain>`) + DNSSEC

## THE HONESTY RULE (load-bearing — read before publishing anything)

**Only publish discovery for services that actually exist.** A discovery document that sends an agent to a dead end — a `/.well-known/openid-configuration` with no auth server behind it, an MCP Server Card whose transport endpoint 404s, a `_mcp._agents` DNS record with no MCP server — is **worse than a lower score**. Agents will try to use it and fail.

This mirrors the "never fake customers/logos/scale" rule: a fabricated capability that fails on first contact destroys trust. On a marketing site with only public POST endpoints, **skip** OAuth/OIDC discovery, oauth-protected-resource, auth.md, and the MCP Server Card — they belong on the app/console domain (real auth server) or require building a real MCP server. Decline these explicitly and say why.

**The flip side — when you DO run the real thing, publish it fully.** If your site runs a real OAuth authorization server (e.g. Better-Auth `oauth-provider` plugin) and a real remote MCP server, the auth + MCP surfaces are no longer dishonest — they are the highest-value checks and unlock Level 5. maps.guru scored 100/100 precisely because those services exist. The honesty rule cuts both ways: don't fake it, but don't under-claim a real capability either.

## THE SCANNER-BEHAVIOR RULES (what actually flips a check green)

Passing the harder checks is NOT "publish the file and move on" — the isitagentready scanner inspects **content and runtime behavior**, not just presence. Three non-obvious behaviors cost real time to discover:

1. **auth.md is content-scanned for "agent registration markers", not just existence.** A 200 response with a valid H1 and generic OAuth instructions still FAILS with _"auth.md exists but does not describe agent registration"_. The body must follow the [WorkOS AUTH.md](https://github.com/workos/auth.md) recipe shape — "You are an agent", "**agentic registration**", the ordered discover → register → authorize → exchange → revoke steps, and references to `register_uri`/`agent_auth`. See `auth-oauth-discovery` for the exact markers.

2. **The `agent_auth` block in `/.well-known/oauth-authorization-server` must use WorkOS field names.** `register_uri` (not `registration_uri`), `skill`, `identity_types_supported` with valid values, plus one complete method (e.g. `anonymous.credential_types_supported` + `claim_uri`). Intuitive names silently fail the check.

3. **WebMCP runs in a headless, no-GPU browser with an 8-second navigation timeout.** If your page ships heavy client JS that keeps the network busy (a live MapLibre/WebGL map streaming tiles), the checker never reaches `networkidle` and reports _"Could not check WebMCP: Navigation timeout"_ — even though your tools ARE registered. Fix: skip the heavy widget when `navigator.webdriver === true` (bots get a static fallback; humans get the full experience). See `discovery-webmcp`.

## SECURITY HARDENING (do this BEFORE you publish, not after)

Publishing agent-discovery surfaces widens your attack surface: you're advertising a public API key to every page + browser agent, echoing request data into markdown, and adding new well-known routes. Run a security pass on the new surfaces — see the `security-hardening` rule. The load-bearing items: the page-embedded system API key MUST be origin-restricted and owned by a non-privileged account (an admin-owned key bypasses quota on every worker); WebMCP tool errors must never echo the key; `htmlToMarkdown` must not decode `<>"'` entities (indirect XSS); and the `Link` header must be skipped on `/api/**` responses.

## THE NITRO/WORKERS GOTCHA (self-referential renders)

Several checks require "render my own page, then transform it" (llms-full.txt aggregation, markdown negotiation). On a deployed Cloudflare Worker, an **absolute-URL** `$fetch('https://<origin>/path')` becomes a real edge subrequest that returns **empty** on the same-zone self-loopback — but it works on `wrangler dev` (single local server), so the bug is invisible until production.

Always use **relative in-process** `event.$fetch(path, { headers })` — Nitro's internal router, no network hop, identical on dev and prod. Works in both route handlers and middleware. This silently served an empty 81-byte `llms-full.txt` in production for weeks before it was caught.

## Verification Discipline

1. Build + boot on `wrangler dev` (workerd); `curl` each route/header.
2. **CRITICAL: verify on PRODUCTION after deploy** — the self-`$fetch` bug only manifests in prod. Confirm `llms-full.txt` is full-size (not ~81 bytes) and markdown negotiation returns `text/markdown`.
3. Fetch each check's hosted `SKILL.md` at `https://isitagentready.com/.well-known/agent-skills/<check>/SKILL.md` for the exact record/format the scanner validates.
4. Re-scan `isitagentready.com/<domain>` to confirm the category flipped green. The scan API is `POST https://isitagentready.com/api/scan` `{"url":"https://<domain>"}` → check `checks.<category>.<check>.status === "pass"`.

## Rule Categories

- **discovery** — Link headers, API catalog, agent-skills index, markdown negotiation, WebMCP, MCP server card, DNS-AID
- **content** — markdown content negotiation
- **auth** — OAuth/OIDC + protected-resource + auth.md content-markers + `agent_auth` block (honesty-gated)
- **dns** — DNS-AID records + DNSSEC
- **security** — hardening the new agent surfaces (origin-restricted public key, error sanitization, entity encoding, Link-skip on `/api`)

Commerce checks (x402, MPP, UCP, ACP) are informational-only on non-commerce sites and do NOT affect the score — skip them unless the site actually sells to agents.

---

# Detailed Rules

### Publish OAuth/OIDC Discovery (Only If You Run an Auth Server)

**Impact:** LOW - Lets agents programmatically discover how to authenticate — but only meaningful when a real authorization server backs it

## Publish OAuth/OIDC Discovery (Only If You Run an Auth Server)

isitagentready checks for OAuth/OIDC discovery so agents can authenticate with protected APIs:

- `/.well-known/openid-configuration` ([OIDC Discovery](http://openid.net/specs/openid-connect-discovery-1_0.html))
- `/.well-known/oauth-authorization-server` ([RFC 8414](https://www.rfc-editor.org/rfc/rfc8414))
- `/.well-known/oauth-protected-resource` ([RFC 9728](https://www.rfc-editor.org/rfc/rfc9728))
- `/auth.md` ([WorkOS auth.md](https://workos.com/auth-md)) — agent registration instructions

### HONESTY GATE — do not publish these on a site with no auth server

These are only legitimate when a **real authorization server** issues tokens. A marketing site whose `/api/v1/*` endpoints are public has no `authorization_endpoint`/`token_endpoint` — publishing this discovery points agents at nothing and they fail on first token request. **Skip it.** If you want the score, put it on the domain that actually runs auth (e.g. your app/console with Better Auth), mapping the _real_ endpoints.

**Correct (only where a real OIDC/OAuth server exists — e.g. the console app):**

```ts
// server/routes/.well-known/openid-configuration.ts  (on app.your-site.com, NOT the marketing site)
import type { H3Event } from 'h3';

const ISSUER = 'https://app.your-site.com';

export default defineEventHandler((event: H3Event) => {
  setHeader(event, 'Content-Type', 'application/json');
  return {
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/api/v1/auth/authorize`, // must be REAL
    token_endpoint: `${ISSUER}/api/v1/auth/token`, // must be REAL
    jwks_uri: `${ISSUER}/api/v1/auth/jwks`, // must be REAL
    grant_types_supported: ['authorization_code', 'refresh_token'],
    response_types_supported: ['code'],
    scopes_supported: ['openid', 'email', 'profile'],
  };
});
```

Map every field to an endpoint your auth stack actually serves. With Better Auth, point these at its real mounted routes — do not invent paths.

### The `agent_auth` block MUST use WorkOS field names (or the check fails)

The `Auth.md agent registration` check reads an `agent_auth` object inside `/.well-known/oauth-authorization-server` and validates it against the [WorkOS AUTH.md](https://github.com/workos/auth.md) profile. **The intuitive field names silently fail.** It wants `register_uri` (NOT `registration_uri`), `skill` (the URL of your auth.md), `identity_types_supported` with a valid value, and at least one complete registration method. For a service that registers agents anonymously via Dynamic Client Registration (RFC 7591) — the common Better-Auth `oauth-provider` shape — use the `anonymous` method:

```ts
// inside the /.well-known/oauth-authorization-server response body
agent_auth: {
  skill: `${ISSUER}/auth.md`,                       // URL of your auth.md
  register_uri: `${ISSUER}/api/v1/auth/oauth2/register`, // real DCR endpoint
  identity_types_supported: ['anonymous'],
  anonymous: {
    credential_types_supported: ['oauth2-authz-code-pkce', 'api-key'],
    claim_uri: `${ISSUER}/dashboard/tokens`,        // where a human claims/manages
  },
},
```

Add the top-level RFC 8414 fields too (`issuer`, `token_endpoint`, `revocation_endpoint`, `grant_types_supported`) — the checker restates them. Every value must map to a real endpoint.

### auth.md is CONTENT-scanned for "agent registration markers"

Serving `/auth.md` with a 200 and a valid H1 is **not enough**. The checker greps the markdown body for agent-registration markers and fails with _"auth.md exists but does not describe agent registration"_ if they're absent — generic "here's how to OAuth" prose does not pass. Write it in the [WorkOS AUTH.md](https://github.com/workos/auth.md) recipe shape:

```md
# Auth.md — Agent Registration for <site>

You are an agent. This service supports **agentic registration**: discover →
register → authorize → exchange for an access token → call the API → handle
revocation. Follow the steps in order.

## Step 1 — Discover

Fetch `/.well-known/oauth-protected-resource` (PRM, RFC 9728) and
`/.well-known/oauth-authorization-server` (RFC 8414). The `agent_auth` block
carries this skill (`skill`), the registration endpoint (`register_uri`), and
`identity_types_supported`.

## Step 2 — Register

Dynamic Client Registration (RFC 7591): POST client metadata to `register_uri`.

## Step 3 — Authorize ## Step 4 — Exchange ## Step 5 — Use the access token

Standard OAuth 2.1 + PKCE; exchange the code at the token_endpoint; call with
`Authorization: Bearer <token>`.

## Revocation

Tokens revocable at the `revocation_endpoint` (RFC 7009).
```

Required marker phrases the scanner looks for: `agentic registration`, `You are an agent`, ordered `register`/`authorize`/`exchange`/`revocation` steps, and `register_uri`/`agent_auth` references. Pin them in a unit test so a future edit can't silently drop a marker and re-break the check.

### Verify

```bash
# 1. agent_auth block present with WorkOS field names
curl -s https://app.your-site.com/.well-known/oauth-authorization-server \
  | jq '.agent_auth | {skill, register_uri, identity_types_supported}'

# 2. auth.md carries the registration markers (expect a non-zero count)
curl -s https://app.your-site.com/auth.md \
  | grep -c 'agentic registration\|register_uri\|agent_auth'

# 3. every advertised endpoint actually responds (not 404)
curl -s -o /dev/null -w '%{http_code}\n' https://app.your-site.com/api/v1/auth/oauth2/register
```

Reference: [OIDC Discovery](http://openid.net/specs/openid-connect-discovery-1_0.html) · [RFC 8414](https://www.rfc-editor.org/rfc/rfc8414) · [RFC 9728](https://www.rfc-editor.org/rfc/rfc9728) · [WorkOS auth.md](https://github.com/workos/auth.md)

---

### Serve Markdown via Accept Content Negotiation

**Impact:** HIGH - The entire Content category on isitagentready — agents that request text/markdown get clean markdown instead of a JS-heavy HTML shell

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

---

### Publish an Agent Skills Discovery Index

**Impact:** MEDIUM - Lets agents discover downloadable SKILL.md capabilities you offer, each verified by a sha256 digest

## Publish an Agent Skills Discovery Index

The [Agent Skills Discovery RFC v0.2.0](https://github.com/cloudflare/agent-skills-discovery-rfc) defines `/.well-known/agent-skills/index.json` — a catalog of downloadable `SKILL.md` artifacts an agent can consume. Publish **one real skill per genuine capability** (e.g. your public API); each entry carries a `sha256` digest of the artifact.

### The digest-drift trap

Each skill entry includes `digest: "sha256:<hex>"` of the SKILL.md artifact. If a formatter (oxfmt/prettier) reformats the SKILL.md, its bytes change and the digest no longer matches — the scanner (or a verifying agent) rejects it. **Format the SKILL.md FIRST, then compute the digest, then write the index.** Re-verify `served-file-sha256 == indexed-digest` after any edit.

**Correct (static index + artifact with a matching digest):**

```jsonc
// public/.well-known/agent-skills/index.json
{
  "$schema": "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
  "skills": [
    {
      "name": "free-audit",
      "type": "skill-md",
      "description": "Run the free Google Business Profile audit and get a scorecard.",
      "url": "https://your-site.com/.well-known/agent-skills/free-audit/SKILL.md",
      "digest": "sha256:0b7afdf087ec3becec2a535ec3561db3ef2b230626060250323526613d8db38a",
    },
  ],
}
```

```md
<!-- public/.well-known/agent-skills/free-audit/SKILL.md -->

# Run a free audit

POST https://your-site.com/api/v1/free-audit with { brand, email, consent:true }.
Returns a scorecard { score, locationCount, duplicates, summary, ... }.
```

Each `skills[]` entry needs `name` (lowercase-hyphen), `type` (`skill-md` | `archive`), `description`, `url`, `digest`.

### Compute + verify the digest

```bash
# 1. format the artifact FIRST
oxfmt public/.well-known/agent-skills/free-audit/SKILL.md
# 2. compute the digest and put it in index.json
shasum -a 256 public/.well-known/agent-skills/free-audit/SKILL.md
# 3. verify served file matches the indexed digest
diff <(shasum -a 256 SKILL.md | awk '{print $1}') <(grep -o 'sha256:[a-f0-9]*' index.json | cut -d: -f2)
```

Reference: [Agent Skills Discovery RFC](https://github.com/cloudflare/agent-skills-discovery-rfc) · [agentskills.io](https://agentskills.io)

---

### Publish an RFC 9727 API Catalog

**Impact:** MEDIUM - Lets agents discover your public API surface and machine-readable resources from one well-known document

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

---

### Advertise Resources with RFC 8288 Link Headers

**Impact:** HIGH - Lets agents discover llms.txt, sitemap, and your API catalog from any HTML response without guessing well-known paths

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

---

### Publish an MCP Server Card (Only If You Run an MCP Server)

**Impact:** LOW - Lets agents discover your MCP server's transport and capabilities — but only meaningful when a real MCP server exists

## Publish an MCP Server Card (Only If You Run an MCP Server)

isitagentready checks for an [MCP Server Card](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127) (SEP-1649) at `/.well-known/mcp/server-card.json` — `serverInfo`, a transport endpoint, and capabilities, so agents can discover and connect to your Model Context Protocol server.

### HONESTY GATE — do not publish a card for a server that doesn't exist

A Server Card advertises a **transport endpoint** an agent connects to. If you don't run an MCP server, that endpoint 404s and the agent's connection fails. **Skip it** unless you have a real MCP server. Building one is a genuine feature (see the `agents-sdk` skill for Cloudflare Workers MCP), not a well-known file — do that first, then publish the card pointing at the real transport.

**Correct (only where a real MCP server is mounted):**

```ts
// server/routes/.well-known/mcp/server-card.json.ts
import type { H3Event } from 'h3';

export default defineEventHandler((event: H3Event) => {
  setHeader(event, 'Content-Type', 'application/json');
  return {
    serverInfo: { name: 'your-app-mcp', version: '1.0.0' },
    transport: {
      type: 'streamable-http',
      endpoint: 'https://your-site.com/mcp',
    }, // must be REAL
    capabilities: { tools: {}, resources: {} },
  };
});
```

The `transport.endpoint` must be a real, connectable MCP server. Reference implementations: `maps.guru` and `talon` run real Workers-hosted MCP servers; a plain marketing site does not.

### Verify

```bash
curl -s https://your-site.com/.well-known/mcp/server-card.json | jq '.transport.endpoint'
# then confirm the endpoint actually speaks MCP (not 404)
curl -s -o /dev/null -w '%{http_code}\n' https://your-site.com/mcp
```

Reference: [MCP Server Card SEP-1649](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127) · build a real one with the `agents-sdk` skill

---

### Expose Site Actions via WebMCP

**Impact:** MEDIUM - In-browser agents can call your real site actions (search, submit, run) as MCP tools via navigator.modelContext

## Expose Site Actions via WebMCP

[WebMCP](https://webmachinelearning.github.io/webmcp/) ([Chrome blog](https://developer.chrome.com/blog/webmcp-epp)) lets an in-browser AI agent call your site's key actions as MCP tools through `navigator.modelContext`. Expose **real actions** (run a search, submit a form, fetch data) that map to real endpoints.

The API is Chrome-EPP-only and unstable, so every access must be **feature-detected** — the plugin is a harmless no-op in browsers without it.

### Types go in `app/types/` — never inline in the plugin

Per house rules, define no `interface`/`type` inline in a plugin. Put the WebMCP surface types in `app/types/webmcp.ts` and import them.

**Correct (types file + feature-detected client plugin):**

```ts
// app/types/webmcp.ts
export type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
};

export type WebMcpModelContext = {
  registerTool?: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => void;
  provideContext?: (context: { tools: WebMcpTool[] }) => void;
};
```

```ts
// app/plugins/webmcp.client.ts  (.client — browser only)
import type { WebMcpModelContext, WebMcpTool } from '~/types/webmcp';

export default defineNuxtPlugin(() => {
  const nav = navigator as Navigator & { modelContext?: WebMcpModelContext };
  const mc = nav.modelContext;
  if (!mc) return; // no-op where the API is absent

  const runAudit: WebMcpTool = {
    name: 'run_free_audit',
    description: 'Run the free Google Business Profile audit for a brand.',
    inputSchema: {
      type: 'object',
      properties: {
        brand: { type: 'string' },
        email: { type: 'string', format: 'email' },
      },
      required: ['brand', 'email'],
    },
    execute: async (input) =>
      $fetch('/api/v1/free-audit', {
        method: 'POST',
        body: { brand: input.brand, email: input.email, consent: true },
      }),
  };

  // Prefer the current registerTool API; fall back to older provideContext.
  if (typeof mc.registerTool === 'function') {
    mc.registerTool(runAudit, { signal: new AbortController().signal });
  } else if (typeof mc.provideContext === 'function') {
    mc.provideContext({ tools: [runAudit] });
  }
});
```

### The headless-browser networkidle trap (the #1 false failure)

The scanner checks WebMCP by loading your page in a **headless, no-GPU browser with an 8-second navigation timeout**, waiting for `networkidle`, then inspecting `navigator.modelContext`. If your page ships heavy client JS that keeps the network busy past 8s — most commonly a **live MapLibre/WebGL map streaming vector tiles**, or any long-running animation that fetches — the checker times out with _"Could not check WebMCP: Navigation timeout of 8000 ms exceeded"_ **even though your tools registered correctly**. The failure is about page load, not about WebMCP.

Fix: detect automation and skip the heavy widget. Bots get a lightweight static fallback so the page reaches `networkidle` fast; humans get the full experience. The WebMCP tools register regardless (they're cheap and map-independent).

```vue
<!-- app/components/HeroMap.client.vue -->
<script setup lang="ts">
  // Headless checkers have no GPU; MapLibre tile streaming starves their
  // networkidle wait and the WebMCP check times out. Bots get the gradient only.
  const isAutomated = navigator.webdriver === true;
</script>

<template>
  <div class="hero">
    <!-- Live map only for real users; static fallback (CSS gradient) for bots -->
    <VMap v-if="!isAutomated" :options="mapOptions" />
  </div>
</template>
```

Delaying the heavy work (e.g. starting a map animation 15s after idle) is NOT enough — the _initial_ tile load alone can exceed the 8s window. Gating on `navigator.webdriver` is the reliable fix. Verify both paths (see below): the bot path must reach `networkidle` in a few seconds AND still expose the tools.

### Verify in a real browser (Playwright)

The scanner loads the page in a browser, so verify the same way — inject a fake `navigator.modelContext` before load and assert the tool registered:

```js
await page.addInitScript(() => {
  const calls = [];
  Object.defineProperty(navigator, 'modelContext', {
    value: { registerTool: (t) => calls.push(t.name) },
    configurable: true,
  });
  window.__mcp = calls;
});
await page.goto('https://your-site.com/');
console.log(await page.evaluate(() => window.__mcp)); // ['run_free_audit']
```

Also verify the **bot path** reaches networkidle fast while still exposing tools — force `navigator.webdriver` true and confirm the heavy widget is skipped:

```js
await page.addInitScript(() => {
  Object.defineProperty(navigator, 'webdriver', { get: () => true });
});
const t0 = Date.now();
await page.goto('https://your-site.com/', {
  waitUntil: 'networkidle',
  timeout: 15000,
});
console.log('bot networkidle in', Date.now() - t0, 'ms'); // want < 8000
console.log(
  await page.evaluate(() => document.querySelectorAll('canvas').length),
); // 0 (map skipped)
console.log(
  await page.evaluate(async () =>
    (await navigator.modelContext.getTools()).map((t) => t.name),
  ),
); // tools still present
```

Reference: [WebMCP spec](https://webmachinelearning.github.io/webmcp/) · [Chrome WebMCP EPP](https://developer.chrome.com/blog/webmcp-epp)

---

### Publish DNS-AID Records with DNSSEC

**Impact:** MEDIUM - DNS-based agent discovery — a signed _index._agents record lets validating agents find your entrypoint

## Publish DNS-AID Records with DNSSEC

[DNS-AID](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/) (DNS for AI Discovery) advertises agent entrypoints via DNS `SVCB`/`HTTPS` records under `_agents.<domain>`. The scanner probes `_index._agents`, `_a2a._agents`, `_mcp._agents`.

**Honesty gate:** only publish records for endpoints that exist. `_index._agents` pointing to your site is honest (the site serves llms.txt + api-catalog). Do NOT publish `_a2a._agents` or `_mcp._agents` unless you actually run an A2A or MCP server — those would send agents nowhere.

**Correct (create the record via the Cloudflare API):**

```js
// POST /zones/{zoneId}/dns_records
{
  type: 'HTTPS',
  name: '_index._agents.your-site.com',
  data: { priority: 1, target: 'your-site.com', value: 'alpn="h2,http/1.1" port=443' },
  ttl: 3600,
}
```

### The DNSSEC requirement (the real blocker)

DNS-AID draft-01 requires the discovery zone be **DNSSEC-signed** — the scanner needs `AD=true` (Authenticated Data) from a validating resolver. Publishing the record is not enough; without DNSSEC the check stays red with _"records found but DNSSEC was not validated"_.

Enabling DNSSEC is two steps and often **user-gated** (a default API token usually lacks the DNSSEC scope — error 10000):

1. **Enable DNSSEC in Cloudflare** (Zone → DNS → Settings → DNSSEC → Enable). This generates a **DS record**.
2. **Add that DS record at the domain registrar.** If the registrar is Cloudflare, it's one click; otherwise the user must paste the DS record into their registrar's DNSSEC settings. This is what signs the zone at the parent.

### Verify

```bash
# record resolves (scanner queries via DNS-over-HTTPS the same way)
curl -s 'https://cloudflare-dns.com/dns-query?name=_index._agents.your-site.com&type=65' \
  -H 'accept: application/dns-json' | jq '.Status'   # 0 = OK

# zone is DNSSEC-signed (AD flag true)
curl -s 'https://cloudflare-dns.com/dns-query?name=your-site.com&type=A&do=1' \
  -H 'accept: application/dns-json' | jq '.AD'        # true
```

Reference: [DNS-AID draft](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/) · [RFC 9460 (SVCB/HTTPS records)](https://www.rfc-editor.org/rfc/rfc9460)

---

### Harden the Agent-Discovery Surfaces Before Publishing

**Impact:** HIGH - Agent-readiness widens your attack surface — a page-embedded API key, request data echoed into markdown, and new well-known routes each need a security pass before they ship

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
