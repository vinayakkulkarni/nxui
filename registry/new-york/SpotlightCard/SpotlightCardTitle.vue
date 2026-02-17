<script setup lang="ts">
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<{ class?: string }>(), { class: '' });
</script>

<template>
  <h3
    :class="
      cn(
        'text-xl font-semibold leading-none tracking-tight text-neutral-900 dark:text-white',
        props.class,
      )
    "
  >
    <slot></slot>
  </h3>
</template>
