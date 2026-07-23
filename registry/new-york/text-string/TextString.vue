<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
  import { useRafFn, useResizeObserver, useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import type {
    TextStringProps,
    TextStringParticle as Particle,
  } from './types';

  const DEFAULT_TEXT =
    'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?"';

  const props = withDefaults(defineProps<TextStringProps>(), {
    text: DEFAULT_TEXT,
    fontFamily: 'Georgia',
    fontSize: 20,
    lineHeight: 28,
    damping: 0.97,
    gravity: 0.15,
    constraintIterations: 12,
    collisionRadius: 7,
    class: '',
  });

  const containerRef = ref<HTMLElement | null>(null);
  const particles = ref<Particle[]>([]);
  const containerWidth = ref(0);
  const containerHeight = ref(0);

  let gravityOn = true;
  const FIXED_DT = 1 / 60;
  const MAX_STEPS = 2;
  const BOUNCE = 0.4;
  let accumulator = 0;
  let lastTime = 0;
  let measureCanvas: HTMLCanvasElement | null = null;
  let measureCtx: CanvasRenderingContext2D | null = null;

  const graphemes = computed(() => [...props.text]);

  function measureChars(): number[] {
    if (!measureCanvas) {
      measureCanvas = document.createElement('canvas');
      measureCtx = measureCanvas.getContext('2d');
    }
    if (!measureCtx) return [];
    measureCtx.font = `${props.fontSize}px ${props.fontFamily}`;
    return graphemes.value.map((ch) => measureCtx!.measureText(ch).width);
  }

  function layoutParticles() {
    if (!containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    containerWidth.value = rect.width;
    containerHeight.value = rect.height;
    const w = rect.width;
    const widths = measureChars();
    if (widths.length === 0) return;

    const chars = graphemes.value;
    const lh = props.lineHeight;
    const pad = 8;

    // Word-wrap into lines
    const lines: { chars: string[]; widths: number[]; indices: number[] }[] =
      [];
    let currentLine: { chars: string[]; widths: number[]; indices: number[] } =
      {
        chars: [],
        widths: [],
        indices: [],
      };
    let lineWidth = 0;

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i]!;
      const cw = widths[i]!;
      if (ch === '\n') {
        lines.push(currentLine);
        currentLine = { chars: [], widths: [], indices: [] };
        lineWidth = 0;
        continue;
      }
      if (lineWidth + cw > w - pad * 2 && currentLine.chars.length > 0) {
        lines.push(currentLine);
        currentLine = { chars: [], widths: [], indices: [] };
        lineWidth = 0;
      }
      currentLine.chars.push(ch);
      currentLine.widths.push(cw);
      currentLine.indices.push(i);
      lineWidth += cw;
    }
    if (currentLine.chars.length > 0) lines.push(currentLine);

    // Snake/zigzag ordering: even lines L→R, odd lines R→L
    const ordered: { char: string; x: number; y: number; width: number }[] = [];
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li]!;
      const lineChars =
        li % 2 === 0
          ? line.chars.map((c, i) => ({ c, w: line.widths[i]! }))
          : line.chars.map((c, i) => ({ c, w: line.widths[i]! })).reverse();

      let cx = pad;
      const cy = pad + li * lh;
      for (const { c, w } of lineChars) {
        ordered.push({ char: c, x: cx, y: cy, width: w });
        cx += w;
      }
    }

    // Create particles, last 6 unlocked
    const count = ordered.length;
    const unlockStart = Math.max(0, count - 6);
    const newParticles: Particle[] = ordered.map((item, i) => ({
      x: item.x,
      y: item.y,
      ox: item.x,
      oy: item.y,
      restX: item.x,
      restY: item.y,
      width: item.width,
      char: item.char,
      locked: i < unlockStart,
      dragging: false,
      pointerId: -1,
    }));
    particles.value = newParticles;
    lastTime = 0;
    accumulator = 0;
  }

  function physicsStep() {
    const pts = particles.value;
    const damp = props.damping;
    const grav = props.gravity;
    const iters = props.constraintIterations;
    const radius = props.collisionRadius;
    const collDist = radius * 2;
    const w = containerWidth.value;
    const h = containerHeight.value;

    // Verlet integration
    for (const p of pts) {
      if (p.locked || p.dragging) continue;
      const vx = (p.x - p.ox) * damp;
      const vy = (p.y - p.oy) * damp + (gravityOn ? grav : 0);
      p.ox = p.x;
      p.oy = p.y;
      p.x += vx;
      p.y += vy;
    }

    // Distance constraints between consecutive letters
    const restMul = 1.2;
    for (let iter = 0; iter < iters; iter++) {
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]!;
        const b = pts[i + 1]!;
        const restDist = ((a.width + b.width) / 2) * restMul;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        if (dist > restDist) {
          const diff = (dist - restDist) / dist;
          const mx = dx * diff * 0.5;
          const my = dy * diff * 0.5;
          if (!a.locked && !a.dragging) {
            a.x += mx;
            a.y += my;
          }
          if (!b.locked && !b.dragging) {
            b.x -= mx;
            b.y -= my;
          }

          // Progressive unravel: unlock upstream when stretched
          if (a.locked && dist > restDist + 1) {
            a.locked = false;
          }
        }
      }

      // Letter-to-letter collision — only check unlocked particles
      const unlocked: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        if (!pts[i]!.locked) unlocked.push(i);
      }
      for (let ui = 0; ui < unlocked.length; ui++) {
        const ai = unlocked[ui]!;
        const a = pts[ai]!;
        for (let uj = ui + 1; uj < unlocked.length; uj++) {
          const bi = unlocked[uj]!;
          if (Math.abs(ai - bi) < 2) continue; // skip adjacent
          const b = pts[bi]!;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
          if (dist < collDist) {
            const overlap = (collDist - dist) / dist;
            const mx = dx * overlap * 0.5;
            const my = dy * overlap * 0.5;
            if (!a.dragging) {
              a.x -= mx;
              a.y -= my;
            }
            if (!b.dragging) {
              b.x += mx;
              b.y += my;
            }
          }
        }
      }

      // Boundary constraints
      for (const p of pts) {
        if (p.locked || p.dragging) continue;
        if (p.x < 0) {
          p.x = 0;
          p.ox = p.x + (p.x - p.ox) * BOUNCE;
        }
        if (p.x > w - p.width) {
          p.x = w - p.width;
          p.ox = p.x + (p.x - p.ox) * BOUNCE;
        }
        if (p.y < 0) {
          p.y = 0;
          p.oy = p.y + (p.y - p.oy) * BOUNCE;
        }
        if (p.y > h - props.fontSize) {
          p.y = h - props.fontSize;
          p.oy = p.y + (p.y - p.oy) * BOUNCE;
        }
      }
    }
  }

  function onFrame(elapsed: { delta: number; timestamp: number }) {
    if (lastTime === 0) {
      lastTime = elapsed.timestamp;
      return;
    }
    const dt = Math.min((elapsed.timestamp - lastTime) / 1000, 0.1);
    lastTime = elapsed.timestamp;
    accumulator += dt;
    let steps = 0;
    while (accumulator >= FIXED_DT && steps < MAX_STEPS) {
      physicsStep();
      accumulator -= FIXED_DT;
      steps++;
    }
    if (steps === MAX_STEPS) accumulator = 0;
  }

  const { pause, resume } = useRafFn(onFrame, { immediate: false });

  function handlePointerDown(e: PointerEvent, index: number) {
    const p = particles.value[index];
    if (!p || p.locked) return;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    p.dragging = true;
    p.pointerId = e.pointerId;
  }

  function handlePointerMove(e: PointerEvent, index: number) {
    const p = particles.value[index];
    if (!p || !p.dragging || p.pointerId !== e.pointerId) return;
    if (!containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    p.x = e.clientX - rect.left;
    p.y = e.clientY - rect.top;
    p.ox = p.x;
    p.oy = p.y;
  }

  function handlePointerUp(e: PointerEvent, index: number) {
    const p = particles.value[index];
    if (!p || p.pointerId !== e.pointerId) return;
    p.dragging = false;
    p.pointerId = -1;
  }

  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'f' || e.key === 'F') {
      gravityOn = !gravityOn;
    }
  });

  useResizeObserver(containerRef, () => {
    pause();
    layoutParticles();
    resume();
  });

  onMounted(() => {
    layoutParticles();
    resume();
  });

  onBeforeUnmount(() => {
    pause();
    measureCanvas = null;
    measureCtx = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn('relative size-full overflow-hidden text-foreground', $props.class)
    "
    :style="{ fontFamily: props.fontFamily, fontSize: `${props.fontSize}px` }"
  >
    <span
      v-for="(p, i) in particles"
      :key="i"
      class="absolute select-none"
      :class="[p.dragging ? 'cursor-grabbing' : 'cursor-grab']"
      :style="{
        transform: `translate(${p.x}px, ${p.y}px)`,
        willChange: 'transform',
        lineHeight: `${props.lineHeight}px`,
      }"
      @pointerdown="handlePointerDown($event, i)"
      @pointermove="handlePointerMove($event, i)"
      @pointerup="handlePointerUp($event, i)"
      @pointercancel="handlePointerUp($event, i)"
      >{{ p.char }}</span
    >
  </div>
</template>
