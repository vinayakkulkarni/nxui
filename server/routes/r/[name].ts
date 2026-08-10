import type { H3Event } from 'h3';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

defineRouteMeta({
  openAPI: {
    tags: ['registry'],
    summary: 'Fetch a registry component definition',
    description:
      'Returns the shadcn-vue registry JSON for a single component. In production these files are served directly from static assets; this handler is the development fallback.',
    parameters: [
      {
        name: 'name',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Component slug, with or without a .json suffix',
      },
    ],
    responses: {
      200: {
        description: 'The registry item',
        content: { 'application/json': { schema: { type: 'object' } } },
      },
      404: { description: 'Unknown component slug' },
    },
  },
});

export default defineEventHandler((event: H3Event) => {
  const name = getRouterParam(event, 'name');
  if (!name) {
    throw createError({ statusCode: 400, message: 'Missing component name' });
  }

  const slug = name.replace(/\.json$/, '');
  const filePath = join(process.cwd(), 'public', 'r', `${slug}.json`);

  if (!existsSync(filePath)) {
    throw createError({
      statusCode: 404,
      message: `Component "${slug}" not found`,
    });
  }

  trackOpenPanelEvent(event, 'registry_download', {
    component: slug,
    url: `https://nxui.geoql.in/r/${slug}`,
  }).catch(() => {});

  const content = readFileSync(filePath, 'utf-8');
  setResponseHeader(event, 'content-type', 'application/json');
  setResponseHeader(event, 'x-content-type-options', 'nosniff');
  return JSON.parse(content);
});
