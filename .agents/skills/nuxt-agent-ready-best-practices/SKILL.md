---
name: nuxt-agent-ready-best-practices
description: 'Nuxt agent-readiness guidelines for making a site operable by autonomous AI agents — not just cited by them. Covers the isitagentready.com standards: Markdown content negotiation, RFC 8288 Link headers, RFC 9727 API catalogs, Agent Skills discovery indexes, WebMCP browser tools, MCP Server Cards, OAuth/OIDC agent auth discovery, and DNS-AID. Triggers on tasks involving agent-ready, isitagentready, MCP, WebMCP, model context protocol, agent skills, API catalog, well-known discovery, agent auth, DNS-AID, A2A, or agentic commerce.'
license: MIT
metadata:
  author: vinayakkulkarni
  version: '1.1.0'
---

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
