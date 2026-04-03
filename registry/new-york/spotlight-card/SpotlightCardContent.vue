<script setup lang="ts">
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<{ class?: string }>(), { class: '' });
</script>

<template>
  <div :class="cn('p-6', props.class)">
    <slot></slot>
  </div>
</template>
