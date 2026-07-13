import type { H3Event } from 'h3';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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
  return JSON.parse(content);
});
