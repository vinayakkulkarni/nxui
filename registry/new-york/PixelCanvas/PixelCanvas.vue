<script setup lang="ts">
  import {
    useMouseInElement,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      pixelSize?: number;
      colors?: string[];
      fadeSpeed?: number;
      class?: string;
    }>(),
    {
      pixelSize: 20,
      colors: () => ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'],
      fadeSpeed: 0.02,
      class: '',
    },
  );

  const containerRef = ref<HTMLElement>();
  const canvasRef = ref<HTMLCanvasElement>();
  const { elementX, elementY, isOutside } = useMouseInElement(containerRef);

  interface Pixel {
    x: number;
    y: number;
    color: string;
    alpha: number;
  }

  const pixels = ref<Pixel[]>([]);

  useResizeObserver(containerRef, (entries) => {
    const entry = entries[0];
    if (!entry || !canvasRef.value) return;

    canvasRef.value.width = entry.contentRect.width;
    canvasRef.value.height = entry.contentRect.height;
  });

  useRafFn(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!isOutside.value) {
      const gridX =
        Math.floor(elementX.value / props.pixelSize) * props.pixelSize;
      const gridY =
        Math.floor(elementY.value / props.pixelSize) * props.pixelSize;
      const color =
        props.colors[Math.floor(Math.random() * props.colors.length)];

      const existing = pixels.value.find(
        (p) => p.x === gridX && p.y === gridY,
      );
      if (existing) {
        existing.alpha = 1;
        existing.color = color;
      } else {
        pixels.value.push({ x: gridX, y: gridY, color, alpha: 1 });
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pixels.value = pixels.value.filter((pixel) => {
      pixel.alpha -= props.fadeSpeed;
      if (pixel.alpha <= 0) return false;

      ctx.globalAlpha = pixel.alpha;
      ctx.fillStyle = pixel.color;
      ctx.fillRect(
        pixel.x,
        pixel.y,
        props.pixelSize - 1,
        props.pixelSize - 1,
      );
      return true;
    });

    ctx.globalAlpha = 1;
  });

  onMounted(() => {
    if (canvasRef.value && containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect();
      canvasRef.value.width = rect.width;
      canvasRef.value.height = rect.height;
    }
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative cursor-crosshair overflow-hidden bg-black', props.class)"
  >
    <canvas ref="canvasRef" class="size-full" />
    <div class="pointer-events-none absolute inset-0 z-10">
      <slot />
    </div>
  </div>
</template>
