<script setup lang="ts">
  import type { NavGroup, NavItem } from '~/types/docs';

  defineProps<{
    filteredGroups: NavGroup[];
    flatItems: NavItem[];
    selectedIndex: number;
  }>();

  const emit = defineEmits<{
    select: [path: string];
  }>();
</script>

<template>
  <div class="max-h-100 overflow-y-auto overscroll-contain p-2">
    <div
      v-if="flatItems.length === 0"
      class="flex flex-col items-center justify-center py-14 text-center"
    >
      <div
        class="mb-3 flex size-12 items-center justify-center rounded-full bg-muted/50"
      >
        <Icon name="lucide:search" class="size-5 text-muted-foreground/50" />
      </div>
      <p class="text-sm text-muted-foreground">No results found</p>
      <p class="text-xs text-muted-foreground/60">
        Try searching for something else
      </p>
    </div>

    <div v-for="group in filteredGroups" :key="group.title">
      <p
        class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {{ group.title }}
      </p>
      <button
        v-for="item in group.items"
        :key="item.path"
        :class="[
          'group/item relative flex w-full cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors',
          flatItems.indexOf(item) === selectedIndex
            ? 'bg-accent text-accent-foreground'
            : 'hover:bg-accent/70 hover:text-accent-foreground',
        ]"
        @click="emit('select', item.path)"
      >
        <div
          :class="[
            'flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors',
            flatItems.indexOf(item) === selectedIndex
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground',
          ]"
        >
          <Icon
            :name="
              group.title === 'Getting Started'
                ? 'lucide:file-text'
                : 'lucide:hash'
            "
            class="size-4"
          />
        </div>
        <div class="flex flex-1 flex-col gap-0.5">
          <span class="flex items-center gap-1.5 font-medium">
            {{ item.title }}
            <span
              v-if="item.badge"
              class="inline-flex items-center rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-violet-500 dark:bg-violet-400/10 dark:text-violet-400"
            >
              {{ item.badge }}
            </span>
          </span>
          <span class="text-xs text-muted-foreground">{{ group.title }}</span>
        </div>
        <Icon
          name="lucide:arrow-right"
          :class="[
            'size-4 transition-all text-muted-foreground',
            flatItems.indexOf(item) === selectedIndex
              ? 'opacity-100'
              : 'opacity-0 -translate-x-2',
          ]"
        />
      </button>
    </div>
  </div>
</template>
