<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createLetterGlitchEngine } from './letter-glitch-engine';
  import {
    LETTER_GLITCH_CHARACTERS,
    LETTER_GLITCH_DARK_COLORS,
    LETTER_GLITCH_FONT,
    LETTER_GLITCH_LIGHT_COLORS,
  } from './letter-glitch-presets';
  import type {
    LetterGlitchEngine,
    LetterGlitchProps,
    LetterGlitchSettings,
  } from './types';

  const props = withDefaults(defineProps<LetterGlitchProps>(), {
    glitchColors: undefined,
    baseColor: undefined,
    characters: undefined,
    fontFamily: undefined,
    fontSize: 14,
    spacing: 0.6,
    density: 0.9,
    baseOpacity: 0.16,
    glitchAmount: 0.5,
    speed: 1,
    smooth: true,
    interactive: true,
    cursorRadius: 140,
    clickEffect: 'tear',
    flow: 0.5,
    edgeFade: 0,
    centerFade: 0,
    intro: true,
    lightMode: false,
    backgroundColor: undefined,
    dpr: undefined,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const rootEl = shallowRef<HTMLElement | null>(null);
  let engine: LetterGlitchEngine | null = null;
  let inView = true;

  const reducedMotion = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const settings = computed<LetterGlitchSettings>(() => {
    const custom = props.glitchColors?.length ? props.glitchColors : null;
    const fallback = props.lightMode
      ? LETTER_GLITCH_LIGHT_COLORS
      : LETTER_GLITCH_DARK_COLORS;
    return {
      colors: (custom ?? fallback).slice(0, 8),
      baseColor: props.baseColor || (props.lightMode ? '#18181b' : '#ffffff'),
      characters: props.characters || LETTER_GLITCH_CHARACTERS,
      fontFamily: props.fontFamily || LETTER_GLITCH_FONT,
      fontSize: clamp(props.fontSize, 6, 96),
      spacing: clamp(props.spacing, 0, 2),
      density: clamp(props.density, 0, 1),
      baseOpacity: clamp(props.baseOpacity, 0, 1),
      glitchAmount: clamp(props.glitchAmount, 0, 1),
      speed: Math.max(0, props.speed),
      smooth: props.smooth,
      interactive: props.interactive,
      cursorRadius: Math.max(0, props.cursorRadius),
      clickEffect: props.clickEffect,
      flow: clamp(props.flow, 0, 1),
      edgeFade: clamp(props.edgeFade, 0, 0.5),
      centerFade: clamp(props.centerFade, 0, 1),
      intro: props.intro,
      backgroundColor: props.backgroundColor,
    };
  });

  const { pause, resume, isActive } = useRafFn(
    ({ timestamp }) => {
      if (!engine || visibility.value === 'hidden') {
        pause();
        return;
      }
      if (!engine.frame(timestamp)) pause();
    },
    { immediate: false },
  );

  function wake() {
    if (!engine || isActive.value || !inView) return;
    if (visibility.value === 'hidden') return;
    resume();
  }

  function measure() {
    const el = containerRef.value;
    if (!el || !engine) return;
    const ratio = Math.min(props.dpr || window.devicePixelRatio || 1, 2);
    engine.resize(el.clientWidth, el.clientHeight, ratio);
    wake();
  }

  useResizeObserver(containerRef, measure);

  useIntersectionObserver(containerRef, (entries) => {
    inView = entries.some((entry) => entry.isIntersecting);
    engine?.setVisible(inView);
    if (inView) wake();
  });

  watch(visibility, () => {
    engine?.resetClock();
    wake();
  });

  watch(settings, wake);
  watch(() => props.dpr, measure);

  function locate(event: PointerEvent) {
    const el = containerRef.value;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    return { x, y, inside };
  }

  function onPointerMove(event: PointerEvent) {
    const point = locate(event);
    if (!point || !engine) return;
    engine.pointer(point.x, point.y, point.inside);
    wake();
  }

  function onPointerDown(event: PointerEvent) {
    const point = locate(event);
    if (!point || !engine) return;
    engine.click(point.x, point.y, point.inside);
    wake();
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerType !== 'mouse') engine?.leave();
  }

  function onPointerLeave() {
    engine?.leave();
    wake();
  }

  function onFonts() {
    engine?.refont();
    wake();
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener('pointerdown', onPointerDown, { passive: true });
  useEventListener('pointerup', onPointerUp, { passive: true });
  useEventListener('pointercancel', onPointerUp, { passive: true });
  useEventListener(rootEl, 'pointerleave', onPointerLeave);

  let stopFonts: (() => void) | null = null;

  onMounted(() => {
    rootEl.value = document.documentElement;
    const canvas = canvasRef.value;
    if (!canvas) return;
    engine = createLetterGlitchEngine(
      canvas,
      () => settings.value,
      reducedMotion.value === 'reduce' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      wake,
    );
    if (!engine) return;
    if (document.fonts) {
      stopFonts = useEventListener(document.fonts, 'loadingdone', onFonts);
    }
    measure();
  });

  onBeforeUnmount(() => {
    pause();
    stopFonts?.();
    engine?.destroy();
    engine = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full overflow-hidden', props.class)"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 block size-full"
      aria-hidden="true"
    />
  </div>
</template>
