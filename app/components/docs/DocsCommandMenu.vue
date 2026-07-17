<script setup lang="ts">
  import { docsNav } from '~/config/docs';
  import Tooltip from '~/components/ui/tooltip/Tooltip.vue';
  import TooltipContent from '~/components/ui/tooltip/TooltipContent.vue';
  import TooltipTrigger from '~/components/ui/tooltip/TooltipTrigger.vue';

  const props = defineProps<{
    /** Compact icon-only trigger (for the floating toolbar). */
    compact?: boolean;
  }>();

  const router = useRouter();
  // Shared open state + a single global ⌘K/Ctrl+K/Escape binding, so multiple
  // trigger instances (docs header + component-page toolbar) stay in sync and
  // never double-register the shortcut.
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
</script>

<template>
  <!-- Compact icon-only trigger (floating toolbar on component pages) -->
  <Tooltip v-if="props.compact">
    <TooltipTrigger as-child>
      <button
        class="pointer-events-auto inline-flex size-7 items-center justify-center rounded-lg bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
        aria-label="Search components (⌘K)"
        @click="isOpen = true"
      >
        <Icon name="lucide:search" class="size-4" />
      </button>
    </TooltipTrigger>
    <TooltipContent>Search (⌘K)</TooltipContent>
  </Tooltip>

  <!-- Full search box (docs header) -->
  <button
    v-else
    class="group relative inline-flex size-9 items-center justify-center gap-2 rounded-md border-0 bg-transparent text-sm font-normal whitespace-nowrap text-muted-foreground transition-all duration-200 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none md:w-40 md:justify-start md:rounded-lg md:border md:border-input/50 md:bg-muted/30 md:px-3 md:py-2 md:hover:border-input lg:w-56"
    @click="isOpen = true"
  >
    <Icon
      name="lucide:search"
      class="size-[1.2rem] opacity-70 transition-opacity group-hover:opacity-100 md:size-4 md:opacity-50 md:group-hover:opacity-70"
    />
    <span class="hidden lg:inline-flex">Search...</span>
    <span class="hidden md:inline-flex lg:hidden">Search</span>
    <kbd
      class="pointer-events-none absolute top-1.5 right-1.5 hidden h-6 items-center gap-0.5 rounded-md border bg-background/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70 select-none sm:flex"
    >
      <span class="text-xs">⌘</span>K
    </kbd>
  </button>

  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-100 bg-black/50 backdrop-blur-sm"
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
