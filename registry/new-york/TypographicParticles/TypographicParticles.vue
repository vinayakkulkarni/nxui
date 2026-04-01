<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
  import { useRafFn, useResizeObserver } from '@vueuse/core';
  import type { TypographicParticlesProps } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<TypographicParticlesProps>(), {
    text: 'NXUI',
    cols: 50,
    rows: 28,
    fontSize: 14,
    particleCount: 120,
    class: undefined,
  });

  // --- constants ---
  const SPRITE_R = 14;
  const ATTRACTOR_FORCE_1 = 0.22;
  const ATTRACTOR_FORCE_2 = 0.18;
  const FIELD_DECAY = 0.82;
  const FRICTION = 0.96;

  // --- refs ---
  const containerRef = ref<HTMLElement | null>(null);
  const sourceCanvasRef = ref<HTMLCanvasElement | null>(null);
  const propCanvasRef = ref<HTMLCanvasElement | null>(null);
  const monoCanvasRef = ref<HTMLCanvasElement | null>(null);

  // --- internal state ---
  let simW = 0;
  let simH = 0;
  let fieldW = 0;
  let fieldH = 0;
  let field: Float32Array | null = null;
  let particles: Float64Array | null = null; // x,y,vx,vy per particle
  let charPalette: Array<{
    ch: string;
    brightness: number;
    width: number;
    font: string;
  }> = [];
  let measureCtx: CanvasRenderingContext2D | null = null;
  let spriteCanvas: HTMLCanvasElement | null = null;
  let spriteCtx: CanvasRenderingContext2D | null = null;

  const gridCols = computed(() => props.cols);
  const gridRows = computed(() => props.rows);

  // --- charset & palette building ---
  const PRINTABLE_ASCII =
    ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

  const FONT_VARIANTS: Array<{ weight: string; style: string }> = [
    { weight: 'normal', style: 'normal' },
    { weight: 'bold', style: 'normal' },
    { weight: '900', style: 'normal' },
    { weight: 'normal', style: 'italic' },
    { weight: 'bold', style: 'italic' },
    { weight: '900', style: 'italic' },
  ];

  const ALPHA_LEVELS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

  function buildCharPalette(fs: number): void {
    charPalette = [];

    const canvas = document.createElement('canvas');
    const size = Math.ceil(fs * 3);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    measureCtx = ctx;

    for (const variant of FONT_VARIANTS) {
      const fontStr = `${variant.style} ${variant.weight} ${fs}px Georgia, serif`;

      for (const alpha of ALPHA_LEVELS) {
        for (const ch of PRINTABLE_ASCII) {
          // measure width
          ctx.font = fontStr;
          const metrics = ctx.measureText(ch);
          const charWidth = metrics.width;

          // measure brightness: render char, sample pixels
          ctx.clearRect(0, 0, size, size);
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.font = fontStr;
          ctx.textBaseline = 'top';
          ctx.fillText(ch, 2, 2);

          const imgData = ctx.getImageData(0, 0, size, size);
          let totalBrightness = 0;
          const pixels = imgData.data;
          for (let i = 0; i < pixels.length; i += 4) {
            totalBrightness += pixels[i]! / 255; // red channel (white text)
          }
          const brightness = totalBrightness / (size * size);

          charPalette.push({
            ch,
            brightness,
            width: charWidth,
            font: fontStr,
          });
        }
      }
    }

    // Sort by brightness for faster lookup
    charPalette.sort((a, b) => a.brightness - b.brightness);
  }

  function findBestChar(
    targetBrightness: number,
    targetWidth: number,
  ): (typeof charPalette)[0] {
    let bestIdx = 0;
    let bestScore = Infinity;

    for (let i = 0; i < charPalette.length; i++) {
      const entry = charPalette[i]!;
      const bErr = Math.abs(entry.brightness - targetBrightness);
      const wErr = Math.abs(entry.width - targetWidth) / targetWidth;
      const score = bErr * 2.5 + wErr;
      if (score < bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    return charPalette[bestIdx]!;
  }

  // --- particle sim ---
  function initParticles(count: number, w: number, h: number): void {
    particles = new Float64Array(count * 4);
    for (let i = 0; i < count; i++) {
      const off = i * 4;
      particles[off] = Math.random() * w; // x
      particles[off + 1] = Math.random() * h; // y
      particles[off + 2] = (Math.random() - 0.5) * 2; // vx
      particles[off + 3] = (Math.random() - 0.5) * 2; // vy
    }
  }

  function updateParticles(now: number): void {
    if (!particles || !field) return;

    const count = props.particleCount;
    const w = simW;
    const h = simH;

    // Lissajous attractors
    const ax1 = Math.cos(now * 0.0007) * w * 0.25 + w / 2;
    const ay1 = Math.sin(now * 0.0011) * h * 0.3 + h / 2;
    const ax2 = Math.cos(now * 0.0013 + 2) * w * 0.3 + w / 2;
    const ay2 = Math.sin(now * 0.0009 + 1) * h * 0.25 + h / 2;

    for (let i = 0; i < count; i++) {
      const off = i * 4;
      let x = particles[off]!;
      let y = particles[off + 1]!;
      let vx = particles[off + 2]!;
      let vy = particles[off + 3]!;

      // Attract to attractor 1
      let dx = ax1 - x;
      let dy = ay1 - y;
      let dist = Math.sqrt(dx * dx + dy * dy) + 1;
      vx += (dx / dist) * ATTRACTOR_FORCE_1;
      vy += (dy / dist) * ATTRACTOR_FORCE_1;

      // Attract to attractor 2
      dx = ax2 - x;
      dy = ay2 - y;
      dist = Math.sqrt(dx * dx + dy * dy) + 1;
      vx += (dx / dist) * ATTRACTOR_FORCE_2;
      vy += (dy / dist) * ATTRACTOR_FORCE_2;

      // Friction
      vx *= FRICTION;
      vy *= FRICTION;

      // Update position
      x += vx;
      y += vy;

      // Wrap edges
      if (x < 0) x += w;
      if (x >= w) x -= w;
      if (y < 0) y += h;
      if (y >= h) y -= h;

      particles[off] = x;
      particles[off + 1] = y;
      particles[off + 2] = vx;
      particles[off + 3] = vy;

      // Stamp radial gradient into brightness field
      stampParticle(x, y);
    }
  }

  function stampParticle(px: number, py: number): void {
    if (!field) return;
    const cellW = simW / fieldW;
    const cellH = simH / fieldH;
    const cx = px / cellW;
    const cy = py / cellH;
    const r = SPRITE_R / Math.max(cellW, cellH);

    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(fieldW - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(fieldH - 1, Math.ceil(cy + r));

    for (let gy = y0; gy <= y1; gy++) {
      for (let gx = x0; gx <= x1; gx++) {
        const dx = gx - cx;
        const dy = gy - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < r) {
          const intensity = 1 - d / r;
          const idx = gy * fieldW + gx;
          field[idx] = Math.min(1, field[idx]! + intensity * 0.4);
        }
      }
    }
  }

  function decayField(): void {
    if (!field) return;
    for (let i = 0; i < field.length; i++) {
      field[i]! *= FIELD_DECAY;
    }
  }

  // --- rendering ---
  function renderSourceCanvas(): void {
    const canvas = sourceCanvasRef.value;
    if (!canvas || !field) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cellW = canvas.width / fieldW;
    const cellH = canvas.height / fieldH;

    for (let y = 0; y < fieldH; y++) {
      for (let x = 0; x < fieldW; x++) {
        const v = field[y * fieldW + x]!;
        if (v > 0.01) {
          const alpha = Math.min(1, v);
          ctx.fillStyle = `rgba(196, 163, 90, ${alpha})`;
          ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
        }
      }
    }
  }

  function renderProportionalASCII(): void {
    const canvas = propCanvasRef.value;
    if (!canvas || !field) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fs = props.fontSize;
    ctx.fillStyle = '#06060a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cellW = canvas.width / fieldW;
    const cellH = canvas.height / fieldH;
    const targetCharW = cellW * 0.8;

    for (let y = 0; y < fieldH; y++) {
      for (let x = 0; x < fieldW; x++) {
        const brightness = field[y * fieldW + x]!;
        if (brightness < 0.005) continue;

        const best = findBestChar(brightness, targetCharW);
        ctx.fillStyle = `rgba(196, 163, 90, ${Math.min(1, brightness * 2)})`;
        ctx.font = best.font;
        ctx.textBaseline = 'top';
        ctx.fillText(best.ch, x * cellW, y * cellH);
      }
    }
  }

  function renderMonospaceASCII(): void {
    const canvas = monoCanvasRef.value;
    if (!canvas || !field) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fs = props.fontSize;
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cellW = canvas.width / fieldW;
    const cellH = canvas.height / fieldH;
    const monoFont = `${fs}px "Courier New", monospace`;
    ctx.font = monoFont;
    ctx.textBaseline = 'top';

    // Simple ASCII ramp for monospace
    const ramp = ' .:-=+*#%@';

    for (let y = 0; y < fieldH; y++) {
      for (let x = 0; x < fieldW; x++) {
        const brightness = field[y * fieldW + x]!;
        if (brightness < 0.005) continue;

        const idx = Math.min(
          ramp.length - 1,
          Math.floor(brightness * ramp.length),
        );
        const ch = ramp[idx]!;
        ctx.fillStyle = `rgba(196, 163, 90, ${Math.min(1, brightness * 2)})`;
        ctx.fillText(ch, x * cellW, y * cellH);
      }
    }
  }

  // --- sprite canvas for particle rendering ---
  function initSpriteCanvas(): void {
    spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = SPRITE_R * 2;
    spriteCanvas.height = SPRITE_R * 2;
    spriteCtx = spriteCanvas.getContext('2d');
    if (!spriteCtx) return;

    const grad = spriteCtx.createRadialGradient(
      SPRITE_R,
      SPRITE_R,
      0,
      SPRITE_R,
      SPRITE_R,
      SPRITE_R,
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    spriteCtx.fillStyle = grad;
    spriteCtx.fillRect(0, 0, SPRITE_R * 2, SPRITE_R * 2);
  }

  // --- setup & resize ---
  function setupSimulation(): void {
    const container = containerRef.value;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    if (w <= 0 || h <= 0) return;

    // Each panel gets 1/3 of width
    const panelW = Math.floor(w / 3);
    const panelH = h;

    simW = panelW;
    simH = panelH;
    fieldW = gridCols.value;
    fieldH = gridRows.value;
    field = new Float32Array(fieldW * fieldH);

    // Size canvases
    const dpr = Math.min(window.devicePixelRatio, 2);
    for (const canvas of [
      sourceCanvasRef.value,
      propCanvasRef.value,
      monoCanvasRef.value,
    ]) {
      if (canvas) {
        canvas.width = panelW * dpr;
        canvas.height = panelH * dpr;
        canvas.style.width = `${panelW}px`;
        canvas.style.height = `${panelH}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
      }
    }

    initParticles(props.particleCount, simW, simH);
    initSpriteCanvas();
    buildCharPalette(props.fontSize);
  }

  // --- animation loop ---
  const { pause, resume } = useRafFn(
    () => {
      const now = performance.now();
      decayField();
      updateParticles(now);
      renderSourceCanvas();
      renderProportionalASCII();
      renderMonospaceASCII();
    },
    { immediate: false },
  );

  useResizeObserver(containerRef, () => {
    pause();
    setupSimulation();
    resume();
  });

  onMounted(() => {
    setupSimulation();
    resume();
  });

  onBeforeUnmount(() => {
    pause();
    field = null;
    particles = null;
    charPalette = [];
    measureCtx = null;
    spriteCanvas = null;
    spriteCtx = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn(
        'typographic-particles relative flex overflow-hidden rounded-lg',
        $props.class,
      )
    "
  >
    <!-- Panel 1: Source (particle simulation) -->
    <div class="art-panel relative flex-1">
      <div class="panel-label">Source</div>
      <canvas ref="sourceCanvasRef" class="block size-full" />
    </div>

    <!-- Panel 2: Proportional ASCII -->
    <div class="art-panel relative flex-1">
      <div class="panel-label">Proportional</div>
      <canvas ref="propCanvasRef" class="block size-full" />
    </div>

    <!-- Panel 3: Monospace ASCII -->
    <div class="art-panel relative flex-1">
      <div class="panel-label">Monospace</div>
      <canvas ref="monoCanvasRef" class="block size-full" />
    </div>
  </div>
</template>

<style scoped>
  .typographic-particles {
    background: linear-gradient(135deg, #0a0a12, #06060a);
  }

  .art-panel {
    box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.5);
  }

  .panel-label {
    position: absolute;
    top: 8px;
    left: 10px;
    z-index: 10;
    color: rgba(196, 163, 90, 0.5);
    font-family: 'Courier New', monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    pointer-events: none;
  }
</style>
