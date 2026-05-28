<script setup lang="ts">
  import type { ShowcaseGridProps } from './types';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<ShowcaseGridProps>(), {
    columns: 3,
    gap: 'md',
    class: '',
  });

  const gapClasses: Record<string, string> = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  const columnClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };
</script>

<template>
  <div
    :class="cn('grid', columnClasses[columns], gapClasses[gap], props.class)"
  >
    <slot></slot>
  </div>
</template>
