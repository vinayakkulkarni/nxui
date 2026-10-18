<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { clamp, setupEchoText } from './echo-text-engine';
  import type { EchoTextProps } from './types';

  const props = withDefaults(defineProps<EchoTextProps>(), {
    text: 'Motion Echo',
    echoes: 12,
    lag: 0.24,
    offset: 36,
    direction: 'right',
    fade: 0.72,
    blur: 3,
    tint: '#7dd3fc',
    echoColors: undefined,
    echoStyle: 'solid',
    echoScale: 1,
    mode: 'both',
    trail: 'pointer',
    clickBurst: true,
    cursorRadius: 320,
    duration: 900,
    ease: 'ease-out',
    fontSize: 'clamp(3rem, 9vw, 7rem)',
    fontWeight: 800,
    color: 'currentColor',
    class: '',
  });

  const rootRef = ref<HTMLSpanElement | null>(null);
  const burstRef = ref<HTMLSpanElement | null>(null);
  const copies: Array<HTMLElement | null> = [];
  const reducedMotion = usePreferredReducedMotion();
  let teardown: (() => void) | null = null;

  const echoCount = computed(() =>
    reducedMotion.value === 'reduce'
      ? 0
      : clamp(Math.round(props.echoes), 0, 24),
  );
  const echoIndexes = computed(() =>
    Array.from(
      { length: echoCount.value },
      (_, index) => echoCount.value - index,
    ),
  );
  const canBurst = computed(() => props.clickBurst && echoCount.value > 0);

  const rootStyle = computed(() => ({
    fontSize:
      typeof props.fontSize === 'number'
        ? `${props.fontSize}px`
        : props.fontSize,
    fontWeight: props.fontWeight,
    color: props.color,
    cursor: canBurst.value ? 'pointer' : undefined,
  }));

  function echoColor(index: number): string | undefined {
    const ramp = props.echoColors;
    if (ramp && ramp.length) {
      const count = echoCount.value;
      const depth = count > 1 ? (index - 1) / (count - 1) : 0;
      return `color-mix(in srgb, ${ramp[ramp.length - 1]} ${Math.round(depth * 100)}%, ${ramp[0]})`;
    }
    return props.tint
      ? `color-mix(in srgb, ${props.tint} ${Math.min(72, 18 + index * 5)}%, currentColor)`
      : undefined;
  }

  function setCopy(index: number, el: unknown) {
    copies[index] = el instanceof HTMLElement ? el : null;
  }

  function setFront(el: unknown) {
    setCopy(0, el);
  }

  function stop() {
    teardown?.();
    teardown = null;
  }

  function start() {
    stop();
    const root = rootRef.value;
    if (!root || reducedMotion.value === 'reduce') return;
    copies.length = echoCount.value + 1;
    teardown = setupEchoText({
      root,
      burstLayer: burstRef.value,
      copies,
      echoCount: echoCount.value,
      direction: props.direction,
      offset: props.offset,
      cursorRadius: props.cursorRadius,
      lag: props.lag,
      fade: props.fade,
      blur: props.blur,
      echoScale: props.echoScale,
      duration: props.duration,
      ease: props.ease,
      mode: props.mode,
      trail: props.trail,
      clickBurst: props.clickBurst,
    });
  }

  watch(
    [
      () => props.blur,
      () => props.clickBurst,
      () => props.cursorRadius,
      () => props.direction,
      () => props.duration,
      () => props.ease,
      echoCount,
      () => props.echoScale,
      () => props.fade,
      () => props.lag,
      () => props.mode,
      () => props.offset,
      reducedMotion,
      () => props.trail,
    ],
    start,
    { flush: 'post' },
  );

  onMounted(start);
  onBeforeUnmount(stop);
</script>

<template>
  <span ref="rootRef" :class="['echo-text', props.class]" :style="rootStyle">
    <span
      v-for="index in echoIndexes"
      :key="`echo-${index}`"
      :ref="(el) => setCopy(index, el)"
      aria-hidden="true"
      :class="[
        'echo-text__echo',
        echoStyle === 'outline' && 'echo-text__echo--outline',
      ]"
      :data-echo-index="index"
      :style="{ color: echoColor(index), opacity: 0 }"
      >{{ text }}</span
    >
    <span ref="burstRef" aria-hidden="true" class="echo-text__bursts" />
    <span
      :ref="setFront"
      class="echo-text__echo echo-text__echo--front"
      data-echo-index="0"
      >{{ text }}</span
    >
  </span>
</template>

<style scoped>
  .echo-text {
    position: relative;
    display: inline-block;
    white-space: nowrap;
    line-height: 0.9;
    letter-spacing: -0.04em;
    user-select: none;
    -webkit-user-select: none;
    contain: layout style;
    font-kerning: normal;
    text-rendering: geometricPrecision;
  }

  .echo-text__echo {
    position: absolute;
    inset: 0;
    display: block;
    pointer-events: none;
    transform: translate3d(0, 0, 0);
    transform-origin: 50% 50%;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  .echo-text__bursts {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .echo-text__echo--outline {
    -webkit-text-fill-color: transparent;
    -webkit-text-stroke: max(1px, 0.014em) currentColor;
  }

  .echo-text__echo--front {
    position: relative;
    z-index: 2;
    opacity: 1;
    filter: none;
    text-shadow: 0 0.035em 0 rgba(255, 255, 255, 0.04);
    will-change: transform;
  }

  @media (prefers-reduced-motion: reduce) {
    .echo-text__echo:not(.echo-text__echo--front) {
      display: none;
    }

    .echo-text__echo--front {
      transform: none !important;
    }
  }
</style>
