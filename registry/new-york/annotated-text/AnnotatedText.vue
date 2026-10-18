<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
  } from 'vue';
  import {
    useIntersectionObserver,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { annotationMarks } from './annotation-marks';
  import type { AnnotatedTextProps } from './types';

  const props = withDefaults(defineProps<AnnotatedTextProps>(), {
    variant: 'wavy',
    color: undefined,
    animate: true,
    delay: 0,
    duration: 0.65,
    class: '',
  });

  const root = ref<HTMLSpanElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const mark = computed(() => annotationMarks[props.variant]);
  const decorationClass = computed(() =>
    cn(mark.value.decoration, props.color ?? mark.value.color),
  );

  let animations: Animation[] = [];
  let pending = false;
  let visible = false;

  function cancelAll() {
    animations.forEach((animation) => animation.cancel());
    animations = [];
    pending = false;
  }

  function playPending() {
    if (!pending) return;
    pending = false;
    animations.forEach((animation) => animation.play());
  }

  function build() {
    cancelAll();
    const element = root.value;
    if (!element || !props.animate || reducedMotion.value === 'reduce') return;

    const drawings = element.querySelectorAll('[data-annotation-drawing]');
    animations = Array.from(drawings, (drawing, index) => {
      const reveal =
        drawing.getAttribute('data-annotation-drawing') === 'reveal';
      const opacity = Number(drawing.getAttribute('opacity') ?? 1);
      const animation = drawing.animate(
        reveal
          ? [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }]
          : [
              // A zero-length dash still paints a round cap. Keep it invisible
              // during the delay, then reveal it as the stroke begins moving.
              {
                strokeDasharray: '1',
                strokeDashoffset: '1',
                opacity: 0,
                offset: 0,
              },
              {
                strokeDasharray: '1',
                strokeDashoffset: '0.999',
                opacity,
                offset: 0.001,
              },
              {
                strokeDasharray: '1',
                strokeDashoffset: '0',
                opacity,
                offset: 1,
              },
            ],
        {
          duration: Math.max(0, props.duration) * 1000,
          delay: Math.max(0, props.delay) * 1000 + index * 160,
          easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
          fill: 'backwards',
        },
      );
      animation.pause();
      return animation;
    });
    pending = true;
    if (visible) playPending();
  }

  // Draw once, the first time a quarter of the mark is on screen.
  useIntersectionObserver(
    root,
    ([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible) playPending();
    },
    { threshold: 0.25 },
  );

  onMounted(build);

  watch(
    [
      () => props.animate,
      () => props.delay,
      () => props.duration,
      () => props.variant,
      reducedMotion,
    ],
    async () => {
      await nextTick();
      build();
    },
  );

  onBeforeUnmount(cancelAll);
</script>

<template>
  <span ref="root" :class="cn(mark.wrapper, props.class)">
    <!-- The mark is an opaque fill, so the words ride on top of it as ink. -->
    <span v-if="mark.behindText" class="relative z-10"><slot /></span>
    <slot v-else />

    <span
      v-if="mark.css"
      aria-hidden="true"
      data-annotation-drawing="reveal"
      :class="cn('block', decorationClass, mark.css)"
    />
    <svg
      v-else
      :class="cn(decorationClass, mark.behindText && 'z-0')"
      :viewBox="mark.viewBox"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        v-for="line in mark.strokes"
        :key="line.d"
        :d="line.d"
        pathLength="1"
        :data-annotation-drawing="line.fill ? 'reveal' : 'stroke'"
        :fill="line.fill ? 'currentColor' : 'none'"
        :stroke="line.fill ? 'none' : 'currentColor'"
        :stroke-width="line.fill ? undefined : (line.width ?? 2.4)"
        stroke-linecap="round"
        stroke-linejoin="round"
        :opacity="line.opacity"
      />
    </svg>
  </span>
</template>
