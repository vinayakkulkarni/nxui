<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { resolveSettings } from './hyperspeed-config';
  import { createHyperspeedEngine } from './hyperspeed-engine';
  import type { HyperspeedEngine, HyperspeedProps } from './types';

  const props = withDefaults(defineProps<HyperspeedProps>(), {
    curve: 'winding',
    curvature: 1,
    speed: 1,
    boost: 3,
    fov: 90,
    boostFov: 130,
    lanes: 3,
    roadWidth: 10,
    medianWidth: 2,
    density: 40,
    trailLength: 1,
    lightSize: 1,
    poles: 20,
    poleHeight: 1,
    dust: 100,
    glow: 0.6,
    reflections: 0.5,
    steer: 0.35,
    tailColors: undefined,
    headColors: undefined,
    poleColors: undefined,
    roadColor: undefined,
    roadOpacity: 0.1,
    lineColor: undefined,
    background: undefined,
    theme: 'dark',
    interactive: true,
    boosting: false,
    class: '',
  });

  const emit = defineEmits<{
    boostStart: [];
    boostEnd: [];
  }>();

  const containerRef = ref<HTMLDivElement>();
  const engine = shallowRef<HyperspeedEngine | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const settings = computed(() => resolveSettings(props));
  let held = false;

  function setHeld(next: boolean) {
    if (held === next) return;
    held = next;
    engine.value?.setHeld(next);
    if (!settings.value.interactive) return;
    if (next) emit('boostStart');
    else emit('boostEnd');
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    setHeld(true);
  }

  function onPointerUp() {
    setHeld(false);
  }

  function onPointerMove(event: PointerEvent) {
    const container = containerRef.value;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    engine.value?.setPointer(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      ((event.clientY - rect.top) / rect.height) * 2 - 1,
    );
  }

  function onPointerLeave() {
    engine.value?.setPointer(0, 0);
  }

  function onContextMenu(event: MouseEvent) {
    if (settings.value.interactive) event.preventDefault();
  }

  useEventListener(containerRef, 'pointerdown', onPointerDown);
  useEventListener(containerRef, 'pointermove', onPointerMove);
  useEventListener(containerRef, 'pointerleave', onPointerLeave);
  useEventListener(containerRef, 'contextmenu', onContextMenu);
  useEventListener('pointerup', onPointerUp);
  useEventListener('pointercancel', onPointerUp);
  useEventListener('blur', onPointerUp);

  useResizeObserver(containerRef, () => engine.value?.resize());
  useIntersectionObserver(containerRef, (entries) => {
    engine.value?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;
    engine.value = createHyperspeedEngine(container, {
      getSettings: () => settings.value,
      reducedMotion: () => reducedMotion.value === 'reduce',
    });
  });

  onBeforeUnmount(() => {
    engine.value?.dispose();
    engine.value = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('hyperspeed absolute inset-0 overflow-hidden', props.class)"
  />
</template>

<style scoped>
  .hyperspeed {
    touch-action: pan-y;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }

  .hyperspeed :deep(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
