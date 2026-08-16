<script setup lang="ts">
  import { cn } from '~/lib/utils';

  defineProps<{
    class?: string;
  }>();
</script>

<template>
  <div
    :class="
      cn('relative z-10 flex h-11 items-start justify-between', $props.class)
    "
  >
    <slot />
  </div>
</template>
