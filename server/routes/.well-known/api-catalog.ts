import { defineRouteMeta } from 'nitro';
import { defineHandler } from 'nuxt/server';
const ORIGIN = 'https://nxui.geoql.in';

defineRouteMeta({
  openAPI: {
    tags: ['discovery'],
    summary: 'RFC 9727 API catalog',
    description:
      'Linkset describing the machine-readable services this site exposes: the component registry, the MCP server and the A2A endpoint.',
    responses: {
      200: {
        description: 'An RFC 9727 linkset document',
        content: {
          'application/linkset+json': { schema: { type: 'object' } },
        },
      },
    },
  },
});

export default defineHandler((event) => {
  event.res.headers.set(
    'content-type',
    'application/linkset+json; charset=utf-8',
  );
  event.res.headers.set('cache-control', 'public, max-age=3600');
  event.res.headers.set('x-content-type-options', 'nosniff');
  return {
    linkset: [
      {
        anchor: `${ORIGIN}/r/registry.json`,
        'service-doc': [{ href: `${ORIGIN}/docs`, type: 'text/html' }],
        describedby: [{ href: `${ORIGIN}/llms.txt`, type: 'text/plain' }],
      },
      {
        anchor: `${ORIGIN}/mcp`,
        'service-doc': [{ href: `${ORIGIN}/docs`, type: 'text/html' }],
        describedby: [
          {
            href: `${ORIGIN}/.well-known/mcp/server-card.json`,
            type: 'application/json',
          },
        ],
      },
      {
        anchor: `${ORIGIN}/a2a`,
        'service-doc': [{ href: `${ORIGIN}/docs`, type: 'text/html' }],
        describedby: [
          {
            href: `${ORIGIN}/.well-known/agent-card.json`,
            type: 'application/json',
          },
        ],
      },
      {
        anchor: ORIGIN,
        'service-meta': [
          { href: `${ORIGIN}/llms.txt`, type: 'text/plain' },
          { href: `${ORIGIN}/llms-full.txt`, type: 'text/plain' },
          { href: `${ORIGIN}/sitemap.xml`, type: 'application/xml' },
        ],
      },
    ],
  };
});
