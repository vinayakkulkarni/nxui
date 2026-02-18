<script setup lang="ts">
  import { useMouseInElement, useElementHover } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      spotlightColor?: string;
      borderColor?: string;
      borderWidth?: number;
      borderRadius?: number;
      glowIntensity?: number;
      class?: string;
    }>(),
    {
      spotlightColor: 'rgba(120, 119, 198, 0.3)',
      borderWidth: 1,
      borderRadius: 16,
      glowIntensity: 0.15,
      class: '',
    },
  );

  const containerRef = ref<HTMLElement>();
  const { elementX, elementY } = useMouseInElement(containerRef);
  const isHovered = useElementHover(containerRef);

  const spotlightStyle = computed(() => ({
    left: `${elementX.value}px`,
    top: `${elementY.value}px`,
    width: '400px',
    height: '400px',
    transform: 'translate(-50%, -50%)',
    background: `radial-gradient(circle, ${props.spotlightColor} 0%, transparent 70%)`,
    opacity: isHovered.value ? props.glowIntensity * 5 : 0,
  }));

  const borderStyle = computed(() => ({
    borderRadius: `${props.borderRadius}px`,
    padding: `${props.borderWidth}px`,
    background: props.borderColor
      ? props.borderColor
      : `conic-gradient(from 225deg, rgba(120, 119, 198, 0.9), rgba(120, 119, 198, 0.1) 25%, rgba(255, 255, 255, 0.15) 50%, rgba(120, 119, 198, 0.1) 75%, rgba(120, 119, 198, 0.9))`,
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    maskComposite: 'exclude',
    WebkitMask:
      'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    opacity: isHovered.value ? 1 : 0.5,
  }));
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn(
        'relative overflow-hidden bg-gradient-to-b from-neutral-50 to-white ring-1 ring-neutral-200 dark:ring-white/10 dark:from-neutral-950 dark:to-neutral-900 transition-all duration-500',
        props.class,
      )
    "
    :style="{ borderRadius: `${borderRadius}px` }"
  >
    <div
      class="pointer-events-none absolute inset-0 transition-opacity duration-500"
      :style="borderStyle"
    ></div>
    <div
      class="pointer-events-none absolute transition-opacity duration-300"
      :style="spotlightStyle"
    ></div>
    <div
      class="pointer-events-none absolute inset-0 transition-opacity duration-500"
      :style="{
        borderRadius: `${borderRadius}px`,
        opacity: isHovered ? 0.5 : 0,
        boxShadow:
          'inset 0 0 30px rgba(120, 119, 198, 0.1), 0 0 30px rgba(120, 119, 198, 0.1)',
      }"
    ></div>
    <div class="relative z-10">
      <slot></slot>
    </div>
  </div>
</template>
