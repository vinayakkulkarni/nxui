<script setup lang="ts">
  import { useRafFn, useElementHover } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      fontSize?: string;
      fontWeight?: number;
      color?: string;
      enableHover?: boolean;
      baseIntensity?: number;
      hoverIntensity?: number;
      fuzzRange?: number;
      class?: string;
    }>(),
    {
      fontSize: 'clamp(2rem, 8vw, 8rem)',
      fontWeight: 900,
      color: '',
      enableHover: true,
      baseIntensity: 0.18,
      hoverIntensity: 0.5,
      fuzzRange: 30,
      class: '',
    },
  );

  const canvas = ref<HTMLCanvasElement>();
  const isHovered = useElementHover(canvas);
  let offscreen: HTMLCanvasElement | null = null;
  let offscreenWidth = 0;
  let tightHeight = 0;

  function initCanvas() {
    const cvs = canvas.value;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const computedFont =
      window.getComputedStyle(cvs).fontFamily || 'sans-serif';
    const fontString = `${props.fontWeight} ${props.fontSize} ${computedFont}`;

    offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    offCtx.font = fontString;
    offCtx.textBaseline = 'alphabetic';

    const metrics = offCtx.measureText(props.text);
    const actualLeft = metrics.actualBoundingBoxLeft ?? 0;
    const actualRight = metrics.actualBoundingBoxRight ?? metrics.width;
    const actualAscent =
      metrics.actualBoundingBoxAscent ?? Number.parseFloat(props.fontSize);
    const actualDescent =
      metrics.actualBoundingBoxDescent ??
      Number.parseFloat(props.fontSize) * 0.2;

    offscreenWidth = Math.ceil(actualLeft + actualRight) + 10;
    tightHeight = Math.ceil(actualAscent + actualDescent);

    offscreen.width = offscreenWidth;
    offscreen.height = tightHeight;

    offCtx.font = fontString;
    offCtx.textBaseline = 'alphabetic';

    const resolvedColor =
      props.color ||
      window.getComputedStyle(cvs).getPropertyValue('color') ||
      '#fff';
    offCtx.fillStyle = resolvedColor;
    offCtx.fillText(props.text, 5 - actualLeft, actualAscent);

    const margin = props.fuzzRange + 20;
    cvs.width = offscreenWidth + margin * 2;
    cvs.height = tightHeight + margin * 2;
  }

  onMounted(() => {
    initCanvas();
  });

  useRafFn(() => {
    const cvs = canvas.value;
    if (!cvs || !offscreen) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const margin = props.fuzzRange + 20;

    ctx.clearRect(0, 0, cvs.width, cvs.height);

    const intensity =
      props.enableHover && isHovered.value
        ? props.hoverIntensity
        : props.baseIntensity;

    for (let j = 0; j < tightHeight; j++) {
      const dx = Math.floor(
        intensity * (Math.random() - 0.5) * props.fuzzRange,
      );
      ctx.drawImage(
        offscreen,
        0,
        j,
        offscreenWidth,
        1,
        margin + dx,
        margin + j,
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
  ></canvas>
</template>
