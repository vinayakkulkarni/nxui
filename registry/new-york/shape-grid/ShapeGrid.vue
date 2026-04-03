<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      direction?: 'diagonal' | 'up' | 'right' | 'down' | 'left';
      speed?: number;
      borderColor?: string;
      squareSize?: number;
      hoverFillColor?: string;
      shape?: 'square' | 'hexagon' | 'circle' | 'triangle';
      hoverTrailAmount?: number;
      vignetteColor?: string;
      class?: string;
    }>(),
    {
      direction: 'right',
      speed: 1,
      borderColor: '#999',
      squareSize: 40,
      hoverFillColor: '#222',
      shape: 'square',
      hoverTrailAmount: 0,
      vignetteColor: '#060010',
      class: '',
    },
  );

  const canvasRef = ref<HTMLCanvasElement>();
  let rafId: number | null = null;
  const gridOffset = { x: 0, y: 0 };
  let hoveredSquare: { x: number; y: number } | null = null;
  const trailCells: Array<{ x: number; y: number }> = [];
  const cellOpacities = new Map<string, number>();

  function drawHex(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
  ) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const vx = cx + size * Math.cos(angle);
      const vy = cy + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
  }

  function drawCircle(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
  ) {
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.closePath();
  }

  function drawTriangle(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    flip: boolean,
  ) {
    ctx.beginPath();
    if (flip) {
      ctx.moveTo(cx, cy + size / 2);
      ctx.lineTo(cx + size / 2, cy - size / 2);
      ctx.lineTo(cx - size / 2, cy - size / 2);
    } else {
      ctx.moveTo(cx, cy - size / 2);
      ctx.lineTo(cx + size / 2, cy + size / 2);
      ctx.lineTo(cx - size / 2, cy + size / 2);
    }
    ctx.closePath();
  }

  function updateCellOpacities() {
    const targets = new Map<string, number>();
    if (hoveredSquare) {
      targets.set(`${hoveredSquare.x},${hoveredSquare.y}`, 1);
    }
    if (props.hoverTrailAmount > 0) {
      for (let i = 0; i < trailCells.length; i++) {
        const t = trailCells[i]!;
        const key = `${t.x},${t.y}`;
        if (!targets.has(key)) {
          targets.set(key, (trailCells.length - i) / (trailCells.length + 1));
        }
      }
    }
    for (const [key] of targets) {
      if (!cellOpacities.has(key)) cellOpacities.set(key, 0);
    }
    for (const [key, opacity] of cellOpacities) {
      const target = targets.get(key) || 0;
      const next = opacity + (target - opacity) * 0.15;
      if (next < 0.005) cellOpacities.delete(key);
      else cellOpacities.set(key, next);
    }
  }

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isHex = props.shape === 'hexagon';
    const isTri = props.shape === 'triangle';
    const hexHoriz = props.squareSize * 1.5;
    const hexVert = props.squareSize * Math.sqrt(3);

    function resizeCanvas() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    useResizeObserver(canvasRef, resizeCanvas);
    resizeCanvas();

    function drawGrid() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const sq = props.squareSize;
      const offsetX =
        ((gridOffset.x % (isHex ? hexHoriz : isTri ? sq / 2 : sq)) +
          (isHex ? hexHoriz : isTri ? sq / 2 : sq)) %
        (isHex ? hexHoriz : isTri ? sq / 2 : sq);
      const offsetY =
        ((gridOffset.y % (isHex ? hexVert : isTri ? sq * 2 : sq)) +
          (isHex ? hexVert : isTri ? sq * 2 : sq)) %
        (isHex ? hexVert : isTri ? sq * 2 : sq);
      const cols =
        Math.ceil(canvas.width / (isHex ? hexHoriz : isTri ? sq / 2 : sq)) + 4;
      const rows = Math.ceil(canvas.height / (isHex ? hexVert : sq)) + 4;
      const colShift = Math.floor(
        gridOffset.x / (isHex ? hexHoriz : isTri ? sq / 2 : sq),
      );
      const rowShift = Math.floor(gridOffset.y / sq);

      for (let col = -2; col < cols; col++) {
        for (let row = -2; row < rows; row++) {
          const cellKey = `${col},${row}`;
          const alpha = cellOpacities.get(cellKey);

          if (props.shape === 'hexagon') {
            const cx = col * hexHoriz + offsetX;
            const cy =
              row * hexVert +
              ((col + colShift) % 2 !== 0 ? hexVert / 2 : 0) +
              offsetY;
            if (alpha) {
              ctx.globalAlpha = alpha;
              drawHex(ctx, cx, cy, sq);
              ctx.fillStyle = props.hoverFillColor;
              ctx.fill();
              ctx.globalAlpha = 1;
            }
            drawHex(ctx, cx, cy, sq);
            ctx.strokeStyle = props.borderColor;
            ctx.stroke();
          } else if (props.shape === 'triangle') {
            const cx = col * (sq / 2) + offsetX;
            const cy = row * sq + sq / 2 + offsetY;
            const flip =
              (((col + colShift + row + rowShift) % 2) + 2) % 2 !== 0;
            if (alpha) {
              ctx.globalAlpha = alpha;
              drawTriangle(ctx, cx, cy, sq, flip);
              ctx.fillStyle = props.hoverFillColor;
              ctx.fill();
              ctx.globalAlpha = 1;
            }
            drawTriangle(ctx, cx, cy, sq, flip);
            ctx.strokeStyle = props.borderColor;
            ctx.stroke();
          } else if (props.shape === 'circle') {
            const cx = col * sq + sq / 2 + offsetX;
            const cy = row * sq + sq / 2 + offsetY;
            if (alpha) {
              ctx.globalAlpha = alpha;
              drawCircle(ctx, cx, cy, sq);
              ctx.fillStyle = props.hoverFillColor;
              ctx.fill();
              ctx.globalAlpha = 1;
            }
            drawCircle(ctx, cx, cy, sq);
            ctx.strokeStyle = props.borderColor;
            ctx.stroke();
          } else {
            const sx = col * sq + offsetX;
            const sy = row * sq + offsetY;
            if (alpha) {
              ctx.globalAlpha = alpha;
              ctx.fillStyle = props.hoverFillColor;
              ctx.fillRect(sx, sy, sq, sq);
              ctx.globalAlpha = 1;
            }
            ctx.strokeStyle = props.borderColor;
            ctx.strokeRect(sx, sy, sq, sq);
          }
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
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, props.vignetteColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function animate() {
      const effectiveSpeed = Math.max(props.speed, 0.1);
      const wrapX = isHex ? hexHoriz * 2 : props.squareSize;
      const wrapY = isHex
        ? hexVert
        : isTri
          ? props.squareSize * 2
          : props.squareSize;

      switch (props.direction) {
        case 'right':
          gridOffset.x = (gridOffset.x - effectiveSpeed + wrapX) % wrapX;
          break;
        case 'left':
          gridOffset.x = (gridOffset.x + effectiveSpeed + wrapX) % wrapX;
          break;
        case 'up':
          gridOffset.y = (gridOffset.y + effectiveSpeed + wrapY) % wrapY;
          break;
        case 'down':
          gridOffset.y = (gridOffset.y - effectiveSpeed + wrapY) % wrapY;
          break;
        case 'diagonal':
          gridOffset.x = (gridOffset.x - effectiveSpeed + wrapX) % wrapX;
          gridOffset.y = (gridOffset.y - effectiveSpeed + wrapY) % wrapY;
          break;
      }

      updateCellOpacities();
      drawGrid();
      rafId = requestAnimationFrame(animate);
    }

    useEventListener(canvas, 'mousemove', (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const sq = props.squareSize;
      const oX = ((gridOffset.x % sq) + sq) % sq;
      const oY = ((gridOffset.y % sq) + sq) % sq;
      const col = Math.floor((mouseX - oX) / sq);
      const row = Math.floor((mouseY - oY) / sq);

      if (
        !hoveredSquare ||
        hoveredSquare.x !== col ||
        hoveredSquare.y !== row
      ) {
        if (hoveredSquare && props.hoverTrailAmount > 0) {
          trailCells.unshift({ ...hoveredSquare });
          if (trailCells.length > props.hoverTrailAmount)
            trailCells.length = props.hoverTrailAmount;
        }
        hoveredSquare = { x: col, y: row };
      }
    });

    useEventListener(canvas, 'mouseleave', () => {
      if (hoveredSquare && props.hoverTrailAmount > 0) {
        trailCells.unshift({ ...hoveredSquare });
        if (trailCells.length > props.hoverTrailAmount)
          trailCells.length = props.hoverTrailAmount;
      }
      hoveredSquare = null;
    });

    rafId = requestAnimationFrame(animate);
  });

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId);
  });
</script>

<template>
  <canvas
    ref="canvasRef"
    :class="cn('block size-full border-none', props.class)"
  ></canvas>
</template>
