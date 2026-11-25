import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RequestEvent } from 'nuxt/server';
import type { RegistryIndex, RegistryItem } from '~/types/mcp';
import registryIndex from '../../public/r/registry.json';

export function getRegistryIndex(): RegistryIndex {
  return registryIndex as RegistryIndex;
}

interface CloudflareAssets {
  fetch: (request: Request) => Promise<Response>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAssets(value: unknown): value is CloudflareAssets {
  return isRecord(value) && typeof value.fetch === 'function';
}

function assetsFrom(cloudflare: unknown): CloudflareAssets | undefined {
  if (!isRecord(cloudflare) || !isRecord(cloudflare.env)) return undefined;
  const assets = cloudflare.env.ASSETS;
  return isAssets(assets) ? assets : undefined;
}

/**
 * The Workers ASSETS binding. Nitro v3 attaches the Cloudflare env to the
 * request (`event.req.runtime.cloudflare`); Nitro v2 put it on
 * `event.context.cloudflare`. Read both so the helper works on either.
 */
function cloudflareAssets(event: RequestEvent): CloudflareAssets | undefined {
  const req: unknown = event.req;
  const runtime = isRecord(req) ? req.runtime : undefined;
  return (
    assetsFrom(isRecord(runtime) ? runtime.cloudflare : undefined) ??
    assetsFrom(event.context.cloudflare)
  );
}

/**
 * Per-component registry JSONs (2.4 MB total) stay out of the worker bundle;
 * on workerd they are only reachable through the ASSETS binding (node:fs is
 * stubbed there), while local dev reads them from disk.
 */
export async function getRegistryItem(
  event: RequestEvent,
  name: string,
): Promise<RegistryItem | null> {
  const slug = name.replace(/\.json$/, '');
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return null;
  }

  const assets = cloudflareAssets(event);
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
