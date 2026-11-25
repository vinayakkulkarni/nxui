import { defineRouteMeta } from 'nitro';
import { defineHandler } from 'nuxt/server';
import { A2A_AGENT_CARD } from '../../utils/a2a';

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

export default defineHandler((event) => {
  event.res.headers.set('content-type', 'application/json');
  event.res.headers.set('cache-control', 'public, max-age=3600');
  event.res.headers.set('x-content-type-options', 'nosniff');
  event.res.headers.set('etag', `"a2a-${A2A_AGENT_CARD.version}"`);
  return A2A_AGENT_CARD;
});
