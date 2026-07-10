import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { H3Event } from 'h3';
import type { RegistryIndex, RegistryItem } from '~/types/mcp';
import registryIndex from '../../public/r/registry.json';

export function getRegistryIndex(): RegistryIndex {
  return registryIndex as RegistryIndex;
}

interface CloudflareAssets {
  fetch: (request: Request) => Promise<Response>;
}

/**
 * Per-component registry JSONs (2.4 MB total) stay out of the worker bundle;
 * on workerd they are only reachable through the Pages ASSETS binding
 * (node:fs is stubbed there), while local dev reads them from disk.
 */
export async function getRegistryItem(
  event: H3Event,
  name: string,
): Promise<RegistryItem | null> {
  const slug = name.replace(/\.json$/, '');
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return null;
  }

  const assets = (
    event.context.cloudflare?.env as { ASSETS?: CloudflareAssets } | undefined
  )?.ASSETS;

  if (assets) {
    const response = await assets.fetch(
      new Request(`https://assets.local/r/${slug}.json`),
    );
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as RegistryItem;
  }

  try {
    const filePath = join(process.cwd(), 'public', 'r', `${slug}.json`);
    return JSON.parse(readFileSync(filePath, 'utf-8')) as RegistryItem;
  } catch {
    return null;
  }
}
