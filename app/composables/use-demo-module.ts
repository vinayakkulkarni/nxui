import { defineAsyncComponent } from 'vue';
import type { Component } from 'vue';

// Same glob as the component page, so both share one lazy chunk per demo.
const demoModules = import.meta.glob<{ default: Component }>(
  '~/components/content/Demo*.vue',
);

function toPascal(slug: string): string {
  return slug
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

const cache = new Map<string, Component>();

/**
 * Lazy primary demo (`Demo<Pascal>.vue`) for a docs slug, or `null` when the
 * page has no demo. Components are cached so remounting a tile is cheap.
 */
export function useDemoModule(slug: string): Component | null {
  const cached = cache.get(slug);
  if (cached) return cached;
  const key = Object.keys(demoModules).find((k) =>
    k.endsWith(`/Demo${toPascal(slug)}.vue`),
  );
  const loader = key ? demoModules[key] : undefined;
  if (!loader) return null;
  const component = defineAsyncComponent(loader);
  cache.set(slug, component);
  return component;
}
