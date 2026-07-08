<script setup lang="ts">
  // Ironbow thermal overlay: a procedural heat field rises and falls over
  // the engraving. Rendered on a small offscreen-scale canvas with
  // value-noise blobs mapped through an ironbow palette, then blended over
  // the grayscale image — no pixel reads, so any image origin works.
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useRafFn } from '@vueuse/core';
  import type { BanknoteBentoThermalProps } from './types';

  const props = withDefaults(defineProps<BanknoteBentoThermalProps>(), {
    tint: '#166534',
    cycle: 8,
  });

  const canvas = ref<HTMLCanvasElement | null>(null);

  const W = 72;
  const H = 96;

  // Ironbow palette stops: black -> purple -> red -> orange -> yellow -> white
  const STOPS: [number, number, number][] = [
    [8, 4, 40],
    [92, 8, 132],
    [212, 40, 60],
    [244, 124, 32],
    [252, 220, 64],
    [252, 252, 208],
  ];

  function ironbow(t: number): [number, number, number] {
    const x = Math.min(0.999, Math.max(0, t)) * (STOPS.length - 1);
    const i = Math.floor(x);
    const f = x - i;
    const a = STOPS[i]!;
    const b = STOPS[i + 1]!;
    return [
      a[0] + (b[0] - a[0]) * f,
      a[1] + (b[1] - a[1]) * f,
      a[2] + (b[2] - a[2]) * f,
    ];
  }

  function hash(x: number, y: number): number {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  function noise(x: number, y: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  let ctx: CanvasRenderingContext2D | null = null;
  let image: ImageData | null = null;
  let start = 0;

  const { pause, resume } = useRafFn(
    () => {
      if (!ctx || !image) return;
      const t = (performance.now() - start) / 1000;
      // Heat level breathes: rises to cover most of the card, then recedes.
      const phase = (t % props.cycle) / props.cycle;
      const level = 0.28 + 0.5 * (0.5 - 0.5 * Math.cos(phase * Math.PI * 2));
      const data = image.data;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const nx = x / W;
          const ny = y / H;
          const n =
            0.62 * noise(nx * 5, ny * 5 - t * 0.35) +
            0.38 * noise(nx * 11 + 7, ny * 11 - t * 0.7);
          // Heat concentrates at the bottom and eats upward with the level.
          const heat = n * 0.55 + (1 - ny) * -0.25 + level - 0.25;
          const k = (y * W + x) * 4;
          const clamped = Math.min(1, Math.max(0, heat));
          const [r, g, b] = ironbow(clamped);
          data[k] = r;
          data[k + 1] = g;
          data[k + 2] = b;
          data[k + 3] = clamped > 0.18 ? 235 : clamped * 5.5 * 235;
        }
      }
      ctx.putImageData(image, 0, 0);
    },
    { immediate: false },
  );

  onMounted(() => {
    const el = canvas.value;
    if (!el) return;
    el.width = W;
    el.height = H;
    ctx = el.getContext('2d');
    if (!ctx) return;
    image = ctx.createImageData(W, H);
    start = performance.now();
    resume();
  });

  onBeforeUnmount(() => pause());
</script>

<template>
  <div class="absolute inset-0">
    <img
      :src="src"
      alt=""
      class="size-full object-cover grayscale"
      draggable="false"
    />
    <div
      class="absolute inset-0 mix-blend-color"
      :style="{ background: tint }"
    />
    <canvas
      ref="canvas"
      class="absolute inset-0 size-full mix-blend-hard-light"
      style="image-rendering: auto"
      aria-hidden="true"
    />
  </div>
</template>
