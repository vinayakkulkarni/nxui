import type { MaybeRefOrGetter } from 'vue';
import type { MinimarkNode } from '@nuxt/content';
import type { DocsBodySection } from '~/types/docs';

// Sections the page chrome already shows (title, live demo, install tabs),
// so rendering them again from the markdown would only duplicate them.
const SKIPPED_SECTIONS = new Set(['installation']);

function tagOf(node: MinimarkNode): string | null {
  return Array.isArray(node) && typeof node[0] === 'string' ? node[0] : null;
}

function textOf(node: MinimarkNode): string {
  if (typeof node === 'string') return node;
  if (!Array.isArray(node)) return '';
  return node
    .slice(2)
    .map((child) => textOf(child as MinimarkNode))
    .join('');
}

function idOf(node: MinimarkNode, title: string): string {
  const props = Array.isArray(node) ? node[1] : null;
  const id = props && typeof props === 'object' ? props.id : undefined;
  return typeof id === 'string' ? id : title.toLowerCase().replace(/\W+/g, '-');
}

/**
 * Splits a component page's markdown body into an intro and one section per
 * `## Heading`, dropping the h1 and live-demo blocks the page renders itself.
 * Everything stays in the server-rendered HTML, so readers and crawlers both
 * get the usage, props and accessibility notes.
 */
export function useDocsBodySections(nodes: MaybeRefOrGetter<MinimarkNode[]>) {
  return computed(() => {
    const intro: MinimarkNode[] = [];
    const sections: DocsBodySection[] = [];
    for (const node of toValue(nodes)) {
      const tag = tagOf(node);
      if (tag === 'h1' || tag?.startsWith('demo-')) continue;
      if (tag === 'h2') {
        const title = textOf(node).trim();
        sections.push({ id: idOf(node, title), title, nodes: [] });
        continue;
      }
      const current = sections.at(-1);
      if (current) current.nodes.push(node);
      else intro.push(node);
    }
    return {
      intro,
      sections: sections.filter(
        (s) => s.nodes.length && !SKIPPED_SECTIONS.has(s.title.toLowerCase()),
      ),
    };
  });
}
