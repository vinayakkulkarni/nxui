<script setup lang="ts">
  import { ref, computed, watch, onMounted, useId } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      width?: number | string;
      height?: number | string;
      borderRadius?: number;
      borderWidth?: number;
      brightness?: number;
      opacity?: number;
      blur?: number;
      displace?: number;
      backgroundOpacity?: number;
      saturation?: number;
      distortionScale?: number;
      redOffset?: number;
      greenOffset?: number;
      blueOffset?: number;
      xChannel?: string;
      yChannel?: string;
      mixBlendMode?: string;
      class?: string;
    }>(),
    {
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
      class: '',
    },
  );

  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${uniqueId}`;
  const redGradId = `red-grad-${uniqueId}`;
  const blueGradId = `blue-grad-${uniqueId}`;

  const containerRef = ref<HTMLElement | null>(null);
  const feImageRef = ref<SVGFEImageElement | null>(null);
  const redChannelRef = ref<SVGFEDisplacementMapElement | null>(null);
  const greenChannelRef = ref<SVGFEDisplacementMapElement | null>(null);
  const blueChannelRef = ref<SVGFEDisplacementMapElement | null>(null);
  const gaussianBlurRef = ref<SVGElement | null>(null);
  const svgSupported = ref(false);

  function supportsSVGFilters(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent;
    const isWebkit = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isFirefox = /Firefox/.test(ua);
    if (isWebkit || isFirefox) return false;
    const div = document.createElement('div');
    div.style.backdropFilter = `url(#${filterId})`;
    return div.style.backdropFilter !== '';
  }

  function generateDisplacementMap(): string {
    const rect = containerRef.value?.getBoundingClientRect();
    const w = rect?.width || 400;
    const h = rect?.height || 200;
    const edgeSize = Math.min(w, h) * (props.borderWidth * 0.5);

    const svgContent = `
      <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${w}" height="${h}" fill="black"/>
        <rect x="0" y="0" width="${w}" height="${h}" rx="${props.borderRadius}" fill="url(#${redGradId})"/>
        <rect x="0" y="0" width="${w}" height="${h}" rx="${props.borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${props.mixBlendMode}"/>
        <rect x="${edgeSize}" y="${edgeSize}" width="${w - edgeSize * 2}" height="${h - edgeSize * 2}" rx="${props.borderRadius}" fill="hsl(0 0% ${props.brightness}% / ${props.opacity})" style="filter:blur(${props.blur}px)"/>
      </svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  }

  function updateDisplacementMap() {
    feImageRef.value?.setAttribute('href', generateDisplacementMap());
  }

  function updateFilterAttrs() {
    const channels = [
      { ref: redChannelRef, offset: props.redOffset },
      { ref: greenChannelRef, offset: props.greenOffset },
      { ref: blueChannelRef, offset: props.blueOffset },
    ];
    for (const { ref: chRef, offset } of channels) {
      if (chRef.value) {
        chRef.value.setAttribute(
          'scale',
          String(props.distortionScale + offset),
        );
        chRef.value.setAttribute('xChannelSelector', props.xChannel);
        chRef.value.setAttribute('yChannelSelector', props.yChannel);
      }
    }
    gaussianBlurRef.value?.setAttribute('stdDeviation', String(props.displace));
  }

  const containerStyle = computed(() => ({
    width: typeof props.width === 'number' ? `${props.width}px` : props.width,
    height:
      typeof props.height === 'number' ? `${props.height}px` : props.height,
    borderRadius: `${props.borderRadius}px`,
    '--glass-frost': props.backgroundOpacity,
    '--glass-saturation': props.saturation,
    '--filter-id': `url(#${filterId})`,
  }));

  const containerClass = computed(() =>
    cn(
      'gs-surface',
      svgSupported.value ? 'gs-surface--svg' : 'gs-surface--fallback',
      props.class,
    ),
  );

  watch(
    [
      () => props.width,
      () => props.height,
      () => props.borderRadius,
      () => props.borderWidth,
      () => props.brightness,
      () => props.opacity,
      () => props.blur,
      () => props.displace,
      () => props.distortionScale,
      () => props.redOffset,
      () => props.greenOffset,
      () => props.blueOffset,
      () => props.xChannel,
      () => props.yChannel,
      () => props.mixBlendMode,
    ],
    () => {
      updateDisplacementMap();
      updateFilterAttrs();
    },
  );

  useResizeObserver(containerRef, () => {
    updateDisplacementMap();
  });

  onMounted(() => {
    svgSupported.value = supportsSVGFilters();
    updateDisplacementMap();
    updateFilterAttrs();
  });
</script>

<template>
  <div ref="containerRef" :class="containerClass" :style="containerStyle">
    <svg
      class="gs-filter"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
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
            ref="feImageRef"
            x="0"
            y="0"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            result="map"
          />

          <feDisplacementMap
            ref="redChannelRef"
            in="SourceGraphic"
            in2="map"
            result="dispRed"
          />
          <feColorMatrix
            in="dispRed"
            type="matrix"
            values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
            result="red"
          />

          <feDisplacementMap
            ref="greenChannelRef"
            in="SourceGraphic"
            in2="map"
            result="dispGreen"
          />
          <feColorMatrix
            in="dispGreen"
            type="matrix"
            values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"
            result="green"
          />

          <feDisplacementMap
            ref="blueChannelRef"
            in="SourceGraphic"
            in2="map"
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
          <feGaussianBlur
            ref="gaussianBlurRef"
            in="output"
            stdDeviation="0.7"
          />
        </filter>
      </defs>
    </svg>

    <div class="gs-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
  .gs-surface {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: opacity 0.26s ease-out;
  }

  .gs-filter {
    width: 100%;
    height: 100%;
    pointer-events: none;
    position: absolute;
    inset: 0;
    opacity: 0;
    z-index: -1;
  }

  .gs-content {
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

  .gs-surface--svg {
    background: oklch(0 0 0 / var(--glass-frost, 0));
    backdrop-filter: var(--filter-id) saturate(var(--glass-saturation, 1));
    box-shadow:
      0 0 2px 1px color-mix(in oklch, white, transparent 65%) inset,
      0 0 10px 4px color-mix(in oklch, white, transparent 85%) inset,
      0px 4px 16px rgba(17, 17, 26, 0.05),
      0px 8px 24px rgba(17, 17, 26, 0.05),
      0px 16px 56px rgba(17, 17, 26, 0.05);
  }

  .gs-surface--fallback {
    background: color-mix(in oklch, var(--foreground), transparent 90%);
    backdrop-filter: blur(12px) saturate(1.8) brightness(1.2);
    -webkit-backdrop-filter: blur(12px) saturate(1.8) brightness(1.2);
    border: 1px solid color-mix(in oklch, var(--foreground), transparent 80%);
    box-shadow:
      inset 0 1px 0 0 color-mix(in oklch, var(--foreground), transparent 80%),
      inset 0 -1px 0 0 color-mix(in oklch, var(--foreground), transparent 90%);
  }

  .gs-surface:focus-visible {
    outline: 2px solid oklch(0.6 0.2 250);
    outline-offset: 2px;
  }
</style>
