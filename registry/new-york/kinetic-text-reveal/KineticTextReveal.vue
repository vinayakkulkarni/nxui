<script setup lang="ts">
  import { useMediaQuery } from '@vueuse/core';
  import type { $Transition } from 'motion-v';
  import { motion } from 'motion-v';
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
  } from 'vue';
  import { cn } from '~/lib/utils';

  type SplitMode = 'words' | 'characters' | 'lines';
  type RevealDirection = 'up' | 'down' | 'left' | 'right';
  type StaggerOrigin = 'start' | 'end' | 'center' | 'edges' | 'random' | number;

  export interface KineticTextRevealRef {
    play: () => void;
    reset: () => void;
  }

  const props = withDefaults(
    defineProps<{
      text: string;
      class?: string;
      segmentClass?: string;
      maskClass?: string;
      splitBy?: SplitMode;
      direction?: RevealDirection;
      distance?: number;
      stagger?: number;
      staggerFrom?: StaggerOrigin;
      transition?: $Transition;
      blur?: boolean;
      autoPlay?: boolean;
      delay?: number;
    }>(),
    {
      splitBy: 'words',
      direction: 'up',
      distance: 20,
      stagger: 0.075,
      staggerFrom: 'start',
      transition: () => ({ duration: 0.72, ease: [0.22, 1, 0.36, 1] }),
      blur: true,
      autoPlay: true,
      delay: 0,
      class: '',
      segmentClass: '',
      maskClass: '',
    },
  );

  const emit = defineEmits<{
    revealStart: [];
    revealComplete: [];
  }>();

  const shouldReduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const run = ref(0);
  const visible = ref(false);

  const segments = computed(() => getSegments(props.text, props.splitBy));
  const animatedTotal = computed(
    () => segments.value.filter((segment) => segment.animated).length,
  );

  function play() {
    visible.value = false;
    requestAnimationFrame(() => {
      run.value++;
      visible.value = true;
      emit('revealStart');
    });
  }

  function reset() {
    visible.value = false;
  }

  defineExpose<KineticTextRevealRef>({ play, reset });

  let autoPlayTimeout: ReturnType<typeof setTimeout> | undefined;

  function triggerAutoPlay() {
    if (autoPlayTimeout) clearTimeout(autoPlayTimeout);
    if (!props.autoPlay) return;
    visible.value = false;
    autoPlayTimeout = setTimeout(() => {
      run.value++;
      // flip to visible on the next frame so motion animates from initial
      nextTick(() => {
        visible.value = true;
        emit('revealStart');
      });
    }, props.delay * 1000);
  }

  onMounted(triggerAutoPlay);

  watch(
    [() => props.text, () => props.autoPlay, () => props.delay],
    triggerAutoPlay,
  );

  onBeforeUnmount(() => {
    if (autoPlayTimeout) clearTimeout(autoPlayTimeout);
  });

  const offset = computed(() => getOffset(props.direction, props.distance));

  interface Segment {
    value: string;
    animated: boolean;
    index: number;
  }

  function splitIntoGraphemes(value: string): string[] {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      const segmenter = new Intl.Segmenter('en', {
        granularity: 'grapheme',
      });
      return Array.from(segmenter.segment(value), ({ segment }) => segment);
    }
    return Array.from(value);
  }

  function getSegments(text: string, splitBy: SplitMode): Segment[] {
    let animatedIndex = 0;
    if (splitBy === 'lines') {
      return text.split('\n').map((line) => {
        const animated = line.length > 0;
        return {
          value: line,
          animated,
          index: animated ? animatedIndex++ : -1,
        };
      });
    }
    if (splitBy === 'characters') {
      return splitIntoGraphemes(text).map((character) => {
        const animated = !/\s/.test(character);
        return {
          value: character,
          animated,
          index: animated ? animatedIndex++ : -1,
        };
      });
    }
    return text.split(/(\s+)/).map((part) => {
      const animated = !/^\s+$/.test(part) && part.length > 0;
      return {
        value: part,
        animated,
        index: animated ? animatedIndex++ : -1,
      };
    });
  }

  function getDelay(
    index: number,
    total: number,
    stagger: number,
    staggerFrom: StaggerOrigin,
  ): number {
    if (typeof staggerFrom === 'number') {
      return Math.abs(staggerFrom - index) * stagger;
    }
    if (staggerFrom === 'end') return (total - 1 - index) * stagger;
    if (staggerFrom === 'center') {
      return Math.abs((total - 1) / 2 - index) * stagger;
    }
    if (staggerFrom === 'edges') {
      return Math.min(index, total - 1 - index) * stagger;
    }
    if (staggerFrom === 'random') {
      const seeded = Math.abs(Math.sin(index * 12.9898) * 43758.5453) % 1;
      return Math.floor(seeded * total) * stagger;
    }
    return index * stagger;
  }

  function getOffset(
    direction: RevealDirection,
    distance: number,
  ): { x: number; y: number } {
    if (direction === 'down') return { x: 0, y: -distance };
    if (direction === 'left') return { x: distance, y: 0 };
    if (direction === 'right') return { x: -distance, y: 0 };
    return { x: 0, y: distance };
  }

  function getTransitionForSegment(index: number): $Transition {
    if (shouldReduceMotion.value) {
      return { duration: 0.01 };
    }
    return {
      ...props.transition,
      delay: getDelay(
        index,
        animatedTotal.value,
        props.stagger,
        props.staggerFrom,
      ),
    };
  }

  function getInitialState() {
    if (shouldReduceMotion.value) {
      return { opacity: 0 };
    }
    return {
      opacity: 0,
      x: offset.value.x,
      y: offset.value.y,
      filter: props.blur ? 'blur(6px)' : 'blur(0px)',
    };
  }

  function getAnimatedState() {
    return {
      opacity: 1,
      x: 0,
      y: 0,
      filter: 'blur(0px)',
    };
  }
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex flex-wrap whitespace-pre-wrap align-baseline',
        splitBy === 'lines' && 'flex-col items-start',
        props.class,
      )
    "
    :aria-label="text"
  >
    <span class="sr-only">{{ text }}</span>
    <template v-for="(segment, index) in segments" :key="`${run}-${index}`">
      <!-- doctor-disable-next-line vue-doctor/template/no-computed-getter-in-template-loop -->
      <span v-if="!segment.animated" aria-hidden="true">{{
        segment.value
      }}</span>
      <span
        v-else
        :class="
          cn('inline-block overflow-hidden align-baseline pb-1', maskClass)
        "
        aria-hidden="true"
      >
        <component
          :is="motion.span"
          :initial="getInitialState()"
          :animate="visible ? getAnimatedState() : getInitialState()"
          :transition="getTransitionForSegment(segment.index)"
          :class="cn('inline-block will-change-transform', segmentClass)"
          @animation-complete="
            segment.index === animatedTotal - 1
              ? emit('revealComplete')
              : undefined
          "
        >
          <!-- doctor-disable-next-line vue-doctor/template/no-computed-getter-in-template-loop -->
          {{ segment.value }}
        </component>
      </span>
    </template>
  </span>
</template>
