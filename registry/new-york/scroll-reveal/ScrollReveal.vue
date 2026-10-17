<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    RISE_MASK,
    SCRUB_SPAN,
    clamp01,
    clampToScroll,
    paintPiece,
    progressBetween,
    resetPiece,
    resolvePosition,
  } from './scroll-reveal-engine';
  import type { RevealLook, ScrollGeometry } from './scroll-reveal-engine';
  import type { ScrollRevealProps, ScrollRevealToken } from './types';

  const props = withDefaults(defineProps<ScrollRevealProps>(), {
    text: undefined,
    scrollContainer: undefined,
    enableBlur: true,
    baseOpacity: 0.1,
    baseRotation: 3,
    blurStrength: 4,
    baseOffset: 0,
    stagger: 0.05,
    smoothing: 0,
    splitBy: 'words',
    effect: 'fade',
    mode: 'scrub',
    duration: 0.8,
    highlightColor: '',
    textClass: '',
    rotationEnd: 'bottom bottom',
    wordAnimationEnd: 'bottom bottom',
    class: '',
  });

  const rootEl = useTemplateRef<HTMLElement>('rootEl');
  const textEl = useTemplateRef<HTMLElement>('textEl');
  const reducedMotion = usePreferredReducedMotion();

  const tokens = computed<ScrollRevealToken[] | null>(() => {
    if (props.text === undefined) return null;
    return props.text
      .split(/(\s+)/)
      .map((value) =>
        value.trim() === ''
          ? { kind: 'space', value }
          : { kind: 'word', value, chars: Array.from(value) },
      );
  });

  let active = false;
  let pieces: HTMLElement[] = [];
  let wrappers: HTMLElement[] = [];
  let order: number[] = [];
  let last: number[] = [];
  let count = 0;
  let span = SCRUB_SPAN;
  let gap = 0;
  let look: RevealLook | null = null;
  let progress = 0;
  let progressTarget = 0;
  let rotation = 0;
  let rotationTarget = 0;
  let played = false;
  let elapsed = 0;

  const total = () => span + Math.max(0, count - 1) * gap;

  function render() {
    if (!look) return;
    const at = progress * total();
    pieces.forEach((piece, index) => {
      const t = clamp01((at - (order[index] ?? index) * gap) / span);
      if (t === last[index]) return;
      last[index] = t;
      if (look) paintPiece(piece, t, look);
    });
  }

  function applyRotation() {
    const el = rootEl.value;
    if (!el) return;
    el.style.transformOrigin = props.baseRotation ? '0% 50%' : '';
    el.style.transform =
      props.baseRotation && Math.abs(rotation) > 0.0005
        ? `rotate(${rotation.toFixed(4)}deg)`
        : '';
  }

  function measure() {
    if (props.splitBy !== 'lines' || !wrappers.length) return;
    let line = -1;
    let top = -Infinity;
    wrappers.forEach((wrapper, index) => {
      const next = wrapper.offsetTop;
      if (Math.abs(next - top) > 2) {
        line += 1;
        top = next;
      }
      order[index] = line;
    });
    count = line + 1;
  }

  function geometry(): ScrollGeometry | null {
    const el = rootEl.value;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const height = el.offsetHeight;
    const center = rect.top + rect.height / 2;
    const scroller = props.scrollContainer;
    if (scroller) {
      const box = scroller.getBoundingClientRect();
      return {
        top:
          center -
          height / 2 -
          box.top -
          scroller.clientTop +
          scroller.scrollTop,
        height,
        view: scroller.clientHeight,
        scroll: scroller.scrollTop,
        maxScroll: scroller.scrollHeight - scroller.clientHeight,
      };
    }
    return {
      top: center - height / 2 + window.scrollY,
      height,
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
      if (props.mode === 'enter') {
        if (!played) return;
        elapsed += delta / 1000;
        progress = clamp01(elapsed / total());
        const turn = clamp01(elapsed / Math.min(total(), 1.4));
        rotation = props.baseRotation * Math.pow(1 - turn, 4);
        render();
        applyRotation();
        if (progress >= 1 && turn >= 1) pause();
        return;
      }
      const ease = 1 - Math.exp(-delta / ((props.smoothing * 1000) / 3));
      progress += (progressTarget - progress) * ease;
      rotation += (rotationTarget - rotation) * ease;
      const settled =
        Math.abs(progressTarget - progress) < 0.0005 &&
        Math.abs(rotationTarget - rotation) < 0.005;
      if (settled) {
        progress = progressTarget;
        rotation = rotationTarget;
      }
      render();
      applyRotation();
      if (settled) pause();
    },
    { immediate: false },
  );

  function update() {
    if (!active) return;
    const geo = geometry();
    if (!geo) return;
    const lead = 0.2 * Math.min(geo.height, geo.view);

    if (props.mode === 'enter') {
      if (played) return;
      const startAt = Math.min(geo.top - geo.view + lead, geo.maxScroll - 1);
      if (geo.scroll >= startAt) {
        played = true;
        elapsed = 0;
        resume();
      }
      return;
    }

    const start = resolvePosition(`top bottom-=${lead}`, geo);
    const end = resolvePosition(
      clampToScroll(props.wordAnimationEnd),
      geo,
      start,
    );
    progressTarget = progressBetween(geo.scroll, start, end);
    if (props.baseRotation) {
      const rotStart = resolvePosition('top bottom', geo);
      const rotEnd = resolvePosition(
        clampToScroll(props.rotationEnd),
        geo,
        rotStart,
      );
      rotationTarget =
        props.baseRotation *
        (1 - progressBetween(geo.scroll, rotStart, rotEnd));
    } else {
      rotationTarget = 0;
    }

    if (props.smoothing > 0) {
      resume();
    } else {
      progress = progressTarget;
      rotation = rotationTarget;
      render();
      applyRotation();
    }
  }

  function teardown() {
    active = false;
    pause();
    pieces.forEach(resetPiece);
    wrappers.forEach((wrapper) => {
      wrapper.style.clipPath = '';
    });
    const el = rootEl.value;
    if (el) {
      el.style.transform = '';
      el.style.transformOrigin = '';
    }
    look = null;
  }

  function setup() {
    teardown();
    const el = rootEl.value;
    const text = textEl.value;
    if (!el || !text) return;
    if (props.scrollContainer === null) return;
    if (reducedMotion.value === 'reduce') return;

    wrappers = Array.from(el.querySelectorAll<HTMLElement>('[data-sr-word]'));
    pieces = wrappers.length
      ? Array.from(el.querySelectorAll<HTMLElement>('[data-sr-piece]'))
      : [text];
    order = pieces.map((_, index) => index);
    last = pieces.map(() => -1);
    count = pieces.length;
    span = props.mode === 'enter' ? Math.max(0.05, props.duration) : SCRUB_SPAN;
    gap = Math.max(0, props.stagger);
    look = {
      effect: props.effect,
      masked: props.effect === 'rise' && wrappers.length > 0,
      baseOpacity: props.baseOpacity,
      blur: props.enableBlur ? props.blurStrength : 0,
      offset: props.baseOffset,
      highlightColor: props.highlightColor,
    };

    measure();
    const willChange =
      pieces.length > 80
        ? ''
        : props.effect === 'fade' && !props.baseOffset
          ? 'opacity'
          : 'opacity, transform';
    pieces.forEach((piece) => {
      piece.style.willChange = willChange;
      piece.style.transformOrigin = props.effect === 'flip' ? '50% 100%' : '';
    });
    if (look.masked) {
      wrappers.forEach((wrapper) => {
        wrapper.style.clipPath = RISE_MASK;
      });
    }

    active = true;
    played = false;
    elapsed = 0;
    progress = 0;
    progressTarget = 0;
    rotation = props.baseRotation;
    rotationTarget = props.baseRotation;
    render();
    applyRotation();
    update();
  }

  const scrollTarget = computed<HTMLElement | Window | null>(() => {
    if (props.scrollContainer) return props.scrollContainer;
    if (props.scrollContainer === null) return null;
    return typeof window === 'undefined' ? null : window;
  });

  useEventListener(scrollTarget, 'scroll', update, { passive: true });
  useEventListener('resize', update, { passive: true });

  useResizeObserver(textEl, () => {
    if (!active || props.splitBy !== 'lines') return;
    measure();
    last.fill(-1);
    render();
    update();
  });

  onMounted(setup);
  onBeforeUnmount(teardown);

  watch(
    [
      tokens,
      () => props.splitBy,
      () => props.effect,
      () => props.mode,
      () => props.duration,
      () => props.highlightColor,
      () => props.enableBlur,
      () => props.baseOpacity,
      () => props.baseRotation,
      () => props.blurStrength,
      () => props.baseOffset,
      () => props.stagger,
      () => props.smoothing,
      () => props.rotationEnd,
      () => props.wordAnimationEnd,
      () => props.scrollContainer,
      reducedMotion,
    ],
    setup,
    { flush: 'post' },
  );
</script>

<template>
  <h2 ref="rootEl" :class="cn('my-5', props.class)" :aria-label="text">
    <span
      ref="textEl"
      :class="
        cn(
          'block text-[clamp(1.6rem,4vw,3rem)] leading-normal font-semibold',
          textClass,
        )
      "
      :aria-hidden="tokens ? 'true' : undefined"
    >
      <template v-if="tokens">
        <template v-for="(token, index) in tokens" :key="index">
          <span v-if="token.kind === 'word'" data-sr-word class="inline-block"
            ><template v-if="splitBy === 'chars'"
              ><span
                v-for="(char, charIndex) in token.chars"
                :key="charIndex"
                data-sr-piece
                class="inline-block"
                >{{ char }}</span
              ></template
            ><span v-else data-sr-piece class="inline-block">{{
              token.value
            }}</span></span
          >
          <template v-else>{{ token.value }}</template>
        </template>
      </template>
      <slot v-else></slot>
    </span>
  </h2>
</template>
