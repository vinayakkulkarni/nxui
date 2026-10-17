<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import {
    DEFAULT_RIBBON_COLORS,
    RIBBON_SHAPES,
    clamp,
    createRibbonsRenderer,
    parseColor,
  } from './ribbons-renderer';
  import type { RibbonsProps, RibbonsRenderer, RibbonsSettings } from './types';

  const props = withDefaults(defineProps<RibbonsProps>(), {
    colors: () => ['#3847ff', '#7c84ff', '#c7cbff'],
    shape: 'lens',
    thickness: 30,
    length: 1.4,
    spread: 18,
    stiffness: 0.5,
    bounce: 0.5,
    wave: 0,
    softness: 0,
    fade: false,
    opacity: 1,
    backgroundColor: 'transparent',
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const palette = computed(() =>
    (props.colors.length ? props.colors : DEFAULT_RIBBON_COLORS).slice(0, 12),
  );

  // Colors are resolved through a canvas, so this only runs on the client
  // (the renderer is the sole reader and is created in onMounted).
  const settings = computed<RibbonsSettings>(() => ({
    colors: palette.value.map((color) => parseColor(color, [1, 1, 1, 1])),
    back: parseColor(props.backgroundColor, [0, 0, 0, 0]),
    thickness: Math.max(1, props.thickness),
    length: clamp(props.length, 0.1, 5),
    spread: Math.max(0, props.spread),
    stiffness: clamp(props.stiffness, 0, 1),
    bounce: clamp(props.bounce, 0, 1),
    shape: RIBBON_SHAPES[props.shape] ?? 0,
    wave: reducedMotion.value === 'reduce' ? 0 : clamp(props.wave, 0, 1),
    softness: clamp(props.softness, 0, 1),
    fade: props.fade,
    opacity: clamp(props.opacity, 0, 1),
    dpr: props.dpr,
  }));

  function getSettings(): RibbonsSettings {
    return settings.value;
  }

  let renderer: RibbonsRenderer | null = null;

  onMounted(() => {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    renderer = createRibbonsRenderer(container, canvas, getSettings);
  });

  onBeforeUnmount(() => {
    renderer?.destroy();
    renderer = null;
  });

  function handlePointer(event: PointerEvent): void {
    renderer?.pointer(event.clientX, event.clientY);
  }

  useEventListener('pointermove', handlePointer, { passive: true });
  useEventListener('pointerdown', handlePointer, { passive: true });

  useResizeObserver(containerRef, () => renderer?.resize());

  useIntersectionObserver(containerRef, (entries) => {
    renderer?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  watch(settings, () => renderer?.redraw());
</script>

<template>
  <div
    ref="containerRef"
    :class="['pointer-events-none size-full', props.class]"
  >
    <canvas ref="canvasRef" class="block size-full"></canvas>
  </div>
</template>
