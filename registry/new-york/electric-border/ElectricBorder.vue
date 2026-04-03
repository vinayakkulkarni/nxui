<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      color?: string;
      speed?: number;
      chaos?: number;
      borderRadius?: number;
      class?: string;
    }>(),
    {
      color: '#5227FF',
      speed: 1,
      chaos: 0.12,
      borderRadius: 24,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  const canvasRef = ref<HTMLCanvasElement>();
  let animationId = 0;
  let timeVal = 0;
  let lastFrameTime = 0;

  const BORDER_OFFSET = 60;

  function pseudoRandom(x: number): number {
    return (Math.sin(x * 12.9898) * 43758.5453) % 1;
  }

  function noise2D(x: number, y: number): number {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    const a = pseudoRandom(i + j * 57);
    const b = pseudoRandom(i + 1 + j * 57);
    const c = pseudoRandom(i + (j + 1) * 57);
    const d = pseudoRandom(i + 1 + (j + 1) * 57);
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    return (
      a * (1 - ux) * (1 - uy) +
      b * ux * (1 - uy) +
      c * (1 - ux) * uy +
      d * ux * uy
    );
  }

  function octavedNoise(
    x: number,
    octaves: number,
    lac: number,
    gain: number,
    amp: number,
    freq: number,
    time: number,
    seed: number,
    flat: number,
  ): number {
    let y = 0;
    let amplitude = amp;
    let frequency = freq;
    for (let i = 0; i < octaves; i++) {
      const oa = i === 0 ? amplitude * flat : amplitude;
      y += oa * noise2D(frequency * x + seed * 100, time * frequency * 0.3);
      frequency *= lac;
      amplitude *= gain;
    }
    return y;
  }

  function getCornerPoint(
    cx: number,
    cy: number,
    r: number,
    startA: number,
    arcLen: number,
    prog: number,
  ) {
    const angle = startA + prog * arcLen;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  function getRoundedRectPoint(
    t: number,
    left: number,
    top: number,
    w: number,
    h: number,
    r: number,
  ) {
    const sw = w - 2 * r;
    const sh = h - 2 * r;
    const ca = (Math.PI * r) / 2;
    const total = 2 * sw + 2 * sh + 4 * ca;
    const dist = t * total;
    let acc = 0;

    if (dist <= acc + sw)
      return { x: left + r + ((dist - acc) / sw) * sw, y: top };
    acc += sw;
    if (dist <= acc + ca)
      return getCornerPoint(
        left + w - r,
        top + r,
        r,
        -Math.PI / 2,
        Math.PI / 2,
        (dist - acc) / ca,
      );
    acc += ca;
    if (dist <= acc + sh)
      return { x: left + w, y: top + r + ((dist - acc) / sh) * sh };
    acc += sh;
    if (dist <= acc + ca)
      return getCornerPoint(
        left + w - r,
        top + h - r,
        r,
        0,
        Math.PI / 2,
        (dist - acc) / ca,
      );
    acc += ca;
    if (dist <= acc + sw)
      return { x: left + w - r - ((dist - acc) / sw) * sw, y: top + h };
    acc += sw;
    if (dist <= acc + ca)
      return getCornerPoint(
        left + r,
        top + h - r,
        r,
        Math.PI / 2,
        Math.PI / 2,
        (dist - acc) / ca,
      );
    acc += ca;
    if (dist <= acc + sh)
      return { x: left, y: top + h - r - ((dist - acc) / sh) * sh };
    acc += sh;
    return getCornerPoint(
      left + r,
      top + r,
      r,
      Math.PI,
      Math.PI / 2,
      (dist - acc) / ca,
    );
  }

  let canvasWidth = 0;
  let canvasHeight = 0;

  function updateSize() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    canvasWidth = rect.width + BORDER_OFFSET * 2;
    canvasHeight = rect.height + BORDER_OFFSET * 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
  }

  useResizeObserver(containerRef, updateSize);

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    updateSize();

    function draw(currentTime: number) {
      animationId = requestAnimationFrame(draw);
      if (!ctx || !canvas) return;

      const deltaTime = (currentTime - lastFrameTime) / 1000;
      timeVal += deltaTime * props.speed;
      lastFrameTime = currentTime;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      ctx.strokeStyle = props.color;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const bw = canvasWidth - 2 * BORDER_OFFSET;
      const bh = canvasHeight - 2 * BORDER_OFFSET;
      const maxR = Math.min(bw, bh) / 2;
      const r = Math.min(props.borderRadius, maxR);
      const approxPerimeter = 2 * (bw + bh) + 2 * Math.PI * r;
      const samples = Math.floor(approxPerimeter / 2);
      const scale = 60;

      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const progress = i / samples;
        const pt = getRoundedRectPoint(
          progress,
          BORDER_OFFSET,
          BORDER_OFFSET,
          bw,
          bh,
          r,
        );
        const xn = octavedNoise(
          progress * 8,
          10,
          1.6,
          0.7,
          props.chaos,
          10,
          timeVal,
          0,
          0,
        );
        const yn = octavedNoise(
          progress * 8,
          10,
          1.6,
          0.7,
          props.chaos,
          10,
          timeVal,
          1,
          0,
        );
        const dx = pt.x + xn * scale;
        const dy = pt.y + yn * scale;
        if (i === 0) ctx.moveTo(dx, dy);
        else ctx.lineTo(dx, dy);
      }
      ctx.closePath();
      ctx.stroke();
    }

    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(draw);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('electric-border-wrap', $props.class)"
    :style="{ '--eb-color': color, borderRadius: `${borderRadius}px` }"
  >
    <div class="eb-canvas-container">
      <canvas ref="canvasRef" class="eb-canvas"></canvas>
    </div>
    <div class="eb-layers">
      <div class="eb-glow-1"></div>
      <div class="eb-glow-2"></div>
    </div>
    <div class="eb-bg-glow"></div>
    <div class="eb-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
  .electric-border-wrap {
    position: relative;
    display: inline-block;
    overflow: visible;
    isolation: isolate;
  }

  .eb-canvas-container {
    position: absolute;
    inset: -60px;
    pointer-events: none;
    z-index: 0;
  }

  .eb-canvas {
    display: block;
  }

  .eb-layers {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  .eb-glow-1 {
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    box-shadow: 0 0 15px 2px var(--eb-color);
    opacity: 0.3;
  }

  .eb-glow-2 {
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    box-shadow: inset 0 0 15px 2px var(--eb-color);
    opacity: 0.15;
  }

  .eb-bg-glow {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    z-index: -1;
    transform: scale(1.1);
    filter: blur(32px);
    opacity: 0.3;
    background: linear-gradient(
      -30deg,
      var(--eb-color),
      transparent,
      var(--eb-color)
    );
  }

  .eb-content {
    position: relative;
    z-index: 1;
  }
</style>
