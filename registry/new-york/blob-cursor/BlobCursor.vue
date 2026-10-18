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
  import { cn } from '~/lib/utils';
  import { createBlobEngine } from './blob-engine';
  import { MAX_TRAIL, clamp } from './blob-shaders';
  import type {
    BlobCursorProps,
    BlobCursorSettings,
    BlobEngine,
  } from './types';

  const props = withDefaults(defineProps<BlobCursorProps>(), {
    material: 'chrome',
    color: '#3B82F6',
    size: 140,
    morph: 0,
    morphSpeed: 0.4,
    depth: 1,
    trail: 16,
    lag: 0.55,
    goo: 1,
    stretch: 0.6,
    wobble: 1,
    drip: 0,
    splash: true,
    splashCount: 6,
    splashSpeed: 0.5,
    splashSize: 0.5,
    splashGravity: 0,
    regrow: 0.5,
    shine: 1,
    shadow: false,
    blend: 'normal',
    hideCursor: true,
    class: '',
  });

  const rootRef = ref<HTMLDivElement | null>(null);
  const docRef = shallowRef<Document | null>(null);
  const engine = shallowRef<BlobEngine | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  let inView = true;

  const settings = computed<BlobCursorSettings>(() => ({
    material: props.material,
    color: props.color,
    size: clamp(props.size, 12, 400),
    morph: clamp(props.morph, 0, 1),
    morphSpeed: clamp(props.morphSpeed, 0, 1),
    depth: clamp(props.depth, 0, 1),
    trail: clamp(Math.round(props.trail), 0, MAX_TRAIL),
    lag: clamp(props.lag, 0, 1),
    goo: clamp(props.goo, 0, 1),
    stretch: clamp(props.stretch, 0, 1),
    wobble: clamp(props.wobble, 0, 1),
    drip: clamp(props.drip, 0, 1),
    splash: props.splash,
    splashCount: clamp(Math.round(props.splashCount), 1, 32),
    splashSpeed: clamp(props.splashSpeed, 0, 1),
    splashSize: clamp(props.splashSize, 0, 1),
    splashGravity: clamp(props.splashGravity, 0, 1),
    regrow: clamp(props.regrow, 0, 1),
    shine: clamp(props.shine, 0, 1),
    shadow: props.shadow,
    blend: props.blend,
    hideCursor: props.hideCursor,
  }));

  function getSettings() {
    return settings.value;
  }

  function isReducedMotion() {
    return reducedMotion.value === 'reduce';
  }

  function isVisible() {
    return inView;
  }

  onMounted(() => {
    const root = rootRef.value;
    if (!root) return;
    docRef.value = document;
    engine.value = createBlobEngine({
      root,
      getSettings,
      isReducedMotion,
      isVisible,
    });
    engine.value?.resize();
    engine.value?.apply();
  });

  watch(settings, () => engine.value?.apply());

  useResizeObserver(rootRef, () => engine.value?.resize());

  useIntersectionObserver(rootRef, (entries) => {
    inView = entries[0]?.isIntersecting ?? true;
    if (inView) engine.value?.start();
  });

  useEventListener(
    'pointermove',
    (event: PointerEvent) => engine.value?.onMove(event),
    {
      passive: true,
    },
  );
  useEventListener(
    'pointerdown',
    (event: PointerEvent) => engine.value?.onDown(event),
    {
      passive: true,
    },
  );
  useEventListener(
    'pointerup',
    (event: PointerEvent) => engine.value?.onUp(event),
    {
      passive: true,
    },
  );
  useEventListener(
    'pointercancel',
    (event: PointerEvent) => engine.value?.onUp(event),
    {
      passive: true,
    },
  );
  useEventListener(docRef, 'pointerout', (event: PointerEvent) =>
    engine.value?.onLeave(event.relatedTarget),
  );
  useEventListener('blur', () => engine.value?.onBlur());

  onBeforeUnmount(() => {
    engine.value?.dispose();
    engine.value = null;
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="
      cn('pointer-events-none absolute inset-0 overflow-hidden', props.class)
    "
  />
</template>
