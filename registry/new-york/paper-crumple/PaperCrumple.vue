<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { clamp, finite } from './paper-path';
  import { createPaperEngine } from './paper-engine';
  import type {
    PaperCrumpleEngine,
    PaperCrumpleLiveOptions,
    PaperCrumpleProps,
    PaperCrumpleState,
    PaperCrumpleStatus,
  } from './types';

  const props = withDefaults(defineProps<PaperCrumpleProps>(), {
    alt: 'Crumplable image',
    backSrc: '',
    width: 320,
    height: 400,
    sceneHeight: 560,
    imageFit: 'cover',
    releaseBehavior: 'restore',
    crumpleAmount: 0.85,
    crumpleDuration: 0.55,
    releaseDuration: 0.4,
    foldCount: 6,
    foldSharpness: 0.6,
    wrinkleDepth: 0.65,
    creaseStrength: 0.18,
    paperColor: '#f4f0e8',
    roughness: 0.92,
    paperTexture: 0.08,
    lightIntensity: 1.8,
    lightAngle: -35,
    shadow: true,
    shadowOpacity: 0.08,
    draggable: true,
    dragRotation: 10,
    dragRadius: 180,
    returnToOrigin: true,
    rotation: 0,
    seed: 7,
    detail: 64,
    disabled: false,
    resetKey: 0,
    class: '',
  });

  const emit = defineEmits<{
    stateChange: [state: PaperCrumpleState];
    error: [error: Error];
  }>();

  const rootRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const hitRef = ref<HTMLButtonElement | null>(null);
  const status = ref<PaperCrumpleStatus>('loading');
  const engine = shallowRef<PaperCrumpleEngine | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();

  function liveOptions(): PaperCrumpleLiveOptions {
    return {
      releaseBehavior: props.releaseBehavior,
      crumpleAmount: props.crumpleAmount,
      crumpleDuration: props.crumpleDuration,
      releaseDuration: props.releaseDuration,
      creaseStrength: props.creaseStrength,
      draggable: props.draggable,
      dragRotation: props.dragRotation,
      dragRadius: props.dragRadius,
      returnToOrigin: props.returnToOrigin,
      disabled: props.disabled,
      reduceMotion: reducedMotion.value === 'reduce',
    };
  }

  function setStatus(next: PaperCrumpleStatus) {
    status.value = next;
  }

  function onState(next: PaperCrumpleState) {
    emit('stateChange', next);
  }

  function onError(error: Error) {
    emit('error', error);
  }

  function build() {
    engine.value?.dispose();
    engine.value = null;
    const root = rootRef.value;
    const canvas = canvasRef.value;
    const hit = hitRef.value;
    if (!root || !canvas || !hit) return;
    engine.value = createPaperEngine({
      root,
      canvas,
      hit,
      scene: {
        src: props.src,
        backSrc: props.backSrc,
        width: props.width,
        height: props.height,
        imageFit: props.imageFit,
        foldCount: props.foldCount,
        foldSharpness: props.foldSharpness,
        wrinkleDepth: props.wrinkleDepth,
        paperColor: props.paperColor,
        roughness: props.roughness,
        paperTexture: props.paperTexture,
        lightIntensity: props.lightIntensity,
        lightAngle: props.lightAngle,
        shadow: props.shadow,
        shadowOpacity: props.shadowOpacity,
        rotation: props.rotation,
        seed: props.seed,
        detail: props.detail,
      },
      live: liveOptions,
      onStatus: setStatus,
      onState,
      onError,
    });
    engine.value?.setHidden(visibility.value === 'hidden');
  }

  onMounted(build);

  watch(
    [
      () => props.src,
      () => props.backSrc,
      () => props.width,
      () => props.height,
      () => props.imageFit,
      () => props.foldCount,
      () => props.foldSharpness,
      () => props.wrinkleDepth,
      () => props.paperColor,
      () => props.roughness,
      () => props.paperTexture,
      () => props.lightIntensity,
      () => props.lightAngle,
      () => props.shadow,
      () => props.shadowOpacity,
      () => props.rotation,
      () => props.seed,
      () => props.detail,
    ],
    build,
  );

  watch(
    () => props.resetKey,
    () => engine.value?.reset(),
  );

  watch(
    () => props.disabled,
    (value) => {
      if (value) engine.value?.cancel();
    },
  );

  watch(reducedMotion, () => engine.value?.motionChange());
  watch(visibility, (value) => engine.value?.setHidden(value === 'hidden'));

  useResizeObserver(rootRef, () => engine.value?.resize());
  useIntersectionObserver(rootRef, (entries) => {
    const entry = entries[0];
    if (entry) engine.value?.setInView(entry.isIntersecting);
  });
  useEventListener('blur', () => engine.value?.cancel());

  onBeforeUnmount(() => {
    engine.value?.dispose();
    engine.value = null;
  });

  function onPointerDown(event: PointerEvent) {
    engine.value?.pointerDown(event);
  }
  function onPointerMove(event: PointerEvent) {
    engine.value?.pointerMove(event);
  }
  function onPointerUp(event: PointerEvent) {
    engine.value?.pointerUp(event);
  }
  function onPointerCancel(event: PointerEvent) {
    engine.value?.pointerCancel(event);
  }
  function onKeyDown(event: KeyboardEvent) {
    engine.value?.keyDown(event);
  }
  function onKeyUp(event: KeyboardEvent) {
    engine.value?.keyUp(event);
  }
  function onBlur() {
    engine.value?.blur();
  }
  function onContextLost(event: Event) {
    engine.value?.contextLost(event);
  }
  function onContextRestored() {
    engine.value?.contextRestored();
  }

  const ready = computed(() => status.value === 'ready');
  const shadowFilter = computed(() =>
    props.shadow
      ? `drop-shadow(0 6px 10px rgb(0 0 0 / ${clamp(finite(props.shadowOpacity, 0.08), 0, 1)}))`
      : undefined,
  );
  const rootStyle = computed(() => ({ height: `${props.sceneHeight}px` }));
  const canvasStyle = computed(() => ({
    visibility: ready.value ? ('visible' as const) : ('hidden' as const),
    filter: shadowFilter.value,
  }));
  const fallbackStyle = computed(() => ({
    objectFit: props.imageFit,
    transform: `translate(-50%, -50%) rotate(${props.rotation}deg)`,
    filter: shadowFilter.value,
  }));
  const hitStyle = computed(() => ({
    visibility: ready.value ? ('visible' as const) : ('hidden' as const),
  }));
  const hitLabel = computed(
    () =>
      `${props.alt}. Hold to crumple and drag. Keyboard: hold Space or Enter, arrow keys to move, Escape to reset.`,
  );
  const statusText = computed(() => {
    if (status.value === 'loading') return 'Loading interactive paper.';
    if (status.value === 'error')
      return 'Interactive paper unavailable. Showing the original image.';
    return '';
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="['paper-crumple text-foreground', props.class]"
    :style="rootStyle"
    :data-status="status"
  >
    <canvas
      ref="canvasRef"
      class="paper-crumple-canvas"
      aria-hidden="true"
      :style="canvasStyle"
      @webglcontextlost="onContextLost"
      @webglcontextrestored="onContextRestored"
    />
    <img
      v-if="!ready && src"
      class="paper-crumple-fallback"
      :src="src"
      :alt="alt"
      draggable="false"
      :style="fallbackStyle"
    />
    <button
      ref="hitRef"
      type="button"
      class="paper-crumple-hit"
      :disabled="disabled || !ready"
      :aria-label="hitLabel"
      aria-pressed="false"
      :style="hitStyle"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
      @lostpointercapture="onPointerUp"
      @keydown="onKeyDown"
      @keyup="onKeyUp"
      @blur="onBlur"
    />
    <span class="paper-crumple-focus" aria-hidden="true" />
    <span class="sr-only" role="status">{{ statusText }}</span>
  </div>
</template>

<style scoped>
  .paper-crumple {
    position: relative;
    width: 100%;
    overflow: hidden;
    isolation: isolate;
  }

  .paper-crumple-canvas {
    display: block;
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .paper-crumple-fallback {
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--pc-image-width, 60%);
    height: var(--pc-image-height, 72%);
    user-select: none;
    pointer-events: none;
  }

  .paper-crumple-hit {
    appearance: none;
    position: absolute;
    top: 0;
    left: 0;
    padding: 0;
    margin: 0;
    border: 0;
    background: transparent;
    border-radius: 2px;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    cursor: grab;
    outline: none;
  }

  .paper-crumple-hit[data-held='true'] {
    cursor: grabbing;
  }

  .paper-crumple-hit:not([data-pointer='true']):focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 4px;
  }

  .paper-crumple-focus {
    position: absolute;
    bottom: 24px;
    left: calc(50% - 2px);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0;
    pointer-events: none;
  }

  .paper-crumple-hit:not([data-pointer='true']):focus-visible
    + .paper-crumple-focus {
    opacity: 0.55;
  }

  .paper-crumple-hit:disabled {
    cursor: default;
  }
</style>
