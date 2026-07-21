---
title: Publish DNS-AID Records with DNSSEC
impact: MEDIUM
impactDescription: DNS-based agent discovery — a signed _index._agents record lets validating agents find your entrypoint
tags: dns-aid, dns, svcb, https-record, dnssec, cloudflare, discovery
---

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
