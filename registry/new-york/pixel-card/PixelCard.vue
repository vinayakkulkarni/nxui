<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
  import { useResizeObserver, useMediaQuery } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      variant?: 'default' | 'blue' | 'yellow' | 'pink';
      gap?: number;
      speed?: number;
      colors?: string;
      noFocus?: boolean;
      class?: string;
    }>(),
    {
      variant: 'default',
      gap: undefined,
      speed: undefined,
      colors: undefined,
      noFocus: undefined,
      class: '',
    },
  );

  const VARIANTS: Record<
    string,
    {
      activeColor: string | null;
      gap: number;
      speed: number;
      colors: string;
      noFocus: boolean;
    }
  > = {
    default: {
      activeColor: null,
      gap: 5,
      speed: 35,
      colors: '#f8fafc,#f1f5f9,#cbd5e1',
      noFocus: false,
    },
    blue: {
      activeColor: '#e0f2fe',
      gap: 10,
      speed: 25,
      colors: '#e0f2fe,#7dd3fc,#0ea5e9',
      noFocus: false,
    },
    yellow: {
      activeColor: '#fef08a',
      gap: 3,
      speed: 20,
      colors: '#fef08a,#fde047,#eab308',
      noFocus: false,
    },
    pink: {
      activeColor: '#fecdd3',
      gap: 6,
      speed: 80,
      colors: '#fecdd3,#fda4af,#e11d48',
      noFocus: true,
    },
  };

  const cfg = computed(() => VARIANTS[props.variant] ?? VARIANTS.default);
  const finalGap = computed(() => props.gap ?? cfg.value.gap);
  const finalSpeed = computed(() => props.speed ?? cfg.value.speed);
  const finalColors = computed(() => props.colors ?? cfg.value.colors);
  const finalNoFocus = computed(() => props.noFocus ?? cfg.value.noFocus);

  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const containerRef = ref<HTMLDivElement>();
  const canvasRef = ref<HTMLCanvasElement>();
  let pixels: Pixel[] = [];
  let animationId = 0;
  let timePrev = 0;

  class Pixel {
    x: number;
    y: number;
    color: string;
    speed: number;
    size = 0;
    sizeStep = Math.random() * 0.4;
    minSize = 0.5;
    maxSizeInt = 2;
    maxSize: number;
    delay: number;
    counter = 0;
    counterStep: number;
    isIdle = false;
    isReverse = false;
    isShimmer = false;
    ctx: CanvasRenderingContext2D;

    constructor(
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      x: number,
      y: number,
      color: string,
      speed: number,
      delay: number,
    ) {
      this.ctx = ctx;
      this.x = x;
      this.y = y;
      this.color = color;
      this.speed = (Math.random() * 0.8 + 0.1) * speed;
      this.maxSize =
        Math.random() * (this.maxSizeInt - this.minSize) + this.minSize;
      this.delay = delay;
      this.counterStep = Math.random() * 4 + (w + h) * 0.01;
    }

    draw() {
      const off = this.maxSizeInt * 0.5 - this.size * 0.5;
      this.ctx.fillStyle = this.color;
      this.ctx.fillRect(this.x + off, this.y + off, this.size, this.size);
    }

    appear() {
      this.isIdle = false;
      if (this.counter <= this.delay) {
        this.counter += this.counterStep;
        return;
      }
      if (this.size >= this.maxSize) this.isShimmer = true;
      if (this.isShimmer) {
        this.shimmer();
      } else {
        this.size += this.sizeStep;
      }
      this.draw();
    }

    disappear() {
      this.isShimmer = false;
      this.counter = 0;
      if (this.size <= 0) {
        this.isIdle = true;
        return;
      }
      this.size -= 0.1;
      this.draw();
    }

    shimmer() {
      if (this.size >= this.maxSize) this.isReverse = true;
      else if (this.size <= this.minSize) this.isReverse = false;
      this.size += this.isReverse ? -this.speed : this.speed;
    }
  }

  function getSpeed(val: number): number {
    if (val <= 0 || reducedMotion.value) return 0;
    return Math.min(val, 100) * 0.001;
  }

  function initPixels() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const colorsArr = finalColors.value.split(',');
    const spd = getSpeed(finalSpeed.value);
    const gp = finalGap.value;
    pixels = [];

    for (let x = 0; x < w; x += gp) {
      for (let y = 0; y < h; y += gp) {
        const c = colorsArr[Math.floor(Math.random() * colorsArr.length)];
        const dx = x - w / 2;
        const dy = y - h / 2;
        const dist = reducedMotion.value ? 0 : Math.sqrt(dx * dx + dy * dy);
        pixels.push(new Pixel(ctx, w, h, x, y, c, spd, dist));
      }
    }
  }

  function doAnimate(fnName: 'appear' | 'disappear') {
    cancelAnimationFrame(animationId);
    timePrev = performance.now();

    function loop() {
      animationId = requestAnimationFrame(loop);
      const now = performance.now();
      if (now - timePrev < 1000 / 60) return;
      timePrev = now;

      const canvas = canvasRef.value;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let allIdle = true;
      for (const px of pixels) {
        px[fnName]();
        if (!px.isIdle) allIdle = false;
      }
      if (allIdle) cancelAnimationFrame(animationId);
    }

    animationId = requestAnimationFrame(loop);
  }

  function onEnter() {
    doAnimate('appear');
  }
  function onLeave() {
    doAnimate('disappear');
  }

  onMounted(() => initPixels());
  useResizeObserver(containerRef, () => initPixels());
  onBeforeUnmount(() => cancelAnimationFrame(animationId));
</script>

<template>
  <div
    ref="containerRef"
    :class="
      cn(
        'relative grid aspect-[4/5] h-100 w-75 select-none place-items-center overflow-hidden rounded-[25px] border border-zinc-800 isolate',
        $props.class,
      )
    "
    :tabindex="finalNoFocus ? -1 : 0"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @focus.self="onEnter"
    @blur.self="onLeave"
  >
    <canvas ref="canvasRef" class="block size-full"></canvas>
    <div class="absolute inset-0 z-10 grid place-items-center">
      <slot></slot>
    </div>
  </div>
</template>
