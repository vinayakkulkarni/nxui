<script setup lang="ts">
  import { useMagicKeys } from '@vueuse/core';
  import { motion, AnimatePresence } from 'motion-v';
  import type { CommandItem } from './types';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      items?: CommandItem[];
      placeholder?: string;
      emptyMessage?: string;
      brandName?: string;
      class?: string;
    }>(),
    {
      items: () => [],
      placeholder: 'Search...',
      emptyMessage: 'No results found',
      brandName: 'Demo App',
      class: '',
    },
  );

  const open = defineModel<boolean>('open', { default: false });
  const search = ref('');

  const { meta_k, ctrl_k } = useMagicKeys();
  watch([meta_k, ctrl_k], ([mk, ck]) => {
    if (mk || ck) open.value = !open.value;
  });

  const filteredItems = computed(() => {
    const q = search.value.toLowerCase();
    if (!q) return props.items;
    return props.items.filter((item) => item.label.toLowerCase().includes(q));
  });

  const groups = computed(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filteredItems.value) {
      const group = item.group ?? 'Actions';
      const arr = map.get(group) ?? [];
      arr.push(item);
      map.set(group, arr);
    }
    return map;
  });

  function selectItem(item: CommandItem) {
    item.onSelect?.();
    open.value = false;
    search.value = '';
  }

  watch(open, (val) => {
    if (!val) search.value = '';
  });
</script>

<template>
  <Teleport to="body">
    <AnimatePresence>
      <div v-if="open" class="fixed inset-0 z-50">
        <component
          :is="motion.div"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0 }"
          :transition="{ duration: 0.15 }"
          class="fixed inset-0 bg-black/50 backdrop-blur-sm"
          @click="open = false"
        />
        <component
          :is="motion.div"
          :initial="{ opacity: 0, scale: 0.96 }"
          :animate="{ opacity: 1, scale: 1 }"
          :exit="{ opacity: 0, scale: 0.96 }"
          :transition="{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }"
          :class="
            cn(
              'fixed left-1/2 top-1/2 z-50 w-full max-w-170 -translate-x-1/2 -translate-y-1/2 p-4',
              props.class,
            )
          "
        >
          <div
            class="overflow-hidden rounded-2xl border border-border/50 bg-popover/95 shadow-2xl shadow-black/20 backdrop-blur-xl"
          >
            <!-- Search header -->
            <div
              class="flex items-center gap-3 border-b border-border/50 px-4 py-3"
            >
              <div
                class="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/5"
              >
                <Icon name="lucide:search" class="size-4 text-primary" />
              </div>
              <input
                v-model="search"
                :placeholder="placeholder"
                class="flex-1 bg-transparent text-base font-normal outline-none placeholder:text-muted-foreground/60"
                autofocus
              />
              <component
                :is="motion.button"
                v-if="search"
                :initial="{ opacity: 0, scale: 0.8 }"
                :animate="{ opacity: 1, scale: 1 }"
                class="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                @click="search = ''"
              >
                Clear
              </component>
              <kbd
                class="hidden h-6 select-none items-center gap-1 rounded-md border bg-muted/50 px-2 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex"
              >
                ESC
              </kbd>
            </div>

            <!-- Items list -->
            <div class="max-h-100 overflow-y-auto overscroll-contain p-2">
              <div
                v-if="filteredItems.length === 0"
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
                v-for="[group, groupItems] in groups"
                :key="group"
                class="mb-2"
              >
                <p
                  class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60"
                >
                  {{ group }}
                </p>
                <button
                  v-for="item in groupItems"
                  :key="item.label"
                  class="group flex w-full cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors hover:bg-accent/70 hover:text-accent-foreground"
                  @click="selectItem(item)"
                >
                  <div
                    class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary"
                  >
                    <Icon v-if="item.icon" :name="item.icon" class="size-4" />
                  </div>
                  <div class="flex flex-1 flex-col gap-0.5">
                    <span class="text-left font-medium">{{ item.label }}</span>
                    <span class="text-left text-xs text-muted-foreground/60">{{
                      group
                    }}</span>
                  </div>
                  <Icon
                    name="lucide:arrow-right"
                    class="size-4 -translate-x-2 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                  />
                </button>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="flex items-center justify-between border-t border-border/50 bg-muted/30 px-4 py-2.5"
            >
              <div
                class="flex items-center gap-4 text-xs text-muted-foreground/60"
              >
                <span class="flex items-center gap-1.5">
                  <kbd
                    class="rounded border bg-background/80 px-1.5 py-0.5 font-mono text-[10px]"
                    >&#8593;&#8595;</kbd
                  >
                  Navigate
                </span>
                <span class="flex items-center gap-1.5">
                  <kbd
                    class="rounded border bg-background/80 px-1.5 py-0.5 font-mono text-[10px]"
                    >&#8629;</kbd
                  >
                  Select
                </span>
              </div>
              <span class="text-xs text-muted-foreground/40">{{
                brandName
              }}</span>
            </div>
          </div>
        </component>
      </div>
    </AnimatePresence>
  </Teleport>
</template>
