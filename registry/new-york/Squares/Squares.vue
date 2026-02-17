<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      direction?: 'left' | 'right' | 'up' | 'down' | 'diagonal';
      speed?: number;
      borderColor?: string;
      squareSize?: number;
      hoverFillColor?: string;
      class?: string;
    }>(),
    {
      direction: 'right',
      speed: 1,
      borderColor: '#999',
      squareSize: 40,
      hoverFillColor: '#222',
      class: '',
    },
  );

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  let ctx: CanvasRenderingContext2D | null = null;
  let animationId = 0;
  const gridOffset = { x: 0, y: 0 };
  let hoveredSquare: { x: number; y: number } | null = null;

  function resizeCanvas() {
    const canvas = canvasRef.value;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function drawGrid() {
    const canvas = canvasRef.value;
    if (!canvas || !ctx) return;
    const { squareSize, borderColor, hoverFillColor } = props;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const startX = Math.floor(gridOffset.x / squareSize) * squareSize;
    const startY = Math.floor(gridOffset.y / squareSize) * squareSize;

    for (let x = startX; x < canvas.width + squareSize; x += squareSize) {
      for (let y = startY; y < canvas.height + squareSize; y += squareSize) {
        const squareX = x - (gridOffset.x % squareSize);
        const squareY = y - (gridOffset.y % squareSize);

        if (
          hoveredSquare &&
          Math.floor((x - startX) / squareSize) === hoveredSquare.x &&
          Math.floor((y - startY) / squareSize) === hoveredSquare.y
        ) {
          ctx.fillStyle = hoverFillColor;
          ctx.fillRect(squareX, squareY, squareSize, squareSize);
        }

        ctx.strokeStyle = borderColor;
        ctx.strokeRect(squareX, squareY, squareSize, squareSize);
      }
    }

    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2,
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function updateAnimation() {
    const { direction, speed, squareSize } = props;
    const effectiveSpeed = Math.max(speed, 0.1);

    switch (direction) {
      case 'right':
        gridOffset.x =
          (gridOffset.x - effectiveSpeed + squareSize) % squareSize;
        break;
      case 'left':
        gridOffset.x =
          (gridOffset.x + effectiveSpeed + squareSize) % squareSize;
        break;
      case 'up':
        gridOffset.y =
          (gridOffset.y + effectiveSpeed + squareSize) % squareSize;
        break;
      case 'down':
        gridOffset.y =
          (gridOffset.y - effectiveSpeed + squareSize) % squareSize;
        break;
      case 'diagonal':
        gridOffset.x =
          (gridOffset.x - effectiveSpeed + squareSize) % squareSize;
        gridOffset.y =
          (gridOffset.y - effectiveSpeed + squareSize) % squareSize;
        break;
    }

    drawGrid();
    animationId = requestAnimationFrame(updateAnimation);
  }

  useResizeObserver(canvasRef, () => {
    resizeCanvas();
  });

  useEventListener(canvasRef, 'mousemove', (event: MouseEvent) => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const { squareSize } = props;
    const startX = Math.floor(gridOffset.x / squareSize) * squareSize;
    const startY = Math.floor(gridOffset.y / squareSize) * squareSize;
    hoveredSquare = {
      x: Math.floor((mouseX + gridOffset.x - startX) / squareSize),
      y: Math.floor((mouseY + gridOffset.y - startY) / squareSize),
    };
  });

  useEventListener(canvasRef, 'mouseleave', () => {
    hoveredSquare = null;
  });

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    animationId = requestAnimationFrame(updateAnimation);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
  });
</script>

<template>
  <canvas ref="canvasRef" :class="cn('size-full', $props.class)"></canvas>
</template>
