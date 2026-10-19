import { computed, ref } from 'vue';
import { docsNav } from '~/config/docs';
import type { GalleryCategory, GalleryItem } from '~/types/docs';

/** Hand-picked live demos for the bento at the top of /docs. */
// Order matters: the bento renders `lg sm sm / sm sm lg`. Every pick animates
// on its own, because gallery previews do not receive pointer input.
const FEATURED = [
  'fluid-glass',
  'crystalized-ball',
  'split-flap-text',
  'kpi-carousel',
  'prismatic-burst',
  'data-table',
];

function toItems(): GalleryCategory[] {
  const seen = new Set<string>();
  return docsNav
    .filter((g) => g.title !== 'Getting Started')
    .map((g) => ({
      title: g.title,
      items: g.items
        .filter((i) => !seen.has(i.path) && seen.add(i.path))
        .map((i): GalleryItem => ({
          ...i,
          slug: i.path.split('/').pop() ?? '',
          category: g.title,
        })),
    }))
    .filter((g) => g.items.length > 0);
}

export function useGallery() {
  const categories = toItems();
  const all = categories.flatMap((c) => c.items);
  const featured = FEATURED.map((s) => all.find((i) => i.slug === s)).filter(
    (i): i is GalleryItem => i !== undefined,
  );

  const query = ref('');
  const active = ref('All');

  const visible = computed<GalleryCategory[]>(() => {
    const q = query.value.trim().toLowerCase();
    return categories
      .filter((c) => active.value === 'All' || c.title === active.value)
      .map((c) => ({
        title: c.title,
        items: q
          ? c.items.filter((i) => i.title.toLowerCase().includes(q))
          : c.items,
      }))
      .filter((c) => c.items.length > 0);
  });

  const total = all.length;
  const tabs = ['All', ...categories.map((c) => c.title)];
  return { featured, visible, query, active, tabs, total };
}
