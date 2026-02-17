<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  interface Spark {
    x: number;
    y: number;
    angle: number;
    startTime: number;
  }

  const props = withDefaults(
    defineProps<{
      sparkColor?: string;
      sparkSize?: number;
      sparkRadius?: number;
      sparkCount?: number;
      duration?: number;
      easing?: 'ease-out' | 'ease-in' | 'ease-in-out' | 'linear';
      extraScale?: number;
      class?: string;
    }>(),
    {
      sparkColor: '#fff',
      sparkSize: 10,
      sparkRadius: 15,
      sparkCount: 8,
      duration: 400,
      easing: 'ease-out',
      extraScale: 1.0,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  const canvasRef = ref<HTMLCanvasElement>();
  const sparks: Spark[] = [];
  let animationId = 0;

  function easeFn(t: number): number {
    switch (props.easing) {
      case 'linear':
        return t;
      case 'ease-in':
        return t * t;
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t * (2 - t);
    }
  }

  function resizeCanvas() {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!canvas || !container) return;
    const { width, height } = container.getBoundingClientRect();
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  useResizeObserver(containerRef, resizeCanvas);

  function handleClick(e: MouseEvent) {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();
    for (let i = 0; i < props.sparkCount; i++) {
      sparks.push({
        x,
        y,
        angle: (2 * Math.PI * i) / props.sparkCount,
        startTime: now,
      });
    }
  }

  onMounted(() => {
    resizeCanvas();

    function draw(timestamp: number) {
      animationId = requestAnimationFrame(draw);
      const canvas = canvasRef.value;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let i = sparks.length;
      while (i--) {
        const spark = sparks[i];
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= props.duration) {
          sparks.splice(i, 1);
          continue;
        }

        const progress = elapsed / props.duration;
        const eased = easeFn(progress);
        const distance = eased * props.sparkRadius * props.extraScale;
        const lineLength = props.sparkSize * (1 - eased);

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        ctx.strokeStyle = props.sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    animationId = requestAnimationFrame(draw);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full', $props.class)"
    @click="handleClick"
  >
    <canvas
      ref="canvasRef"
      class="pointer-events-none absolute inset-0 block select-none"
      style="width: 100%; height: 100%"
    ></canvas>
    <slot></slot>
  </div>
</template>
