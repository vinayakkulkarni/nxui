<script setup lang="ts">
  import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
  import { useMediaQuery } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    toGrayscaleGrid,
    errorDiffusionDither,
    applyMaskInversion,
    fetchImage,
    initParticles,
    stepParticles,
    drawParticles,
  } from './dither';
  import type {
    DitheredParticleSystem,
    DitheredRipple,
    DitheredLogoProps,
  } from './types';

  const props = withDefaults(defineProps<DitheredLogoProps>(), {
    gridSize: 200,
    scale: 0.5,
    dotScale: 1,
    invert: true,
    cornerRadius: 0.2,
    threshold: 180,
    contrast: 0,
    gamma: 1,
    blur: 3.75,
    diffusionStrength: 1,
    serpentine: true,
    particleColor: 'currentColor',
    class: '',
  });

  const canvas = ref<HTMLCanvasElement | null>(null);
  const isMobile = useMediaQuery('(max-width: 640px)');

  let system: DitheredParticleSystem | null = null;
  const cursor = { x: 0, y: 0, active: false };
  const ripples: DitheredRipple[] = [];
  let animFrame = 0;
  let running = false;
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  let ro: ResizeObserver | null = null;
  let mo: MutationObserver | null = null;

  function resolveParticleColor(): string {
    const el = canvas.value;
    if (!el) return props.particleColor;
    return props.particleColor === 'currentColor'
      ? getComputedStyle(el).color
      : props.particleColor;
  }

  function startLoop(): void {
    if (running) return;
    const el = canvas.value;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;

    running = true;
    const dpr = window.devicePixelRatio || 1;

    const tick = (): void => {
      if (!system) {
        running = false;
        return;
      }
      const rect = el.getBoundingClientRect();
      const needsMore = stepParticles(
        system,
        cursor.x,
        cursor.y,
        cursor.active,
        ripples,
        performance.now(),
      );
      drawParticles(
        ctx,
        system,
        resolveParticleColor(),
        rect.width,
        rect.height,
        dpr,
      );
      if (needsMore) {
        animFrame = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };

    animFrame = requestAnimationFrame(tick);
  }

  async function rebuild(src: string): Promise<void> {
    const el = canvas.value;
    if (!el || !src) return;

    try {
      const img = await fetchImage(src);
      const rect = el.getBoundingClientRect();
      const processed = toGrayscaleGrid(
        img,
        props.gridSize,
        props.contrast,
        props.gamma,
        props.blur,
      );
      const { width: gridW, height: gridH } = processed;

      let positions = errorDiffusionDither(
        processed.grayscale,
        gridW,
        gridH,
        {
          threshold: props.threshold,
          serpentine: props.serpentine,
          diffusionStrength: props.diffusionStrength,
        },
        processed.alpha,
      );

      if (props.invert) {
        positions = applyMaskInversion(
          positions,
          gridW,
          gridH,
          props.cornerRadius,
          processed.alpha,
        );
      }

      const scaleFactor = Math.max(
        0.5,
        (Math.min(rect.width, rect.height) * props.scale) /
          Math.max(gridW, gridH),
      );
      const originX = Math.round((rect.width - gridW * scaleFactor) / 2);
      const originY = Math.round((rect.height - gridH * scaleFactor) / 2);
      const responsiveDotScale = isMobile.value
        ? props.dotScale * 0.8
        : props.dotScale;

      system = initParticles(
        positions,
        scaleFactor,
        responsiveDotScale,
        originX,
        originY,
      );
      startLoop();
    } catch (error) {
      console.error('DitheredLogo: failed to process image', error);
    }
  }

  let lastW = 0;
  let lastH = 0;

  function handleResize(): void {
    const el = canvas.value;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;

    const rect = el.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    el.width = Math.max(1, Math.round(rect.width * dpr));
    el.height = Math.max(1, Math.round(rect.height * dpr));

    if (system) {
      drawParticles(
        ctx,
        system,
        resolveParticleColor(),
        rect.width,
        rect.height,
        dpr,
      );
    }

    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (lastW !== 0 && (w !== lastW || h !== lastH)) {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => rebuild(props.imageSrc), 200);
    }
    lastW = w;
    lastH = h;
  }

  function onPointerMove(event: PointerEvent): void {
    const el = canvas.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    cursor.x = event.clientX - rect.left;
    cursor.y = event.clientY - rect.top;
    cursor.active = true;
    startLoop();
  }

  function onPointerLeave(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    cursor.active = false;
    startLoop();
  }

  function onPointerCancel(): void {
    cursor.active = false;
    startLoop();
  }

  function onPointerUp(event: PointerEvent): void {
    const el = canvas.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    ripples.push({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      start: performance.now(),
    });
    if (event.pointerType !== 'mouse') cursor.active = false;
    startLoop();
  }

  onMounted(() => {
    const el = canvas.value;
    if (!el) return;
    handleResize();
    ro = new ResizeObserver(handleResize);
    ro.observe(el);
    mo = new MutationObserver(() => handleResize());
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
    rebuild(props.imageSrc);
  });

  watch(
    () => [
      props.imageSrc,
      props.gridSize,
      props.scale,
      props.dotScale,
      props.invert,
      props.cornerRadius,
      props.threshold,
      props.contrast,
      props.gamma,
      props.blur,
      props.diffusionStrength,
      props.serpentine,
      isMobile.value,
    ],
    () => rebuild(props.imageSrc),
  );

  onBeforeUnmount(() => {
    cancelAnimationFrame(animFrame);
    running = false;
    if (resizeTimer) clearTimeout(resizeTimer);
    ro?.disconnect();
    mo?.disconnect();
  });
</script>

<template>
  <div :class="cn('relative size-60 text-black dark:text-white', props.class)">
    <canvas
      ref="canvas"
      class="absolute inset-0 block size-full touch-none"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
      @pointercancel="onPointerCancel"
      @pointerup="onPointerUp"
    />
  </div>
</template>
