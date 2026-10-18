<script setup lang="ts">
  import { computed } from 'vue';
  import { cn } from '~/lib/utils';
  import type { TiltedCardLayerProps } from './types';

  const props = withDefaults(defineProps<TiltedCardLayerProps>(), {
    depth: 20,
    class: '',
  });

  const layerStyle = computed(() => ({ '--tc-depth': props.depth }));
</script>

<template>
  <div :class="cn('tilted-card__layer', props.class)" :style="layerStyle">
    <slot></slot>
  </div>
</template>

<style scoped>
  .tilted-card__layer {
    position: absolute;
    inset: 0;
    transform: translate3d(
      calc(var(--tc-px, 0) * var(--tc-depth, 0) * 1px),
      calc(var(--tc-py, 0) * var(--tc-depth, 0) * 1px),
      0
    );
  }
</style>
