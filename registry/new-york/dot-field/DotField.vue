<script setup lang="ts">
  import {
    ref,
    reactive,
    onMounted,
    onBeforeUnmount,
    watch,
    computed,
    useId,
  } from 'vue';
  import {
    useResizeObserver,
    useEventListener,
    useIntervalFn,
  } from '@vueuse/core';
  import type { DotFieldProps, DotFieldDot } from './types';
  import { cn } from '~/lib/utils';

  const TWO_PI = Math.PI * 2;

  const props = withDefaults(defineProps<DotFieldProps>(), {
    dotRadius: 1.5,
    dotSpacing: 14,
    cursorRadius: 500,
    cursorForce: 0.1,
    bulgeOnly: true,
    bulgeStrength: 67,
    glowRadius: 160,
    sparkle: false,
    waveAmplitude: 0,
    gradientFrom: 'rgba(168, 85, 247, 0.35)',
    gradientTo: 'rgba(180, 151, 207, 0.25)',
    glowColor: '#120F17',
    class: '',
  });

  const containerRef = ref<HTMLDivElement>();
  const canvasRef = ref<HTMLCanvasElement>();
  const svgRef = ref<SVGElement>();
  const glowCircleRef = ref<SVGCircleElement>();

  const mouse = reactive({
    x: -9999,
    y: -9999,
    prevX: -9999,
    prevY: -9999,
    speed: 0,
  });
  const size = reactive({ w: 0, h: 0, offsetX: 0, offsetY: 0 });
  const glowOpacity = ref(0);
  const engagement = ref(0);

  let dots: DotFieldDot[] = [];
  let rafId = 0;
  let frameCount = 0;
  const glowId = `dot-field-glow-${useId()}`;

  function doResize() {
    const canvas = canvasRef.value;
    if (!canvas || !canvas.parentElement) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    size.w = w;
    size.h = h;
    size.offsetX = rect.left + window.scrollX;
    size.offsetY = rect.top + window.scrollY;

    buildDots(w, h);
  }

  function buildDots(w: number, h: number) {
    const { dotRadius, dotSpacing } = props;
    const cell = dotSpacing;
    const cols = Math.ceil(w / cell) + 1;
    const rows = Math.ceil(h / cell) + 1;

    dots = [];
    for (let i = 0; i < cols * rows; i++) {
      const x = (i % cols) * cell;
      const y = Math.floor(i / cols) * cell;
      dots.push({ ax: x, ay: y, sx: x, sy: y, vx: 0, vy: 0 });
    }
  }

  function onMouseMove(e: MouseEvent) {
    mouse.x = e.pageX - size.offsetX;
    mouse.y = e.pageY - size.offsetY;
  }

  function updateMouseSpeed() {
    const dx = mouse.x - mouse.prevX;
    const dy = mouse.y - mouse.prevY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    mouse.speed += (dist - mouse.speed) * 0.5;
    if (mouse.speed < 0.001) mouse.speed = 0;
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
  }

  function tick() {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const { w, h } = size;
    if (w === 0 || h === 0) return;

    const {
      dotRadius,
      dotSpacing,
      cursorRadius,
      cursorForce,
      bulgeOnly,
      bulgeStrength,
      sparkle,
      waveAmplitude,
      gradientFrom,
      gradientTo,
    } = props;

    frameCount++;
    const cr = cursorRadius;
    const crSq = cr * cr;

    // Update engagement
    const dx = mouse.x - w / 2;
    const dy = mouse.y - h / 2;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);
    const targetEng = Math.max(0, 1 - distFromCenter / cr);
    engagement.value += (targetEng - engagement.value) * 0.04;
    glowOpacity.value += (engagement.value - glowOpacity.value) * 0.08;

    // Move SVG glow circle
    if (glowCircleRef.value) {
      glowCircleRef.value.setAttribute('cx', String(mouse.x));
      glowCircleRef.value.setAttribute('cy', String(mouse.y));
      glowCircleRef.value.style.opacity = String(glowOpacity.value);
    }

    // Draw gradient background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, gradientFrom);
    grad.addColorStop(1, gradientTo);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw dots
    ctx.fillStyle = '#000';
    ctx.beginPath();

    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      const dx = d.ax - mouse.x;
      const dy = d.ay - mouse.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < crSq && engagement.value > 0.01) {
        const dist = Math.sqrt(distSq);
        if (bulgeOnly) {
          const push =
            (bulgeStrength * engagement.value) / Math.max(dist * 0.1, 1);
          d.sx += d.ax - (mouse.x + (dx / dist) * push) - d.sx;
          d.sy += d.ay - (mouse.y + (dy / dist) * push) - d.sy;
          d.sx += (d.ax - d.sx) * 0.1;
          d.sy += (d.ay - d.sy) * 0.1;
        } else {
          const angle = Math.atan2(dy, dx);
          const move = (500 / dist) * (mouse.speed * cursorForce);
          d.vx += Math.cos(angle) * -move;
          d.vy += Math.sin(angle) * -move;
          d.sx += d.vx * 0.1;
          d.sy += d.vy * 0.1;
          d.vx *= 0.95;
          d.vy *= 0.95;
        }
      } else if (bulgeOnly) {
        d.sx += (d.ax - d.sx) * 0.1;
        d.sy += (d.ay - d.sy) * 0.1;
      }

      // Wave perturbation
      if (waveAmplitude > 0) {
        const wave = Math.sin(frameCount * 0.02 + d.ax * 0.02) * waveAmplitude;
        const waveY =
          Math.cos(frameCount * 0.015 + d.ay * 0.02) * waveAmplitude;
        d.sx += wave;
        d.sy += waveY;
      }

      // Clamp to bounds
      if (d.sx < 0) d.sx = 0;
      if (d.sy < 0) d.sy = 0;
      if (d.sx > w) d.sx = w;
      if (d.sy > h) d.sy = h;

      const drawX = d.sx;
      const drawY = d.sy;

      if (sparkle) {
        const hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0;
        const drawRad = hash % 100 < 3 ? dotRadius * 1.8 : dotRadius;
        ctx.moveTo(drawX + drawRad, drawY);
        ctx.arc(drawX, drawY, drawRad, 0, TWO_PI);
      } else {
        ctx.moveTo(drawX + dotRadius, drawY);
        ctx.arc(drawX, drawY, dotRadius, 0, TWO_PI);
      }
    }

    ctx.fill();

    rafId = requestAnimationFrame(tick);
  }

  let resizeTimer: ReturnType<typeof setTimeout>;
  function resize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(doResize, 100);
  }

  useResizeObserver(containerRef, doResize);
  useEventListener(window, 'mousemove', onMouseMove, { passive: true });
  useEventListener(window, 'resize', resize, { passive: true });

  useIntervalFn(updateMouseSpeed, 20);

  watch(
    () => [props.dotRadius, props.dotSpacing],
    () => {
      if (size.w > 0 && size.h > 0) buildDots(size.w, size.h);
    },
  );

  onMounted(() => {
    doResize();
    rafId = requestAnimationFrame(tick);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    clearTimeout(resizeTimer);
  });

  const glowIdRef = computed(() => glowId);
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
  >
    <canvas
      ref="canvasRef"
      class="pointer-events-none absolute inset-0 size-full"
    ></canvas>
    <svg
      ref="svgRef"
      class="pointer-events-none absolute inset-0 size-full"
      style="will-change: opacity"
    >
      <defs>
        <radialGradient :id="glowIdRef">
          <stop offset="0%" :stop-color="props.glowColor" />
          <stop offset="100%" stop-color="transparent" />
        </radialGradient>
      </defs>
      <circle
        ref="glowCircleRef"
        cx="-9999"
        cy="-9999"
        :r="props.glowRadius"
        :fill="`url(#${glowIdRef})`"
        style="opacity: 0"
      />
    </svg>
  </div>
</template>
