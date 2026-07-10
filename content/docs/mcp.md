---
title: MCP
description: Integrating MCP with nxui lets you control it via AI.
---

Integrating MCP with nxui lets you add components through your AI assistant — Claude Code, Cursor, Windsurf, and any other MCP-capable client.

## Remote MCP server

nxui hosts a remote MCP server over streamable HTTP at `https://nxui.geoql.in/mcp`. Add it to your client and you get three tools: `list_components`, `get_component`, and `get_install_command`.

```bash
claude mcp add --transport http nxui https://nxui.geoql.in/mcp
```

Or configure it manually in any MCP client:

```json
{
  "mcpServers": {
    "nxui": {
      "type": "http",
      "url": "https://nxui.geoql.in/mcp"
    }
  }
}
```

The server is discoverable via its [server card](https://nxui.geoql.in/.well-known/mcp/server-card.json).

## Local registry MCP

Alternatively, enable the shadcn MCP server in your project environment:

```bash
npx shadcn@latest mcp init
```

Then add the nxui registry to your `components.json` file:

```json
{
  "registries": {
    "@nxui": "https://nxui.geoql.in/r/{name}.json"
  }
}
```

## Usage

You can now ask your IDE to use any nxui component. Here are some examples:

- "Add a shimmer button"
- "Add an aurora background"
- "Add a scroll-triggered text reveal"
