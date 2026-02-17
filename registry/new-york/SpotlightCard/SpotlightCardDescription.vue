<script setup lang="ts">
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<{ class?: string }>(), { class: '' });
</script>

<template>
  <p :class="cn('text-sm text-neutral-600 dark:text-neutral-400', props.class)">
    <slot></slot>
  </p>
</template>
