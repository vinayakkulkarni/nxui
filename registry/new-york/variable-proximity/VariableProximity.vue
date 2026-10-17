<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import type { CSSProperties } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    createVariableProximityEngine,
    ensureRobotoFlex,
    measureLineStarts,
    parseAxes,
  } from './variable-proximity-engine';
  import type { VariableProximityEngine } from './variable-proximity-engine';
  import type {
    VariableProximityProps,
    VariableProximityState,
    VariableProximityWord,
  } from './types';

  const props = withDefaults(defineProps<VariableProximityProps>(), {
    fromFontVariationSettings: "'wght' 400, 'opsz' 9",
    toFontVariationSettings: "'wght' 1000, 'opsz' 40",
    containerRef: null,
    radius: 50,
    falloff: 'linear',
    smoothing: 0.2,
    fromColor: undefined,
    toColor: undefined,
    scale: 1,
    lift: 0,
    idleWave: false,
    fontSize: undefined,
    class: '',
  });

  const root = ref<HTMLElement | null>(null);
  const engine = shallowRef<VariableProximityEngine | null>(null);
  const lineStarts = ref<string | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const state: VariableProximityState = {
    pointer: { x: 0, y: 0, active: false },
    levels: [],
    targets: [],
  };
  let mounted = false;
  let lastWidth = -1;
  let measureFrame = 0;

  const axes = computed(() =>
    parseAxes(props.fromFontVariationSettings, props.toFontVariationSettings),
  );

  const words = computed<VariableProximityWord[]>(() => {
    let index = 0;
    return props.label.split(' ').map((word, wordIndex) => ({
      key: `${wordIndex}-${word}`,
      letters: word.split('').map((char) => ({ index: index++, char })),
    }));
  });

  const breakSet = computed(
    () =>
      new Set(lineStarts.value ? lineStarts.value.split(',').map(Number) : []),
  );

  const rootStyle = computed<CSSProperties>(() => ({
    display: 'inline',
    fontSize:
      props.fontSize === undefined
        ? undefined
        : typeof props.fontSize === 'number'
          ? `${props.fontSize}px`
          : props.fontSize,
    whiteSpace: lineStarts.value === null ? undefined : 'nowrap',
  }));

  const letterStyle = computed<CSSProperties>(() => ({
    display: 'inline-block',
    fontVariationSettings: props.fromFontVariationSettings,
    color: props.fromColor || undefined,
    transformOrigin: '50% 80%',
  }));

  function letters(): HTMLElement[] {
    return root.value
      ? [...root.value.querySelectorAll<HTMLElement>('[data-letter]')]
      : [];
  }

  function measureLines() {
    measureFrame = 0;
    const el = root.value;
    if (!el) return;
    const key = measureLineStarts(
      el,
      letters(),
      props.fromFontVariationSettings,
    );
    if (lineStarts.value !== key) lineStarts.value = key;
  }

  function queueMeasure() {
    if (!measureFrame) measureFrame = requestAnimationFrame(measureLines);
  }

  async function rebuild() {
    engine.value?.destroy();
    engine.value = null;
    await nextTick();
    if (!mounted) return;
    engine.value = createVariableProximityEngine(
      letters(),
      {
        axes: axes.value,
        fromFontVariationSettings: props.fromFontVariationSettings,
        container: props.containerRef,
        radius: props.radius,
        falloff: props.falloff,
        smoothing: props.smoothing,
        fromColor: props.fromColor,
        toColor: props.toColor,
        scale: props.scale,
        lift: props.lift,
        idleWave: props.idleWave,
        reducedMotion:
          reducedMotion.value === 'reduce' ||
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
      },
      state,
    );
  }

  onMounted(() => {
    mounted = true;
    ensureRobotoFlex();
    measureLines();
    void document.fonts?.ready.then(queueMeasure);
    void rebuild();
  });

  watch(
    [
      () => props.label,
      () => props.fromFontVariationSettings,
      () => props.fontSize,
    ],
    () => {
      if (mounted) void nextTick(measureLines);
    },
  );

  watch(
    [
      axes,
      () => props.fromFontVariationSettings,
      () => props.containerRef,
      () => props.radius,
      () => props.falloff,
      () => props.smoothing,
      () => props.fromColor,
      () => props.toColor,
      () => props.scale,
      () => props.lift,
      () => props.idleWave,
      () => props.fontSize,
      () => props.label,
      lineStarts,
      reducedMotion,
    ],
    () => {
      if (mounted) void rebuild();
    },
  );

  useResizeObserver(
    () => root.value?.parentElement ?? null,
    (entries) => {
      const width = entries[0]?.contentRect.width;
      if (width === undefined || Math.abs(width - lastWidth) < 1) return;
      lastWidth = width;
      queueMeasure();
    },
  );

  useIntersectionObserver(root, (entries) => {
    engine.value?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  function move(x: number, y: number) {
    state.pointer.x = x;
    state.pointer.y = y;
    state.pointer.active = true;
    engine.value?.schedule();
  }
  function leave() {
    state.pointer.active = false;
    engine.value?.schedule();
  }
  function schedule() {
    engine.value?.schedule();
  }

  useEventListener(
    'mousemove',
    (event: MouseEvent) => {
      move(event.clientX, event.clientY);
    },
    { passive: true },
  );
  useEventListener(
    'touchmove',
    (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) move(touch.clientX, touch.clientY);
    },
    { passive: true },
  );
  useEventListener('touchend', leave);
  useEventListener('touchcancel', leave);
  useEventListener('scroll', schedule, { capture: true, passive: true });
  useEventListener('resize', () => engine.value?.relayout());
  onMounted(() => {
    useEventListener(document.documentElement, 'mouseleave', leave);
  });

  onBeforeUnmount(() => {
    mounted = false;
    cancelAnimationFrame(measureFrame);
    engine.value?.destroy();
    engine.value = null;
  });
</script>

<template>
  <span
    ref="root"
    :class="cn('variable-proximity font-[Roboto_Flex,sans-serif]', props.class)"
    :style="rootStyle"
  >
    <template v-for="(word, wi) in words" :key="word.key">
      <br v-if="breakSet.has(wi)" />
      <span data-word class="inline-block whitespace-nowrap">
        <span
          v-for="letter in word.letters"
          :key="letter.index"
          data-letter
          :style="letterStyle"
          aria-hidden="true"
          >{{ letter.char }}</span
        >
        <span v-if="wi < words.length - 1" class="inline-block">&nbsp;</span>
      </span>
    </template>
    <span class="sr-only">{{ label }}</span>
  </span>
</template>
