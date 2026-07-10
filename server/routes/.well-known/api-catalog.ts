const ORIGIN = 'https://nxui.geoql.in';

export default defineEventHandler((event) => {
  setResponseHeader(
    event,
    'content-type',
    'application/linkset+json; charset=utf-8',
  );
  setResponseHeader(event, 'cache-control', 'public, max-age=3600');
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
