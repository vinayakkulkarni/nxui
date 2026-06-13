<script setup lang="ts">
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      triggerClass?: string;
      triggerLabel?: string;
      shortcutKey?: string;
    }>(),
    {
      triggerClass: '',
      triggerLabel: 'Search...',
      shortcutKey: 'K',
    },
  );

  const emit = defineEmits<{ (e: 'open'): void }>();
</script>

<template>
  <button
    :class="
      cn(
        'group inline-flex items-center gap-2 whitespace-nowrap transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        'border border-input/50 hover:border-input hover:bg-accent/50',
        'px-3 py-2 relative h-9 w-full justify-start rounded-lg bg-muted/50',
        'text-sm font-normal text-muted-foreground sm:pr-12 md:w-40 lg:w-56',
        props.triggerClass,
      )
    "
    @click="emit('open')"
  >
    <Icon
      name="lucide:search"
      class="size-4 opacity-70 group-hover:opacity-100 transition-opacity"
    />
    <span class="hidden lg:inline-flex">{{ triggerLabel }}</span>
    <span class="inline-flex lg:hidden">Search</span>
    <kbd
      class="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-0.5 rounded-md border bg-background/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70 sm:flex"
    >
      <span class="text-xs">⌘</span>{{ shortcutKey }}
    </kbd>
  </button>
</template>
