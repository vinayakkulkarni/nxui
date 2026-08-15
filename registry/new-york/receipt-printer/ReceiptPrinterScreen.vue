<script setup lang="ts">
  import { cn } from '~/lib/utils';

  defineProps<{
    class?: string;
  }>();
</script>

<template>
  <div
    :class="
      cn(
        'relative z-10 isolate overflow-hidden rounded-(--printer-inner-radius) border border-zinc-900 bg-zinc-900 p-4 text-zinc-50 shadow-inner shadow-zinc-900/80 after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-[inherit] after:shadow-[inset_0_0_24px_4px_rgba(24,24,27,0.52)] after:content-[\'\'] dark:border-zinc-200 dark:bg-zinc-200 dark:text-zinc-900 dark:shadow-zinc-200/80 dark:after:shadow-[inset_0_0_24px_4px_rgba(250,250,250,0.52)]',
        $props.class,
      )
    "
  >
    <div class="relative z-10">
      <slot />
    </div>
  </div>
</template>
