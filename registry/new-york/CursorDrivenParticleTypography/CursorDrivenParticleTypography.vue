<script setup lang="ts">
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      fontSize?: number;
      fontFamily?: string;
      particleSize?: number;
      particleDensity?: number;
      dispersionStrength?: number;
      returnSpeed?: number;
      color?: string;
      class?: string;
    }>(),
    {
      fontSize: 120,
      fontFamily: 'Inter, sans-serif',
      particleSize: 1.5,
      particleDensity: 6,
      dispersionStrength: 15,
      returnSpeed: 0.08,
      color: '',
      class: '',
    },
  );

  class Particle {
    x: number;
    y: number;
    originX: number;
    originY: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    dispersion: number;
    returnSpd: number;

    constructor(
      x: number,
      y: number,
      size: number,
      color: string,
      dispersion: number,
      returnSpd: number,
    ) {
      this.x = x + (Math.random() - 0.5) * 10;
      this.y = y + (Math.random() - 0.5) * 10;
      this.originX = x;
      this.originY = y;
      this.vx = (Math.random() - 0.5) * 5;
      this.vy = (Math.random() - 0.5) * 5;
      this.size = size;
      this.color = color;
      this.dispersion = dispersion;
      this.returnSpd = returnSpd;
    }

    update(mouseX: number, mouseY: number) {
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const interactionRadius = 120;

      if (
        distance < interactionRadius &&
        mouseX !== -1000 &&
        mouseY !== -1000
      ) {
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const force = (interactionRadius - distance) / interactionRadius;
        this.vx -= forceDirectionX * force * this.dispersion;
        this.vy -= forceDirectionY * force * this.dispersion;
      }

      this.vx += (this.originX - this.x) * this.returnSpd;
      this.vy += (this.originY - this.y) * this.returnSpd;
      this.vx *= 0.85;
      this.vy *= 0.85;

      const distToOrigin = Math.sqrt(
        (this.x - this.originX) ** 2 + (this.y - this.originY) ** 2,
      );
      if (distToOrigin < 1 && Math.random() > 0.95) {
        this.vx += (Math.random() - 0.5) * 0.2;
        this.vy += (Math.random() - 0.5) * 0.2;
      }

      this.x += this.vx;
      this.y += this.vy;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const canvasRef = ref<HTMLCanvasElement>();
  const containerRef = ref<HTMLDivElement>();

  let particles: Particle[] = [];
  let mouseX = -1000;
  let mouseY = -1000;
  let containerWidth = 0;
  let containerHeight = 0;
  let animationFrameId: number;

  const colorMode = useColorMode();

  function init() {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    containerWidth = container.clientWidth;
    containerHeight = container.clientHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const computedStyle = window.getComputedStyle(container);
    const textColor = props.color || computedStyle.color || '#000000';

    ctx.clearRect(0, 0, containerWidth, containerHeight);
    ctx.fillStyle = textColor;
    const effectiveFontSize = Math.min(props.fontSize, containerWidth * 0.15);
    ctx.font = `bold ${effectiveFontSize}px ${props.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(props.text, containerWidth / 2, containerHeight / 2);

    const textCoordinates = ctx.getImageData(0, 0, canvas.width, canvas.height);
    particles = [];

    const step = Math.max(1, Math.floor(props.particleDensity * dpr));
    for (let y = 0; y < textCoordinates.height; y += step) {
      for (let x = 0; x < textCoordinates.width; x += step) {
        const index = (y * textCoordinates.width + x) * 4;
        const alpha = textCoordinates.data[index + 3] || 0;

        if (alpha > 128) {
          particles.push(
            new Particle(
              x / dpr,
              y / dpr,
              props.particleSize,
              textColor,
              props.dispersionStrength,
              props.returnSpeed,
            ),
          );
        }
      }
    }
  }

  function animate() {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, containerWidth, containerHeight);
    for (const particle of particles) {
      particle.update(mouseX, mouseY);
      particle.draw(ctx);
    }
    animationFrameId = requestAnimationFrame(animate);
  }

  function onMouseMove(e: MouseEvent) {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }

  function onMouseLeave() {
    mouseX = -1000;
    mouseY = -1000;
  }

  function onTouchStart(e: TouchEvent) {
    if (!e.touches[0] || !canvasRef.value) return;
    const rect = canvasRef.value.getBoundingClientRect();
    mouseX = e.touches[0].clientX - rect.left;
    mouseY = e.touches[0].clientY - rect.top;
  }

  function onTouchMove(e: TouchEvent) {
    if (!e.touches[0] || !canvasRef.value) return;
    const rect = canvasRef.value.getBoundingClientRect();
    mouseX = e.touches[0].clientX - rect.left;
    mouseY = e.touches[0].clientY - rect.top;
  }

  useResizeObserver(containerRef, () => {
    init();
  });

  watch(
    () => colorMode.value,
    () => {
      init();
    },
  );

  onMounted(() => {
    setTimeout(() => {
      init();
      animate();
    }, 100);
  });

  onUnmounted(() => {
    cancelAnimationFrame(animationFrameId);
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn(
        'relative flex min-h-100 w-full items-center justify-center touch-none',
        props.class,
      )
    "
  >
    <canvas
      ref="canvasRef"
      class="block size-full"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onMouseLeave"
    ></canvas>
  </div>
</template>
