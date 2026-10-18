<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    shallowRef,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    useMutationObserver,
    usePreferredDark,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { createTechTextEngine } from './tech-text-engine';
  import type {
    TechTextEngine,
    TechTextProps,
    TechTextSettings,
  } from './types';

  const props = withDefaults(defineProps<TechTextProps>(), {
    text: 'nxui',
    fontFamily: '',
    fontWeight: 600,
    fontSize: 150,
    letterSpacing: -0.05,
    color: 'currentColor',
    accentColor: 'currentColor',
    align: 'center',
    reach: 200,
    softness: 0.7,
    dashLength: 4,
    dashGap: 2,
    strokeWidth: 1.5,
    lineStyle: 'dashed',
    reveal: 'letter',
    specks: 15,
    selection: true,
    labels: true,
    draggable: true,
    bounce: 0.4,
    sweep: true,
    speed: 1,
    clickKick: true,
    intro: 'none',
    introDuration: 2,
    guides: false,
    class: '',
  });

  const containerRef = useTemplateRef<HTMLDivElement>('container');
  const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas');
  const engine = shallowRef<TechTextEngine | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const prefersDark = usePreferredDark();

  const settings = computed<TechTextSettings>(() => ({
    text: props.text,
    fontFamily: props.fontFamily,
    fontWeight: props.fontWeight,
    fontSize: props.fontSize,
    letterSpacing: props.letterSpacing,
    color: props.color,
    accentColor: props.accentColor,
    align: props.align,
    reach: props.reach,
    softness: props.softness,
    dashLength: props.dashLength,
    dashGap: props.dashGap,
    strokeWidth: props.strokeWidth,
    lineStyle: props.lineStyle,
    reveal: props.reveal,
    specks: props.specks,
    selection: props.selection,
    labels: props.labels,
    draggable: props.draggable,
    bounce: props.bounce,
    sweep: props.sweep,
    speed: props.speed,
    clickKick: props.clickKick,
    intro: props.intro,
    introDuration: props.introDuration,
    guides: props.guides,
  }));

  function wake() {
    engine.value?.wake();
  }

  onMounted(() => {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    themeTargets.value = [document.documentElement, document.body];
    if (!container || !canvas) return;
    engine.value = createTechTextEngine({
      container,
      canvas,
      settings: () => settings.value,
      reducedMotion: () => reducedMotion.value === 'reduce',
    });
  });

  onBeforeUnmount(() => {
    engine.value?.destroy();
    engine.value = null;
  });

  watch(settings, wake);
  watch(prefersDark, wake);

  useResizeObserver(containerRef, () => engine.value?.resize());
  useIntersectionObserver(containerRef, (entries) => {
    const entry = entries[0];
    if (entry) engine.value?.setVisible(entry.isIntersecting);
  });

  const themeTargets = shallowRef<HTMLElement[]>([]);
  useMutationObserver(themeTargets, wake, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme'],
  });

  const passive = { passive: true };

  function onPointerMove(event: PointerEvent) {
    engine.value?.pointerMove(event);
  }
  function onPointerLeave() {
    engine.value?.pointerLeave();
  }
  function onPointerDown(event: PointerEvent) {
    engine.value?.pointerDown(event);
  }
  function onPointerUp(event: PointerEvent) {
    engine.value?.pointerUp(event);
  }

  useEventListener(containerRef, 'pointermove', onPointerMove, passive);
  useEventListener(containerRef, 'pointerenter', onPointerMove, passive);
  useEventListener(containerRef, 'pointerdown', onPointerDown, passive);
  useEventListener(containerRef, 'pointerup', onPointerUp, passive);
  useEventListener(containerRef, 'pointercancel', onPointerUp, passive);
  useEventListener(containerRef, 'pointerleave', onPointerLeave, passive);
</script>

<template>
  <div
    ref="container"
    :class="['tech-text', props.class]"
    role="img"
    :aria-label="props.text"
  >
    <canvas ref="canvas" class="tech-text-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .tech-text {
    position: relative;
    width: 100%;
    height: 100%;
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
  }

  .tech-text-canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
