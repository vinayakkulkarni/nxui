---
title: Publish an MCP Server Card (Only If You Run an MCP Server)
impact: LOW
impactDescription: Lets agents discover your MCP server's transport and capabilities — but only meaningful when a real MCP server exists
tags: mcp, mcp-server-card, model-context-protocol, well-known, honesty-gate
---

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
