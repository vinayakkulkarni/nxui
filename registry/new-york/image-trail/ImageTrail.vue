<script setup lang="ts">
  import { computed, nextTick, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useRafFn,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createImageTrail } from './image-trail-engine';
  import type { ImageTrailConfig, ImageTrailProps } from './types';

  const props = withDefaults(defineProps<ImageTrailProps>(), {
    items: () => [],
    size: 190,
    aspectRatio: 1.1,
    radius: 15,
    threshold: 80,
    lifetime: 0.4,
    appearScale: 1,
    zoom: 1,
    flash: 0,
    exitScale: 0.2,
    drift: 0,
    rotation: 0,
    sizeVariance: 0,
    alignToMotion: false,
    stack: 0,
    tilt: 0,
    class: '',
  });

  const containerRef = ref<HTMLDivElement>();
  const reducedMotion = usePreferredReducedMotion();
  let trail: ReturnType<typeof createImageTrail> | null = null;

  const toCssLength = (value: number | string) =>
    typeof value === 'number' ? `${value}px` : value;

  const rootStyle = computed(() => ({
    '--trail-size': toCssLength(props.size),
    '--trail-aspect': String(props.aspectRatio),
    '--trail-radius': toCssLength(props.radius),
    perspective: props.tilt ? '1000px' : undefined,
  }));

  function config(): ImageTrailConfig {
    return {
      threshold: props.threshold,
      lifetime: props.lifetime,
      appearScale: props.appearScale,
      zoom: props.zoom,
      flash: props.flash,
      exitScale: props.exitScale,
      drift: props.drift,
      rotation: props.rotation,
      sizeVariance: props.sizeVariance,
      alignToMotion: props.alignToMotion,
      stack: props.stack,
      tilt: props.tilt,
    };
  }

  const { pause, resume, isActive } = useRafFn(
    ({ timestamp }) => {
      if (!trail?.tick(timestamp)) pause();
    },
    { immediate: false },
  );

  function onMouseMove(event: MouseEvent) {
    if (!trail) return;
    trail.move(event.clientX, event.clientY);
    if (!isActive.value) resume();
  }

  function onTouchMove(event: TouchEvent) {
    const point = event.touches[0];
    if (!trail || !point) return;
    trail.move(point.clientX, point.clientY);
    if (!isActive.value) resume();
  }

  useEventListener(containerRef, 'mousemove', onMouseMove);
  useEventListener(containerRef, 'touchmove', onTouchMove, { passive: true });

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;
    trail = createImageTrail(
      container,
      config,
      () => reducedMotion.value === 'reduce',
    );
  });

  watch(
    () => props.items,
    async () => {
      await nextTick();
      trail?.reset();
    },
  );
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('image-trail', props.class)"
    :style="rootStyle"
  >
    <div
      v-for="(url, i) in items"
      :key="i"
      class="image-trail__img"
      data-trail-image=""
    >
      <div
        class="image-trail__img-inner"
        :style="{ backgroundImage: `url(${url})` }"
      />
    </div>
  </div>
</template>

<style scoped>
  .image-trail {
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 100;
    border-radius: 8px;
    background: transparent;
    overflow: visible;
  }

  .image-trail__img {
    width: var(--trail-size, 190px);
    aspect-ratio: var(--trail-aspect, 1.1);
    border-radius: var(--trail-radius, 15px);
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
    will-change: transform, filter;
  }

  .image-trail__img-inner {
    background-position: 50% 50%;
    width: calc(100% + 20px);
    height: calc(100% + 20px);
    background-size: cover;
    position: absolute;
    top: calc(-1 * 20px / 2);
    left: calc(-1 * 20px / 2);
  }
</style>
