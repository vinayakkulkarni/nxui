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
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { clamp } from './elastic-mesh-field';
  import { createElasticMeshEngine } from './elastic-mesh-engine';
  import type {
    ElasticMeshEngine,
    ElasticMeshProps,
    ElasticMeshSettings,
  } from './types';

  const props = withDefaults(defineProps<ElasticMeshProps>(), {
    text: 'Squish',
    src: '',
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 900,
    color: '#3b5bff',
    imageColors: true,
    material: 'balloon',
    inflate: 1,
    stiffness: 0.5,
    wobble: 0.6,
    grabRadius: 70,
    stretch: 0.5,
    press: 0.5,
    shadow: 0.5,
    intro: true,
    theme: 'dark',
    dpr: undefined,
    class: '',
  });

  const MATERIALS = { balloon: 0, chrome: 1, jelly: 2, clay: 3 } as const;

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const motion = usePreferredReducedMotion();
  const doc = shallowRef<Document | null>(null);
  let engine: ElasticMeshEngine | null = null;
  let pokeIndex = 0;

  const settings = computed<ElasticMeshSettings>(() => ({
    text: String(props.text),
    src: String(props.src || ''),
    fontFamily: String(props.fontFamily),
    fontWeight: props.fontWeight,
    color: String(props.color),
    imageColors: props.imageColors,
    material: MATERIALS[props.material] ?? 0,
    inflate: clamp(props.inflate, 0.1, 3),
    stiffness: clamp(props.stiffness, 0, 1),
    wobble: clamp(props.wobble, 0, 1),
    grabRadius: clamp(props.grabRadius, 10, 400),
    stretch: clamp(props.stretch, 0, 1),
    press: clamp(props.press, 0, 1),
    shadow: clamp(props.shadow, 0, 1),
    intro: props.intro,
    light: props.theme === 'light',
    reduce: motion.value === 'reduce',
    dpr: props.dpr,
  }));

  const label = computed(() => (props.src ? 'Elastic logo' : props.text));

  const getSettings = () => settings.value;

  onMounted(() => {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    doc.value = document;
    if (!container || !canvas) return;
    engine = createElasticMeshEngine(container, canvas, getSettings);
  });

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });

  useResizeObserver(containerRef, () => engine?.resize());
  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  function onPointerDown(event: PointerEvent) {
    engine?.pointerDown(event);
  }
  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event);
  }
  function onPointerUp(event: PointerEvent) {
    engine?.pointerUp(event);
  }
  function onPointerLeave() {
    engine?.pointerLeave();
  }
  function onVisibility() {
    engine?.resume();
  }
  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    const slot = engine?.pokePart(pokeIndex) ?? -1;
    if (slot >= 0) pokeIndex = slot + 1;
  }

  useEventListener(containerRef, 'pointerdown', onPointerDown);
  useEventListener(containerRef, 'pointerleave', onPointerLeave);
  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerup', onPointerUp);
  useEventListener('pointercancel', onPointerUp);
  useEventListener(doc, 'visibilitychange', onVisibility);

  watch(
    [
      () => props.text,
      () => props.src,
      () => props.fontFamily,
      () => props.fontWeight,
    ],
    () => {
      pokeIndex = 0;
      engine?.rebuild();
    },
  );

  watch(settings, () => engine?.wake());
</script>

<template>
  <div
    ref="containerRef"
    :class="['elastic-mesh', props.class]"
    role="img"
    :aria-label="label"
    tabindex="0"
    @keydown="onKeydown"
  >
    <canvas ref="canvasRef" class="elastic-mesh-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .elastic-mesh {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
    border-radius: inherit;
  }

  .elastic-mesh:focus-visible {
    outline: 2px solid var(--ring, currentColor);
    outline-offset: -2px;
  }

  .elastic-mesh-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
