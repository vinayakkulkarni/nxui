import { defaultWindow } from '@vueuse/core';
import type { TocHeading } from '~/types/docs';

export function useTocScroll() {
  const route = useRoute();
  const headings = ref<TocHeading[]>([]);
  const activeId = ref('');
  const isScrolling = ref(false);

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function extractHeadings() {
    const elements = document.querySelectorAll('main h2, main h3');
    const items: TocHeading[] = [];
    const seenIds = new Set<string>();

    elements.forEach((elem) => {
      const text = (elem.textContent ?? '').trim();
      if (!text) return;

      if (!elem.id) {
        let id = slugify(text);
        let counter = 1;
        while (seenIds.has(id)) {
          id = `${slugify(text)}-${counter++}`;
        }
        elem.id = id;
      }

      if (!seenIds.has(elem.id)) {
        seenIds.add(elem.id);
        const level = elem.tagName === 'H2' ? 2 : 3;
        items.push({ id: elem.id, text, level });
      }
    });

    headings.value = items;
    if (items.length > 0) {
      activeId.value = items[0]!.id;
    }
  }

  function handleClick(e: Event, headingId: string) {
    e.preventDefault();
    isScrolling.value = true;
    activeId.value = headingId;
    document.getElementById(headingId)?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      isScrolling.value = false;
    }, 600);
  }

  function findActiveHeading() {
    if (isScrolling.value) return;
    let active = '';
    for (const heading of headings.value) {
      const el = document.getElementById(heading.id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top <= 120) {
        active = heading.id;
      }
    }
    if (active) {
      activeId.value = active;
    } else if (headings.value.length > 0) {
      activeId.value = headings.value[0]!.id;
    }
  }

  onMounted(() => {
    setTimeout(() => extractHeadings(), 500);
  });

  watchDebounced(() => route.path, extractHeadings, { debounce: 500 });

  useEventListener(defaultWindow, 'scroll', findActiveHeading, {
    passive: true,
  });

  return { headings, activeId, handleClick };
}
