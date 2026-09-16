import type { H3Event } from 'h3';

defineRouteMeta({
  openAPI: {
    tags: ['discovery'],
    summary: 'A2A agent card',
    description:
      'Agent-to-Agent discovery document describing this site as an A2A-capable agent.',
    responses: {
      200: {
        description: 'The A2A agent card',
        content: { 'application/json': { schema: { type: 'object' } } },
      },
    },
  },
});

export default defineEventHandler((event: H3Event) => {
  setResponseHeader(event, 'content-type', 'application/json');
  setResponseHeader(event, 'cache-control', 'public, max-age=3600');
  setResponseHeader(event, 'x-content-type-options', 'nosniff');
  setResponseHeader(event, 'etag', `"a2a-${A2A_AGENT_CARD.version}"`);
  return A2A_AGENT_CARD;
});
