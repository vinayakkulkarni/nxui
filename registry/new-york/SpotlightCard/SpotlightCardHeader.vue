<script setup lang="ts">
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<{ class?: string }>(), { class: '' });
</script>

<template>
  <div :class="cn('flex flex-col space-y-1.5 p-6 pb-0', props.class)">
    <slot></slot>
  </div>
</template>
