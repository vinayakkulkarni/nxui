<script setup lang="ts">
  import { useMouseInElement, useElementHover } from '@vueuse/core';
  import type { GradientFollowCardProps } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<GradientFollowCardProps>(), {
    gradientColors: () =>
      ['#7877c6', '#5eead4', '#f472b6'] as [string, string, string],
    borderRadius: 16,
    class: '',
  });

  const containerRef = ref<HTMLElement>();
  const { elementX, elementY, isOutside } = useMouseInElement(containerRef);
  const isHovered = useElementHover(containerRef);

  const posX = computed(() => {
    if (isOutside.value || !containerRef.value) return 50;
    return (
      (elementX.value / containerRef.value.getBoundingClientRect().width) * 100
    );
  });

  const posY = computed(() => {
    if (isOutside.value || !containerRef.value) return 50;
    return (
      (elementY.value / containerRef.value.getBoundingClientRect().height) * 100
    );
  });

  const gradientStyle = computed(() => ({
    background: `
    radial-gradient(600px circle at ${posX.value}% ${posY.value}%, ${props.gradientColors[0]}40, transparent 40%),
    radial-gradient(400px circle at ${posX.value + 10}% ${posY.value - 10}%, ${props.gradientColors[1]}30, transparent 40%),
    radial-gradient(300px circle at ${posX.value - 10}% ${posY.value + 10}%, ${props.gradientColors[2]}20, transparent 40%)
  `,
    opacity: isHovered.value ? 1 : 0.3,
  }));

  const borderStyle = computed(() => ({
    borderRadius: `${props.borderRadius}px`,
    border: '1px solid',
    borderColor: isHovered.value
      ? 'rgba(255, 255, 255, 0.2)'
      : 'rgba(255, 255, 255, 0.1)',
  }));
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn('relative overflow-hidden transition-all duration-500', props.class)
    "
    :style="{ borderRadius: `${borderRadius}px` }"
  >
    <div
      class="absolute inset-0 transition-opacity duration-500"
      :style="gradientStyle"
    ></div>
    <div
      class="absolute inset-0 bg-white/90 dark:bg-neutral-950/90"
      :style="{ borderRadius: `${borderRadius}px` }"
    ></div>
    <div
      class="absolute inset-0 pointer-events-none transition-opacity duration-500"
      :style="borderStyle"
    ></div>
    <div class="relative z-10">
      <slot></slot>
    </div>
  </div>
</template>
