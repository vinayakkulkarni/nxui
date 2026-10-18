<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    NOISE_BLENDS,
    NOISE_TILE,
    clamp,
    paintDust,
    paintTile,
  } from './noise-paint';
  import type { NoiseProps, NoiseScratch, NoiseSettings } from './types';

  const props = withDefaults(defineProps<NoiseProps>(), {
    opacity: 0.2,
    size: 1,
    fps: 24,
    blendMode: 'overlay',
    contrast: 0.6,
    colored: false,
    dust: 0,
    scratches: 0,
    scanlines: 0,
    flicker: 0,
    fixed: false,
    zIndex: undefined,
    class: '',
  });

  const rootRef = ref<HTMLDivElement>();
  const grainRef = ref<HTMLDivElement>();
  const dustRef = ref<HTMLCanvasElement>();
  const linesRef = ref<HTMLDivElement>();
  const reducedMotion = usePreferredReducedMotion();

  const settings = computed<NoiseSettings>(() => ({
    opacity: clamp(props.opacity, 0, 1),
    size: Math.max(0.5, props.size),
    fps: clamp(props.fps, 0, 60),
    flicker: clamp(props.flicker, 0, 1),
    dust: clamp(props.dust, 0, 1),
    scratches: clamp(props.scratches, 0, 1),
  }));
  const blend = computed(() =>
    NOISE_BLENDS.includes(props.blendMode) ? props.blendMode : 'normal',
  );
  const grainStyle = computed(() => {
    const span = NOISE_TILE * settings.value.size;
    return {
      opacity: settings.value.opacity,
      mixBlendMode: blend.value,
      backgroundSize: `${span}px ${span}px`,
    };
  });
  const linesStyle = computed(() => ({
    opacity: clamp(props.scanlines, 0, 1),
    mixBlendMode: blend.value,
  }));

  const scratchList: NoiseScratch[] = [];
  let ctx: CanvasRenderingContext2D | null = null;
  let tileUrl = '';
  let tileToken = 0;
  let last = 0;
  let roll = 0;
  let visible = true;
  let width = 1;
  let height = 1;

  function repaint(step: number) {
    const canvas = dustRef.value;
    if (!ctx || !canvas) return;
    paintDust(ctx, canvas, settings.value, scratchList, width, height, step);
  }

  function rate(): number {
    return reducedMotion.value === 'reduce' ? 0 : settings.value.fps;
  }

  const { pause, resume, isActive } = useRafFn(
    ({ timestamp }) => {
      const grain = grainRef.value;
      const r = rate();
      if (!grain || !visible || r <= 0) {
        pause();
        return;
      }
      if (timestamp - last < 1000 / r) return;
      const step = last ? Math.min(0.2, (timestamp - last) / 1000) : 1 / r;
      last = timestamp;
      const s = settings.value;
      const span = NOISE_TILE * s.size;
      grain.style.backgroundPosition = `${(Math.random() * span).toFixed(1)}px ${(Math.random() * span).toFixed(1)}px`;
      grain.style.opacity = String(
        s.opacity * (1 - s.flicker * Math.random() * 0.7),
      );
      roll = (roll + 1) % 3;
      linesRef.value?.style.setProperty('background-position', `0 ${roll}px`);
      repaint(step);
    },
    { immediate: false },
  );

  function wake() {
    repaint(0);
    if (isActive.value || !visible || rate() <= 0) return;
    resume();
  }

  function buildTile() {
    const grain = grainRef.value;
    if (!grain) return;
    const token = ++tileToken;
    const canvas = paintTile(clamp(props.contrast, 0, 1), props.colored);
    canvas?.toBlob((blob) => {
      if (token !== tileToken || !blob) return;
      const previous = tileUrl;
      tileUrl = URL.createObjectURL(blob);
      grain.style.backgroundImage = `url("${tileUrl}")`;
      if (previous) URL.revokeObjectURL(previous);
    });
  }

  function resize() {
    const root = rootRef.value;
    const canvas = dustRef.value;
    if (!root || !canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, root.clientWidth);
    height = Math.max(1, root.clientHeight);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    repaint(0);
  }

  useResizeObserver(rootRef, resize);
  useIntersectionObserver(rootRef, (entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) wake();
  });

  onMounted(() => {
    ctx = dustRef.value?.getContext('2d') ?? null;
    buildTile();
    resize();
    wake();
  });

  watch([() => props.contrast, () => props.colored], buildTile);
  watch([settings, reducedMotion], wake);

  onBeforeUnmount(() => {
    tileToken++;
    pause();
    if (tileUrl) URL.revokeObjectURL(tileUrl);
    tileUrl = '';
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('noise', fixed && 'noise--fixed', props.class)"
    :style="{ zIndex }"
    aria-hidden="true"
  >
    <div ref="grainRef" class="noise__grain" :style="grainStyle" />
    <canvas ref="dustRef" class="noise__dust" />
    <div
      v-if="scanlines > 0"
      ref="linesRef"
      class="noise__lines"
      :style="linesStyle"
    />
  </div>
</template>

<style scoped>
  .noise {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .noise--fixed {
    position: fixed;
  }

  .noise__grain {
    position: absolute;
    inset: 0;
    background-repeat: repeat;
    image-rendering: pixelated;
  }

  .noise__dust {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .noise__lines {
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.55) 0,
      rgba(0, 0, 0, 0.55) 1px,
      transparent 1px,
      transparent 3px
    );
  }
</style>
