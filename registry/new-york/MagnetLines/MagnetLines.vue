<script setup lang="ts">
  import { useMouseInElement, useRafFn, useElementSize } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      lineCount?: number;
      lineColor?: string;
      lineWidth?: number;
      magnetStrength?: number;
      class?: string;
    }>(),
    {
      lineCount: 40,
      lineColor: 'currentColor',
      lineWidth: 1,
      magnetStrength: 0.5,
      class: '',
    },
  );

  const containerRef = ref<HTMLElement>();
  const canvasRef = ref<HTMLCanvasElement>();
  const { elementX, elementY, isOutside } = useMouseInElement(containerRef);
  const { width, height } = useElementSize(containerRef);

  watch([width, height], ([w, h]) => {
    if (canvasRef.value) {
      canvasRef.value.width = w;
      canvasRef.value.height = h;
    }
  });

  useRafFn(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = props.lineColor;
    ctx.lineWidth = props.lineWidth;

    const spacing = canvas.width / (props.lineCount + 1);

    for (let i = 1; i <= props.lineCount; i++) {
      const baseX = i * spacing;
      const startY = 0;
      const endY = canvas.height;

      ctx.beginPath();
      ctx.moveTo(baseX, startY);

      if (!isOutside.value) {
        const dx = elementX.value - baseX;
        const dy = elementY.value - canvas.height / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influence =
          Math.max(0, 1 - distance / (canvas.width * 0.4)) *
          props.magnetStrength;

        const cpX = baseX + dx * influence;
        const cpY = canvas.height / 2 + dy * influence * 0.3;

        ctx.quadraticCurveTo(cpX, cpY, baseX, endY);
      } else {
        ctx.lineTo(baseX, endY);
      }

      ctx.stroke();
    }
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
    :class="cn('relative overflow-hidden', props.class)"
  >
    <canvas ref="canvasRef" class="size-full" />
    <div class="pointer-events-none absolute inset-0 z-10">
      <slot />
    </div>
  </div>
</template>
