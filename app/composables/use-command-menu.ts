import { docsNav } from '~/config/docs';

export function useCommandMenu() {
  const router = useRouter();
  const { isOpen } = useCommandPalette();
  const query = ref('');
  const inputRef = ref<HTMLInputElement | null>(null);
  const selectedIndex = ref(0);

  watch(isOpen, (val) => {
    if (val) {
      query.value = '';
      selectedIndex.value = 0;
      nextTick(() => inputRef.value?.focus());
    }
  });

  const filteredGroups = computed(() => {
    const q = query.value.toLowerCase();
    if (!q) return docsNav;
    return docsNav
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            group.title.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.items.length > 0);
  });

  const flatItems = computed(() =>
    filteredGroups.value.flatMap((g) => g.items),
  );

  function handleSelect(path: string) {
    isOpen.value = false;
    router.push(path);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex.value = Math.min(
        selectedIndex.value + 1,
        flatItems.value.length - 1,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
    } else if (e.key === 'Enter' && flatItems.value[selectedIndex.value]) {
      e.preventDefault();
      handleSelect(flatItems.value[selectedIndex.value]!.path);
    }
  }

  return {
    isOpen,
    query,
    inputRef,
    selectedIndex,
    filteredGroups,
    flatItems,
    handleSelect,
    handleKeydown,
  };
}
