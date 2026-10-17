<script setup lang="ts">
  import { onBeforeUnmount, ref, watch } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import type { PixelImageTrailPixel, PixelImageTrailProps } from './types';

  const props = withDefaults(defineProps<PixelImageTrailProps>(), {
    pixelSize: 36,
    radius: 58,
    fadeDuration: 900,
    maxPixels: 84,
    initialPixels: 24,
    class: undefined,
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const imageRef = ref<HTMLImageElement | null>(null);
  const motionPreference = usePreferredReducedMotion();

  const pixels = new Map<string, PixelImageTrailPixel>();
  const hoveredKeys = new Set<string>();
  let context: CanvasRenderingContext2D | null = null;
  let width = 0;
  let height = 0;
  let frame = 0;
  let pointerInside = false;
  let lastColumn: number | null = null;
  let lastRow: number | null = null;

  function cellSize(): number {
    return Math.max(12, props.pixelSize);
  }

  function isReduced(): boolean {
    return motionPreference.value === 'reduce';
  }

  function seedPixels(): void {
    const size = cellSize();
    const columns = Math.max(1, Math.ceil(width / size));
    const rows = Math.max(1, Math.ceil(height / size));
    const count = Math.min(props.initialPixels, columns * rows);
    for (let index = 0; index < count; index += 1) {
      const column = Math.floor(Math.random() * columns);
      const row = Math.floor(Math.random() * rows);
      pixels.set(`${column}:${row}`, {
        column,
        row,
        touchedAt: performance.now(),
        ambient: true,
      });
    }
  }

  function drawPixel(pixel: PixelImageTrailPixel, opacity: number): void {
    const image = imageRef.value;
    if (!context || !image) return;
    if (!image.complete || !image.naturalWidth || !image.naturalHeight) return;
    const size = cellSize();
    const x = pixel.column * size;
    const y = pixel.row * size;
    const coverScale = Math.max(
      width / image.naturalWidth,
      height / image.naturalHeight,
    );
    const offsetX = (width - image.naturalWidth * coverScale) / 2;
    const offsetY = (height - image.naturalHeight * coverScale) / 2;
    context.globalAlpha = opacity;
    context.drawImage(
      image,
      (x - offsetX) / coverScale,
      (y - offsetY) / coverScale,
      size / coverScale,
      size / coverScale,
      x,
      y,
      size,
      size,
    );
  }

  function pixelOpacity(
    key: string,
    pixel: PixelImageTrailPixel,
    now: number,
  ): number {
    const hovered = pointerInside && hoveredKeys.has(key);
    if (pixel.ambient) return hovered ? 1 : 0.58;
    if (isReduced()) return pointerInside ? 1 : 0;
    const age = now - pixel.touchedAt;
    return Math.max(0, 1 - age / Math.max(120, props.fadeDuration));
  }

  function draw(now: number): void {
    frame = 0;
    if (!context) return;
    context.clearRect(0, 0, width, height);
    let hasTrail = false;
    for (const [key, pixel] of pixels) {
      if (pointerInside && hoveredKeys.has(key)) pixel.touchedAt = now;
      const opacity = pixelOpacity(key, pixel, now);
      if (opacity <= 0) {
        pixels.delete(key);
        continue;
      }
      if (!pixel.ambient) hasTrail = true;
      drawPixel(pixel, opacity * opacity * (3 - 2 * opacity));
    }
    context.globalAlpha = 1;
    if (!isReduced() && hasTrail) frame = requestAnimationFrame(draw);
  }

  function requestDraw(): void {
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function resize(): void {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas) return;
    context = canvas.getContext('2d');
    if (!context) return;
    cancelAnimationFrame(frame);
    frame = 0;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    pixels.clear();
    seedPixels();
    context.clearRect(0, 0, width, height);
    frame = requestAnimationFrame(draw);
  }

  function trimTrail(): void {
    const limit = Math.max(1, props.maxPixels);
    const trail = [...pixels.entries()].filter(([, pixel]) => !pixel.ambient);
    if (trail.length <= limit) return;
    trail.sort((a, b) => a[1].touchedAt - b[1].touchedAt);
    const excess = trail.length - limit;
    for (let index = 0; index < excess; index += 1) {
      const entry = trail[index];
      if (entry) pixels.delete(entry[0]);
    }
  }

  function setTrailPixel(
    key: string,
    column: number,
    row: number,
    touchedAt: number,
  ): void {
    if (pixels.get(key)?.ambient) return;
    pixels.set(key, { column, row, touchedAt, ambient: false });
  }

  function insideGrid(column: number, row: number): boolean {
    const size = cellSize();
    return (
      column >= 0 && row >= 0 && column * size < width && row * size < height
    );
  }

  function clearTrail(): void {
    for (const [key, pixel] of pixels) {
      if (!pixel.ambient) pixels.delete(key);
    }
  }

  function addSatellite(
    centerColumn: number,
    centerRow: number,
    horizontalMotion: boolean,
    now: number,
  ): void {
    const size = cellSize();
    const spread = Math.max(1, Math.floor(props.radius / size));
    const distance = 1 + Math.floor(Math.random() * spread);
    const offset = Math.random() < 0.5 ? -distance : distance;
    const column = centerColumn + (horizontalMotion ? 0 : offset);
    const row = centerRow + (horizontalMotion ? offset : 0);
    if (!insideGrid(column, row)) return;
    setTrailPixel(
      `${column}:${row}`,
      column,
      row,
      now - props.fadeDuration * 0.18,
    );
  }

  function paintAt(clientX: number, clientY: number): void {
    const container = containerRef.value;
    if (!container) return;
    const size = cellSize();
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const centerColumn = Math.floor(x / size);
    const centerRow = Math.floor(y / size);
    const reduced = isReduced();
    if (reduced) clearTrail();

    const now = performance.now();
    hoveredKeys.clear();
    const fromColumn = lastColumn ?? centerColumn;
    const fromRow = lastRow ?? centerRow;
    const columnDistance = centerColumn - fromColumn;
    const rowDistance = centerRow - fromRow;
    const steps = Math.max(1, Math.abs(columnDistance), Math.abs(rowDistance));

    for (let step = 0; step <= steps; step += 1) {
      const progress = step / steps;
      const column = Math.round(fromColumn + columnDistance * progress);
      const row = Math.round(fromRow + rowDistance * progress);
      setTrailPixel(`${column}:${row}`, column, row, now);
    }

    const xDirection = x % size > size / 2 ? 1 : -1;
    const yDirection = y % size > size / 2 ? 1 : -1;
    const activeCluster: Array<[number, number]> = [
      [centerColumn, centerRow],
      [centerColumn + xDirection, centerRow],
      [centerColumn, centerRow + yDirection],
      [centerColumn + xDirection, centerRow + yDirection],
    ];
    for (const [column, row] of activeCluster) {
      if (!insideGrid(column, row)) continue;
      const key = `${column}:${row}`;
      hoveredKeys.add(key);
      setTrailPixel(key, column, row, now);
    }

    const moved = lastColumn !== centerColumn || lastRow !== centerRow;
    if (moved && !reduced && Math.random() < 0.34) {
      const horizontalMotion =
        Math.abs(columnDistance) >= Math.abs(rowDistance);
      addSatellite(centerColumn, centerRow, horizontalMotion, now);
    }

    lastColumn = centerColumn;
    lastRow = centerRow;
    trimTrail();
    requestDraw();
  }

  function onPointerMove(event: PointerEvent): void {
    pointerInside = true;
    paintAt(event.clientX, event.clientY);
  }

  function onPointerLeave(): void {
    pointerInside = false;
    hoveredKeys.clear();
    lastColumn = null;
    lastRow = null;
    if (isReduced()) {
      clearTrail();
      requestDraw();
    }
  }

  function onFocusIn(): void {
    const container = containerRef.value;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    pointerInside = true;
    paintAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  function onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    const container = containerRef.value;
    if (container && next instanceof Node && container.contains(next)) return;
    onPointerLeave();
  }

  useResizeObserver(containerRef, resize);
  useEventListener(imageRef, 'load', requestDraw);

  watch(
    [
      () => props.src,
      () => props.pixelSize,
      () => props.radius,
      () => props.fadeDuration,
      () => props.maxPixels,
      () => props.initialPixels,
    ],
    resize,
  );

  onBeforeUnmount(() => {
    cancelAnimationFrame(frame);
    frame = 0;
    pixels.clear();
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative isolate touch-pan-y overflow-hidden', props.class)"
    @pointerenter="onPointerMove"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <img
      ref="imageRef"
      :src="src"
      :alt="alt"
      class="pointer-events-none absolute inset-0 size-full object-cover opacity-0"
      draggable="false"
    />
    <canvas
      ref="canvasRef"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 size-full"
    />
    <div v-if="$slots.default" class="relative z-10">
      <slot />
    </div>
  </div>
</template>
