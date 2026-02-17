<script setup lang="ts">
  import { docsNav } from '~/config/docs';

  const router = useRouter();
  const isOpen = ref(false);
  const query = ref('');
  const inputRef = ref<HTMLInputElement | null>(null);
  const selectedIndex = ref(0);

  const { meta_k, ctrl_k, escape } = useMagicKeys();

  watch([meta_k, ctrl_k], ([mk, ck]) => {
    if (mk || ck) isOpen.value = !isOpen.value;
  });

  watch(escape, (val) => {
    if (val) isOpen.value = false;
  });

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
</script>

<template>
  <button
    class="group inline-flex items-center justify-center md:justify-start gap-2 whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 border-0 md:border md:border-input/50 md:hover:border-input hover:bg-accent/50 md:px-3 md:py-2 relative h-9 w-9 md:w-40 lg:w-56 rounded-md md:rounded-lg bg-transparent md:bg-muted/30 text-sm font-normal text-muted-foreground"
    @click="isOpen = true"
  >
    <Icon
      name="lucide:search"
      class="size-[1.2rem] md:size-4 opacity-70 group-hover:opacity-100 md:opacity-50 md:group-hover:opacity-70 transition-opacity"
    />
    <span class="hidden lg:inline-flex">Search...</span>
    <span class="hidden md:inline-flex lg:hidden">Search</span>
    <kbd
      class="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-0.5 rounded-md border bg-background/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70 sm:flex"
    >
      <span class="text-xs">⌘</span>K
    </kbd>
  </button>

  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        @click="isOpen = false"
      ></div>
    </Transition>

    <Transition name="scale">
      <DocsCommandMenuDialog
        v-if="isOpen"
        :query="query"
        :filtered-groups="filteredGroups"
        :flat-items="flatItems"
        :selected-index="selectedIndex"
        :input-ref="inputRef"
        @update:query="query = $event"
        @update:input-ref="inputRef = $event"
        @select="handleSelect"
        @keydown="handleKeydown"
        @close="isOpen = false"
      />
    </Transition>
  </Teleport>
</template>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.12s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .scale-enter-active,
  .scale-leave-active {
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }
  .scale-enter-from,
  .scale-leave-to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.96);
  }
  .scale-enter-to,
  .scale-leave-from {
    transform: translate(-50%, -50%) scale(1);
  }
</style>
