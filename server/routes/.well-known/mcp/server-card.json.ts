export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'application/json');
  setResponseHeader(event, 'cache-control', 'public, max-age=3600');
  return {
    $schema:
      'https://static.modelcontextprotocol.io/schemas/2025-11-25/server-card.schema.json',
    serverInfo: MCP_SERVER_INFO,
    protocolVersion: '2025-06-18',
    transport: {
      type: 'streamable-http',
      endpoint: 'https://nxui.geoql.in/mcp',
    },
    capabilities: { tools: {} },
    description:
      'MCP server for the nxui component registry: browse, search, and fetch the source of 220+ animated Vue components, with shadcn-vue CLI install commands.',
    documentationUrl: 'https://nxui.geoql.in/docs',
  };
});
