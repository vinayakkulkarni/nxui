<script setup lang="ts">
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      colorFrom?: string;
      colorTo?: string;
      angle?: number;
      class?: string;
    }>(),
    {
      colorFrom: '#7c3aed',
      colorTo: '#06b6d4',
      angle: 135,
      class: '',
    },
  );

  const containerRef = ref<HTMLElement>();
  const canvasRef = ref<HTMLCanvasElement>();

  function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          Number.parseInt(result[1], 16),
          Number.parseInt(result[2], 16),
          Number.parseInt(result[3], 16),
        ]
      : [0, 0, 0];
  }

  function renderDither(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    const from = hexToRgb(props.colorFrom);
    const to = hexToRgb(props.colorTo);
    const rad = (props.angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x / width - 0.5;
        const ny = y / height - 0.5;
        const t = Math.max(0, Math.min(1, nx * cos + ny * sin + 0.5));

        const r = from[0] + (to[0] - from[0]) * t;
        const g = from[1] + (to[1] - from[1]) * t;
        const b = from[2] + (to[2] - from[2]) * t;

        const dither = (Math.random() - 0.5) * 30;
        const idx = (y * width + x) * 4;
        data[idx] = Math.max(0, Math.min(255, r + dither));
        data[idx + 1] = Math.max(0, Math.min(255, g + dither));
        data[idx + 2] = Math.max(0, Math.min(255, b + dither));
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  useResizeObserver(containerRef, (entries) => {
    const entry = entries[0];
    if (!entry || !canvasRef.value) return;

    canvasRef.value.width = entry.contentRect.width;
    canvasRef.value.height = entry.contentRect.height;
    renderDither(canvasRef.value);
  });

  onMounted(() => {
    if (canvasRef.value) {
      renderDither(canvasRef.value);
    }
  });
</script>

<template>
  <div ref="containerRef" :class="cn('relative overflow-hidden', props.class)">
    <canvas ref="canvasRef" class="size-full"></canvas>
    <div class="absolute inset-0 z-10">
      <slot></slot>
    </div>
  </div>
</template>
