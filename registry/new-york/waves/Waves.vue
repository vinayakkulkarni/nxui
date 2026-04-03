<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useResizeObserver, useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      lineColor?: string;
      backgroundColor?: string;
      waveSpeedX?: number;
      waveSpeedY?: number;
      waveAmpX?: number;
      waveAmpY?: number;
      xGap?: number;
      yGap?: number;
      friction?: number;
      tension?: number;
      maxCursorMove?: number;
      class?: string;
    }>(),
    {
      lineColor: 'black',
      backgroundColor: 'transparent',
      waveSpeedX: 0.0125,
      waveSpeedY: 0.005,
      waveAmpX: 32,
      waveAmpY: 16,
      xGap: 10,
      yGap: 32,
      friction: 0.925,
      tension: 0.005,
      maxCursorMove: 100,
      class: '',
    },
  );

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  let ctx: CanvasRenderingContext2D | null = null;
  let animationId = 0;
  let boundingRect = { width: 0, height: 0, left: 0, top: 0 };

  interface WavePoint {
    x: number;
    y: number;
    wave: { x: number; y: number };
    cursor: { x: number; y: number; vx: number; vy: number };
  }

  let lines: WavePoint[][] = [];
  const mouse = {
    x: -10,
    y: 0,
    lx: 0,
    ly: 0,
    sx: 0,
    sy: 0,
    v: 0,
    vs: 0,
    a: 0,
    set: false,
  };

  // Perlin noise
  class Grad {
    x: number;
    y: number;
    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
    }
    dot2(x: number, y: number) {
      return this.x * x + this.y * y;
    }
  }

  const grad3 = [
    new Grad(1, 1),
    new Grad(-1, 1),
    new Grad(1, -1),
    new Grad(-1, -1),
    new Grad(1, 0),
    new Grad(-1, 0),
    new Grad(1, 0),
    new Grad(-1, 0),
    new Grad(0, 1),
    new Grad(0, -1),
    new Grad(0, 1),
    new Grad(0, -1),
  ];
  const p = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
    36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120,
    234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
    88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71,
    134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133,
    230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161,
    1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130,
    116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250,
    124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227,
    47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44,
    154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98,
    108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34,
    242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14,
    239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121,
    50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243,
    141, 128, 195, 78, 66, 215, 61, 156, 180,
  ];
  const perm = Array.from<number>({ length: 512 });
  const gradP = Array.from<number>({ length: 512 });

  function seedNoise(seed: number) {
    if (seed > 0 && seed < 1) seed *= 65536;
    seed = Math.floor(seed);
    if (seed < 256) seed |= seed << 8;
    for (let i = 0; i < 256; i++) {
      const v = i & 1 ? p[i] ^ (seed & 255) : p[i] ^ ((seed >> 8) & 255);
      perm[i] = perm[i + 256] = v;
      gradP[i] = gradP[i + 256] = grad3[v % 12];
    }
  }

  function fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  function lerp(a: number, b: number, t: number) {
    return (1 - t) * a + t * b;
  }

  function perlin2(x: number, y: number) {
    let X = Math.floor(x),
      Y = Math.floor(y);
    x -= X;
    y -= Y;
    X &= 255;
    Y &= 255;
    const n00 = gradP[X + perm[Y]].dot2(x, y);
    const n01 = gradP[X + perm[Y + 1]].dot2(x, y - 1);
    const n10 = gradP[X + 1 + perm[Y]].dot2(x - 1, y);
    const n11 = gradP[X + 1 + perm[Y + 1]].dot2(x - 1, y - 1);
    const u = fade(x);
    return lerp(lerp(n00, n10, u), lerp(n01, n11, u), fade(y));
  }

  seedNoise(Math.random());

  function setLines() {
    const { width, height } = boundingRect;
    lines = [];
    const oWidth = width + 200;
    const oHeight = height + 30;
    const { xGap, yGap } = props;
    const totalLines = Math.ceil(oWidth / xGap);
    const totalPoints = Math.ceil(oHeight / yGap);
    const xStart = (width - xGap * totalLines) / 2;
    const yStart = (height - yGap * totalPoints) / 2;
    for (let i = 0; i <= totalLines; i++) {
      const pts: WavePoint[] = [];
      for (let j = 0; j <= totalPoints; j++) {
        pts.push({
          x: xStart + xGap * i,
          y: yStart + yGap * j,
          wave: { x: 0, y: 0 },
          cursor: { x: 0, y: 0, vx: 0, vy: 0 },
        });
      }
      lines.push(pts);
    }
  }

  function movePoints(time: number) {
    const {
      waveSpeedX,
      waveSpeedY,
      waveAmpX,
      waveAmpY,
      friction,
      tension,
      maxCursorMove,
    } = props;
    for (const pts of lines) {
      for (const pt of pts) {
        const move =
          perlin2(
            (pt.x + time * waveSpeedX) * 0.002,
            (pt.y + time * waveSpeedY) * 0.0015,
          ) * 12;
        pt.wave.x = Math.cos(move) * waveAmpX;
        pt.wave.y = Math.sin(move) * waveAmpY;
        const dx = pt.x - mouse.sx;
        const dy = pt.y - mouse.sy;
        const dist = Math.hypot(dx, dy);
        const l = Math.max(175, mouse.vs);
        if (dist < l) {
          const s = 1 - dist / l;
          const f = Math.cos(dist * 0.001) * s;
          pt.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.00065;
          pt.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.00065;
        }
        pt.cursor.vx += (0 - pt.cursor.x) * tension;
        pt.cursor.vy += (0 - pt.cursor.y) * tension;
        pt.cursor.vx *= friction;
        pt.cursor.vy *= friction;
        pt.cursor.x += pt.cursor.vx * 2;
        pt.cursor.y += pt.cursor.vy * 2;
        pt.cursor.x = Math.min(
          maxCursorMove,
          Math.max(-maxCursorMove, pt.cursor.x),
        );
        pt.cursor.y = Math.min(
          maxCursorMove,
          Math.max(-maxCursorMove, pt.cursor.y),
        );
      }
    }
  }

  function moved(point: WavePoint, withCursor = true) {
    const x = point.x + point.wave.x + (withCursor ? point.cursor.x : 0);
    const y = point.y + point.wave.y + (withCursor ? point.cursor.y : 0);
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  }

  function drawLines() {
    if (!ctx) return;
    const { width, height } = boundingRect;
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = props.lineColor;
    for (const points of lines) {
      let p1 = moved(points[0], false);
      ctx.moveTo(p1.x, p1.y);
      for (let idx = 0; idx < points.length; idx++) {
        const isLast = idx === points.length - 1;
        p1 = moved(points[idx], !isLast);
        const p2 = moved(points[idx + 1] || points[points.length - 1], !isLast);
        ctx.lineTo(p1.x, p1.y);
        if (isLast) ctx.moveTo(p2.x, p2.y);
      }
    }
    ctx.stroke();
  }

  function tick(t: number) {
    mouse.sx += (mouse.x - mouse.sx) * 0.1;
    mouse.sy += (mouse.y - mouse.sy) * 0.1;
    const dx = mouse.x - mouse.lx;
    const dy = mouse.y - mouse.ly;
    const d = Math.hypot(dx, dy);
    mouse.v = d;
    mouse.vs += (d - mouse.vs) * 0.1;
    mouse.vs = Math.min(100, mouse.vs);
    mouse.lx = mouse.x;
    mouse.ly = mouse.y;
    mouse.a = Math.atan2(dy, dx);
    movePoints(t);
    drawLines();
    animationId = requestAnimationFrame(tick);
  }

  function updateMouse(x: number, y: number) {
    mouse.x = x - boundingRect.left;
    mouse.y = y - boundingRect.top;
    if (!mouse.set) {
      mouse.sx = mouse.x;
      mouse.sy = mouse.y;
      mouse.lx = mouse.x;
      mouse.ly = mouse.y;
      mouse.set = true;
    }
  }

  useResizeObserver(containerRef, (entries) => {
    const rect = entries[0].contentRect;
    boundingRect = { width: rect.width, height: rect.height, left: 0, top: 0 };
    const canvas = canvasRef.value;
    if (canvas) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    setLines();
  });

  useEventListener(window, 'mousemove', (e: MouseEvent) => {
    if (!containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    boundingRect.left = rect.left;
    boundingRect.top = rect.top;
    updateMouse(e.clientX, e.clientY);
  });

  useEventListener(window, 'touchmove', (e: TouchEvent) => {
    if (!containerRef.value || !e.touches[0]) return;
    const rect = containerRef.value.getBoundingClientRect();
    boundingRect.left = rect.left;
    boundingRect.top = rect.top;
    updateMouse(e.touches[0].clientX, e.touches[0].clientY);
  });

  onMounted(() => {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!canvas || !container) return;
    ctx = canvas.getContext('2d');
    const rect = container.getBoundingClientRect();
    boundingRect = {
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
    };
    canvas.width = rect.width;
    canvas.height = rect.height;
    setLines();
    animationId = requestAnimationFrame(tick);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('absolute inset-0 size-full overflow-hidden', $props.class)"
    :style="{ backgroundColor }"
  >
    <canvas ref="canvasRef" class="size-full"></canvas>
  </div>
</template>
