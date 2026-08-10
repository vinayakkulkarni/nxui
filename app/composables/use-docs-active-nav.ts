import { docsNav } from '~/config/docs';

export function useDocsActiveNav() {
  const route = useRoute();

  const activeHrefByGroup = computed(() => {
    const result: Record<string, string | null> = {};
    for (const group of docsNav) {
      const activeItem = group.items.find((item) => route.path === item.path);
      result[group.title] = activeItem?.path ?? null;
    }
    return result;
  });

  return { activeHrefByGroup };
}
