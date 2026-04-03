<script setup lang="ts">
  import { useMouseInElement, useElementHover } from '@vueuse/core';
  import type { TiltSpotlightCardProps } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<TiltSpotlightCardProps>(), {
    maxTilt: 10,
    perspective: 1000,
    scale: 1.02,
    borderRadius: 16,
    glareOpacity: 0.2,
    spotlightColor: 'rgba(120, 119, 198, 0.3)',
    class: '',
  });

  const containerRef = ref<HTMLElement>();
  const { elementX, elementY, isOutside } = useMouseInElement(containerRef);
  const isHovered = useElementHover(containerRef);

  const rotateY = computed(() => {
    if (isOutside.value || !containerRef.value) return 0;
    const rect = containerRef.value.getBoundingClientRect();
    return (
      ((elementX.value - rect.width / 2) / (rect.width / 2)) * props.maxTilt
    );
  });

  const rotateX = computed(() => {
    if (isOutside.value || !containerRef.value) return 0;
    const rect = containerRef.value.getBoundingClientRect();
    return (
      -((elementY.value - rect.height / 2) / (rect.height / 2)) * props.maxTilt
    );
  });

  const glareX = computed(() => {
    if (!containerRef.value) return 50;
    return (
      (elementX.value / containerRef.value.getBoundingClientRect().width) * 100
    );
  });

  const glareY = computed(() => {
    if (!containerRef.value) return 50;
    return (
      (elementY.value / containerRef.value.getBoundingClientRect().height) * 100
    );
  });

  const containerStyle = computed(() => ({
    borderRadius: `${props.borderRadius}px`,
    perspective: `${props.perspective}px`,
    transform: `
    perspective(${props.perspective}px)
    rotateX(${rotateX.value}deg)
    rotateY(${rotateY.value}deg)
    scale(${isHovered.value ? props.scale : 1})
  `,
    transition: isHovered.value
      ? 'transform 0.1s ease-out'
      : 'transform 0.5s ease-out',
  }));

  const glareStyle = computed(() => ({
    background: `radial-gradient(circle at ${glareX.value}% ${glareY.value}%, rgba(255, 255, 255, ${props.glareOpacity}) 0%, transparent 50%)`,
    opacity: isHovered.value ? 1 : 0,
  }));

  const spotlightStyle = computed(() => ({
    left: `${elementX.value}px`,
    top: `${elementY.value}px`,
    width: '400px',
    height: '400px',
    transform: 'translate(-50%, -50%)',
    background: `radial-gradient(circle, ${props.spotlightColor} 0%, transparent 70%)`,
    opacity: isHovered.value ? 0.4 : 0,
    filter: 'blur(20px)',
  }));
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn(
        'relative overflow-hidden',
        'bg-white dark:bg-neutral-950',
        'border border-neutral-200 dark:border-neutral-800',
        'transition-[border-color] duration-500',
        isHovered && 'border-neutral-300 dark:border-neutral-700',
        props.class,
      )
    "
    :style="containerStyle"
  >
    <div
      class="absolute inset-0 pointer-events-none transition-opacity duration-300"
      :style="glareStyle"
    ></div>
    <div
      class="absolute pointer-events-none transition-opacity duration-300"
      :style="spotlightStyle"
    ></div>
    <div class="relative z-10">
      <slot></slot>
    </div>
  </div>
</template>
