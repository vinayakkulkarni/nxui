<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useIntersectionObserver } from '@vueuse/core';
  import { MotionConfig, motion } from 'motion-v';
  import { cn } from '~/lib/utils';
  import {
    CSS_EASE,
    MOVE_KEYS,
    buildEffect,
    buildKeyframes,
    buildRanks,
    startPhase,
    toVariant,
  } from './blur-text-effects';
  import type { CSSProperties } from 'vue';
  import type { Transition } from 'motion-v';
  import type { BlurTextPhase, BlurTextPiece, BlurTextProps } from './types';

  const props = withDefaults(defineProps<BlurTextProps>(), {
    text: '',
    delay: 200,
    animateBy: 'words',
    direction: 'top',
    threshold: 0.1,
    rootMargin: '0px',
    animationFrom: undefined,
    animationTo: undefined,
    easing: undefined,
    stepDuration: 0.35,
    blur: 10,
    distance: 50,
    effect: 'blur',
    staggerFrom: 'start',
    trigger: 'view',
    loop: false,
    loopDelay: 2,
    color: undefined,
    fromColor: undefined,
    focusOnHover: false,
    class: '',
  });

  const emit = defineEmits<{ animationComplete: [] }>();

  const INSTANT: Transition = { duration: 0 };
  const PIECE_STYLE: CSSProperties = {
    display: 'inline-block',
    willChange: 'transform, filter, opacity',
  };
  const WORD_STYLE: CSSProperties = { display: 'inline-flex' };

  const el = ref<HTMLElement | null>(null);
  const phase = ref<BlurTextPhase>(startPhase(props.trigger));
  const firstPhase = phase.value;
  const focusWord = ref(-1);
  let settled = phase.value === 'rest';

  const fx = computed(() =>
    buildEffect(props.effect, props.direction, props.blur, props.distance),
  );

  const custom = computed(() =>
    Boolean(props.animationFrom || props.animationTo || props.easing),
  );
  const fromSnapshot = computed(() => props.animationFrom ?? fx.value.from);
  const toSnapshots = computed(() => props.animationTo ?? fx.value.steps);
  const exitSnapshot = computed(() => props.animationFrom ?? fx.value.exit);
  const restSnapshot = computed(
    () => toSnapshots.value[toSnapshots.value.length - 1] ?? fromSnapshot.value,
  );
  const animateKeyframes = computed(() =>
    buildKeyframes(
      fromSnapshot.value,
      custom.value ? toSnapshots.value : [restSnapshot.value],
    ),
  );

  const stepCount = computed(() => toSnapshots.value.length + 1);
  const totalDuration = computed(
    () => props.stepDuration * (stepCount.value - 1),
  );
  const times = computed(() => {
    if (!props.animationTo) return fx.value.times;
    const count = stepCount.value;
    return Array.from({ length: count }, (_, i) =>
      count === 1 ? 0 : i / (count - 1),
    );
  });
  const stagger = computed(() => Math.max(0, props.delay) / 1000);
  const exitDuration = computed(() => props.stepDuration * 1.3);
  const exitStagger = computed(() => stagger.value * 0.4);

  const words = computed(() => props.text.split(' '));

  const pieces = computed(() => {
    const list: BlurTextPiece[] = [];
    words.value.forEach((word, w) => {
      const isLast = w === words.value.length - 1;
      if (props.animateBy === 'words') {
        list.push({
          word: w,
          content: isLast ? word : `${word}\u00A0`,
          key: `word-${w}`,
        });
        return;
      }
      Array.from(word).forEach((char, c) =>
        list.push({ word: w, content: char, key: `char-${w}-${c}` }),
      );
      if (!isLast) list.push({ word: w, content: '\u00A0', key: `space-${w}` });
    });
    return list;
  });

  const groups = computed(() => {
    const list: number[][] = words.value.map(() => []);
    pieces.value.forEach((piece, index) => list[piece.word]?.push(index));
    return list;
  });

  const ranks = computed(() =>
    buildRanks(pieces.value.length, props.staggerFrom, props.text),
  );
  const maxRank = computed(() =>
    ranks.value.reduce((max, rank) => Math.max(max, rank), 0),
  );
  const inTotal = computed(
    () =>
      (totalDuration.value *
        (custom.value ? 1 : Math.max(1, fx.value.settle * 2.2)) +
        maxRank.value * stagger.value) *
      1000,
  );
  const outTotal = computed(
    () => (exitDuration.value + maxRank.value * exitStagger.value) * 1000,
  );

  const { stop: stopObserver } = useIntersectionObserver(
    el,
    (entries) => {
      if (props.trigger !== 'view') return;
      if (entries.some((entry) => entry.isIntersecting)) {
        if (phase.value === 'from') phase.value = 'in';
        stopObserver();
      }
    },
    { threshold: props.threshold, rootMargin: props.rootMargin },
  );

  watch(
    () => props.trigger,
    (trigger) => {
      if (phase.value !== 'from') return;
      if (trigger === 'load') phase.value = 'in';
      else if (trigger === 'hover' || trigger === 'click') phase.value = 'rest';
    },
  );

  watch(
    [phase, () => props.loop, () => props.loopDelay, inTotal, outTotal],
    ([current, loop, loopDelay, inMs, outMs], _previous, onCleanup) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const scheduleOut = () => {
        if (loop) {
          timer = setTimeout(
            () => {
              phase.value = 'out';
            },
            Math.max(0, loopDelay) * 1000,
          );
        }
      };
      if (current === 'in') {
        settled = false;
        timer = setTimeout(() => {
          settled = true;
          emit('animationComplete');
          scheduleOut();
        }, inMs);
      } else if (current === 'rest') {
        settled = true;
        scheduleOut();
      } else if (current === 'out') {
        settled = false;
        timer = setTimeout(() => {
          phase.value = 'in';
        }, outMs);
      }
      onCleanup(() => clearTimeout(timer));
    },
    { immediate: true },
  );

  function replay(): void {
    if (phase.value === 'out' || phase.value === 'from') return;
    phase.value = 'out';
  }

  function onEnter(): void {
    if (props.trigger === 'hover' && settled) replay();
  }

  function onClick(): void {
    if (props.trigger === 'click') replay();
  }

  function onWordEnter(w: number): void {
    if (props.focusOnHover) focusWord.value = w;
  }

  function onWordLeave(): void {
    if (props.focusOnHover) focusWord.value = -1;
  }

  function inTransition(rank: number): Transition {
    const delayed = rank * stagger.value;
    if (custom.value) {
      return {
        duration: totalDuration.value,
        times: times.value,
        delay: delayed,
        ease: props.easing ?? 'linear',
      };
    }
    const transition: Transition = {
      duration: totalDuration.value,
      delay: delayed,
      ease: fx.value.fade,
    };
    if (fx.value.bounce === null) return transition;
    const move: Transition = {
      type: 'spring',
      visualDuration: totalDuration.value * fx.value.settle,
      bounce: fx.value.bounce,
      delay: delayed,
    };
    const overrides: Record<string, Transition> = {};
    MOVE_KEYS.forEach((key) => {
      if (key in fromSnapshot.value) overrides[key] = move;
    });
    return { ...transition, ...overrides };
  }

  const target = computed(() => {
    if (phase.value === 'in') return toVariant(animateKeyframes.value);
    if (phase.value === 'out') return toVariant(exitSnapshot.value);
    if (phase.value === 'rest') return toVariant(restSnapshot.value);
    return toVariant(fromSnapshot.value);
  });
  const initial = computed(() =>
    firstPhase === 'rest' ? false : toVariant(fromSnapshot.value),
  );
  const tinted = computed(
    () =>
      Boolean(props.fromColor) &&
      (phase.value === 'from' || phase.value === 'out'),
  );
  const dim = computed(() => Math.min(6, Math.max(2, props.blur * 0.3)));
  const pieceStyle = computed<CSSProperties>(() => {
    const origin = fx.value.origin;
    if (!origin || custom.value) return PIECE_STYLE;
    return {
      ...PIECE_STYLE,
      transformOrigin: `${origin.originX * 100}% ${origin.originY * 100}%`,
    };
  });

  function transitionFor(index: number): Transition {
    const rank = ranks.value[index] ?? 0;
    if (phase.value === 'in') return inTransition(rank);
    if (phase.value === 'out') {
      return {
        duration: exitDuration.value,
        ease: fx.value.exitEase,
        delay: rank * exitStagger.value,
      };
    }
    return INSTANT;
  }

  function styleFor(index: number): CSSProperties {
    if (!props.fromColor) return pieceStyle.value;
    const rank = ranks.value[index] ?? 0;
    let transition = 'none';
    if (phase.value === 'in') {
      transition = `color ${totalDuration.value * 0.9}s ${CSS_EASE} ${rank * stagger.value}s`;
    } else if (phase.value === 'out') {
      transition = `color ${exitDuration.value}s ${CSS_EASE} ${rank * exitStagger.value}s`;
    }
    return {
      ...pieceStyle.value,
      color: tinted.value ? props.fromColor : undefined,
      transition,
    };
  }

  function wordStyle(w: number): CSSProperties {
    if (!props.focusOnHover) return WORD_STYLE;
    const dimmed = focusWord.value !== -1 && focusWord.value !== w;
    return {
      ...WORD_STYLE,
      filter: dimmed ? `blur(${dim.value}px)` : 'blur(0px)',
      opacity: dimmed ? 0.3 : 1,
      transition: `filter 0.45s ${CSS_EASE}, opacity 0.45s ${CSS_EASE}`,
    };
  }

  const rootStyle = computed<CSSProperties>(() => ({
    color: props.color,
    cursor: props.trigger === 'click' ? 'pointer' : undefined,
  }));
</script>

<template>
  <MotionConfig reduced-motion="user">
    <p
      ref="el"
      :class="cn('flex flex-wrap', props.class)"
      :style="rootStyle"
      @pointerenter="onEnter"
      @click="onClick"
    >
      <span class="sr-only select-none">{{ text }}</span>
      <span
        v-for="(indices, w) in groups"
        :key="`word-${w}`"
        :style="wordStyle(w)"
        @pointerenter="onWordEnter(w)"
        @pointerleave="onWordLeave"
      >
        <component
          :is="motion.span"
          v-for="index in indices"
          :key="pieces[index]!.key"
          aria-hidden="true"
          :style="styleFor(index)"
          :initial="initial"
          :animate="target"
          :transition="transitionFor(index)"
        >
          {{ pieces[index]!.content }}
        </component>
      </span>
    </p>
  </MotionConfig>
</template>
