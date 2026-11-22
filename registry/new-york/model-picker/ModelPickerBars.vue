<script setup lang="ts">
  import { computed } from 'vue';
  import type { ModelPickerBarsProps } from './types';

  const props = defineProps<ModelPickerBarsProps>();

  const SEGMENTS = [0, 1, 2, 3, 4];

  const filled = computed(() =>
    Math.max(0, Math.min(5, Math.round(props.value))),
  );

  function segmentStyle(index: number): Record<string, string> {
    const on = index < filled.value;
    const lit = on && props.active;
    const wait = `${props.delay + index * 45}ms`;
    return {
      backgroundColor: lit ? props.accent : '',
      transitionDelay: lit ? wait : '0ms',
      animationDelay: wait,
    };
  }
</script>

<template>
  <span class="flex items-center gap-0.75 max-sm:gap-0.5" aria-hidden="true">
    <span
      v-for="index in SEGMENTS"
      :key="index"
      :class="[
        'h-1.5 w-2.5 rounded-[2px] max-sm:w-1.5 transition-colors duration-200',
        index < filled
          ? 'bg-foreground/16 dark:bg-foreground/18'
          : 'bg-foreground/6 dark:bg-foreground/8',
        active && index < filled && animate ? 'mp-pop' : '',
      ]"
      :style="segmentStyle(index)"
    />
  </span>
</template>

<style scoped>
  .mp-pop {
    animation: mp-pop 320ms cubic-bezier(0.3, 0.7, 0.4, 1) both;
  }

  @keyframes mp-pop {
    0% {
      transform: scale(1);
    }
    45% {
      transform: scale(1.35);
    }
    100% {
      transform: scale(1);
    }
  }
</style>
