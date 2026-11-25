import { defineHandler, getRequestHeader, serverFetch } from 'nuxt/server';

const ORIGIN = 'https://nxui.geoql.in';

const LINK_HEADER = [
  `<${ORIGIN}/llms.txt>; rel="describedby"; type="text/plain"`,
  `<${ORIGIN}/sitemap.xml>; rel="sitemap"; type="application/xml"`,
  `<${ORIGIN}/.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"`,
].join(', ');

const SKIP_PREFIXES = ['/api/', '/_nuxt/', '/r/', '/raw/', '/__nuxt_content/'];

export default defineHandler(async (event) => {
  if (event.req.method !== 'GET') return;

  const path = event.url.pathname;
  if (SKIP_PREFIXES.some((prefix) => path.startsWith(prefix))) return;
  if (path === '/mcp' || path === '/a2a' || path.startsWith('/.well-known/'))
    return;

  event.res.headers.append('link', LINK_HEADER);

  if (path !== '/docs' && !path.startsWith('/docs/')) return;

  // Both representations (HTML and markdown) of /docs* must carry
  // Vary: Accept — the Workers cache stores variants per the response's
  // Vary header, so an HTML entry cached without it would be served to
  // Accept: text/markdown agents (and vice versa).
  event.res.headers.set('vary', 'Accept');

  const accept = getRequestHeader(event, 'accept') ?? '';
  if (!accept.includes('text/markdown')) return;

  // @nuxt/content already serves each docs page as raw markdown under
  // /raw/**.md; serverFetch stays in-process (an absolute self-URL fetch
  // returns empty on the deployed worker's same-zone loopback).
  const rawPath =
    path === '/docs' || path === '/docs/'
      ? '/raw/docs/index.md'
      : `/raw${path.replace(/\/$/, '')}.md`;

  const response = await serverFetch(event, rawPath).catch(() => null);
  const markdown = response?.ok ? await response.text() : '';
  if (!markdown) return;

  event.res.headers.set('content-type', 'text/markdown; charset=utf-8');
  return markdown;
});
