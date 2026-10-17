<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    DEFAULT_SRC,
    buildSettings,
    createHalftoneReveal,
  } from './halftone-reveal';
  import type { HalftoneRevealEngine, HalftoneRevealProps } from './types';

  const props = withDefaults(defineProps<HalftoneRevealProps>(), {
    src: undefined,
    fit: 'cover',
    mode: 'mono',
    shape: 'dot',
    cellSize: 6,
    angle: 45,
    dotScale: 1,
    inkColor: '#120f17',
    accentColor: '#ff4f2a',
    paperColor: '#ffffff',
    contrast: 1.1,
    brightness: 0,
    invert: false,
    roughness: 0,
    misregistration: 0,
    revealRadius: 160,
    softness: 0.6,
    linger: 1.2,
    reverse: false,
    wander: false,
    clickBurst: true,
    intro: true,
    class: '',
    style: undefined,
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  const settings = computed(() => buildSettings(props));
  const reducedMotion = usePreferredReducedMotion();
  const documentVisibility = useDocumentVisibility();
  const intersecting = ref(true);

  let engine: HalftoneRevealEngine | null = null;

  function getSettings() {
    return settings.value;
  }

  function getReduceMotion() {
    return reducedMotion.value === 'reduce';
  }

  function measure() {
    const el = containerRef.value;
    if (el) engine?.resize(el.clientWidth, el.clientHeight);
  }

  function syncVisibility() {
    engine?.setVisible(
      intersecting.value && documentVisibility.value !== 'hidden',
    );
  }

  function mount() {
    engine?.destroy();
    engine = null;
    if (!canvasRef.value) return;
    engine = createHalftoneReveal(
      canvasRef.value,
      props.src ?? DEFAULT_SRC,
      getSettings,
      getReduceMotion,
    );
    measure();
    syncVisibility();
  }

  function local(event: PointerEvent): [number, number] {
    const rect = containerRef.value?.getBoundingClientRect();
    return [
      event.clientX - (rect?.left ?? 0),
      event.clientY - (rect?.top ?? 0),
    ];
  }

  function onPointerMove(event: PointerEvent) {
    const [x, y] = local(event);
    engine?.pointerMove(x, y);
  }

  function onPointerDown(event: PointerEvent) {
    const [x, y] = local(event);
    const primary = event.pointerType !== 'mouse' || event.button === 0;
    engine?.pointerDown(x, y, primary);
  }

  function onPointerLeave() {
    engine?.pointerLeave();
  }

  const passive = { passive: true };
  useEventListener(containerRef, 'pointermove', onPointerMove, passive);
  useEventListener(containerRef, 'pointerenter', onPointerMove, passive);
  useEventListener(containerRef, 'pointerdown', onPointerDown, passive);
  useEventListener(containerRef, 'pointerleave', onPointerLeave, passive);
  useEventListener(containerRef, 'pointercancel', onPointerLeave, passive);

  useResizeObserver(containerRef, measure);

  useIntersectionObserver(containerRef, (entries) => {
    intersecting.value = entries.some((entry) => entry.isIntersecting);
    syncVisibility();
  });

  watch(documentVisibility, syncVisibility);

  watch(
    () => props.src,
    () => mount(),
  );

  watch(settings, () => engine?.refresh());

  onMounted(mount);

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
    :style="props.style"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block size-full"
      aria-hidden="true"
    />
  </div>
</template>
