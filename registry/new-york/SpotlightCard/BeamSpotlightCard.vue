<script setup lang="ts">
  import { useMouseInElement, useElementHover } from '@vueuse/core';
  import type { BeamSpotlightCardProps } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<BeamSpotlightCardProps>(), {
    beamColor: 'rgba(120, 119, 198, 0.5)',
    beamWidth: 200,
    borderRadius: 16,
    class: '',
  });

  const containerRef = ref<HTMLElement>();
  const { elementX, elementY } = useMouseInElement(containerRef);
  const isHovered = useElementHover(containerRef);

  const verticalBeamStyle = computed(() => ({
    left: `${elementX.value - props.beamWidth / 2}px`,
    top: '0',
    width: `${props.beamWidth}px`,
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${props.beamColor}, transparent)`,
    opacity: isHovered.value ? 0.6 : 0,
    filter: 'blur(20px)',
  }));

  const horizontalBeamStyle = computed(() => ({
    left: '0',
    top: `${elementY.value - props.beamWidth / 2}px`,
    width: '100%',
    height: `${props.beamWidth}px`,
    background: `linear-gradient(180deg, transparent, ${props.beamColor}, transparent)`,
    opacity: isHovered.value ? 0.4 : 0,
    filter: 'blur(20px)',
  }));

  const intersectionStyle = computed(() => ({
    left: `${elementX.value}px`,
    top: `${elementY.value}px`,
    width: '100px',
    height: '100px',
    transform: 'translate(-50%, -50%)',
    background: `radial-gradient(circle, ${props.beamColor} 0%, transparent 70%)`,
    opacity: isHovered.value ? 1 : 0,
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
        'transition-all duration-500',
        props.class,
      )
    "
    :style="{ borderRadius: `${borderRadius}px` }"
  >
    <div
      class="absolute pointer-events-none transition-all duration-150"
      :style="verticalBeamStyle"
    ></div>
    <div
      class="absolute pointer-events-none transition-all duration-150"
      :style="horizontalBeamStyle"
    ></div>
    <div
      class="absolute pointer-events-none transition-all duration-150"
      :style="intersectionStyle"
    ></div>
    <div class="relative z-10">
      <slot></slot>
    </div>
  </div>
</template>
