<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { usePreferredReducedMotion, useRafFn } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import type { FlippingWordSwapLayer, FlippingWordSwapProps } from './types';
  import {
    characterStyle,
    resolveTiming,
    segmentCharacters,
  } from './flipping-word-swap-timeline';

  const props = withDefaults(defineProps<FlippingWordSwapProps>(), {
    duration: 400,
    stagger: 44,
    class: undefined,
    toClass: undefined,
    toStyle: undefined,
  });

  const reducedMotion = usePreferredReducedMotion();
  const isSwapped = ref(false);
  const playhead = ref(0);

  const firstChars = computed(() => segmentCharacters(props.word1));
  const secondChars = computed(() => segmentCharacters(props.word2));

  const timing = computed(() =>
    resolveTiming(
      props.duration,
      props.stagger,
      firstChars.value.length,
      secondChars.value.length,
      reducedMotion.value === 'reduce',
    ),
  );

  const end = computed(() => (timing.value.total > 0 ? timing.value.total : 1));

  const { pause, resume } = useRafFn(
    ({ delta }) => {
      const step = delta / 1000;
      const target = isSwapped.value ? end.value : 0;
      const next = isSwapped.value
        ? Math.min(target, playhead.value + step)
        : Math.max(target, playhead.value - step);
      playhead.value = next;
      if (next === target) pause();
    },
    { immediate: false },
  );

  function updateSwap(next: boolean) {
    isSwapped.value = next;
    if (timing.value.total <= 0) {
      pause();
      playhead.value = next ? end.value : 0;
      return;
    }
    resume();
  }

  watch(
    [
      () => props.duration,
      () => props.stagger,
      () => props.word1,
      () => props.word2,
      reducedMotion,
    ],
    () => {
      pause();
      playhead.value = isSwapped.value ? end.value : 0;
    },
  );

  function displayCharacter(character: string) {
    return character === ' ' ? '\u00A0' : character;
  }

  function styleFor(layer: FlippingWordSwapLayer, index: number) {
    return characterStyle(layer, index, playhead.value, timing.value);
  }

  function onMouseEnter() {
    updateSwap(true);
  }

  function onMouseLeave() {
    updateSwap(false);
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerType !== 'mouse') updateSwap(!isSwapped.value);
  }

  function onFocus(event: FocusEvent) {
    const target = event.currentTarget;
    if (target instanceof HTMLElement && target.matches(':focus-visible')) {
      updateSwap(true);
    }
  }

  function onBlur() {
    updateSwap(false);
  }
</script>

<template>
  <button
    type="button"
    :class="
      cn(
        'relative inline-grid cursor-pointer border-0 bg-transparent p-0 align-baseline font-[inherit] leading-[inherit] tracking-[inherit] text-inherit select-none',
        'rounded-[0.08em] focus-visible:ring-2 focus-visible:ring-current/30 focus-visible:ring-offset-2 focus-visible:outline-hidden',
        props.class,
      )
    "
    :aria-label="isSwapped ? props.word2 : props.word1"
    :aria-pressed="isSwapped"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @pointerup="onPointerUp"
    @focus="onFocus"
    @blur="onBlur"
  >
    <span
      class="col-start-1 row-start-1 inline-grid overflow-hidden perspective-midrange"
    >
      <span
        class="col-start-1 row-start-1 inline-flex items-baseline justify-center gap-[0.012em] whitespace-pre"
        aria-hidden="true"
      >
        <span
          v-for="(character, index) in firstChars"
          :key="`first-${index}-${character}`"
          class="inline-block whitespace-pre backface-hidden will-change-[transform,opacity]"
          :style="styleFor('first', index)"
          v-text="displayCharacter(character)"
        />
      </span>
      <span
        :class="
          cn(
            'col-start-1 row-start-1 inline-flex items-baseline justify-center gap-[0.012em] whitespace-pre',
            props.toClass,
          )
        "
        :style="props.toStyle"
        aria-hidden="true"
      >
        <span
          v-for="(character, index) in secondChars"
          :key="`second-${index}-${character}`"
          class="inline-block whitespace-pre backface-hidden will-change-[transform,opacity]"
          :style="styleFor('second', index)"
          v-text="displayCharacter(character)"
        />
      </span>
    </span>
  </button>
</template>
