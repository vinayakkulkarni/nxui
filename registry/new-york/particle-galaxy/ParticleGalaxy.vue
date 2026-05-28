<script setup lang="ts">
  import { useRafFn, useResizeObserver, useMouseInElement } from '@vueuse/core';
  import type { GalaxyParticle } from './types';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      particleCount?: number;
      color?: string;
      mouseInfluence?: number;
      speed?: number;
      class?: string;
    }>(),
    {
      particleCount: 3000,
      color: '#8b5cf6',
      mouseInfluence: 0.3,
      speed: 0.5,
      class: '',
    },
  );

  const canvasRef = ref<HTMLCanvasElement>();
  const containerRef = ref<HTMLElement>();
  const { elementX, elementY, isOutside } = useMouseInElement(containerRef);

  const particles = ref<GalaxyParticle[]>([]);
  let rotation = 0;
  let frameCount = 0;

  const ARM_COUNT = 4;
  const MAX_RADIUS = 250;

  function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : { r: 139, g: 92, b: 246 };
  }

  function initParticles() {
    const ps: GalaxyParticle[] = [];
    for (let i = 0; i < props.particleCount; i++) {
      const arm = Math.floor(Math.random() * ARM_COUNT);
      const armOffset = (arm / ARM_COUNT) * Math.PI * 2;
      const radius = Math.random() * MAX_RADIUS + 10;
      const angle =
        armOffset + Math.log(radius) * 1.2 + (Math.random() - 0.5) * 0.3;

      ps.push({
        x: 0,
        y: 0,
        z: (Math.random() - 0.5) * 200,
        angle,
        radius,
        size: Math.random() * 2.2 + 0.3,
        speed: (Math.random() * 0.5 + 0.5) * props.speed * 0.001,
        arm,
      });
    }
    ps.sort((a, b) => a.z - b.z);
    particles.value = ps;
  }

  useResizeObserver(containerRef, (entries) => {
    const entry = entries[0];
    if (!entry || !canvasRef.value) return;
    canvasRef.value.width = entry.contentRect.width;
    canvasRef.value.height = entry.contentRect.height;
  });

  useRafFn(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    frameCount++;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
    coreGradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
    coreGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.1)');
    coreGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGradient;
    ctx.fillRect(cx - 80, cy - 80, 160, 160);

    rotation += 0.002 * props.speed;

    const mx = isOutside.value
      ? 0
      : (elementX.value - cx) * props.mouseInfluence * 0.002;
    const my = isOutside.value
      ? 0
      : (elementY.value - cy) * props.mouseInfluence * 0.002;

    const baseRgb = hexToRgb(props.color);

    if (frameCount % 60 === 0) {
      particles.value.sort((a, b) => a.z - b.z);
    }

    for (const p of particles.value) {
      p.angle += p.speed;
      const x = Math.cos(p.angle + rotation + mx) * p.radius;
      const y = Math.sin(p.angle + rotation + my) * p.radius * 0.5;

      const depth = (p.z + 100) / 200;
      const screenX = cx + x;
      const screenY = cy + y + p.z * 0.2;
      const alpha = Math.max(0.15, depth * 0.9);

      const t = Math.min(1, p.radius / MAX_RADIUS);
      const r = Math.round(255 + (baseRgb.r - 255) * t);
      const g = Math.round(240 + (baseRgb.g - 240) * t);
      const b = Math.round(220 + (baseRgb.b - 220) * t);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.arc(screenX, screenY, p.size * depth, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  onMounted(() => {
    initParticles();
    if (canvasRef.value && containerRef.value) {
      const { width, height } = containerRef.value.getBoundingClientRect();
      canvasRef.value.width = width;
      canvasRef.value.height = height;
    }
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative overflow-hidden bg-black', props.class)"
  >
    <canvas ref="canvasRef" class="size-full"></canvas>
    <div class="absolute inset-0 z-10">
      <slot></slot>
    </div>
  </div>
</template>
