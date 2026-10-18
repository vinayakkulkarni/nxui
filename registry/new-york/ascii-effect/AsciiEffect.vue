<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    IMAGE_COLORS,
    clamp,
    ditherBayer,
    ditherFloydSteinberg,
    gradientColor,
    posterizeField,
  } from './ascii-effect';
  import type { AsciiEffectProps } from './types';

  const props = withDefaults(defineProps<AsciiEffectProps>(), {
    alt: 'ASCII rendering',
    variant: 'image',
    chars: ' .:-=+*#%@',
    fontSize: 9,
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontWeight: 400,
    lineHeight: 1,
    characterSpacing: 1,
    brightnessBoost: 2.2,
    contrast: 1.1,
    threshold: 0.06,
    posterize: 32,
    dither: 'floyd-steinberg',
    ditherStrength: 0.8,
    flowSpeed: 0.22,
    flowDirection: 0,
    flowStrength: 12,
    flowFrequency: 0.018,
    mouseRadius: 150,
    mouseStrength: 22,
    mouseWaveSpeed: 1.2,
    scale: 1.15,
    fit: 'cover',
    colors: undefined,
    colorMode: 'gradient',
    backgroundColor: '#07090d',
    invert: false,
    glitchIntensity: 0.65,
    glitchFrequency: 1.4,
    revealDuration: 1400,
    class: '',
  });

  const containerRef = useTemplateRef<HTMLDivElement>('container');
  const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas');

  const reducedMotion = usePreferredReducedMotion();
  const reduce = computed(() => reducedMotion.value === 'reduce');
  const palette = computed(() => props.colors ?? IMAGE_COLORS);

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };

  let context: CanvasRenderingContext2D | null = null;
  let sampleCanvas: HTMLCanvasElement | null = null;
  let sampleContext: CanvasRenderingContext2D | null = null;
  let image: HTMLImageElement | null = null;
  let loaded = false;
  let visible = true;
  let width = 0;
  let height = 0;
  let startedAt = 0;
  let nextGlitchAt = 0;
  let glitchUntil = 0;
  let glitchBands = new Map<number, number>();

  function isAnimated(): boolean {
    return !reduce.value && props.variant !== 'image';
  }

  function updateGlitch(now: number, rows: number) {
    if (
      props.variant !== 'glitch' ||
      reduce.value ||
      props.glitchFrequency <= 0 ||
      now < nextGlitchAt
    ) {
      return;
    }
    const intensity = clamp(props.glitchIntensity);
    glitchBands = new Map();
    const bandCount = Math.max(1, Math.round(intensity * 4));
    for (let band = 0; band < bandCount; band++) {
      const start = Math.floor(Math.random() * rows);
      const size = 1 + Math.floor(Math.random() * 3);
      const offset = (Math.random() - 0.5) * props.fontSize * 12 * intensity;
      for (let row = start; row < Math.min(rows, start + size); row++) {
        glitchBands.set(row, offset);
      }
    }
    glitchUntil = now + 70 + 90 * intensity;
    nextGlitchAt = now + 1000 / props.glitchFrequency;
  }

  function draw(now: number) {
    if (!loaded || !image || !context || !sampleCanvas || !sampleContext) {
      return;
    }
    if (width === 0 || height === 0 || props.chars.length === 0) return;

    const {
      variant,
      chars,
      fontSize,
      fit,
      flowDirection,
      flowFrequency,
      flowSpeed,
      flowStrength,
      mouseRadius,
      mouseStrength,
      mouseWaveSpeed,
    } = props;
    const animatedFlow = variant === 'flow' && !reduce.value;

    pointer.x += (pointer.targetX - pointer.x) * 0.08;
    pointer.y += (pointer.targetY - pointer.y) * 0.08;

    const cellHeight = Math.max(4, fontSize * Math.max(0.5, props.lineHeight));
    context.font = `${props.fontWeight} ${fontSize}px ${props.fontFamily}`;
    const cellWidth = Math.max(
      2,
      context.measureText('M').width * Math.max(0.5, props.characterSpacing),
    );
    const columns = Math.ceil(width / cellWidth) + 2;
    const rows = Math.ceil(height / cellHeight) + 2;
    const radians = (flowDirection * Math.PI) / 180;
    const directionX = Math.cos(radians);
    const directionY = Math.sin(radians);
    sampleCanvas.width = columns;
    sampleCanvas.height = rows;

    const fitScale =
      fit === 'contain'
        ? Math.min(width / image.naturalWidth, height / image.naturalHeight)
        : Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const imageScale =
      fit === 'stretch' ? 1 : fitScale * Math.max(0.1, props.scale);
    const drawWidth =
      fit === 'stretch'
        ? columns
        : (image.naturalWidth * imageScale) / cellWidth;
    const drawHeight =
      fit === 'stretch'
        ? rows
        : (image.naturalHeight * imageScale) / cellHeight;
    sampleContext.clearRect(0, 0, columns, rows);
    sampleContext.drawImage(
      image,
      (columns - drawWidth) / 2,
      (rows - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );

    const pixels = sampleContext.getImageData(0, 0, columns, rows).data;
    const steps = Math.max(2, Math.round(props.posterize));
    const contrast = Math.max(0, props.contrast);
    const threshold = props.threshold;
    const field = new Float32Array(columns * rows);
    for (let index = 0; index < field.length; index++) {
      const pixel = index * 4;
      const alpha = (pixels[pixel + 3] ?? 0) / 255;
      let luminance =
        ((pixels[pixel] ?? 0) * 0.2126 +
          (pixels[pixel + 1] ?? 0) * 0.7152 +
          (pixels[pixel + 2] ?? 0) * 0.0722) /
        255;
      luminance = clamp((luminance - 0.5) * contrast + 0.5);
      luminance = clamp(luminance * props.brightnessBoost * alpha);
      field[index] =
        luminance <= threshold
          ? 0
          : (luminance - threshold) / Math.max(0.001, 1 - threshold);
    }

    if (props.dither === 'floyd-steinberg') {
      ditherFloydSteinberg(field, columns, rows, steps, props.ditherStrength);
    } else if (props.dither === 'bayer') {
      ditherBayer(field, columns, rows, props.ditherStrength);
    } else {
      posterizeField(field, steps);
    }

    const reveal =
      variant === 'glitch' && !reduce.value && props.revealDuration > 0
        ? clamp((now - startedAt) / props.revealDuration)
        : 1;

    updateGlitch(now, rows);
    if (now > glitchUntil) glitchBands.clear();

    context.fillStyle = props.backgroundColor;
    context.fillRect(0, 0, width, height);
    context.textBaseline = 'top';

    const sourceColors = props.colorMode === 'source';
    const colors = palette.value;
    const lastChar = chars.length - 1;

    for (let row = 0; row < rows; row++) {
      const rowOffset = glitchBands.get(row) ?? 0;
      for (let column = 0; column < columns; column++) {
        const dx = column / Math.max(1, columns - 1) - 0.5;
        const dy = row / Math.max(1, rows - 1) - 0.5;
        if (Math.hypot(dx, dy) > reveal * 0.72) continue;

        let sourceColumn = column;
        let sourceRow = row;
        let mouseInfluence = 0;
        if (animatedFlow) {
          const x = column * cellWidth;
          const y = row * cellHeight;
          const phase =
            (x * directionX + y * directionY) * flowFrequency +
            now * flowSpeed * Math.PI * 0.002;
          const crossPhase =
            (-x * directionY + y * directionX) * flowFrequency * 0.65;
          const drift =
            (Math.sin(phase) + Math.sin(phase * 0.61 + crossPhase) * 0.45) *
            flowStrength;

          if (pointer.active && mouseRadius > 0) {
            const mouseX = x - pointer.x;
            const mouseY = y - pointer.y;
            const distance = Math.hypot(mouseX, mouseY);
            mouseInfluence = clamp(1 - distance / mouseRadius);
            if (distance > 0 && mouseInfluence > 0) {
              const ripple = Math.sin(
                distance * 0.055 - now * mouseWaveSpeed * Math.PI * 0.002,
              );
              const displacement = mouseInfluence ** 2 * mouseStrength * ripple;
              sourceColumn -= ((mouseX / distance) * displacement) / cellWidth;
              sourceRow -= ((mouseY / distance) * displacement) / cellHeight;
            }
          }

          sourceColumn -= (directionX * drift) / cellWidth;
          sourceRow -= (directionY * drift) / cellHeight;
        }

        const sampledColumn = Math.round(clamp(sourceColumn, 0, columns - 1));
        const sampledRow = Math.round(clamp(sourceRow, 0, rows - 1));
        const sampleIndex = sampledRow * columns + sampledColumn;
        const pixel = sampleIndex * 4;
        let luminance = clamp(
          (field[sampleIndex] ?? 0) + mouseInfluence * 0.08,
        );
        if (props.invert) luminance = 1 - luminance;

        const character =
          chars[Math.min(lastChar, Math.floor(luminance * lastChar))];
        if (!character?.trim()) continue;

        context.fillStyle = sourceColors
          ? `rgb(${pixels[pixel]}, ${pixels[pixel + 1]}, ${pixels[pixel + 2]})`
          : gradientColor(colors, luminance);
        context.fillText(
          character,
          column * cellWidth - cellWidth + rowOffset,
          row * cellHeight - cellHeight,
        );
      }
    }
  }

  const { pause, resume } = useRafFn(
    ({ timestamp }) => {
      draw(timestamp);
    },
    { immediate: false },
  );

  function syncLoop() {
    if (loaded && visible && isAnimated()) resume();
    else pause();
  }

  function resize() {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (!container || !canvas || !context) return;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (loaded) draw(performance.now());
  }

  /** Mirrors upstream's effect re-run: restart the reveal and glitch timers, redraw, resync the loop. */
  function restart() {
    if (!loaded) return;
    startedAt = performance.now();
    nextGlitchAt = 0;
    glitchUntil = 0;
    glitchBands.clear();
    draw(startedAt);
    syncLoop();
  }

  function onImageLoad() {
    if (loaded) return;
    loaded = true;
    startedAt = performance.now();
    resize();
    syncLoop();
  }

  function loadImage(src: string) {
    if (image) image.onload = null;
    loaded = false;
    pause();
    const next = new Image();
    next.crossOrigin = 'anonymous';
    next.decoding = 'async';
    next.onload = onImageLoad;
    image = next;
    next.src = src;
    if (next.complete && next.naturalWidth > 0) onImageLoad();
  }

  function onPointerMove(event: PointerEvent) {
    if (props.variant !== 'flow') return;
    const container = containerRef.value;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (!pointer.active) {
      pointer.x = x;
      pointer.y = y;
    }
    pointer.active = true;
    pointer.targetX = x;
    pointer.targetY = y;
  }

  function onPointerLeave() {
    pointer.active = false;
  }

  useResizeObserver(containerRef, resize);

  useIntersectionObserver(containerRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    syncLoop();
  });

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    context = canvas.getContext('2d');
    sampleCanvas = document.createElement('canvas');
    sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
    loadImage(props.imageSrc);
  });

  watch(
    () => props.imageSrc,
    (src) => {
      loadImage(src);
    },
  );

  watch(
    [
      () => props.variant,
      () => props.chars,
      () => props.fontSize,
      () => props.fontFamily,
      () => props.fontWeight,
      () => props.lineHeight,
      () => props.characterSpacing,
      () => props.brightnessBoost,
      () => props.contrast,
      () => props.threshold,
      () => props.posterize,
      () => props.dither,
      () => props.ditherStrength,
      () => props.flowSpeed,
      () => props.flowDirection,
      () => props.flowStrength,
      () => props.flowFrequency,
      () => props.mouseRadius,
      () => props.mouseStrength,
      () => props.mouseWaveSpeed,
      () => props.scale,
      () => props.fit,
      palette,
      () => props.colorMode,
      () => props.backgroundColor,
      () => props.invert,
      () => props.glitchIntensity,
      () => props.glitchFrequency,
      () => props.revealDuration,
      reduce,
    ],
    restart,
    { deep: true },
  );

  onBeforeUnmount(() => {
    pause();
    if (image) image.onload = null;
    image = null;
    context = null;
    sampleContext = null;
    sampleCanvas = null;
  });
</script>

<template>
  <div
    ref="container"
    :class="cn('relative size-full overflow-hidden', props.class)"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
  >
    <canvas ref="canvas" role="img" :aria-label="alt" class="block size-full" />
  </div>
</template>
