<script setup lang="ts">
  import Tooltip from '~/components/ui/tooltip/Tooltip.vue';
  import TooltipContent from '~/components/ui/tooltip/TooltipContent.vue';
  import TooltipTrigger from '~/components/ui/tooltip/TooltipTrigger.vue';

  defineProps<{
    compact?: boolean;
  }>();

  const { isOpen } = useCommandPalette();
</script>

<template>
  <Tooltip v-if="compact">
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
</template>
