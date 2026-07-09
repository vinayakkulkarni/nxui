<script setup lang="ts">
  // Thermal banknote card: the engraving is rendered as an ink/paper duotone,
  // and a noisy thermal boundary rises from the bottom remapping the artwork's
  // luminance through a rainbow heat palette (purple ink -> green/yellow/red),
  // with a typewriter caption while the card runs hot. Pixel-reads the image,
  // so the source must be CORS-readable (crossorigin anonymous).
  import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
  import { useRafFn } from '@vueuse/core';
  import type { BanknoteBentoThermalProps } from './types';

  const props = withDefaults(defineProps<BanknoteBentoThermalProps>(), {
    ink: '#14532d',
    paper: '#e7e3d8',
    cycle: 9,
    caption: '',
    focus: '50% 50%',
  });

  const host = ref<HTMLDivElement | null>(null);
  const canvas = ref<HTMLCanvasElement | null>(null);
  const typed = ref('');
  const showType = ref(false);

  const MAXW = 280;

  // Rainbow thermal LUT: cold ink -> hot paper.
  const LUT: [number, number, number][] = [
    [24, 8, 66],
    [86, 20, 158],
    [30, 84, 190],
    [24, 150, 92],
    [150, 194, 48],
    [244, 208, 44],
    [242, 128, 32],
    [220, 50, 38],
  ];

  function lut(t: number): [number, number, number] {
    const x = Math.min(0.999, Math.max(0, t)) * (LUT.length - 1);
    const i = Math.floor(x);
    const f = x - i;
    const a = LUT[i]!;
    const b = LUT[i + 1]!;
    return [
      a[0] + (b[0] - a[0]) * f,
      a[1] + (b[1] - a[1]) * f,
      a[2] + (b[2] - a[2]) * f,
    ];
  }

  function hex(c: string): [number, number, number] {
    const h = c.replace('#', '');
    return [
      Number.parseInt(h.slice(0, 2), 16),
      Number.parseInt(h.slice(2, 4), 16),
      Number.parseInt(h.slice(4, 6), 16),
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
  let out: ImageData | null = null;
  let lum: Float32Array | null = null;
  let W = 0;
  let H = 0;
  let start = 0;
  let ro: ResizeObserver | null = null;

  function coverDraw(img: HTMLImageElement): void {
    const el = host.value;
    if (!el || !canvas.value) return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    W = Math.min(MAXW, Math.max(96, Math.round(rect.width / 3)));
    H = Math.max(96, Math.round((W * rect.height) / rect.width));
    canvas.value.width = W;
    canvas.value.height = H;
    ctx = canvas.value.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const [fx, fy] = props.focus
      .split(' ')
      .map((s) => Number.parseFloat(s) / 100 || 0.5);
    ctx.drawImage(
      img,
      Math.min(0, Math.max(W - dw, (W - dw) * fx!)),
      Math.min(0, Math.max(H - dh, (H - dh) * fy!)),
      dw,
      dh,
    );
    const src = ctx.getImageData(0, 0, W, H);
    lum = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) {
      const k = i * 4;
      lum[i] =
        (0.299 * src.data[k]! +
          0.587 * src.data[k + 1]! +
          0.114 * src.data[k + 2]!) /
        255;
    }
    out = ctx.createImageData(W, H);
  }

  const { pause, resume } = useRafFn(
    () => {
      if (!ctx || !out || !lum) return;
      const t = (performance.now() - start) / 1000;
      const phase = (t % props.cycle) / props.cycle;
      // Rise -> hold hot -> recede.
      const level = Math.min(
        1.12,
        Math.max(0, 1.55 * (0.5 - 0.5 * Math.cos(phase * Math.PI * 2))),
      );

      const inkC = hex(props.ink);
      const papC = hex(props.paper);
      const data = out.data;

      for (let y = 0; y < H; y++) {
        const ny = y / H;
        const fromBottom = 1 - ny;
        for (let x = 0; x < W; x++) {
          const nx = x / W;
          const i = y * W + x;
          const l = lum[i]!;
          const warp =
            (noise(nx * 3.2, ny * 3.2 - t * 0.45) - 0.5) * 0.42 +
            (noise(nx * 9 + 5, ny * 9 - t * 0.9) - 0.5) * 0.18;
          const d = fromBottom - level + warp;
          const k = i * 4;
          if (d < 0) {
            // Hot: luminance through the thermal palette + mottle.
            const mottle = 0.22 * (noise(nx * 6 + 11, ny * 6 - t * 0.6) - 0.5);
            const [r, g, b] = lut(0.2 + l * 0.72 + mottle);
            data[k] = r;
            data[k + 1] = g;
            data[k + 2] = b;
          } else if (d < 0.02) {
            // White-hot rim at the boundary.
            data[k] = 252;
            data[k + 1] = 244;
            data[k + 2] = 200;
          } else {
            // Cold: ink/paper duotone of the engraving.
            data[k] = inkC[0] + (papC[0] - inkC[0]) * l;
            data[k + 1] = inkC[1] + (papC[1] - inkC[1]) * l;
            data[k + 2] = inkC[2] + (papC[2] - inkC[2]) * l;
          }
          data[k + 3] = 255;
        }
      }
      ctx.putImageData(out, 0, 0);

      // Typewriter caption while hot.
      if (props.caption) {
        const p = Math.min(1, Math.max(0, (level - 0.5) / 0.35));
        showType.value = p > 0;
        typed.value = props.caption.slice(
          0,
          Math.round(p * props.caption.length),
        );
      }
    },
    { immediate: false },
  );

  onMounted(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      coverDraw(img);
      start = performance.now();
      resume();
      ro = new ResizeObserver(() => coverDraw(img));
      if (host.value) ro.observe(host.value);
    };
    img.src = props.src;
  });

  watch(
    () => props.src,
    (s) => {
      pause();
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        coverDraw(img);
        start = performance.now();
        resume();
      };
      img.src = s;
    },
  );

  onBeforeUnmount(() => {
    pause();
    ro?.disconnect();
  });
</script>

<template>
  <div ref="host" class="absolute inset-0">
    <canvas ref="canvas" class="size-full" aria-hidden="true" />
    <span
      v-if="caption && showType"
      class="absolute top-4 left-4 max-w-[85%] font-mono text-sm/relaxed text-lime-200 drop-shadow-[0_0_6px_rgba(120,220,80,0.55)] sm:top-5 sm:left-5 sm:text-base/relaxed"
    >
      {{ typed }}<span class="animate-pulse">▌</span>
    </span>
  </div>
</template>
