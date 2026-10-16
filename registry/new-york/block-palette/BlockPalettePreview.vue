<script setup lang="ts">
  import { CHART_BARS } from './block-kinds';
  import type { BlockPalettePreviewProps } from './types';

  const props = defineProps<BlockPalettePreviewProps>();
</script>

<template>
  <div
    aria-hidden="true"
    class="flex h-6 w-14 shrink-0 items-center justify-end"
  >
    <div
      v-if="props.kind === 'group'"
      class="flex h-6 w-14 items-center gap-1 rounded-lg border border-dashed border-muted-foreground/50 px-1"
    >
      <span class="h-2.5 flex-1 rounded-sm bg-muted-foreground/25" />
      <span class="h-2.5 flex-1 rounded-sm bg-muted-foreground/25" />
    </div>

    <div v-else-if="props.kind === 'chart'" class="flex h-5 items-end gap-0.75">
      <span
        v-for="(bar, index) in CHART_BARS"
        :key="index"
        :class="[
          'w-1.5 rounded-t-[1px]',
          bar.bright
            ? 'bg-green-500 dark:bg-green-400'
            : 'bg-green-600/60 dark:bg-green-600/70',
        ]"
        :style="{ height: `${bar.height}px` }"
      />
    </div>

    <Icon
      v-else-if="props.kind === 'slice'"
      name="lucide:grip-vertical"
      class="size-4 text-muted-foreground/70"
    />

    <div
      v-else-if="props.kind === 'parameter'"
      class="relative h-1 w-14 rounded-full bg-muted-foreground/25"
    >
      <span
        class="absolute inset-y-0 left-0 w-2/3 rounded-full bg-yellow-400"
      />
      <span
        class="absolute top-1/2 left-2/3 grid size-3 -translate-1/2 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/10"
      >
        <span class="size-1 rounded-full bg-yellow-400" />
      </span>
    </div>

    <div v-else class="flex w-14 flex-col gap-1">
      <span class="h-1.5 w-9 rounded-full bg-pink-400/80 dark:bg-pink-400/70" />
      <span class="h-0.5 w-14 rounded-full bg-muted-foreground/30" />
      <span class="h-0.5 w-11 rounded-full bg-muted-foreground/30" />
    </div>
  </div>
</template>
