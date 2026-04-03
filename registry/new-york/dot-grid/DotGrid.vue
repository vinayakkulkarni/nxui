<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      dotSize?: number;
      gap?: number;
      baseColor?: string;
      activeColor?: string;
      proximity?: number;
      speedTrigger?: number;
      shockRadius?: number;
      shockStrength?: number;
      maxSpeed?: number;
      returnDuration?: number;
      class?: string;
    }>(),
    {
      dotSize: 16,
      gap: 32,
      baseColor: '#5227FF',
      activeColor: '#5227FF',
      proximity: 150,
      speedTrigger: 100,
      shockRadius: 250,
      shockStrength: 5,
      maxSpeed: 5000,
      returnDuration: 1.5,
      class: '',
    },
  );

  interface Dot {
    cx: number;
    cy: number;
    xOffset: number;
    yOffset: number;
    vx: number;
    vy: number;
    returning: boolean;
    returnT: number;
    startX: number;
    startY: number;
  }

  function hexToRgb(hex: string) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return { r: 0, g: 0, b: 0 };
    return {
      r: Number.parseInt(m[1], 16),
      g: Number.parseInt(m[2], 16),
      b: Number.parseInt(m[3], 16),
    };
  }

  const baseRgb = computed(() => hexToRgb(props.baseColor));
  const activeRgb = computed(() => hexToRgb(props.activeColor));

  const containerRef = ref<HTMLDivElement>();
  const canvasRef = ref<HTMLCanvasElement>();
  let dots: Dot[] = [];
  let animationId = 0;
  let circlePath: Path2D | null = null;

  const pointer = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
  };

  function buildGrid() {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!canvas || !container) return;

    const { width, height } = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    const cell = props.dotSize + props.gap;
    const cols = Math.floor((width + props.gap) / cell);
    const rows = Math.floor((height + props.gap) / cell);
    const gridW = cell * cols - props.gap;
    const gridH = cell * rows - props.gap;
    const startX = (width - gridW) / 2 + props.dotSize / 2;
    const startY = (height - gridH) / 2 + props.dotSize / 2;

    dots = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        dots.push({
          cx: startX + x * cell,
          cy: startY + y * cell,
          xOffset: 0,
          yOffset: 0,
          vx: 0,
          vy: 0,
          returning: false,
          returnT: 0,
          startX: 0,
          startY: 0,
        });
      }
    }
  }

  function elasticOut(t: number): number {
    if (t === 0 || t === 1) return t;
    return 2 ** (-10 * t) * Math.sin(((t - 0.075) * (2 * Math.PI)) / 0.3) + 1;
  }

  useResizeObserver(containerRef, buildGrid);

  useEventListener('mousemove', (e: MouseEvent) => {
    const now = performance.now();
    const dt = pointer.lastTime ? now - pointer.lastTime : 16;
    const dx = e.clientX - pointer.lastX;
    const dy = e.clientY - pointer.lastY;
    let vx = (dx / dt) * 1000;
    let vy = (dy / dt) * 1000;
    let speed = Math.hypot(vx, vy);
    if (speed > props.maxSpeed) {
      const scale = props.maxSpeed / speed;
      vx *= scale;
      vy *= scale;
      speed = props.maxSpeed;
    }
    pointer.lastTime = now;
    pointer.lastX = e.clientX;
    pointer.lastY = e.clientY;
    pointer.vx = vx;
    pointer.vy = vy;
    pointer.speed = speed;

    const canvas = canvasRef.value;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;

    // Apply impulse to nearby dots when cursor is fast
    if (speed > props.speedTrigger) {
      for (const dot of dots) {
        const dist = Math.hypot(dot.cx - pointer.x, dot.cy - pointer.y);
        if (dist < props.proximity && !dot.returning) {
          const pushX = dot.cx - pointer.x + vx * 0.005;
          const pushY = dot.cy - pointer.y + vy * 0.005;
          dot.vx += pushX * 0.3;
          dot.vy += pushY * 0.3;
        }
      }
    }
  });

  useEventListener(containerRef, 'click', (e: MouseEvent) => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    for (const dot of dots) {
      const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
      if (dist < props.shockRadius) {
        const falloff = Math.max(0, 1 - dist / props.shockRadius);
        dot.vx += (dot.cx - cx) * props.shockStrength * falloff;
        dot.vy += (dot.cy - cy) * props.shockStrength * falloff;
        dot.returning = false;
      }
    }
  });

  onMounted(() => {
    circlePath = new Path2D();
    circlePath.arc(0, 0, props.dotSize / 2, 0, Math.PI * 2);

    buildGrid();

    const proxSq = props.proximity * props.proximity;
    const friction = 0.92;

    function draw() {
      animationId = requestAnimationFrame(draw);
      const canvas = canvasRef.value;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx || !circlePath) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const dt = 1 / 60;
      const returnDur = props.returnDuration;

      for (const dot of dots) {
        // Apply velocity friction
        dot.vx *= friction;
        dot.vy *= friction;
        dot.xOffset += dot.vx * dt;
        dot.yOffset += dot.vy * dt;

        // When velocity is low, start elastic return
        if (
          Math.abs(dot.vx) < 0.5 &&
          Math.abs(dot.vy) < 0.5 &&
          (Math.abs(dot.xOffset) > 0.1 || Math.abs(dot.yOffset) > 0.1)
        ) {
          if (!dot.returning) {
            dot.returning = true;
            dot.returnT = 0;
            dot.startX = dot.xOffset;
            dot.startY = dot.yOffset;
          }
        }

        if (dot.returning) {
          dot.returnT += dt / returnDur;
          if (dot.returnT >= 1) {
            dot.xOffset = 0;
            dot.yOffset = 0;
            dot.returning = false;
            dot.vx = 0;
            dot.vy = 0;
          } else {
            const e = elasticOut(dot.returnT);
            dot.xOffset = dot.startX * (1 - e);
            dot.yOffset = dot.startY * (1 - e);
          }
        }

        // Draw
        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;

        const dx = dot.cx - pointer.x;
        const dy = dot.cy - pointer.y;
        const dsq = dx * dx + dy * dy;

        let fillStyle = props.baseColor;
        if (dsq <= proxSq) {
          const dist = Math.sqrt(dsq);
          const t = 1 - dist / props.proximity;
          const r = Math.round(
            baseRgb.value.r + (activeRgb.value.r - baseRgb.value.r) * t,
          );
          const g = Math.round(
            baseRgb.value.g + (activeRgb.value.g - baseRgb.value.g) * t,
          );
          const b = Math.round(
            baseRgb.value.b + (activeRgb.value.b - baseRgb.value.b) * t,
          );
          fillStyle = `rgb(${r},${g},${b})`;
        }

        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillStyle = fillStyle;
        ctx.fill(circlePath);
        ctx.restore();
      }
    }

    animationId = requestAnimationFrame(draw);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
  });
</script>

<template>
  <div
    :class="
      cn('relative flex size-full items-center justify-center', $props.class)
    "
  >
    <div ref="containerRef" class="relative size-full">
      <canvas
        ref="canvasRef"
        class="pointer-events-none absolute inset-0 size-full"
      ></canvas>
    </div>
  </div>
</template>
