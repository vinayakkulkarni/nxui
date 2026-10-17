<script setup lang="ts">
  import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createRippleDistortion } from './ripple-distortion';
  import type { RippleDistortionEngine, RippleDistortionProps } from './types';

  const props = withDefaults(defineProps<RippleDistortionProps>(), {
    src: undefined,
    brushSize: 150,
    strength: 0.2,
    swirl: 1,
    rings: 4,
    spread: 5,
    fade: 3,
    spacing: 15,
    dispersion: 0,
    glint: 0,
    tint: '#a855f7',
    tintAmount: 0.1,
    grayscale: true,
    highlightColor: '#ffffff',
    trigger: 'hover',
    clickStrength: 2,
    quality: 'low',
    enabled: true,
    class: '',
    style: undefined,
  });

  const mountRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  // A lost WebGL context cannot be revived, so a new src / quality gets a fresh canvas.
  const generation = ref(0);

  const reducedMotion = usePreferredReducedMotion();
  const documentVisibility = useDocumentVisibility();
  const intersecting = ref(true);

  let engine: RippleDistortionEngine | null = null;

  function getProps() {
    return props;
  }

  function getReduceMotion() {
    return reducedMotion.value === 'reduce';
  }

  function measure() {
    const el = mountRef.value;
    if (el) engine?.resize(el.clientWidth, el.clientHeight);
  }

  function syncVisibility() {
    engine?.setVisible(
      intersecting.value && documentVisibility.value !== 'hidden',
    );
  }

  function mount() {
    if (!canvasRef.value) return;
    engine = createRippleDistortion(canvasRef.value, getProps, getReduceMotion);
    measure();
    syncVisibility();
  }

  async function remount() {
    engine?.destroy();
    engine = null;
    generation.value += 1;
    await nextTick();
    mount();
  }

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event.clientX, event.clientY);
  }

  function onPointerDown(event: PointerEvent) {
    engine?.pointerDown(event.clientX, event.clientY);
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });

  useResizeObserver(mountRef, measure);

  useIntersectionObserver(mountRef, (entries) => {
    intersecting.value = entries.some((entry) => entry.isIntersecting);
    syncVisibility();
  });

  watch(documentVisibility, syncVisibility);

  watch([() => props.src, () => props.quality], remount);

  watch(
    [
      () => props.rings,
      () => props.strength,
      () => props.swirl,
      () => props.dispersion,
      () => props.glint,
      () => props.tintAmount,
      () => props.grayscale,
      () => props.highlightColor,
      () => props.tint,
    ],
    () => engine?.updateUniforms(),
  );

  onMounted(mount);

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });
</script>

<template>
  <div
    ref="mountRef"
    :class="cn('relative size-full overflow-hidden bg-black', props.class)"
    :style="props.style"
  >
    <canvas
      :key="generation"
      ref="canvasRef"
      class="block size-full"
      aria-hidden="true"
    />
  </div>
</template>
