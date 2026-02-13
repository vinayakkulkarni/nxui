<script setup lang="ts">
  import { useMagicKeys } from '@vueuse/core';
  import { motion, AnimatePresence } from 'motion-v';
  import type { CommandItem } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      items?: CommandItem[];
      placeholder?: string;
      class?: string;
    }>(),
    {
      items: () => [],
      placeholder: 'Type a command or search...',
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
</script>

<template>
  <Teleport to="body">
    <AnimatePresence>
      <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="open = false" ></div>
        <component
          :is="motion.div"
          :initial="{ opacity: 0, scale: 0.96 }"
          :animate="{ opacity: 1, scale: 1 }"
          :exit="{ opacity: 0, scale: 0.96 }"
          :transition="{ duration: 0.15 }"
          :class="cn('relative z-10 w-full max-w-lg overflow-hidden rounded-xl border bg-popover shadow-2xl', props.class)"
        >
          <div class="flex items-center border-b px-3">
            <Icon name="lucide:search" class="mr-2 size-4 shrink-0 text-muted-foreground" />
            <input
              v-model="search"
              :placeholder="props.placeholder"
              class="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div class="max-h-80 overflow-y-auto p-2">
            <div v-if="filteredItems.length === 0" class="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
            <div v-for="[group, groupItems] in groups" :key="group" class="mb-2">
              <p class="mb-1 px-2 text-xs font-medium text-muted-foreground">{{ group }}</p>
              <button
                v-for="item in groupItems"
                :key="item.label"
                class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                @click="selectItem(item)"
              >
                <Icon v-if="item.icon" :name="item.icon" class="size-4 text-muted-foreground" />
                <span class="flex-1 text-left">{{ item.label }}</span>
                <kbd v-if="item.shortcut" class="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium opacity-100 sm:flex">
                  {{ item.shortcut }}
                </kbd>
              </button>
            </div>
          </div>
        </component>
      </div>
    </AnimatePresence>
  </Teleport>
</template>
