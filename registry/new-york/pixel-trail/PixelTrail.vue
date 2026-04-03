<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      pixelSize?: number;
      fadeDuration?: number;
      color?: string;
      gooeyFilter?: boolean;
      class?: string;
    }>(),
    {
      pixelSize: 24,
      fadeDuration: 500,
      color: '#ffffff',
      gooeyFilter: true,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  let ctx: CanvasRenderingContext2D | null = null;
  let animId = 0;

  interface Pixel {
    x: number;
    y: number;
    birth: number;
  }

  const pixels: Pixel[] = [];
  const filterId = `goo-filter-${Math.random().toString(36).slice(2, 9)}`;

  function resizeCanvas() {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!canvas || !container) return;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  }

  function addPixel(x: number, y: number) {
    const { pixelSize } = props;
    const snappedX = Math.floor(x / pixelSize) * pixelSize;
    const snappedY = Math.floor(y / pixelSize) * pixelSize;
    const existing = pixels.find((p) => p.x === snappedX && p.y === snappedY);
    if (existing) {
      existing.birth = performance.now();
      return;
    }
    pixels.push({ x: snappedX, y: snappedY, birth: performance.now() });
  }

  function draw() {
    const canvas = canvasRef.value;
    if (!canvas || !ctx) {
      animId = requestAnimationFrame(draw);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = performance.now();
    const { pixelSize, fadeDuration, color } = props;

    for (let i = pixels.length - 1; i >= 0; i--) {
      const pixel = pixels[i];
      const age = now - pixel.birth;
      if (age > fadeDuration) {
        pixels.splice(i, 1);
        continue;
      }
      const alpha = 1 - age / fadeDuration;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(
        pixel.x + pixelSize / 2,
        pixel.y + pixelSize / 2,
        pixelSize / 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    animId = requestAnimationFrame(draw);
  }

  useResizeObserver(containerRef, () => {
    resizeCanvas();
  });

  useEventListener(containerRef, 'mousemove', (e: MouseEvent) => {
    const container = containerRef.value;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    addPixel(e.clientX - rect.left, e.clientY - rect.top);
  });

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    animId = requestAnimationFrame(draw);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animId);
  });
</script>

<template>
  <div ref="containerRef" :class="cn('pixel-trail-container', $props.class)">
    <svg v-if="gooeyFilter" class="goo-filter-svg">
      <defs>
        <filter :id="filterId">
          <feGaussianBlur
            in="SourceGraphic"
            :stdDeviation="pixelSize * 0.3"
            result="blur"
          />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
    <canvas
      ref="canvasRef"
      class="pixel-canvas"
      :style="gooeyFilter ? { filter: `url(#${filterId})` } : {}"
    ></canvas>
    <slot></slot>
  </div>
</template>

<style scoped>
  .pixel-trail-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .goo-filter-svg {
    position: absolute;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  .pixel-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }
</style>
