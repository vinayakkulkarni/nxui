<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    useId,
    watch,
  } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { bendShape, traceShape } from './glass-shape';
  import { createGlassRenderer } from './glass-webgl';
  import type {
    GlassSettings,
    GlassShapeArt,
    GlassShapeTrace,
    GlassSurfaceProps,
  } from './types';

  const props = withDefaults(defineProps<GlassSurfaceProps>(), {
    width: 200,
    height: 80,
    borderRadius: 20,
    borderWidth: 0.07,
    brightness: 50,
    opacity: 0.93,
    blur: 11,
    displace: 0,
    backgroundOpacity: 0,
    saturation: 1,
    distortionScale: -180,
    redOffset: 0,
    greenOffset: 10,
    blueOffset: 20,
    xChannel: 'R',
    yChannel: 'G',
    mixBlendMode: 'difference',
    refraction: true,
    renderer: 'auto',
    backdrop: null,
    shape: undefined,
    class: '',
  });

  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${uniqueId}`;
  const redGradId = `red-grad-${uniqueId}`;
  const blueGradId = `blue-grad-${uniqueId}`;
  const softId = `soft-${uniqueId}`;

  const containerRef = ref<HTMLElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  const svgSupported = ref(false);
  const checked = ref(false);
  const webglFailed = ref(false);
  const boxSize = ref('');
  const mapUrl = ref('');
  const loaded = shallowRef<{ src: string; image: HTMLImageElement | null }>({
    src: '',
    image: null,
  });
  const art = shallowRef<GlassShapeArt | null>(null);

  let shapeMap = '';
  let trace: GlassShapeTrace | null = null;
  let disposeRenderer: (() => void) | null = null;
  let cancelShapeLoad: (() => void) | null = null;

  function generateDisplacementMap(): string {
    const rect = containerRef.value?.getBoundingClientRect();
    const w = rect?.width || 400;
    const h = rect?.height || 200;
    const edgeSize = Math.min(w, h) * (props.borderWidth * 0.5);
    const r = props.borderRadius;
    const svgContent = `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
          <filter id="${softId}" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB">
            <feGaussianBlur stdDeviation="${props.blur}" />
          </filter>
        </defs>
        <rect x="0" y="0" width="${w}" height="${h}" fill="black"></rect>
        <rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="url(#${blueGradId})" style="mix-blend-mode: ${props.mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${w - edgeSize * 2}" height="${h - edgeSize * 2}" rx="${r}" fill="hsl(0 0% ${props.brightness}% / ${props.opacity})" filter="url(#${softId})" />
      </svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  }

  function updateDisplacementMap() {
    if (!containerRef.value) return;
    mapUrl.value = shapeMap || generateDisplacementMap();
  }

  function supportsSVGFilters(): boolean {
    const ua = navigator.userAgent;
    const isWebkit = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isFirefox = /Firefox/.test(ua);
    if (isWebkit || isFirefox) return false;
    const div = document.createElement('div');
    div.style.backdropFilter = `url(#${filterId})`;
    return div.style.backdropFilter !== '';
  }

  function loadShape(src: string | undefined) {
    cancelShapeLoad?.();
    cancelShapeLoad = null;
    if (!src) return;
    let alive = true;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => {
      if (alive) loaded.value = { src, image };
    };
    image.onerror = () => {
      if (alive) loaded.value = { src, image: null };
    };
    image.src = src;
    cancelShapeLoad = () => {
      alive = false;
    };
  }

  function updateShape() {
    const element = containerRef.value;
    if (!element) return;
    const shape = props.shape;
    const current = loaded.value;
    const shapeImage = shape && current.src === shape ? current.image : null;
    const w = element.offsetWidth;
    const h = element.offsetHeight;
    let map = '';
    let next: GlassShapeTrace | null = null;
    if (shapeImage && w && h) {
      const ratio = Math.min(
        2,
        window.devicePixelRatio || 1,
        Math.sqrt(400000 / (w * h)),
      );
      next = trace;
      try {
        if (
          !next ||
          next.image !== shapeImage ||
          next.width !== w ||
          next.height !== h ||
          next.ratio !== ratio
        ) {
          next = {
            image: shapeImage,
            width: w,
            height: h,
            ...traceShape(shapeImage, w, h, ratio),
          };
          trace = next;
        }
        map = bendShape(
          next,
          Math.min(w, h) * props.borderWidth * 0.5,
          Math.max(props.blur, 0.5),
          props.opacity,
          props.brightness / 100,
        );
      } catch {
        next = null;
        trace = null;
      }
    }
    shapeMap = map;
    updateDisplacementMap();
    if (shape && next) {
      art.value = {
        src: shape,
        failed: false,
        box: next.box,
        line: next.line,
        glow: next.glow,
      };
    } else if (shape && current.src === shape) {
      art.value = {
        src: shape,
        failed: true,
        box: { x: 0, y: 0, width: 0, height: 0 },
        line: '',
        glow: '',
      };
    }
  }

  const webgl = computed(
    () =>
      checked.value &&
      props.refraction &&
      Boolean(props.backdrop) &&
      !webglFailed.value &&
      (props.renderer === 'webgl' ||
        (props.renderer === 'auto' && !svgSupported.value)),
  );
  const refractive = computed(
    () => !webgl.value && svgSupported.value && props.refraction,
  );
  const frosted = computed(() => !webgl.value && !refractive.value);

  const outline = computed(() => {
    const value = art.value;
    return props.shape && value && value.src === props.shape && !value.failed
      ? value
      : null;
  });

  const shapeStyle = computed(() => {
    const value = outline.value;
    if (value) {
      const url = `url("${value.src.replace(/"/g, '%22').replace(/[\n\r]+/g, ' ')}")`;
      const place = `${value.box.x}px ${value.box.y}px / ${value.box.width}px ${value.box.height}px no-repeat`;
      return {
        borderRadius: '0',
        boxShadow: 'none',
        WebkitMask: `${url} ${place}`,
        mask: `${url} ${place}`,
      };
    }
    if (props.shape && art.value?.src !== props.shape) {
      return { opacity: '0', transition: 'none' };
    }
    return undefined;
  });

  const containerStyle = computed(() => ({
    width: typeof props.width === 'number' ? `${props.width}px` : props.width,
    height:
      typeof props.height === 'number' ? `${props.height}px` : props.height,
    borderRadius: `${props.borderRadius}px`,
    '--glass-frost': props.backgroundOpacity,
    '--glass-saturation': props.saturation,
    '--filter-id': `url(#${filterId})`,
    ...shapeStyle.value,
  }));

  const modeClass = computed(() => {
    if (webgl.value) return 'glass-surface--webgl';
    return refractive.value ? 'glass-surface--svg' : 'glass-surface--fallback';
  });

  const glowStyle = computed(() =>
    outline.value
      ? {
          WebkitMaskImage: `url(${outline.value.glow})`,
          maskImage: `url(${outline.value.glow})`,
        }
      : undefined,
  );
  const lineStyle = computed(() =>
    outline.value
      ? {
          WebkitMaskImage: `url(${outline.value.line})`,
          maskImage: `url(${outline.value.line})`,
        }
      : undefined,
  );

  function getSettings(): GlassSettings {
    return {
      backdrop: props.backdrop,
      displace: props.displace,
      saturation: props.saturation,
      distortionScale: props.distortionScale,
      redOffset: props.redOffset,
      greenOffset: props.greenOffset,
      blueOffset: props.blueOffset,
      xChannel: props.xChannel,
      yChannel: props.yChannel,
    };
  }

  function stopRenderer() {
    disposeRenderer?.();
    disposeRenderer = null;
  }

  function onRendererFail() {
    webglFailed.value = true;
  }

  useResizeObserver(containerRef, () => {
    const element = containerRef.value;
    if (element)
      boxSize.value = `${element.offsetWidth}x${element.offsetHeight}`;
  });

  watch(
    [
      boxSize,
      () => props.width,
      () => props.height,
      () => props.borderRadius,
      () => props.borderWidth,
      () => props.brightness,
      () => props.opacity,
      () => props.blur,
      () => props.mixBlendMode,
    ],
    updateDisplacementMap,
    { flush: 'post' },
  );

  watch(
    () => props.shape,
    (shape) => {
      if (checked.value) loadShape(shape);
    },
  );

  watch(
    [
      () => props.shape,
      loaded,
      boxSize,
      () => props.borderWidth,
      () => props.blur,
      () => props.opacity,
      () => props.brightness,
    ],
    updateShape,
    { flush: 'post' },
  );

  watch(
    webgl,
    async (enabled) => {
      stopRenderer();
      if (!enabled) return;
      await nextTick();
      const canvas = canvasRef.value;
      const element = containerRef.value;
      if (!webgl.value || !canvas || !element) return;
      disposeRenderer = createGlassRenderer({
        canvas,
        element,
        getSettings,
        getMapUrl: () => mapUrl.value,
        onFail: onRendererFail,
      });
      if (!disposeRenderer) webglFailed.value = true;
    },
    { flush: 'post' },
  );

  onMounted(() => {
    svgSupported.value = supportsSVGFilters();
    checked.value = true;
    loadShape(props.shape);
    updateShape();
  });

  onBeforeUnmount(() => {
    cancelShapeLoad?.();
    stopRenderer();
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('glass-surface', modeClass, props.class)"
    :style="containerStyle"
  >
    <svg class="glass-surface__filter" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter
          :id="filterId"
          color-interpolation-filters="sRGB"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
        >
          <feImage
            :href="mapUrl || undefined"
            x="0"
            y="0"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            result="map"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            :scale="props.distortionScale + props.redOffset"
            :xChannelSelector="props.xChannel"
            :yChannelSelector="props.yChannel"
            result="dispRed"
          />
          <feColorMatrix
            in="dispRed"
            type="matrix"
            values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
            result="red"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            :scale="props.distortionScale + props.greenOffset"
            :xChannelSelector="props.xChannel"
            :yChannelSelector="props.yChannel"
            result="dispGreen"
          />
          <feColorMatrix
            in="dispGreen"
            type="matrix"
            values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"
            result="green"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            :scale="props.distortionScale + props.blueOffset"
            :xChannelSelector="props.xChannel"
            :yChannelSelector="props.yChannel"
            result="dispBlue"
          />
          <feColorMatrix
            in="dispBlue"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"
            result="blue"
          />
          <feBlend in="red" in2="green" mode="screen" result="rg" />
          <feBlend in="rg" in2="blue" mode="screen" result="output" />
          <feGaussianBlur in="output" :stdDeviation="props.displace" />
        </filter>
      </defs>
    </svg>

    <canvas
      v-if="webgl"
      ref="canvasRef"
      class="glass-surface__canvas"
      aria-hidden="true"
    ></canvas>
    <span
      v-if="webgl"
      class="glass-surface__frame"
      aria-hidden="true"
      :style="outline ? { boxShadow: 'none' } : undefined"
    ></span>
    <span v-if="frosted" class="glass-surface__sheen" aria-hidden="true"></span>
    <span
      v-if="frosted && !outline"
      class="glass-surface__rim"
      aria-hidden="true"
    ></span>
    <span
      v-if="outline"
      class="glass-surface__glow"
      aria-hidden="true"
      :style="glowStyle"
    ></span>
    <span
      v-if="outline"
      class="glass-surface__line"
      aria-hidden="true"
      :style="lineStyle"
    ></span>

    <div class="glass-surface__content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
  .glass-surface {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: opacity 0.26s ease-out;
    color-scheme: light;
  }

  .dark .glass-surface {
    color-scheme: dark;
  }

  .glass-surface__filter {
    width: 100%;
    height: 100%;
    pointer-events: none;
    position: absolute;
    inset: 0;
    opacity: 0;
    z-index: -1;
  }

  .glass-surface__content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border-radius: inherit;
    position: relative;
    z-index: 1;
  }

  .glass-surface--svg {
    background: light-dark(
      hsl(0 0% 100% / var(--glass-frost, 0)),
      hsl(0 0% 0% / var(--glass-frost, 0))
    );
    backdrop-filter: var(--filter-id, url(#glass-filter))
      saturate(var(--glass-saturation, 1));
    box-shadow:
      0 0 2px 1px
        light-dark(
          color-mix(in oklch, black, transparent 85%),
          color-mix(in oklch, white, transparent 65%)
        )
        inset,
      0 0 10px 4px
        light-dark(
          color-mix(in oklch, black, transparent 90%),
          color-mix(in oklch, white, transparent 85%)
        )
        inset,
      0px 4px 16px rgba(17, 17, 26, 0.05),
      0px 8px 24px rgba(17, 17, 26, 0.05),
      0px 16px 56px rgba(17, 17, 26, 0.05),
      0px 4px 16px rgba(17, 17, 26, 0.05) inset,
      0px 8px 24px rgba(17, 17, 26, 0.05) inset,
      0px 16px 56px rgba(17, 17, 26, 0.05) inset;
  }

  .glass-surface--webgl {
    box-shadow:
      0px 4px 16px rgba(17, 17, 26, 0.05),
      0px 8px 24px rgba(17, 17, 26, 0.05),
      0px 16px 56px rgba(17, 17, 26, 0.05);
  }

  .glass-surface__canvas,
  .glass-surface__frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    pointer-events: none;
  }

  .glass-surface__frame {
    background: light-dark(
      hsl(0 0% 100% / var(--glass-frost, 0)),
      hsl(0 0% 0% / var(--glass-frost, 0))
    );
    box-shadow:
      0 0 2px 1px
        light-dark(
          color-mix(in oklch, black, transparent 85%),
          color-mix(in oklch, white, transparent 65%)
        )
        inset,
      0 0 10px 4px
        light-dark(
          color-mix(in oklch, black, transparent 90%),
          color-mix(in oklch, white, transparent 85%)
        )
        inset,
      0px 4px 16px rgba(17, 17, 26, 0.05) inset,
      0px 8px 24px rgba(17, 17, 26, 0.05) inset,
      0px 16px 56px rgba(17, 17, 26, 0.05) inset;
  }

  .glass-surface--fallback {
    background: light-dark(
      hsl(0 0% 100% / calc(0.12 + var(--glass-frost, 0) * 0.5)),
      hsl(0 0% 100% / calc(0.04 + var(--glass-frost, 0) * 0.3))
    );
    -webkit-backdrop-filter: blur(12px)
      saturate(calc(var(--glass-saturation, 1) * 1.4)) brightness(1.04);
    backdrop-filter: blur(12px) saturate(calc(var(--glass-saturation, 1) * 1.4))
      brightness(1.04);
    box-shadow:
      inset 0 1px 0 0 light-dark(hsl(0 0% 100% / 0.85), hsl(0 0% 100% / 0.3)),
      inset 0 -1px 0 0 light-dark(hsl(0 0% 100% / 0.35), hsl(0 0% 100% / 0.08)),
      0 0 2px 1px
        light-dark(
          color-mix(in oklch, black, transparent 88%),
          color-mix(in oklch, white, transparent 72%)
        )
        inset,
      0 0 12px 3px
        light-dark(
          color-mix(in oklch, white, transparent 72%),
          color-mix(in oklch, white, transparent 90%)
        )
        inset,
      0px 4px 16px rgba(17, 17, 26, 0.06),
      0px 8px 24px rgba(17, 17, 26, 0.06),
      0px 16px 56px rgba(17, 17, 26, 0.06);
  }

  .glass-surface__sheen,
  .glass-surface__rim {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
  }

  .glass-surface__sheen {
    background: linear-gradient(
      135deg,
      light-dark(hsl(0 0% 100% / 0.42), hsl(0 0% 100% / 0.14)) 0%,
      transparent 42%,
      transparent 64%,
      light-dark(hsl(0 0% 100% / 0.18), hsl(0 0% 100% / 0.05)) 100%
    );
  }

  .glass-surface__rim {
    padding: 3px;
    background: linear-gradient(
      150deg,
      light-dark(hsl(0 0% 100% / 0.7), hsl(0 0% 100% / 0.34)),
      light-dark(hsl(0 0% 100% / 0.1), hsl(0 0% 100% / 0.03)) 45%,
      light-dark(hsl(0 0% 100% / 0.08), hsl(0 0% 100% / 0.02)) 60%,
      light-dark(hsl(0 0% 100% / 0.42), hsl(0 0% 100% / 0.18))
    );
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#000 0 0) content-box exclude,
      linear-gradient(#000 0 0);
  }

  .glass-surface__line,
  .glass-surface__glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
  }

  .glass-surface--svg .glass-surface__line,
  .glass-surface--webgl .glass-surface__line {
    background: light-dark(
      color-mix(in oklch, black, transparent 85%),
      color-mix(in oklch, white, transparent 65%)
    );
  }

  .glass-surface--svg .glass-surface__glow,
  .glass-surface--webgl .glass-surface__glow {
    background: light-dark(
      color-mix(in oklch, black, transparent 90%),
      color-mix(in oklch, white, transparent 85%)
    );
  }

  .glass-surface--fallback .glass-surface__line {
    background: light-dark(
      color-mix(in oklch, black, transparent 88%),
      color-mix(in oklch, white, transparent 72%)
    );
  }

  .glass-surface--fallback .glass-surface__glow {
    background: light-dark(
      color-mix(in oklch, white, transparent 72%),
      color-mix(in oklch, white, transparent 90%)
    );
  }

  @supports not (
    (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))
  ) {
    .glass-surface--fallback {
      background: light-dark(hsl(0 0% 100% / 0.72), hsl(0 0% 12% / 0.72));
    }
  }

  .glass-surface:focus-visible {
    outline: 2px solid light-dark(#007aff, #0a84ff);
    outline-offset: 2px;
  }
</style>
