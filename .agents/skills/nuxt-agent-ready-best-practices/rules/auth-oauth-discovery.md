---
title: Publish OAuth/OIDC Discovery (Only If You Run an Auth Server)
impact: LOW
impactDescription: Lets agents programmatically discover how to authenticate — but only meaningful when a real authorization server backs it
tags: oauth, oidc, discovery, well-known, agent-auth, honesty-gate
---

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
