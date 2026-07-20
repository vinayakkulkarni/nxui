<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { useElementSize, useMediaQuery, useRafFn } from '@vueuse/core';
  import {
    DEFAULT_SIGNATURE,
    EFFECT_LABELS,
    EFFECT_ORDER,
    particleAlpha,
    spawnParticles,
    stepParticle,
  } from './particles';
  import type {
    SignatureEraserEffect,
    SignatureEraserPoint,
    SignatureEraserStroke,
    SignatureEraserTool,
  } from './types';
  import type { Particle } from './particles';

  const props = withDefaults(
    defineProps<{
      signature?: SignatureEraserStroke[];
      effect?: SignatureEraserEffect;
      penWidth?: number;
      eraserRadius?: number;
      particleDensity?: number;
      autoRestore?: boolean;
      autoRestoreDelay?: number;
    }>(),
    {
      signature: () => DEFAULT_SIGNATURE,
      effect: 'thanos-snap',
      penWidth: 3,
      eraserRadius: 18,
      particleDensity: 1,
      autoRestore: true,
      autoRestoreDelay: 2600,
    },
  );

  const emit = defineEmits<{
    (e: 'cleared', effect: SignatureEraserEffect): void;
    (e: 'restored'): void;
    (e: 'change', strokeCount: number): void;
  }>();

  const root = ref<HTMLElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  let inkCanvas: HTMLCanvasElement | null = null;

  const { width, height } = useElementSize(root);
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)');

  const tool = ref<SignatureEraserTool>('pen');
  const effectIndex = ref(EFFECT_ORDER.indexOf(props.effect));
  const cleared = ref(false);
  const restoring = ref(false);
  const strokeCount = ref(0);

  const activeEffect = computed(
    () => EFFECT_ORDER[((effectIndex.value % 5) + 5) % 5]!,
  );
  const effectLabel = computed(() => EFFECT_LABELS[activeEffect.value]);

  let ctx: CanvasRenderingContext2D | null = null;
  let inkCtx: CanvasRenderingContext2D | null = null;
  let dpr = 1;
  let drawing = false;
  let currentStroke: SignatureEraserPoint[] = [];
  let particles: Particle[] = [];
  let frame = 0;
  let restoreTimer: ReturnType<typeof setTimeout> | null = null;
  const rewind = { active: false, t: 0, duration: 110 };

  const DESIGN_W = 560;
  const DESIGN_H = 320;

  function inkColor(): string {
    const element = root.value;
    if (!element) return 'currentColor';
    return getComputedStyle(element).getPropertyValue('--se-ink').trim();
  }

  function scaleStroke(stroke: SignatureEraserStroke): SignatureEraserStroke {
    const sx = width.value / DESIGN_W;
    const sy = Math.min(height.value / DESIGN_H, sx * 1.25);
    const offsetY = (height.value - DESIGN_H * sy) / 2;
    return {
      points: stroke.points.map((p) => ({
        x: p.x * sx,
        y: p.y * sy + offsetY,
      })),
    };
  }

  function drawStrokePath(
    target: CanvasRenderingContext2D,
    stroke: SignatureEraserStroke,
    size: number,
    color: string,
  ): void {
    const pts = stroke.points;
    if (pts.length === 0) return;
    target.strokeStyle = color;
    target.lineWidth = size;
    target.lineCap = 'round';
    target.lineJoin = 'round';
    target.beginPath();
    if (pts.length === 1) {
      target.moveTo(pts[0]!.x, pts[0]!.y);
      target.lineTo(pts[0]!.x + 0.01, pts[0]!.y + 0.01);
    } else {
      target.moveTo(pts[0]!.x, pts[0]!.y);
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i]!;
        target.lineTo(p.x, p.y);
      }
    }
    target.stroke();
  }

  function rebuildInk(): void {
    if (!inkCtx) return;
    inkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    inkCtx.clearRect(0, 0, width.value, height.value);
    for (const s of props.signature) {
      drawStrokePath(inkCtx, scaleStroke(s), props.penWidth, inkColor());
    }
    strokeCount.value = props.signature.length;
  }

  function paintInk(): void {
    if (!ctx || !inkCanvas) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width.value, height.value);
    ctx.drawImage(inkCanvas, 0, 0, width.value, height.value);
  }

  function resize(): void {
    const canvas = canvasRef.value;
    if (!canvas || width.value === 0 || height.value === 0) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width.value * dpr);
    canvas.height = Math.round(height.value * dpr);
    if (!inkCanvas) return;
    inkCanvas.width = canvas.width;
    inkCanvas.height = canvas.height;
    ctx = canvas.getContext('2d');
    inkCtx = inkCanvas.getContext('2d');
    rebuildInk();
    paintInk();
  }

  function pointerPos(
    ev: PointerEvent,
    canvas: HTMLCanvasElement,
  ): SignatureEraserPoint {
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }

  function onPointerDown(ev: PointerEvent): void {
    if (cleared.value || restoring.value) return;
    const canvas = canvasRef.value;
    if (!canvas) return;
    drawing = true;
    canvas.setPointerCapture(ev.pointerId);
    const pos = pointerPos(ev, canvas);
    if (tool.value === 'pen') {
      currentStroke = [pos];
    } else {
      eraseAt(pos);
    }
  }

  function onPointerMove(ev: PointerEvent): void {
    if (!drawing || cleared.value || restoring.value || !inkCtx) return;
    const canvas = canvasRef.value;
    if (!canvas) return;
    const pos = pointerPos(ev, canvas);
    if (tool.value === 'pen') {
      currentStroke.push(pos);
      drawStrokePath(
        inkCtx,
        { points: currentStroke.slice(-2) },
        props.penWidth,
        inkColor(),
      );
      paintInk();
    } else {
      eraseAt(pos);
    }
  }

  function onPointerUp(): void {
    if (!drawing) return;
    drawing = false;
    if (tool.value === 'pen' && currentStroke.length > 1) {
      strokeCount.value += 1;
      emit('change', strokeCount.value);
    }
    currentStroke = [];
  }

  function eraseAt(pos: SignatureEraserPoint): void {
    if (!inkCtx) return;
    inkCtx.save();
    inkCtx.setTransform(1, 0, 0, 1, 0, 0);
    inkCtx.globalCompositeOperation = 'destination-out';
    inkCtx.beginPath();
    inkCtx.arc(
      pos.x * dpr,
      pos.y * dpr,
      props.eraserRadius * dpr,
      0,
      Math.PI * 2,
    );
    inkCtx.fill();
    inkCtx.restore();
    paintInk();
  }

  function collectInkSamples(): SignatureEraserPoint[] {
    if (!inkCtx) return [];
    if (!inkCanvas) return [];
    const w = inkCanvas.width;
    const h = inkCanvas.height;
    const data = inkCtx.getImageData(0, 0, w, h).data;
    const step = Math.max(2, Math.round(3 * dpr));
    const samples: SignatureEraserPoint[] = [];
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (data[(y * w + x) * 4 + 3]! > 40) {
          samples.push({ x: x / dpr, y: y / dpr });
        }
      }
    }
    return samples;
  }

  function clearSignature(): void {
    if (cleared.value || restoring.value) return;
    const samples = collectInkSamples();
    cleared.value = true;
    emit('cleared', activeEffect.value);

    if (prefersReduced.value || samples.length === 0) {
      if (inkCtx) {
        inkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        inkCtx.clearRect(0, 0, width.value, height.value);
      }
      scheduleRestore();
      return;
    }

    const density = Math.max(0.25, props.particleDensity);
    const sampled = samples.filter((_, i) => i % Math.ceil(1 / density) === 0);

    if (activeEffect.value === 'rewind') {
      rewind.active = true;
      rewind.t = 0;
      particles = sampled.map((p) => ({
        x: p.x + (Math.random() - 0.5) * width.value * 0.8,
        y: p.y + (Math.random() - 0.5) * height.value * 0.8 - 80,
        vx: 0,
        vy: 0,
        ox: p.x,
        oy: p.y,
        r: 0.9 + Math.random() * 1.4,
        life: 0,
        maxLife: 1,
        delay: Math.random() * 30,
      }));
      if (inkCtx) {
        inkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        inkCtx.clearRect(0, 0, width.value, height.value);
      }
      resume();
    } else {
      particles = spawnParticles(
        sampled,
        activeEffect.value,
        width.value,
        height.value,
      );
      if (inkCtx) {
        inkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        inkCtx.clearRect(0, 0, width.value, height.value);
      }
      scheduleRestore();
      resume();
    }
  }

  function scheduleRestore(): void {
    if (!props.autoRestore) return;
    if (restoreTimer) clearTimeout(restoreTimer);
    restoreTimer = setTimeout(() => restore(), props.autoRestoreDelay);
  }

  function restore(): void {
    if (restoreTimer) {
      clearTimeout(restoreTimer);
      restoreTimer = null;
    }
    particles = [];
    rewind.active = false;
    restoring.value = false;
    rebuildInk();
    paintInk();
    cleared.value = false;
    emit('restored');
  }

  function cycleEffect(): void {
    effectIndex.value = (effectIndex.value + 1) % EFFECT_ORDER.length;
  }

  const { pause, resume } = useRafFn(
    () => {
      const canvas = canvasRef.value;
      if (!canvas || !ctx || width.value === 0) return;
      frame += 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width.value, height.value);
      if (inkCanvas) ctx.drawImage(inkCanvas, 0, 0, width.value, height.value);

      if (particles.length === 0 && !rewind.active) {
        pause();
        return;
      }

      const color = inkColor();
      ctx.fillStyle = color;

      if (rewind.active) {
        rewind.t += 1;
        const eased =
          1 - Math.pow(1 - Math.min(1, rewind.t / rewind.duration), 3);
        let landed = 0;
        for (const p of particles) {
          if (frame < p.delay) {
            landed += 1;
            continue;
          }
          const t = Math.min(1, Math.max(0, eased * 1.15 - 0.15));
          const x = p.x + (p.ox - p.x) * t;
          const y = p.y + (p.oy - p.y) * t;
          const alpha = 0.35 + 0.65 * t;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(x, y, p.r, 0, Math.PI * 2);
          ctx.fill();
          if (t >= 1) landed += 1;
        }
        ctx.globalAlpha = 1;
        if (landed === particles.length && rewind.t > rewind.duration) {
          restore();
          resume();
        }
        return;
      }

      particles = particles.filter((p) =>
        stepParticle(p, activeEffect.value, width.value, height.value, frame),
      );
      for (const p of particles) {
        const a = particleAlpha(p, frame);
        if (a <= 0) continue;
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (particles.length === 0) pause();
    },
    { immediate: false },
  );

  watch([width, height], resize);
  watch(
    () => props.signature,
    () => {
      if (!cleared.value) rebuildInk();
    },
  );
  watch(
    () => props.effect,
    (val) => {
      effectIndex.value = EFFECT_ORDER.indexOf(val);
    },
  );

  onMounted(() => {
    inkCanvas = document.createElement('canvas');
    resize();
  });

  onBeforeUnmount(() => {
    if (restoreTimer) clearTimeout(restoreTimer);
    pause();
  });
