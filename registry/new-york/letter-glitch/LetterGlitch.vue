<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      glitchColors?: string[];
      glitchSpeed?: number;
      centerVignette?: boolean;
      outerVignette?: boolean;
      smooth?: boolean;
      characters?: string;
      class?: string;
    }>(),
    {
      glitchColors: () => ['#2b4539', '#61dca3', '#61b3dc'],
      glitchSpeed: 50,
      centerVignette: false,
      outerVignette: true,
      smooth: true,
      characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789',
      class: '',
    },
  );

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const containerRef = ref<HTMLDivElement | null>(null);
  let ctx: CanvasRenderingContext2D | null = null;
  let animationId = 0;
  let lastGlitchTime = Date.now();

  const fontSize = 16;
  const charWidth = 10;
  const charHeight = 20;

  interface Letter {
    char: string;
    color: string;
    targetColor: string;
    colorProgress: number;
  }

  let letters: Letter[] = [];
  let grid = { columns: 0, rows: 0 };

  function getRandomChar(): string {
    const chars = Array.from(props.characters);
    return chars[Math.floor(Math.random() * chars.length)];
  }

  function getRandomColor(): string {
    return props.glitchColors[
      Math.floor(Math.random() * props.glitchColors.length)
    ];
  }

  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : null;
  }

  function interpolateColor(
    start: { r: number; g: number; b: number },
    end: { r: number; g: number; b: number },
    factor: number,
  ): string {
    const r = Math.round(start.r + (end.r - start.r) * factor);
    const g = Math.round(start.g + (end.g - start.g) * factor);
    const b = Math.round(start.b + (end.b - start.b) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function initializeLetters(columns: number, rows: number) {
    grid = { columns, rows };
    letters = Array.from({ length: columns * rows }, () => ({
      char: getRandomChar(),
      color: getRandomColor(),
      targetColor: getRandomColor(),
      colorProgress: 1,
    }));
  }

  function resizeCanvas() {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const columns = Math.ceil(rect.width / charWidth);
    const rows = Math.ceil(rect.height / charHeight);
    initializeLetters(columns, rows);
    drawLetters();
  }

  function drawLetters() {
    const canvas = canvasRef.value;
    if (!ctx || !canvas || letters.length === 0) return;
    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';

    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i];
      const x = (i % grid.columns) * charWidth;
      const y = Math.floor(i / grid.columns) * charHeight;
      ctx.fillStyle = letter.color;
      ctx.fillText(letter.char, x, y);
    }
  }

  function updateLetters() {
    if (letters.length === 0) return;
    const updateCount = Math.max(1, Math.floor(letters.length * 0.05));

    for (let i = 0; i < updateCount; i++) {
      const index = Math.floor(Math.random() * letters.length);
      const letter = letters[index];
      if (!letter) continue;

      letter.char = getRandomChar();
      letter.targetColor = getRandomColor();

      if (!props.smooth) {
        letter.color = letter.targetColor;
        letter.colorProgress = 1;
      } else {
        letter.colorProgress = 0;
      }
    }
  }

  function handleSmoothTransitions() {
    let needsRedraw = false;
    for (const letter of letters) {
      if (letter.colorProgress < 1) {
        letter.colorProgress = Math.min(letter.colorProgress + 0.05, 1);
        const startRgb = hexToRgb(letter.color);
        const endRgb = hexToRgb(letter.targetColor);
        if (startRgb && endRgb) {
          letter.color = interpolateColor(
            startRgb,
            endRgb,
            letter.colorProgress,
          );
          needsRedraw = true;
        }
      }
    }
    if (needsRedraw) drawLetters();
  }

  function animate() {
    const now = Date.now();
    if (now - lastGlitchTime >= props.glitchSpeed) {
      updateLetters();
      drawLetters();
      lastGlitchTime = now;
    }
    if (props.smooth) handleSmoothTransitions();
    animationId = requestAnimationFrame(animate);
  }

  useResizeObserver(containerRef, () => {
    resizeCanvas();
  });

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    animationId = requestAnimationFrame(animate);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden bg-black', $props.class)"
  >
    <canvas ref="canvasRef" class="block size-full"></canvas>
    <div
      v-if="outerVignette"
      class="pointer-events-none absolute inset-0"
      style="
        background: radial-gradient(
          circle,
          rgba(0, 0, 0, 0) 60%,
          rgba(0, 0, 0, 1) 100%
        );
      "
    ></div>
    <div
      v-if="centerVignette"
      class="pointer-events-none absolute inset-0"
      style="
        background: radial-gradient(
          circle,
          rgba(0, 0, 0, 0.8) 0%,
          rgba(0, 0, 0, 0) 60%
        );
      "
    ></div>
  </div>
</template>
