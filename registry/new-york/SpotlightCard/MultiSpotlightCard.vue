<script setup lang="ts">
  import { useMouseInElement, useElementHover } from '@vueuse/core';
  import type { MultiSpotlightCardProps } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<MultiSpotlightCardProps>(), {
    colors: () => [
      'rgba(120, 119, 198, 0.4)',
      'rgba(255, 77, 77, 0.3)',
      'rgba(77, 255, 174, 0.3)',
    ],
    borderRadius: 16,
    class: '',
  });

  const containerRef = ref<HTMLElement>();
  const { elementX, elementY } = useMouseInElement(containerRef);
  const isHovered = useElementHover(containerRef);

  function getSpotlightStyle(color: string, index: number) {
    return {
      left: `${elementX.value + (index - 1) * 50}px`,
      top: `${elementY.value + (index - 1) * 50}px`,
      width: '300px',
      height: '300px',
      transform: 'translate(-50%, -50%)',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      opacity: isHovered.value ? 1 : 0,
      filter: 'blur(40px)',
    };
  }
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn(
        'relative overflow-hidden',
        'bg-white dark:bg-neutral-950',
        'border border-neutral-200 dark:border-neutral-800',
        'transition-all duration-500',
        props.class,
      )
    "
    :style="{ borderRadius: `${borderRadius}px` }"
  >
    <div
      v-for="(color, index) in colors"
      :key="index"
      class="absolute pointer-events-none transition-opacity duration-500"
      :style="getSpotlightStyle(color, index)"
    ></div>
    <div class="relative z-10">
      <slot></slot>
    </div>
  </div>
</template>
