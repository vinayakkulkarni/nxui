<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useRafFn, useElementHover, useMutationObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      fontSize?: string;
      fontWeight?: number;
      fontFamily?: string;
      color?: string;
      enableHover?: boolean;
      baseIntensity?: number;
      hoverIntensity?: number;
      fuzzRange?: number;
      direction?: 'horizontal' | 'vertical' | 'both';
      transitionDuration?: number;
      clickEffect?: boolean;
      glitchMode?: boolean;
      glitchInterval?: number;
      glitchDuration?: number;
      gradient?: string[] | null;
      letterSpacing?: number;
      fps?: number;
      class?: string;
    }>(),
    {
      fontSize: 'clamp(2rem, 8vw, 8rem)',
      fontWeight: 900,
      fontFamily: '',
      color: '',
      enableHover: true,
      baseIntensity: 0.18,
      hoverIntensity: 0.5,
      fuzzRange: 30,
      direction: 'both',
      transitionDuration: 300,
      clickEffect: false,
      glitchMode: false,
      glitchInterval: 2000,
      glitchDuration: 200,
      gradient: null,
      letterSpacing: 0,
      fps: 0,
      class: '',
    },
  );

  const canvas = ref<HTMLCanvasElement>();
  const isHovered = useElementHover(canvas);
  let offscreen: HTMLCanvasElement | null = null;
  let offscreenWidth = 0;
  let tightHeight = 0;

  // Smooth intensity transition
  let currentIntensity = props.baseIntensity;
  let targetIntensity = props.baseIntensity;

  // Click effect state
  let clickBurstEnd = 0;

  // Glitch mode state
  let glitchTimer: ReturnType<typeof setInterval> | null = null;
  let glitchEnd = 0;

  // FPS throttle
  let lastDrawTime = 0;

  function initCanvas() {
    const cvs = canvas.value;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const computedStyle = window.getComputedStyle(cvs);
    const fontFamilyStr =
      props.fontFamily || computedStyle.fontFamily || 'sans-serif';
    const fontString = `${props.fontWeight} ${props.fontSize} ${fontFamilyStr}`;

    offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    offCtx.font = fontString;
    offCtx.textBaseline = 'alphabetic';

    let totalWidth: number;
    let metrics: TextMetrics;

    if (props.letterSpacing > 0) {
      // Render character by character with custom spacing
      totalWidth = 0;
      for (const char of props.text) {
        totalWidth += offCtx.measureText(char).width + props.letterSpacing;
      }
      totalWidth -= props.letterSpacing; // Remove trailing space
    } else {
      metrics = offCtx.measureText(props.text);
      totalWidth =
        (metrics.actualBoundingBoxLeft ?? 0) +
        (metrics.actualBoundingBoxRight ?? metrics.width);
    }

    metrics = offCtx.measureText(props.text);
    const actualAscent =
      metrics.actualBoundingBoxAscent ?? Number.parseFloat(props.fontSize);
    const actualDescent =
      metrics.actualBoundingBoxDescent ??
      Number.parseFloat(props.fontSize) * 0.2;
    const actualLeft = metrics.actualBoundingBoxLeft ?? 0;

    offscreenWidth = Math.ceil(totalWidth) + 10;
    tightHeight = Math.ceil(actualAscent + actualDescent);

    offscreen.width = offscreenWidth;
    offscreen.height = tightHeight;

    offCtx.font = fontString;
    offCtx.textBaseline = 'alphabetic';

    // Set fill style: gradient or solid color
    if (props.gradient && props.gradient.length > 0) {
      const grad = offCtx.createLinearGradient(0, 0, offscreenWidth, 0);
      for (let i = 0; i < props.gradient.length; i++) {
        grad.addColorStop(i / (props.gradient.length - 1), props.gradient[i]!);
      }
      offCtx.fillStyle = grad;
    } else {
      const resolvedColor =
        props.color ||
        window.getComputedStyle(cvs).getPropertyValue('color') ||
        '#fff';
      offCtx.fillStyle = resolvedColor;
    }

    if (props.letterSpacing > 0) {
      let x = 5 - actualLeft;
      for (const char of props.text) {
        offCtx.fillText(char, x, actualAscent);
        x += offCtx.measureText(char).width + props.letterSpacing;
      }
    } else {
      offCtx.fillText(props.text, 5 - actualLeft, actualAscent);
    }

    const margin = props.fuzzRange + 20;
    cvs.width = offscreenWidth + margin * 2;
    cvs.height = tightHeight + margin * 2;
  }

  onMounted(() => {
    initCanvas();

    useMutationObserver(
      document.documentElement,
      () => {
        initCanvas();
      },
      { attributes: true, attributeFilter: ['class'] },
    );

    // Setup glitch mode
    if (props.glitchMode) {
      glitchTimer = setInterval(() => {
        glitchEnd = performance.now() + props.glitchDuration;
      }, props.glitchInterval);
    }
  });

  onBeforeUnmount(() => {
    if (glitchTimer) clearInterval(glitchTimer);
  });

  function handleClick() {
    if (props.clickEffect) {
      clickBurstEnd = performance.now() + 150;
    }
  }

  useRafFn(({ timestamp }) => {
    const cvs = canvas.value;
    if (!cvs || !offscreen) return;

    // FPS throttle
    if (props.fps > 0) {
      const interval = 1000 / props.fps;
      if (timestamp - lastDrawTime < interval) return;
      lastDrawTime = timestamp;
    }

    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const margin = props.fuzzRange + 20;
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    // Determine target intensity
    const now = performance.now();
    if (now < clickBurstEnd) {
      targetIntensity = 1;
    } else if (now < glitchEnd) {
      targetIntensity = 1;
    } else if (props.enableHover && isHovered.value) {
      targetIntensity = props.hoverIntensity;
    } else {
      targetIntensity = props.baseIntensity;
    }

    // Smooth transition
    if (props.transitionDuration > 0) {
      const step = (1 / props.transitionDuration) * 16; // ~16ms per frame
      if (currentIntensity < targetIntensity) {
        currentIntensity = Math.min(currentIntensity + step, targetIntensity);
      } else {
        currentIntensity = Math.max(currentIntensity - step, targetIntensity);
      }
    } else {
      currentIntensity = targetIntensity;
    }

    for (let j = 0; j < tightHeight; j++) {
      let dx = 0;
      let dy = 0;

      if (props.direction === 'horizontal' || props.direction === 'both') {
        dx = Math.floor(
          currentIntensity * (Math.random() - 0.5) * props.fuzzRange,
        );
      }
      if (props.direction === 'vertical' || props.direction === 'both') {
        dy = Math.floor(
          currentIntensity * (Math.random() - 0.5) * props.fuzzRange,
        );
      }

      ctx.drawImage(
        offscreen,
        0,
        j,
        offscreenWidth,
        1,
        margin + dx,
        margin + j + dy,
        offscreenWidth,
        1,
      );
    }
  });
</script>

<template>
  <canvas
    ref="canvas"
    :class="cn('block', props.class)"
    :style="{ fontSize, fontWeight }"
    @click="handleClick"
  ></canvas>
</template>
