<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    createFloatingLines,
    normalizeFloatingLines,
  } from './floating-lines-gl';
  import type { FloatingLinesEngine, FloatingLinesProps } from './types';

  const props = withDefaults(defineProps<FloatingLinesProps>(), {
    linesGradient: () => ['#e945f5', '#ffffff'],
    enabledWaves: () => ['top', 'middle', 'bottom'],
    lineCount: 10,
    lineDistance: 6,
    topWavePosition: undefined,
    middleWavePosition: undefined,
    bottomWavePosition: undefined,
    animationSpeed: 1,
    amplitude: 1,
    lineWidth: 1,
    lineStyle: 'solid',
    glow: 1,
    brightness: 1,
    depthOfField: 0.5,
    edgeFade: 0,
    interactive: true,
    bendRadius: 5,
    bendStrength: -0.5,
    mouseDamping: 0.05,
    parallax: true,
    parallaxStrength: 0.2,
    clickSwirl: true,
    intro: true,
    mixBlendMode: 'screen',
    backgroundColor: undefined,
    lightMode: false,
    opacity: 1,
    dpr: undefined,
    class: '',
  });

  const containerRef = shallowRef<HTMLDivElement | null>(null);
  const canvasRef = shallowRef<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();
  let engine: FloatingLinesEngine | null = null;

  const settings = computed(() =>
    normalizeFloatingLines(props, reducedMotion.value === 'reduce'),
  );

  const rootStyle = computed(() => ({
    mixBlendMode:
      props.lightMode || props.backgroundColor ? 'normal' : props.mixBlendMode,
  }));

  onMounted(() => {
    if (!containerRef.value || !canvasRef.value) return;
    engine = createFloatingLines(
      containerRef.value,
      canvasRef.value,
      () => settings.value,
    );
  });

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });

  useResizeObserver(containerRef, () => engine?.resize());
  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event);
  }

  function onPointerDown(event: PointerEvent) {
    engine?.pointerDown(event);
  }

  function onPointerUp(event: PointerEvent) {
    engine?.pointerUp(event);
  }

  function onPointerOut(event: PointerEvent) {
    if (!event.relatedTarget) engine?.pointerLeave();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
  useEventListener('pointerout', onPointerOut);

  watch(settings, () => engine?.refresh());
  watch(visibility, () => engine?.visibilityChange());
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
    :style="rootStyle"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block size-full"
      aria-hidden="true"
    />
  </div>
</template>
