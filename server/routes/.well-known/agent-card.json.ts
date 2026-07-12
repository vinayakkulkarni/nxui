import type { H3Event } from 'h3';
export default defineEventHandler((event: H3Event) => {
  setResponseHeader(event, 'content-type', 'application/json');
  setResponseHeader(event, 'cache-control', 'public, max-age=3600');
  setResponseHeader(event, 'etag', `"a2a-${A2A_AGENT_CARD.version}"`);
  return A2A_AGENT_CARD;
});
