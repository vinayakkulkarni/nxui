<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { useElementSize, useMediaQuery, useRafFn } from '@vueuse/core';
  import { computeField, phaseOf, WAVE_COLS, WAVE_ROWS } from './wave';
  import type { PixelWavePhase } from './types';

  const props = withDefaults(
    defineProps<{
      speed?: number;
      verticalPadding?: number;
      animate?: boolean;
    }>(),
    {
      speed: 1,
      verticalPadding: 0,
      animate: true,
    },
  );

  const emit = defineEmits<{
    (e: 'phase', phase: PixelWavePhase): void;
  }>();

  const root = ref<HTMLElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const { width, height } = useElementSize(root);
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  let ctx: CanvasRenderingContext2D | null = null;
  let dpr = 1;
  let frame = 0;
  let lastPhase: PixelWavePhase | '' = '';
  const field = new Uint8Array(WAVE_COLS * WAVE_ROWS);

  const PALETTE: [number, number, number][] = [
    [10, 14, 20], // 0 empty (near-black, rarely used)
    [250, 250, 248], // 1 foam
    [148, 163, 171], // 2 gray spray
    [45, 212, 191], // 3 turquoise
    [20, 158, 178], // 4 teal
    [37, 99, 196], // 5 ocean blue
    [19, 42, 99], // 6 deep navy
  ];

  function resize(): void {
    const canvas = canvasRef.value;
    if (!canvas || width.value === 0 || height.value === 0) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width.value * dpr);
    canvas.height = Math.round(height.value * dpr);
    ctx = canvas.getContext('2d');
    draw();
  }

  function draw(): void {
    if (!ctx) return;
    const w = width.value;
    const h = height.value;
    if (w === 0 || h === 0) return;

    const cols = WAVE_COLS;
    const rows = WAVE_ROWS + props.verticalPadding * 2;
    const gapRatio = 0.24;
    const cell = Math.min(
      w / (cols + (cols - 1) * gapRatio),
      h / (rows + (rows - 1) * gapRatio),
    );
    const gap = cell * gapRatio;
    const gridW = cols * cell + (cols - 1) * gap;
    const gridH = rows * cell + (rows - 1) * gap;
    const ox = (w - gridW) / 2;
    const oy = (h - gridH) / 2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    computeField(Math.floor(frame), field);

    const pad = props.verticalPadding;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const inWave =
          row >= pad && row < pad + WAVE_ROWS
            ? field[(row - pad) * WAVE_COLS + col]!
            : 0;
        const x = ox + col * (cell + gap);
        const y = oy + row * (cell + gap);
        if (inWave === 0) {
          // faint LED-outline for empty cells
          ctx.strokeStyle = 'rgba(148, 163, 171, 0.14)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
        } else {
          const [r, g, b] = PALETTE[inWave]!;
          ctx.fillStyle = `rgb(${r} ${g} ${b})`;
          ctx.fillRect(x, y, cell, cell);
        }
      }
    }
  }

  const { pause, resume } = useRafFn(
    () => {
      frame += props.speed;
      draw();
      const phase = phaseOf(Math.floor(frame));
      if (phase !== lastPhase) {
        lastPhase = phase;
        emit('phase', phase);
      }
    },
    { immediate: false },
  );

  watch([width, height], resize);

  watch([() => props.animate, prefersReduced], () => {
    if (props.animate && !prefersReduced.value) {
      resume();
    } else {
      pause();
      draw(); // static frame
    }
  });

  onMounted(() => {
    resize();
    if (props.animate && !prefersReduced.value) resume();
    else draw();
  });

  onBeforeUnmount(() => {
    pause();
  });
</script>

<template>
  <div ref="root" class="relative size-full" aria-hidden="true">
    <canvas ref="canvasRef" class="absolute inset-0 size-full" />
  </div>
</template>
