import { defineRouteMeta } from 'nitro';
import { defineHandler } from 'nuxt/server';
import { MCP_SERVER_INFO } from '../../../utils/mcp-tools';

defineRouteMeta({
  openAPI: {
    tags: ['discovery'],
    summary: 'MCP server card',
    description:
      'Model Context Protocol server card describing the transport, protocol version and capabilities of the nxui MCP server.',
    responses: {
      200: {
        description: 'The MCP server card',
        content: { 'application/json': { schema: { type: 'object' } } },
      },
    },
  },
});

export default defineHandler((event) => {
  event.res.headers.set('content-type', 'application/json');
  event.res.headers.set('cache-control', 'public, max-age=3600');
  event.res.headers.set('x-content-type-options', 'nosniff');
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
      'MCP server for the nxui component registry: browse, search, and fetch the source of 360+ animated Vue components, with shadcn-vue CLI install commands.',
    documentationUrl: 'https://nxui.geoql.in/docs',
  };
});
