<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { usePreferredReducedMotion, useRafFn } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { parseEase } from './animated-content-ease';
  import {
    REST,
    WIPES,
    applyState,
    makePhase,
    revert,
    sample,
    setMask,
    settle,
    staggerOffsets,
  } from './animated-content-reveal';
  import type {
    AnimatedContentPhase,
    AnimatedContentProps,
    AnimatedContentState,
  } from './types';

  const props = withDefaults(defineProps<AnimatedContentProps>(), {
    container: null,
    distance: 100,
    direction: 'vertical',
    reverse: false,
    duration: 0.8,
    ease: 'power3.out',
    initialOpacity: 0,
    animateOpacity: true,
    scale: 1,
    blur: 0,
    rotate: 0,
    tilt: 0,
    wipe: 'none',
    threshold: 0.1,
    delay: 0,
    stagger: 0,
    staggerFrom: 'start',
    trigger: 'scroll',
    once: true,
    scrub: false,
    disappearAfter: 0,
    disappearDuration: 0.5,
    disappearEase: 'power3.in',
    class: '',
  });

  const emit = defineEmits<{
    start: [];
    complete: [];
    disappearanceComplete: [];
  }>();

  const rootRef = ref<HTMLDivElement>();
  const shown = ref(false);
  const reducedMotion = usePreferredReducedMotion();

  let targets: HTMLElement[] = [];
  let main: AnimatedContentPhase | null = null;
  let out: AnimatedContentPhase | null = null;
  let mask: string | null = null;
  let horizontal = false;
  let useBlur = false;
  let usePerspective = false;
  let time = 0;
  let dir: -1 | 0 | 1 = 0;
  let outTime = -1;
  let scrubTarget = 0;
  let scrubCurrent = 0;
  let detachScroll: (() => void) | null = null;

  function render(phase: AnimatedContentPhase, at: number) {
    targets.forEach((el, i) =>
      applyState(el, sample(phase, i, at), horizontal, useBlur, usePerspective),
    );
  }

  function complete() {
    emit('complete');
    if (props.scrub) return;
    for (const el of targets) settle(el, Boolean(mask));
    if (props.once && out) outTime = 0;
  }

  const { pause, resume, isActive } = useRafFn(
    ({ delta }) => {
      const dt = Math.min(delta / 1000, 0.1);
      let busy = false;
      if (main && props.scrub) {
        const smooth = typeof props.scrub === 'number' ? props.scrub : 0;
        const before = scrubCurrent;
        scrubCurrent =
          smooth > 0
            ? scrubCurrent +
              (scrubTarget - scrubCurrent) * (1 - Math.exp((-dt * 3) / smooth))
            : scrubTarget;
        if (Math.abs(scrubTarget - scrubCurrent) < 0.0005) {
          scrubCurrent = scrubTarget;
        } else busy = true;
        if (before === 0 && scrubCurrent > 0) emit('start');
        render(main, scrubCurrent * main.total);
        if (before < 1 && scrubCurrent >= 1) emit('complete');
      } else if (main && dir !== 0) {
        time = Math.min(main.total, Math.max(0, time + dt * dir));
        render(main, time);
        if (dir === 1 && time >= main.total) {
          dir = 0;
          complete();
        } else if (dir === -1 && time <= 0) {
          dir = 0;
        } else busy = true;
      }
      if (out && outTime >= 0) {
        outTime += dt;
        render(out, outTime);
        if (outTime >= out.total) {
          outTime = -1;
          emit('disappearanceComplete');
        } else busy = true;
      }
      if (!busy && outTime < 0) pause();
    },
    { immediate: false },
  );

  function wake() {
    if (!isActive.value) resume();
  }

  function play() {
    if (time === 0) emit('start');
    dir = 1;
    wake();
  }

  function rewind() {
    if (mask) for (const el of targets) setMask(el, mask);
    dir = -1;
    wake();
  }

  /** Layout top of the root, ignoring the transform this component applied. */
  function layoutTop(root: HTMLElement): number {
    if (targets[0] !== root) return root.getBoundingClientRect().top;
    const saved = root.style.transform;
    root.style.transform = 'none';
    const top = root.getBoundingClientRect().top;
    root.style.transform = saved;
    return top;
  }

  function resolveScroller(): HTMLElement | null {
    const c = props.container;
    if (!c) return null;
    return typeof c === 'string' ? document.querySelector<HTMLElement>(c) : c;
  }

  function watchScroll(root: HTMLElement) {
    const scroller = resolveScroller();
    let entered = false;
    const lines = () => {
      const top = scroller ? scroller.getBoundingClientRect().top : 0;
      const height = scroller ? scroller.clientHeight : window.innerHeight;
      const startPct = (1 - props.threshold) * 100;
      const endPct = Math.max(startPct - 45, 5);
      return {
        start: top + (startPct / 100) * height,
        end: top + (endPct / 100) * height,
      };
    };
    const check = () => {
      if (!main) return;
      const { start, end } = lines();
      const top = layoutTop(root);
      if (props.scrub) {
        scrubTarget = Math.min(
          1,
          Math.max(0, (start - top) / Math.max(start - end, 1)),
        );
        wake();
        return;
      }
      if (!entered && top <= start) {
        entered = true;
        play();
        if (props.once) detach();
      } else if (entered && !props.once && top > start) {
        entered = false;
        rewind();
      }
    };
    const source: HTMLElement | Window = scroller ?? window;
    source.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    const detach = () => {
      source.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      if (detachScroll === detach) detachScroll = null;
    };
    detachScroll = detach;
    check();
  }

  function teardown() {
    detachScroll?.();
    pause();
    for (const el of targets) revert(el);
    targets = [];
    main = null;
    out = null;
    dir = 0;
    time = 0;
    outTime = -1;
    scrubTarget = 0;
    scrubCurrent = 0;
  }

  function init() {
    const root = rootRef.value;
    if (!root) return;
    teardown();
    shown.value = true;
    const children = Array.from(root.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
    targets = props.stagger > 0 && children.length ? children : [root];
    if (reducedMotion.value === 'reduce') {
      emit('complete');
      return;
    }

    horizontal = props.direction === 'horizontal';
    const sign = props.reverse ? -1 : 1;
    mask = props.wipe !== 'none' ? WIPES[props.wipe] : null;
    useBlur = props.blur > 0;
    usePerspective = props.tilt !== 0;

    const from: AnimatedContentState = {
      offset: props.distance * sign,
      scale: props.scale,
      opacity: props.animateOpacity ? props.initialOpacity : 1,
      blur: props.blur,
      rotate: props.rotate ? props.rotate * sign : 0,
      tilt: props.tilt
        ? horizontal
          ? -props.tilt * sign
          : props.tilt * sign
        : 0,
      wipe: mask ? 0 : 1,
    };
    const offsets =
      props.stagger > 0
        ? staggerOffsets(targets.length, props.stagger, props.staggerFrom)
        : targets.map(() => 0);
    const base = props.scrub ? 0 : Math.max(props.delay, 0);
    main = makePhase(
      from,
      REST,
      offsets.map((o) => base + o),
      props.duration,
      parseEase(props.ease),
    );
    out =
      props.disappearAfter > 0 && !props.scrub
        ? makePhase(
            REST,
            {
              ...REST,
              offset: -props.distance * sign,
              scale: 0.8,
              opacity: props.animateOpacity ? props.initialOpacity : 0,
              blur: props.blur,
            },
            offsets.map((o) => props.disappearAfter + o),
            props.disappearDuration,
            parseEase(props.disappearEase),
          )
        : null;

    if (mask) for (const el of targets) setMask(el, mask);
    render(main, 0);

    if (props.trigger === 'mount') play();
    else watchScroll(root);
  }

  onMounted(init);
  watch([props, reducedMotion], init, { flush: 'post' });
  onBeforeUnmount(teardown);
</script>

<template>
  <div
    ref="rootRef"
    :class="cn(props.class)"
    :style="shown ? undefined : { visibility: 'hidden' }"
  >
    <slot />
  </div>
</template>
