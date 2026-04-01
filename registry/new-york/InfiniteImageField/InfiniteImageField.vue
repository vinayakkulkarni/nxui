<script lang="ts">
  const DEFAULT_IMAGES = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=560&fit=crop',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=560&fit=crop',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=560&fit=crop',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=560&fit=crop',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=560&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=560&fit=crop',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=560&fit=crop',
    'https://images.unsplash.com/photo-1465056836900-8f1e940f2693?w=400&h=560&fit=crop',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=560&fit=crop',
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=560&fit=crop',
    'https://images.unsplash.com/photo-1439853949127-fa647821eba0?w=400&h=560&fit=crop',
    'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=400&h=560&fit=crop',
  ];
</script>

<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { useRafFn, useResizeObserver, useEventListener } from '@vueuse/core';
  import type { InfiniteImageFieldProps } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(defineProps<InfiniteImageFieldProps>(), {
    images: () => DEFAULT_IMAGES,
    imageWidth: 200,
    imageHeight: 280,
    gap: 28,
    maxSpeed: 5,
    smoothing: 0.07,
    borderRadius: 0,
    class: '',
  });

  const canvasRef = ref<HTMLCanvasElement>();
  const containerRef = ref<HTMLDivElement>();

  // Non-reactive mutable state for performance
  const camera = { x: 0, y: 0, vx: 0, vy: 0 };
  const mouse = { x: -9999, y: -9999, active: false };
  let loadedImages: HTMLImageElement[] = [];
  let imagesReady = false;
  let canvasWidth = 0;
  let canvasHeight = 0;

  const NUM_COLS = 12;
  const NUM_ROWS = 8;

  function getImageIndex(col: number, row: number, numImages: number): number {
    return Math.abs(col * 7 + row * 13 + ((col * row * 3) | 0)) % numImages;
  }

  function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function render() {
    const canvas = canvasRef.value;
    if (!canvas || !imagesReady || loadedImages.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvasWidth;
    const h = canvasHeight;
    if (w === 0 || h === 0) return;

    const cellW = props.imageWidth + props.gap;
    const cellH = props.imageHeight + props.gap;
    const totalW = NUM_COLS * cellW;
    const totalH = NUM_ROWS * cellH;

    // Update camera velocity toward target
    const centerX = w / 2;
    const centerY = h / 2;

    if (mouse.active) {
      const targetVx = ((mouse.x - centerX) / centerX) * props.maxSpeed;
      const targetVy = ((mouse.y - centerY) / centerY) * props.maxSpeed;
      camera.vx += (targetVx - camera.vx) * props.smoothing;
      camera.vy += (targetVy - camera.vy) * props.smoothing;
    } else {
      camera.vx += (0 - camera.vx) * props.smoothing;
      camera.vy += (0 - camera.vy) * props.smoothing;
    }

    camera.x += camera.vx;
    camera.y += camera.vy;

    // Wrap camera for infinite tiling
    camera.x = ((camera.x % totalW) + totalW) % totalW;
    camera.y = ((camera.y % totalH) + totalH) % totalH;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Calculate visible cell range
    const startCol = Math.floor(camera.x / cellW) - 1;
    const endCol = startCol + Math.ceil(w / cellW) + 2;
    const startRow = Math.floor(camera.y / cellH) - 1;
    const endRow = startRow + Math.ceil(h / cellH) + 2;

    const numImages = loadedImages.length;
    const br = props.borderRadius;

    for (let col = startCol; col <= endCol; col++) {
      for (let row = startRow; row <= endRow; row++) {
        // Screen position
        const screenX = col * cellW - camera.x;
        const screenY = row * cellH - camera.y;

        // Skip if fully off-screen
        if (
          screenX + props.imageWidth < 0 ||
          screenX > w ||
          screenY + props.imageHeight < 0 ||
          screenY > h
        )
          continue;

        // Wrap col/row for deterministic image assignment
        const wrappedCol = ((col % NUM_COLS) + NUM_COLS) % NUM_COLS;
        const wrappedRow = ((row % NUM_ROWS) + NUM_ROWS) % NUM_ROWS;
        const imgIdx = getImageIndex(wrappedCol, wrappedRow, numImages);
        const img = loadedImages[imgIdx]!;

        // Draw image with optional rounded rect clipping
        if (br > 0) {
          ctx.save();
          drawRoundedRect(
            ctx,
            screenX,
            screenY,
            props.imageWidth,
            props.imageHeight,
            br,
          );
          ctx.clip();
          ctx.drawImage(
            img,
            screenX,
            screenY,
            props.imageWidth,
            props.imageHeight,
          );
          ctx.restore();
        } else {
          ctx.drawImage(
            img,
            screenX,
            screenY,
            props.imageWidth,
            props.imageHeight,
          );
        }

        // Glass-panel border overlay
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        if (br > 0) {
          drawRoundedRect(
            ctx,
            screenX,
            screenY,
            props.imageWidth,
            props.imageHeight,
            br,
          );
          ctx.stroke();
        } else {
          ctx.strokeRect(screenX, screenY, props.imageWidth, props.imageHeight);
        }
      }
    }
  }

  function updateCanvasSize() {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvasWidth = rect.width;
    canvasHeight = rect.height;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }

  function preloadImages(): Promise<HTMLImageElement[]> {
    return Promise.all(
      props.images.map(
        (src) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          }),
      ),
    );
  }

  const { pause } = useRafFn(() => render(), { immediate: false });

  useResizeObserver(containerRef, () => updateCanvasSize());

  onMounted(async () => {
    updateCanvasSize();

    if (containerRef.value) {
      const el = containerRef.value;

      useEventListener(el, 'mousemove', (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.active = true;
      });

      useEventListener(el, 'mouseleave', () => {
        mouse.active = false;
      });

      useEventListener(
        el,
        'touchmove',
        (e: TouchEvent) => {
          const t = e.touches[0];
          if (t) {
            const rect = el.getBoundingClientRect();
            mouse.x = t.clientX - rect.left;
            mouse.y = t.clientY - rect.top;
            mouse.active = true;
          }
        },
        { passive: true },
      );

      useEventListener(el, 'touchend', () => {
        mouse.active = false;
      });
    }

    try {
      loadedImages = await preloadImages();
      imagesReady = true;
    } catch {
      // Silently handle failed image loads
      imagesReady = false;
    }
  });

  onBeforeUnmount(() => {
    pause();
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative overflow-hidden bg-black', $props.class)"
  >
    <canvas ref="canvasRef" class="block size-full" />
  </div>
</template>
