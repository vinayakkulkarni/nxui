<script setup lang="ts">
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      opacity?: number;
      class?: string;
    }>(),
    {
      opacity: 0.04,
      class: '',
    },
  );

  const canvasRef = ref<HTMLCanvasElement>();
  const containerRef = ref<HTMLElement>();

  function generateNoise(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  useResizeObserver(containerRef, (entries) => {
    const entry = entries[0];
    if (!entry || !canvasRef.value) return;

    const { width, height } = entry.contentRect;
    canvasRef.value.width = width;
    canvasRef.value.height = height;
    generateNoise(canvasRef.value);
  });

  onMounted(() => {
    if (canvasRef.value) {
      generateNoise(canvasRef.value);
    }
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative overflow-hidden', props.class)"
  >
    <slot />
    <canvas
      ref="canvasRef"
      class="pointer-events-none absolute inset-0 size-full"
      :style="{ opacity }"
    />
  </div>
</template>
