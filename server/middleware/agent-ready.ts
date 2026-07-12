const ORIGIN = 'https://nxui.geoql.in';

const LINK_HEADER = [
  `<${ORIGIN}/llms.txt>; rel="describedby"; type="text/plain"`,
  `<${ORIGIN}/sitemap.xml>; rel="sitemap"; type="application/xml"`,
  `<${ORIGIN}/.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"`,
].join(', ');

const SKIP_PREFIXES = ['/api/', '/_nuxt/', '/r/', '/raw/', '/__nuxt_content/'];

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET') return;

  const path = getRequestURL(event).pathname;
  if (SKIP_PREFIXES.some((prefix) => path.startsWith(prefix))) return;
  if (path === '/mcp' || path.startsWith('/.well-known/')) return;

  appendResponseHeader(event, 'link', LINK_HEADER);

  if (path !== '/docs' && !path.startsWith('/docs/')) return;

  // Both representations (HTML and markdown) of /docs* must carry
  // Vary: Accept — the Workers cache stores variants per the response's
  // Vary header, so an HTML entry cached without it would be served to
  // Accept: text/markdown agents (and vice versa).
  setResponseHeader(event, 'vary', 'Accept');

  const accept = getHeader(event, 'accept') ?? '';
  if (!accept.includes('text/markdown')) return;

  // @nuxt/content already serves each docs page as raw markdown under
  // /raw/**.md; relative event.$fetch stays in-process (an absolute self-URL
  // $fetch returns empty on the deployed worker's same-zone loopback).
  const rawPath =
    path === '/docs' || path === '/docs/'
      ? '/raw/docs/index.md'
      : `/raw${path.replace(/\/$/, '')}.md`;

  const markdown = await event
    .$fetch<string>(rawPath, { responseType: 'text' })
    .catch(() => null);
  if (!markdown) return;

  setResponseHeader(event, 'content-type', 'text/markdown; charset=utf-8');
  return markdown;
});
