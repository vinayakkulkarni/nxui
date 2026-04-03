<script setup lang="ts">
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import type {
    PixelCanvasPixel,
    PixelCanvasVariant,
  } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      gap?: number;
      speed?: number;
      colors?: string[];
      noFocus?: boolean;
      variant?: PixelCanvasVariant;
      class?: string;
    }>(),
    {
      gap: 6,
      speed: 0.02,
      colors: () => ['#e879f9', '#a78bfa', '#38bdf8', '#22d3ee'],
      noFocus: false,
      variant: 'default',
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement>();
  const canvasRef = ref<HTMLCanvasElement>();
  const mouse = reactive({ x: -1000, y: -1000 });
  let pixels: PixelCanvasPixel[][] = [];
  let cols = 0;
  let rows = 0;
  let frameId = 0;
  let lastTime = 0;

  function hexToRgb(hex: string) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m
      ? {
          r: Number.parseInt(m[1], 16),
          g: Number.parseInt(m[2], 16),
          b: Number.parseInt(m[3], 16),
        }
      : null;
  }

  function lerpColor(a: string, b: string, t: number) {
    const c1 = hexToRgb(a);
    const c2 = hexToRgb(b);
    if (!c1 || !c2) return a;
    return `rgb(${Math.round(c1.r + (c2.r - c1.r) * t)},${Math.round(c1.g + (c2.g - c1.g) * t)},${Math.round(c1.b + (c2.b - c1.b) * t)})`;
  }

  function getColor(intensity: number, phase: number) {
    const c = props.colors;
    if (c.length === 0) return '#ffffff';
    if (c.length === 1) return c[0];
    const t = (phase + intensity) % 1;
    const idx = Math.floor(t * (c.length - 1));
    const next = Math.min(idx + 1, c.length - 1);
    return lerpColor(c[idx], c[next], (t * (c.length - 1)) % 1);
  }

  function initPixels() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (ctx) ctx.scale(dpr, dpr);
    const sz = Math.max(props.gap, 4);
    cols = Math.ceil(rect.width / sz);
    rows = Math.ceil(rect.height / sz);
    const prev = pixels;
    pixels = [];
    for (let i = 0; i < cols; i++) {
      const row: PixelCanvasPixel[] = [];
      for (let j = 0; j < rows; j++) {
        const old = prev[i]?.[j];
        row.push({
          x: i * sz,
          y: j * sz,
          size: sz - 1,
          intensity: old?.intensity ?? 0,
          targetIntensity: 0,
          colorPhase: Math.random(),
        });
      }
      pixels.push(row);
    }
  }

  function draw(ts: number) {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!canvas || !container) {
      frameId = requestAnimationFrame(draw);
      return;
    }
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    const dt = ts - lastTime;
    lastTime = ts;
    const rect = container.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    const radius = props.variant === 'glow' ? 120 : 80;
    const glowPasses = props.variant === 'glow' ? 2 : 1;
    for (let i = 0; i < cols; i++) {
      const col = pixels[i];
      if (!col) continue;
      for (let j = 0; j < rows; j++) {
        const p = col[j];
        if (!p) continue;
        const cx = p.x + p.size / 2;
        const cy = p.y + p.size / 2;
        const d = Math.sqrt((mouse.x - cx) ** 2 + (mouse.y - cy) ** 2);
        p.targetIntensity = d < radius ? (1 - d / radius) ** 1.5 : 0;
        const spd = p.targetIntensity > p.intensity ? 0.3 : props.speed;
        p.intensity += (p.targetIntensity - p.intensity) * spd;
        p.colorPhase = (p.colorPhase + 0.001 * (dt / 16)) % 1;
        if (p.intensity > 0.01) {
          const color = getColor(p.intensity, p.colorPhase);
          if (props.variant === 'glow' && p.intensity > 0.2) {
            for (let g = glowPasses; g > 0; g--) {
              const gs = p.size + g * 4;
              const go = (gs - p.size) / 2;
              ctx.globalAlpha = (p.intensity * 0.15) / g;
              ctx.fillStyle = color;
              ctx.fillRect(p.x - go, p.y - go, gs, gs);
            }
          }
          ctx.globalAlpha = p.intensity * 0.9;
          ctx.fillStyle = color;
          if (props.variant === 'trail') {
            const cr = p.size * 0.3;
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.size, p.size, cr);
            ctx.fill();
          } else {
            ctx.fillRect(p.x, p.y, p.size, p.size);
          }
        }
      }
    }
    ctx.globalAlpha = 1;
    frameId = requestAnimationFrame(draw);
  }

  useResizeObserver(containerRef, () => initPixels());

  onMounted(() => {
    initPixels();
    lastTime = performance.now();
    frameId = requestAnimationFrame(draw);
    if (!props.noFocus && containerRef.value) {
      const el = containerRef.value;
      useEventListener(el, 'mousemove', (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        mouse.x = e.clientX - r.left;
        mouse.y = e.clientY - r.top;
      });
      useEventListener(el, 'mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
      });
      useEventListener(
        el,
        'touchmove',
        (e: TouchEvent) => {
          const t = e.touches[0];
          if (t) {
            const r = el.getBoundingClientRect();
            mouse.x = t.clientX - r.left;
            mouse.y = t.clientY - r.top;
          }
        },
        { passive: true },
      );
      useEventListener(el, 'touchend', () => {
        mouse.x = -1000;
        mouse.y = -1000;
      });
    }
  });

  onBeforeUnmount(() => cancelAnimationFrame(frameId));
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn(
        'relative cursor-crosshair overflow-hidden bg-neutral-950',
        props.class,
      )
    "
  >
    <canvas ref="canvasRef" class="block size-full"></canvas>
    <div class="pointer-events-none absolute inset-0 z-10">
      <slot></slot>
    </div>
  </div>
</template>