</script>

<template>
  <div
    ref="root"
    class="signature-eraser relative size-full touch-none select-none"
    role="application"
    aria-label="Signature canvas"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 size-full"
      :class="tool === 'pen' ? 'cursor-crosshair' : 'cursor-cell'"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
    />

    <div
      class="absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-border/50 bg-background/80 p-1 backdrop-blur-sm"
    >
      <button
        type="button"
        class="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors sm:h-7"
        :class="
          tool === 'pen'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground'
        "
        :aria-pressed="tool === 'pen'"
        @click="tool = 'pen'"
      >
        Pen
      </button>
      <button
        type="button"
        class="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors sm:h-7"
        :class="
          tool === 'eraser'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground'
        "
        :aria-pressed="tool === 'eraser'"
        @click="tool = 'eraser'"
      >
        Eraser
      </button>
    </div>

    <div class="absolute top-3 right-3 flex items-center gap-1.5">
      <button
        type="button"
        class="flex h-9 items-center gap-1.5 rounded-full border border-border/50 bg-background/80 px-2.5 font-mono text-xs text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground sm:h-7"
        title="Cycle erase effect"
        @click="cycleEffect"
      >
        <span aria-hidden="true">↻</span>
        {{ effectLabel }}
      </button>
      <button
        type="button"
        class="flex h-9 items-center gap-1.5 rounded-full bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-40 sm:h-7"
        :disabled="cleared"
        @click="clearSignature"
      >
        Clear
      </button>
    </div>

    <p
      v-if="cleared && !restoring"
      class="pointer-events-none absolute inset-x-0 bottom-4 text-center font-mono text-xs text-foreground/70"
    >
      <template v-if="activeEffect === 'rewind'">reassembling…</template>
      <template v-else>signature erased · {{ effectLabel }}</template>
    </p>
  </div>
</template>

<style scoped>
  .signature-eraser {
    --se-ink: oklch(0.21 0 0);
  }
  :global(.dark) .signature-eraser,
  :global(.dark .signature-eraser) {
    --se-ink: oklch(0.96 0 0);
  }
</style>
