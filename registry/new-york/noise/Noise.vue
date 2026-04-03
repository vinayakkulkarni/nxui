<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRafFn } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      patternSize?: number;
      patternScaleX?: number;
      patternScaleY?: number;
      patternRefreshInterval?: number;
      patternAlpha?: number;
      class?: string;
    }>(),
    {
      patternSize: 250,
      patternScaleX: 1,
      patternScaleY: 1,
      patternRefreshInterval: 2,
      patternAlpha: 15,
      class: '',
    },
  );

  const canvasRef = ref<HTMLCanvasElement>();
  const CANVAS_SIZE = 1024;
  let frame = 0;

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
  });

  useRafFn(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    if (frame % props.patternRefreshInterval === 0) {
      const imageData = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = props.patternAlpha;
      }

      ctx.putImageData(imageData, 0, 0);
    }
    frame++;
  });
</script>

<template>
  <canvas
    ref="canvasRef"
    :class="cn('pointer-events-none absolute inset-0', props.class)"
    :style="{ width: '100%', height: '100%', imageRendering: 'pixelated' }"
  ></canvas>
</template>
