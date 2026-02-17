<script setup lang="ts">
  import { useRafFn, useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      color?: string;
      fontSize?: number;
      speed?: number;
      class?: string;
    }>(),
    {
      color: '#0f0',
      fontSize: 14,
      speed: 1,
      class: '',
    },
  );

  const canvasRef = ref<HTMLCanvasElement>();
  const containerRef = ref<HTMLElement>();
  const columns = ref<number[]>([]);
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()';

  function initColumns(width: number) {
    const numCols = Math.floor(width / props.fontSize);
    columns.value = Array.from({ length: numCols }, () => Math.random() * -100);
  }

  useResizeObserver(containerRef, (entries) => {
    const entry = entries[0];
    if (!entry || !canvasRef.value) return;

    const { width, height } = entry.contentRect;
    canvasRef.value.width = width;
    canvasRef.value.height = height;
    initColumns(width);
  });

  let frameCount = 0;

  useRafFn(() => {
    frameCount++;
    if (frameCount % Math.max(1, Math.round(3 / props.speed)) !== 0) return;

    const canvas = canvasRef.value;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = props.color;
    ctx.font = `${props.fontSize}px monospace`;

    for (let i = 0; i < columns.value.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * props.fontSize;
      const y = columns.value[i] * props.fontSize;

      ctx.fillText(char, x, y);

      if (y > canvas.height && Math.random() > 0.975) {
        columns.value[i] = 0;
      }

      columns.value[i]++;
    }
  });

  onMounted(() => {
    if (canvasRef.value && containerRef.value) {
      const { width, height } = containerRef.value.getBoundingClientRect();
      canvasRef.value.width = width;
      canvasRef.value.height = height;
      initColumns(width);
    }
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative overflow-hidden bg-black', props.class)"
  >
    <canvas ref="canvasRef" class="size-full"></canvas>
    <div class="absolute inset-0 z-10">
      <slot></slot>
    </div>
  </div>
</template>
