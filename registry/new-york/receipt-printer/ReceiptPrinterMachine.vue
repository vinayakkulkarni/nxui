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
        'machine-shell relative isolate w-full overflow-hidden rounded-(--printer-radius) border border-zinc-900 bg-zinc-800 p-(--printer-inset) pb-8 shadow-[0_20px_36px_-20px_rgba(24,24,27,0.55),0_6px_14px_-8px_rgba(24,24,27,0.24),inset_0_1px_0_rgba(250,250,250,0.14),inset_0_-1px_0_rgba(24,24,27,0.55)] [--printer-inner-radius:calc(var(--printer-radius)-var(--printer-inset))] [--printer-inset:0.75rem] [--printer-radius:1.5rem] dark:border-zinc-300 dark:bg-zinc-200 dark:shadow-[0_20px_36px_-20px_rgba(24,24,27,0.55),0_6px_14px_-8px_rgba(24,24,27,0.24),inset_0_1px_0_rgba(250,250,250,0.14),inset_0_-1px_0_rgba(24,24,27,0.55)]',
        $props.class,
      )
    "
  >
    <slot />
    <div
      aria-hidden="true"
      class="absolute inset-x-6 bottom-(--printer-inset) z-40 h-2 rounded-sm border border-zinc-900 bg-zinc-900 shadow-inner shadow-zinc-900 dark:border-zinc-50 dark:bg-zinc-50 dark:shadow-zinc-50"
    />
  </div>
</template>

<style scoped>
  .machine-shell::before {
    content: '';
    pointer-events: none;
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: inherit;
    background-image: url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22180%22%20height%3D%22180%22%20viewBox%3D%220%200%20180%20180%22%3E%3Cfilter%20id%3D%22noise%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.92%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22%20%2F%3E%3CfeColorMatrix%20type%3D%22saturate%22%20values%3D%220%22%20%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url%28%23noise%29%22%20%2F%3E%3C%2Fsvg%3E');
    background-size: 180px 180px;
    background-repeat: repeat;
    opacity: 0.3;
    mix-blend-mode: multiply;
  }
</style>
