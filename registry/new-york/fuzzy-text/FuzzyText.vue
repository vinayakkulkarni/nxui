<script setup lang="ts">
  import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createFuzzyTextEngine } from './fuzzy-text-engine';
  import type {
    FuzzyTextEngine,
    FuzzyTextProps,
    FuzzyTextTuning,
  } from './types';

  const props = withDefaults(defineProps<FuzzyTextProps>(), {
    fontSize: 'clamp(2rem, 8vw, 8rem)',
    fontWeight: 900,
    fontFamily: 'inherit',
    color: 'currentColor',
    enableHover: true,
    baseIntensity: 0.18,
    hoverIntensity: 0.5,
    fuzzRange: 30,
    fps: 60,
    direction: 'horizontal',
    transitionDuration: 0,
    clickEffect: false,
    glitchMode: false,
    glitchInterval: 2000,
    glitchDuration: 200,
    gradient: null,
    letterSpacing: 0,
    sliceSize: 1,
    trigger: 'hover',
    intro: false,
    introDuration: 1400,
    colorSplit: 0,
    class: '',
  });

  const canvas = shallowRef<HTMLCanvasElement | null>(null);
  const engine = shallowRef<FuzzyTextEngine | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  const intro = { start: 0, done: !props.intro };
  let glitching = false;

  function getTuning(): FuzzyTextTuning {
    return {
      enableHover: props.enableHover,
      baseIntensity: props.baseIntensity,
      hoverIntensity: props.hoverIntensity,
      fps: props.fps,
      transitionDuration: props.transitionDuration,
      clickEffect: props.clickEffect,
      sliceSize: props.sliceSize,
      trigger: props.trigger,
      intro: props.intro,
      introDuration: props.introDuration,
      colorSplit: props.colorSplit,
    };
  }

  function isGlitching() {
    return glitching;
  }

  function prefersReduced() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  function rebuild() {
    engine.value?.destroy();
    engine.value = null;
    const el = canvas.value;
    if (!el) return;
    engine.value = createFuzzyTextEngine(
      el,
      {
        text: props.text,
        fontSize: props.fontSize,
        fontWeight: props.fontWeight,
        fontFamily: props.fontFamily,
        color: props.color,
        gradient: props.gradient,
        letterSpacing: props.letterSpacing,
        fuzzRange: props.fuzzRange,
        direction: props.direction,
      },
      {
        getTuning,
        isGlitching,
        reduceMotion: prefersReduced() || reducedMotion.value === 'reduce',
        intro,
      },
    );
  }

  const gradientKey = () =>
    Array.isArray(props.gradient) && props.gradient.length >= 2
      ? props.gradient.join('|')
      : '';

  onMounted(() => {
    rebuild();
    watch(
      [
        () => props.text,
        () => props.fontSize,
        () => props.fontWeight,
        () => props.fontFamily,
        () => props.color,
        gradientKey,
        () => props.letterSpacing,
        () => props.fuzzRange,
        () => props.direction,
        () => props.colorSplit > 0,
        reducedMotion,
      ],
      rebuild,
    );
  });

  watch(
    [
      () => props.glitchMode,
      () => props.glitchInterval,
      () => props.glitchDuration,
      canvas,
    ],
    ([enabled, interval, duration, el], _old, onCleanup) => {
      if (!enabled || !el || prefersReduced()) return;
      let startTimer: ReturnType<typeof setTimeout> | undefined;
      let endTimer: ReturnType<typeof setTimeout> | undefined;
      const schedule = () => {
        startTimer = setTimeout(() => {
          glitching = true;
          endTimer = setTimeout(() => {
            glitching = false;
            schedule();
          }, duration);
        }, interval);
      };
      schedule();
      onCleanup(() => {
        clearTimeout(startTimer);
        clearTimeout(endTimer);
        glitching = false;
      });
    },
  );

  useIntersectionObserver(canvas, ([entry]) => {
    engine.value?.setVisible(entry?.isIntersecting ?? true);
  });

  useEventListener('resize', () => engine.value?.resize());

  onBeforeUnmount(() => {
    engine.value?.destroy();
    engine.value = null;
  });

  function onPointerMove(event: PointerEvent) {
    engine.value?.pointerMove(event);
  }
  function onPointerUp(event: PointerEvent) {
    engine.value?.pointerUp(event);
  }
  function onPointerLeave() {
    engine.value?.pointerLeave();
  }
  function onClick() {
    engine.value?.click();
  }
</script>

<template>
  <canvas
    ref="canvas"
    :class="cn(props.class)"
    :style="trigger === 'click' ? { cursor: 'pointer' } : undefined"
    role="img"
    :aria-label="text"
    @pointermove="onPointerMove"
    @pointerdown="onPointerMove"
    @pointerup="onPointerUp"
    @pointerleave="onPointerLeave"
    @pointercancel="onPointerLeave"
    @click="onClick"
  ></canvas>
</template>
