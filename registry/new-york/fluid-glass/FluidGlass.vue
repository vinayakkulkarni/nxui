<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    useSlots,
    watch,
  } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    useMutationObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { SHAPES, clamp, isShape, parseColor } from './fluid-glass-math';
  import { createFluidGlassEngine } from './fluid-glass-engine';
  import type {
    FluidGlassEngine,
    FluidGlassProps,
    FluidGlassSettings,
    FluidGlassShape,
  } from './types';

  const props = withDefaults(defineProps<FluidGlassProps>(), {
    text: 'Look closer.',
    textColor: undefined,
    fontFamily: undefined,
    fontWeight: 600,
    fontSize: undefined,
    src: undefined,
    fit: 'cover',
    background: 'transparent',
    shape: 'torus',
    shapes: undefined,
    size: 260,
    refraction: 1,
    dispersion: 0.35,
    reflection: 1,
    frost: 0,
    color: '#ffffff',
    tint: 0,
    shadow: 0.5,
    elevation: 0.4,
    interaction: 'follow',
    smoothness: 0.5,
    wobble: 0.5,
    spin: 0.3,
    idle: true,
    morphOnClick: true,
    position: () => [0.5, 0.5],
    intro: true,
    maxDevicePixelRatio: 2,
    class: undefined,
  });

  const emit = defineEmits<{
    shapeChange: [shape: FluidGlassShape];
  }>();

  const slots = useSlots();
  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const handleRef = ref<HTMLDivElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const pageVisibility = useDocumentVisibility();

  const cycle = computed<FluidGlassShape[]>(() => {
    const picked = props.shapes?.filter((name) => isShape(name)) ?? [];
    return picked.length ? picked : SHAPES;
  });

  const settings = computed<FluidGlassSettings>(() => ({
    text: String(props.text ?? ''),
    textColor: props.textColor,
    fontFamily: props.fontFamily,
    fontWeight: props.fontWeight,
    fontSize: props.fontSize,
    src: props.src,
    fit: props.fit,
    background: parseColor(props.background) ?? [0, 0, 0, 0],
    shape: isShape(props.shape) ? props.shape : 'torus',
    cycle: cycle.value,
    size: Math.max(16, props.size),
    ior: 1 + 0.5 * clamp(props.refraction, 0, 2),
    dispersion: clamp(props.dispersion, 0, 1),
    reflection: clamp(props.reflection, 0, 2),
    frost: clamp(props.frost, 0, 1),
    color: parseColor(props.color) ?? [1, 1, 1, 1],
    tint: clamp(props.tint, 0, 1),
    shadow: clamp(props.shadow, 0, 1),
    elevation: clamp(props.elevation, 0, 3),
    interaction: props.interaction,
    smoothness: clamp(props.smoothness, 0, 1),
    wobble: clamp(props.wobble, 0, 1),
    spin: props.spin,
    idle: props.idle,
    morphOnClick: props.morphOnClick,
    position: [
      clamp(props.position[0] ?? 0.5, 0, 1),
      clamp(props.position[1] ?? 0.5, 0, 1),
    ],
    intro: props.intro,
    maxRatio: clamp(props.maxDevicePixelRatio, 0.5, 3),
  }));

  const handleClass = computed(() => {
    if (props.interaction === 'drag')
      return 'pointer-events-auto cursor-grab touch-none group-data-grabbing:cursor-grabbing';
    if (props.interaction === 'static' && props.morphOnClick)
      return 'pointer-events-auto cursor-pointer';
    return 'pointer-events-none';
  });

  let engine: FluidGlassEngine | null = null;

  function getSettings(): FluidGlassSettings {
    return settings.value;
  }

  function onShapeChange(shape: FluidGlassShape) {
    emit('shapeChange', shape);
  }

  function start(firstRun: boolean) {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    engine = createFluidGlassEngine({
      container,
      canvas,
      handle: handleRef.value,
      getSettings,
      firstRun,
      reduced: reducedMotion.value === 'reduce',
      onShapeChange,
    });
    engine?.setPageVisible(pageVisibility.value !== 'hidden');
  }

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event);
  }

  function onPointerDown(event: PointerEvent) {
    engine?.pointerDown(event);
  }

  function onPointerUp(event: PointerEvent) {
    engine?.pointerUp(event);
  }

  function onLeave() {
    engine?.leave();
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    engine?.destroy();
    engine = null;
  }

  function onContextRestored() {
    start(false);
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onLeave, { passive: true });
  useEventListener(
    () => containerRef.value?.ownerDocument.documentElement,
    'pointerleave',
    onLeave,
  );
  useEventListener(canvasRef, 'webglcontextlost', onContextLost);
  useEventListener(canvasRef, 'webglcontextrestored', onContextRestored);

  useResizeObserver(containerRef, () => engine?.refresh());

  useIntersectionObserver(containerRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  useMutationObserver(
    () => containerRef.value?.ownerDocument.documentElement,
    () => engine?.redrawText(),
    { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] },
  );

  watch(pageVisibility, (state) => engine?.setPageVisible(state !== 'hidden'));
  watch(settings, () => engine?.refresh());

  onMounted(() => {
    start(true);
    document.fonts?.ready.then(() => engine?.resetText());
  });

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('group relative size-full overflow-hidden', props.class)"
    :data-interaction="props.interaction"
    :data-clickable="props.morphOnClick ? '' : undefined"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block size-full"
      aria-hidden="true"
    />
    <div
      ref="handleRef"
      :class="
        cn(
          'absolute top-0 left-0 size-0 rounded-full will-change-transform',
          handleClass,
        )
      "
      aria-hidden="true"
    />
    <p v-if="props.text" class="sr-only whitespace-pre-line">
      {{ props.text }}
    </p>
    <div
      v-if="slots.default"
      class="pointer-events-none absolute inset-0 *:pointer-events-auto"
    >
      <slot />
    </div>
  </div>
</template>
