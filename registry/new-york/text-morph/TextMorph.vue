<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    useId,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    TEXT_MORPH_BLUR,
    TEXT_MORPH_DEFAULT_WORDS,
    TEXT_MORPH_THRESHOLD,
    clamp,
    setLayerStyles,
    smoothstep,
  } from './text-morph-math';
  import type { TextMorphLayer, TextMorphProps } from './types';

  const props = withDefaults(defineProps<TextMorphProps>(), {
    words: () => ['IMAGINE', 'REFINE', 'RELEASE'],
    interval: 2600,
    morphDuration: 680,
    class: undefined,
  });

  const values = computed(() => {
    const filtered = props.words.filter((word) => word.trim().length > 0);
    return filtered.length > 0 ? filtered : TEXT_MORPH_DEFAULT_WORDS;
  });

  const currentIndex = ref(0);
  const stageRef = useTemplateRef<HTMLSpanElement>('stage');
  const currentLayerRef = useTemplateRef<HTMLSpanElement>('currentLayer');
  const nextLayerRef = useTemplateRef<HTMLSpanElement>('nextLayer');

  const motionPreference = usePreferredReducedMotion();
  const reducedMotion = computed(() => motionPreference.value === 'reduce');

  const filterId = `text-morph-threshold-${useId().replace(/[^\w-]/g, '')}`;
  const matrixValues = `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${TEXT_MORPH_THRESHOLD} ${-TEXT_MORPH_THRESHOLD * 0.46}`;

  const safeIndex = computed(() => currentIndex.value % values.value.length);
  const nextIndex = computed(() => (safeIndex.value + 1) % values.value.length);
  const currentWord = computed(() => values.value[safeIndex.value] ?? '');
  const nextWord = computed(() => values.value[nextIndex.value] ?? '');

  let morphing = false;
  let holdTimer: ReturnType<typeof setTimeout> | undefined;
  let morphStart = 0;
  let morphLength = 0;

  function measureStage(target: TextMorphLayer, immediate = false) {
    const stage = stageRef.value;
    const layer =
      target === 'current' ? currentLayerRef.value : nextLayerRef.value;
    if (!stage || !layer) return;

    // offsetWidth/offsetHeight ignore transforms, so both layers are measured
    // from their crisp resting geometry around the same center.
    const width = layer.offsetWidth;
    const height = layer.offsetHeight;
    if (immediate || reducedMotion.value) {
      const previousTransition = stage.style.transition;
      stage.style.transition = 'none';
      stage.style.width = `${width}px`;
      stage.style.height = `${height}px`;
      void stage.offsetWidth;
      stage.style.transition = previousTransition;
      return;
    }
    stage.style.width = `${width}px`;
    stage.style.height = `${height}px`;
  }

  function settleLayers() {
    const currentLayer = currentLayerRef.value;
    const nextLayer = nextLayerRef.value;
    const stage = stageRef.value;
    if (!currentLayer || !nextLayer || !stage) return;

    setLayerStyles(currentLayer, 1, 0, 1);
    setLayerStyles(
      nextLayer,
      0,
      reducedMotion.value ? 0 : TEXT_MORPH_BLUR,
      0.992,
    );
    currentLayer.style.willChange = 'auto';
    nextLayer.style.willChange = 'auto';
    stage.style.filter = 'none';
    const duration = Math.max(160, props.morphDuration);
    stage.style.transition = reducedMotion.value
      ? 'none'
      : `width ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), height ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    measureStage('current', true);
  }

  function finishMorph() {
    const currentLayer = currentLayerRef.value;
    const nextLayer = nextLayerRef.value;
    const stage = stageRef.value;
    if (stage) stage.style.filter = 'none';
    if (currentLayer) currentLayer.style.willChange = 'auto';
    if (nextLayer) nextLayer.style.willChange = 'auto';
    morphing = false;
    currentIndex.value = nextIndex.value;
  }

  const { pause: stopFrames, resume: startFrames } = useRafFn(
    ({ timestamp }) => {
      const currentLayer = currentLayerRef.value;
      const nextLayer = nextLayerRef.value;
      if (!currentLayer || !nextLayer) {
        stopFrames();
        morphing = false;
        return;
      }
      if (morphStart === 0) morphStart = timestamp;
      const progress = clamp((timestamp - morphStart) / morphLength);

      if (reducedMotion.value) {
        const eased = smoothstep(progress);
        setLayerStyles(currentLayer, 1 - eased, 0, 1);
        setLayerStyles(nextLayer, eased, 0, 1);
      } else {
        // The incoming layer starts early and the outgoing layer lingers.
        // Their overlap gives the threshold filter enough shared alpha.
        const incoming = smoothstep(clamp(progress / 0.82));
        const outgoing = smoothstep(clamp((progress - 0.18) / 0.82));
        setLayerStyles(
          currentLayer,
          Math.pow(1 - outgoing, 0.55),
          TEXT_MORPH_BLUR * outgoing,
          1 - outgoing * 0.012,
        );
        setLayerStyles(
          nextLayer,
          Math.pow(incoming, 0.55),
          TEXT_MORPH_BLUR * (1 - incoming),
          0.988 + incoming * 0.012,
        );
      }

      if (progress < 1) return;
      stopFrames();
      finishMorph();
    },
    { immediate: false },
  );

  function beginMorph() {
    const currentLayer = currentLayerRef.value;
    const nextLayer = nextLayerRef.value;
    const stage = stageRef.value;
    if (
      !currentLayer ||
      !nextLayer ||
      !stage ||
      morphing ||
      values.value.length < 2
    ) {
      return;
    }

    morphing = true;
    currentLayer.style.willChange = 'opacity, filter, transform';
    nextLayer.style.willChange = 'opacity, filter, transform';
    stage.style.filter = reducedMotion.value ? 'none' : `url(#${filterId})`;
    measureStage('next');

    morphStart = 0;
    morphLength = reducedMotion.value
      ? 140
      : Math.max(240, props.morphDuration);
    startFrames();
  }

  function clearHold() {
    if (holdTimer !== undefined) clearTimeout(holdTimer);
    holdTimer = undefined;
  }

  function scheduleHold() {
    clearHold();
    if (values.value.length < 2) return;
    holdTimer = setTimeout(beginMorph, Math.max(400, props.interval));
  }

  useResizeObserver([currentLayerRef, nextLayerRef], () => {
    if (!morphing) measureStage('current', true);
  });

  watch(
    [currentIndex, () => props.morphDuration, reducedMotion, values],
    settleLayers,
    { flush: 'post' },
  );

  watch([currentIndex, () => props.interval, () => values.value.length], () => {
    if (currentIndex.value >= values.value.length) {
      currentIndex.value = 0;
      return;
    }
    scheduleHold();
  });

  onMounted(() => {
    settleLayers();
    scheduleHold();
  });

  onBeforeUnmount(() => {
    clearHold();
    stopFrames();
  });
</script>

<template>
  <span
    :class="cn('relative inline-block max-w-full align-baseline', props.class)"
    :aria-label="currentWord"
    aria-live="off"
  >
    <svg
      aria-hidden="true"
      focusable="false"
      class="pointer-events-none absolute size-0 overflow-hidden"
    >
      <defs>
        <filter
          :id="filterId"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          color-interpolation-filters="sRGB"
        >
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            :values="matrixValues"
            result="thresholded"
          />
          <feComposite in="SourceGraphic" in2="thresholded" operator="atop" />
        </filter>
      </defs>
    </svg>

    <span
      ref="stage"
      aria-hidden="true"
      class="relative block max-w-full min-w-0 select-none"
    >
      <span
        ref="currentLayer"
        class="absolute top-0 left-1/2 block w-max origin-center whitespace-pre"
        style="transform: translateX(-50%)"
        >{{ currentWord }}</span
      >
      <span
        ref="nextLayer"
        class="absolute top-0 left-1/2 block w-max origin-center whitespace-pre opacity-0"
        style="filter: blur(12px); transform: translateX(-50%) scale(0.992)"
        >{{ nextWord }}</span
      >
    </span>
  </span>
</template>
