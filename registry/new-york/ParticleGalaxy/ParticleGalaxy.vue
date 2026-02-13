<script setup lang="ts">
  import { useRafFn, useResizeObserver, useMouseInElement } from '@vueuse/core';
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
      particleCount: 1500,
      color: '#8b5cf6',
      mouseInfluence: 0.3,
      speed: 0.5,
      class: '',
    },
  );

  const canvasRef = ref<HTMLCanvasElement>();
  const containerRef = ref<HTMLElement>();
  const { elementX, elementY, isOutside } = useMouseInElement(containerRef);

  interface Particle { x: number; y: number; z: number; angle: number; radius: number; size: number; speed: number; arm: number }

  const particles = ref<Particle[]>([]);
  let rotation = 0;

  function initParticles() {
    const ps: Particle[] = [];
    for (let i = 0; i < props.particleCount; i++) {
      const arm = Math.floor(Math.random() * 3);
      const armOffset = (arm / 3) * Math.PI * 2;
      const radius = Math.random() * 200 + 20;
      const angle = armOffset + Math.log(radius) * 0.8 + (Math.random() - 0.5) * 0.5;

      ps.push({
        x: 0, y: 0,
        z: (Math.random() - 0.5) * 200,
        angle,
        radius,
        size: Math.random() * 1.5 + 0.5,
        speed: (Math.random() * 0.5 + 0.5) * props.speed * 0.001,
        arm,
      });
    }
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

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, w, h);

    rotation += 0.002 * props.speed;

    const mx = isOutside.value ? 0 : (elementX.value - cx) * props.mouseInfluence * 0.002;
    const my = isOutside.value ? 0 : (elementY.value - cy) * props.mouseInfluence * 0.002;

    for (const p of particles.value) {
      p.angle += p.speed;
      const x = Math.cos(p.angle + rotation + mx) * p.radius;
      const y = Math.sin(p.angle + rotation + my) * p.radius * 0.5;

      const depth = (p.z + 100) / 200;
      const screenX = cx + x;
      const screenY = cy + y + p.z * 0.2;
      const alpha = Math.max(0.1, depth);

      ctx.fillStyle = props.color;
      ctx.globalAlpha = alpha;
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
  <div ref="containerRef" :class="cn('relative overflow-hidden bg-black', props.class)">
    <canvas ref="canvasRef" class="size-full" ></canvas>
    <div class="absolute inset-0 z-10">
      <slot ></slot>
    </div>
  </div>
</template>
