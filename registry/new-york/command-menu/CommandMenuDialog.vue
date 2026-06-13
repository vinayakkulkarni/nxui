<script setup lang="ts">
  import { motion, AnimatePresence } from 'motion-v';
  import type { CommandMenuGroup, CommandMenuItem } from './types';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      groups: CommandMenuGroup[];
      placeholder?: string;
      emptyMessage?: string;
      brandName?: string;
      class?: string;
    }>(),
    {
      placeholder: 'Search...',
      emptyMessage: 'No results found',
      brandName: 'Command Menu',
      class: '',
    },
  );

  const open = defineModel<boolean>('open', { default: false });
  const query = ref('');
  const inputRef = ref<HTMLInputElement>();
  const selectedIndex = ref(0);

  watch(open, (val) => {
    if (val) nextTick(() => inputRef.value?.focus());
    else query.value = '';
  });

  const filteredGroups = computed(() => {
    const q = query.value.toLowerCase();
    if (!q) return props.groups;
    return props.groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) =>
            i.title.toLowerCase().includes(q) ||
            g.title.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.items.length > 0);
  });

  const flatFiltered = computed(() =>
    filteredGroups.value.flatMap((g) => g.items),
  );

  watch(query, () => {
    selectedIndex.value = 0;
  });

  function handleKeyNav(e: KeyboardEvent) {
    const len = flatFiltered.value.length;
    if (!len) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex.value = (selectedIndex.value + 1) % len;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex.value = (selectedIndex.value - 1 + len) % len;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(flatFiltered.value[selectedIndex.value]!);
    }
  }

  function handleSelect(item: CommandMenuItem) {
    open.value = false;
    item.onSelect?.();
  }
  function isSelected(item: CommandMenuItem) {
    return flatFiltered.value[selectedIndex.value]?.id === item.id;
  }
</script>

<template>
  <Teleport to="body">
    <AnimatePresence>
      <template v-if="open">
        <component
          :is="motion.div"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0 }"
          :transition="{ duration: 0.15 }"
          class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          @click="open = false"
        />
        <component
          :is="motion.div"
          :initial="{ opacity: 0, scale: 0.96 }"
          :animate="{ opacity: 1, scale: 1 }"
          :exit="{ opacity: 0, scale: 0.96 }"
          :transition="{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }"
          class="fixed left-1/2 top-1/2 z-50 w-full max-w-170 -translate-1/2 p-4"
        >
          <div
            :class="
              cn(
                'overflow-hidden rounded-2xl border border-border/80 bg-popover shadow-2xl shadow-black/10 dark:shadow-black/30 backdrop-blur-xl dark:border-white/8',
                props.class,
              )
            "
            @keydown="handleKeyNav"
          >
            <div
              class="flex items-center gap-3 border-b border-border/50 px-4 py-3"
            >
              <div
                class="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/5"
              >
                <Icon name="lucide:search" class="size-4 text-primary" />
              </div>
              <input
                ref="inputRef"
                v-model="query"
                :placeholder="placeholder"
                class="flex-1 bg-transparent text-base font-normal text-foreground outline-none placeholder:text-muted-foreground"
              />
              <component
                :is="motion.button"
                v-if="query"
                :initial="{ opacity: 0, scale: 0.8 }"
                :animate="{ opacity: 1, scale: 1 }"
                class="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                @click="query = ''"
                >Clear</component
              >
              <kbd
                class="hidden sm:inline-flex h-6 items-center gap-1 rounded-md border bg-muted/50 px-2 font-mono text-[10px] font-medium text-muted-foreground"
                >ESC</kbd
              >
            </div>
            <div class="max-h-100 overflow-y-auto overscroll-contain p-2">
              <div
                v-if="flatFiltered.length === 0"
                class="flex flex-col items-center justify-center py-14 text-center"
              >
                <div
                  class="mb-3 flex size-12 items-center justify-center rounded-full bg-muted/50"
                >
                  <Icon
                    name="lucide:search"
                    class="size-5 text-muted-foreground/50"
                  />
                </div>
                <p class="text-sm text-muted-foreground">{{ emptyMessage }}</p>
                <p class="text-xs text-muted-foreground/60">
                  Try searching for something else
                </p>
              </div>
              <div
                v-for="group in filteredGroups"
                :key="group.title"
                class="mb-1"
              >
                <p
                  class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {{ group.title }}
                </p>
                <button
                  v-for="item in group.items"
                  :key="item.id"
                  :class="
                    cn(
                      'group/item relative flex w-full cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors hover:bg-accent/70 hover:text-accent-foreground',
                      isSelected(item) && 'bg-accent text-accent-foreground',
                    )
                  "
                  @click="handleSelect(item)"
                >
                  <div
                    :class="
                      cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors',
                        isSelected(item) && 'bg-primary/10 text-primary',
                      )
                    "
                  >
                    <Icon v-if="item.icon" :name="item.icon" class="size-4" />
                  </div>
                  <div
                    class="flex flex-1 flex-col items-start gap-0.5 text-left"
                  >
                    <span class="font-medium text-foreground">{{
                      item.title
                    }}</span
                    ><span class="text-xs text-muted-foreground">{{
                      group.title
                    }}</span>
                  </div>
                  <Icon
                    name="lucide:arrow-right"
                    :class="
                      cn(
                        'size-4 text-muted-foreground transition-all -translate-x-2 opacity-0',
                        isSelected(item) && 'opacity-100 translate-x-0',
                      )
                    "
                  />
                </button>
              </div>
            </div>
            <div
              class="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-2.5"
            >
              <div
                class="flex items-center gap-4 text-xs text-muted-foreground"
              >
                <span class="flex items-center gap-1.5"
                  ><kbd
                    class="rounded border bg-background/80 px-1.5 py-0.5 font-mono text-[10px]"
                    >↑↓</kbd
                  >
                  Navigate</span
                >
                <span class="flex items-center gap-1.5"
                  ><kbd
                    class="rounded border bg-background/80 px-1.5 py-0.5 font-mono text-[10px]"
                    >↵</kbd
                  >
                  Select</span
                >
              </div>
              <span class="text-xs text-muted-foreground/40">{{
                brandName
              }}</span>
            </div>
          </div>
        </component>
      </template>
    </AnimatePresence>
  </Teleport>
</template>
