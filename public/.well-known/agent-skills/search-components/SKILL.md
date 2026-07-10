# Search nxui components

Find the right animated Vue component in the nxui registry.

## Registry index

```bash
curl https://nxui.geoql.in/r/registry.json
```

Returns `{ items: [{ name, title, description }] }` for all 220+ components.
Filter client-side by matching your query against `name`, `title`, and
`description`.

## Categories

Components are grouped in the docs sidebar: Text Animations, Animations,
Components, Backgrounds, Hero Backgrounds, Visual Effects, Buttons, and
Paper Shaders. Browse them at https://nxui.geoql.in/docs or fetch the full
catalog as markdown from https://nxui.geoql.in/llms.txt.

## MCP server

Prefer structured access? nxui runs a remote MCP server (streamable HTTP) at
`https://nxui.geoql.in/mcp` with `list_components`, `get_component`, and
`get_install_command` tools. Discovery card:
`https://nxui.geoql.in/.well-known/mcp/server-card.json`.

## Fetch a component's source

```bash
curl https://nxui.geoql.in/r/<name>.json
```

`files[].content` holds the complete Vue SFC source; `dependencies` lists npm
packages the component needs.
