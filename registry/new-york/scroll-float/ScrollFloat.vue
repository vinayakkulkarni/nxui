<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    useTemplateRef,
    watch,
  } from 'vue';
  import type { CSSProperties } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { parseEase } from './scroll-float-ease';
  import {
    clamp01,
    clampToScroll,
    getDelays,
    paintFloat,
    preparePiece,
    progressBetween,
    resetPiece,
    resolvePosition,
  } from './scroll-float-engine';
  import type { FloatLook, ScrollGeometry } from './scroll-float-engine';
  import type { ScrollFloatProps, ScrollFloatToken } from './types';

  const props = withDefaults(defineProps<ScrollFloatProps>(), {
    text: undefined,
    scrollContainer: undefined,
    textClass: '',
    effect: 'float',
    splitBy: 'chars',
    direction: 'up',
    order: 'start',
    fromColor: 'currentColor',
    animationDuration: 1,
    ease: 'back.inOut(2)',
    scrollStart: 'center bottom+=50%',
    scrollEnd: 'bottom bottom-=40%',
    stagger: 0.03,
    distance: 120,
    stretch: 2.3,
    smoothing: 0,
    class: '',
  });

  const rootEl = useTemplateRef<HTMLElement>('rootEl');
  const textEl = useTemplateRef<HTMLElement>('textEl');
  const reducedMotion = usePreferredReducedMotion();

  const tokens = computed<ScrollFloatToken[] | null>(() => {
    if (props.text === undefined) return null;
    return props.text
      .split(/(\s+)/)
      .map((value) =>
        value.trim() === ''
          ? { kind: 'space', value }
          : { kind: 'word', value, chars: Array.from(value) },
      );
  });

  const shiftColor = computed(() =>
    props.fromColor && props.fromColor !== 'currentColor'
      ? props.fromColor
      : null,
  );

  const shiftStyle = computed<CSSProperties | undefined>(() =>
    shiftColor.value
      ? {
          color: `color-mix(in oklab, ${shiftColor.value} calc(var(--scroll-float-mix, 0) * 100%), currentColor)`,
        }
      : undefined,
  );

  let active = false;
  let targets: HTMLElement[] = [];
  let delays: number[] = [];
  let look: FloatLook | null = null;
  let duration = 1;
  let total = 1;
  let progress = 0;
  let progressTarget = 0;

  function render() {
    if (!look) return;
    const time = progress * total;
    targets.forEach((target, index) => {
      const q = clamp01((time - (delays[index] ?? 0)) / duration);
      if (look) paintFloat(target, index, q, look);
    });
  }

  function geometry(): ScrollGeometry | null {
    const el = rootEl.value;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const scroller = props.scrollContainer;
    if (scroller) {
      const box = scroller.getBoundingClientRect();
      return {
        top: rect.top - box.top - scroller.clientTop + scroller.scrollTop,
        height: el.offsetHeight,
        view: scroller.clientHeight,
        scroll: scroller.scrollTop,
        maxScroll: scroller.scrollHeight - scroller.clientHeight,
      };
    }
    return {
      top: rect.top + window.scrollY,
      height: el.offsetHeight,
      view: window.innerHeight,
      scroll: window.scrollY,
      maxScroll: document.documentElement.scrollHeight - window.innerHeight,
    };
  }

  const { pause, resume } = useRafFn(
    ({ delta }) => {
      if (!active) {
        pause();
        return;
      }
      const ease = 1 - Math.exp(-delta / ((props.smoothing * 1000) / 3));
      progress += (progressTarget - progress) * ease;
      const settled = Math.abs(progressTarget - progress) < 0.0005;
      if (settled) progress = progressTarget;
      render();
      if (settled) pause();
    },
    { immediate: false },
  );

  function update() {
    if (!active) return;
    const geo = geometry();
    if (!geo) return;
    const start = resolvePosition(props.scrollStart, geo);
    const end = resolvePosition(clampToScroll(props.scrollEnd), geo, start);
    progressTarget = progressBetween(geo.scroll, start, end);
    if (props.smoothing > 0) {
      resume();
    } else {
      progress = progressTarget;
      render();
    }
  }

  function fontSize(): number {
    const text = textEl.value;
    if (!text) return 16;
    return Number.parseFloat(getComputedStyle(text).fontSize) || 16;
  }

  function teardown() {
    active = false;
    pause();
    targets.forEach(resetPiece);
    targets = [];
    look = null;
  }

  function setup() {
    teardown();
    const el = rootEl.value;
    const text = textEl.value;
    if (!el || !text) return;
    if (props.scrollContainer === null) return;
    if (reducedMotion.value === 'reduce') return;

    const selector =
      props.splitBy === 'words' ? '[data-sf-word]' : '[data-sf-char]';
    const pieces = Array.from(el.querySelectorAll<HTMLElement>(selector));
    targets = pieces.length ? pieces : [text];
    delays = getDelays(targets.length, props.order, props.stagger);
    duration = Math.max(0.0001, props.animationDuration);
    total = duration + Math.max(0, ...delays);
    const stretch = props.stretch;
    look = {
      effect: props.effect,
      sign: props.direction === 'down' ? -1 : 1,
      reach: Math.max(0, Number(props.distance) || 0) / 120,
      stretch,
      squeeze: stretch > 0 ? stretch ** -0.43 : 1,
      size: fontSize(),
      count: targets.length,
      colorShift: shiftColor.value !== null,
      ease: parseEase(props.ease),
    };
    const current = look;
    targets.forEach((target) => preparePiece(target, current));

    active = true;
    progress = 0;
    progressTarget = 0;
    render();
    update();
  }

  function refresh() {
    if (!active || !look) return;
    const size = fontSize();
    if (size !== look.size) {
      look.size = size;
      const current = look;
      targets.forEach((target) => preparePiece(target, current));
      render();
    }
    update();
  }

  const scrollTarget = computed<HTMLElement | Window | null>(() => {
    if (props.scrollContainer) return props.scrollContainer;
    if (props.scrollContainer === null) return null;
    return typeof window === 'undefined' ? null : window;
  });

  useEventListener(scrollTarget, 'scroll', update, { passive: true });
  useEventListener('resize', refresh, { passive: true });
  useResizeObserver(textEl, refresh);

  onMounted(setup);
  onBeforeUnmount(teardown);

  watch(
    [
      tokens,
      shiftColor,
      () => props.effect,
      () => props.splitBy,
      () => props.direction,
      () => props.order,
      () => props.animationDuration,
      () => props.ease,
      () => props.scrollStart,
      () => props.scrollEnd,
      () => props.stagger,
      () => props.distance,
      () => props.stretch,
      () => props.smoothing,
      () => props.scrollContainer,
      reducedMotion,
    ],
    setup,
    { flush: 'post' },
  );
</script>

<template>
  <h2
    ref="rootEl"
    :class="
      cn(
        'my-5',
        effect === 'float'
          ? 'overflow-hidden'
          : 'overflow-visible overflow-x-clip',
        props.class,
      )
    "
  >
    <span v-if="tokens" class="sr-only">{{ text }}</span>
    <span
      ref="textEl"
      :class="
        cn(
          'inline-block text-center text-[clamp(1.6rem,8vw,10rem)] leading-normal font-black',
          textClass,
        )
      "
      :style="tokens ? undefined : shiftStyle"
      :aria-hidden="tokens ? 'true' : undefined"
    >
      <template v-if="tokens">
        <template v-for="(token, index) in tokens" :key="index">
          <span
            v-if="token.kind === 'word'"
            data-sf-word
            class="inline-block whitespace-nowrap"
            ><span
              v-for="(char, charIndex) in token.chars"
              :key="charIndex"
              data-sf-char
              class="inline-block"
              :style="shiftStyle"
              >{{ char }}</span
            ></span
          >
          <template v-else>{{ token.value }}</template>
        </template>
      </template>
      <slot v-else></slot>
    </span>
  </h2>
</template>
