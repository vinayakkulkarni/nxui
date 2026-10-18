<script setup lang="ts">
  import type { DocsNavBadgeProps, NavBadge } from '~/types/docs';

  defineProps<DocsNavBadgeProps>();

  const TONE: Record<NavBadge, string> = {
    new: 'bg-violet-500/10 text-violet-500 dark:bg-violet-400/10 dark:text-violet-400',
    updated: 'bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400',
  };
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-medium',
      TONE[badge],
    ]"
  >
    {{ badge }}
  </span>
</template>
