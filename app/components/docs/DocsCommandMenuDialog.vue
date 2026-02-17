<script setup lang="ts">
  import type { NavGroup, NavItem } from '~/types/docs';

  defineProps<{
    query: string;
    filteredGroups: NavGroup[];
    flatItems: NavItem[];
    selectedIndex: number;
    inputRef: HTMLInputElement | null;
  }>();

  const emit = defineEmits<{
    'update:query': [value: string];
    'update:input-ref': [el: HTMLInputElement | null];
    select: [path: string];
    keydown: [e: KeyboardEvent];
    close: [];
  }>();

  const localInputRef = ref<HTMLInputElement | null>(null);

  onMounted(() => {
    emit('update:input-ref', localInputRef.value);
    nextTick(() => localInputRef.value?.focus());
  });
</script>

<template>
  <div
    class="fixed left-1/2 top-1/2 z-[101] w-full max-w-[680px] -translate-x-1/2 -translate-y-1/2 p-4"
  >
    <div
      class="overflow-hidden rounded-2xl border border-border/80 bg-popover shadow-2xl shadow-black/10 dark:shadow-black/30 backdrop-blur-2xl dark:border-white/[0.08]"
      @keydown="emit('keydown', $event)"
    >
      <div class="flex items-center gap-3 border-b border-border/50 px-4 py-3">
        <div
          class="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5"
        >
          <Icon name="lucide:search" class="size-4 text-primary" />
        </div>
        <input
          ref="localInputRef"
          :value="query"
          placeholder="Search documentation..."
          class="flex-1 bg-transparent text-base font-normal text-foreground outline-none placeholder:text-muted-foreground"
          @input="
            emit('update:query', ($event.target as HTMLInputElement).value)
          "
        />
        <button
          v-if="query"
          class="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          @click="emit('update:query', '')"
        >
          Clear
        </button>
        <kbd
          class="hidden sm:inline-flex h-6 items-center gap-1 rounded-md border bg-muted/50 px-2 font-mono text-[10px] font-medium text-muted-foreground"
        >
          ESC
        </kbd>
      </div>

      <div class="max-h-[400px] overflow-y-auto overscroll-contain p-2">
        <div
          v-if="flatItems.length === 0"
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
              <span class="font-medium">{{ item.title }}</span>
              <span class="text-xs text-muted-foreground">{{
                group.title
              }}</span>
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

      <div
        class="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-2.5"
      >
        <div class="flex items-center gap-4 text-xs text-muted-foreground">
          <span class="flex items-center gap-1.5">
            <kbd
              class="rounded border bg-background/80 px-1.5 py-0.5 font-mono text-[10px]"
              >↑↓</kbd
            >
            Navigate
          </span>
          <span class="flex items-center gap-1.5">
            <kbd
              class="rounded border bg-background/80 px-1.5 py-0.5 font-mono text-[10px]"
              >↵</kbd
            >
            Select
          </span>
        </div>
        <span class="text-xs text-muted-foreground/40">nxui</span>
      </div>
    </div>
  </div>
</template>
