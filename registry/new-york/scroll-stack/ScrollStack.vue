<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    ref,
    useSlots,
    watch,
  } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    flattenSlot,
    resolveOffset,
    scrollsInside,
    toLength,
  } from './scroll-stack-utils';
  import type { ScrollStackProps } from './types';

  const props = withDefaults(defineProps<ScrollStackProps>(), {
    itemDistance: 100,
    itemStackDistance: 24,
    stackPosition: '15%',
    itemScale: 0.05,
    baseScale: 0.8,
    dimAmount: 0.2,
    blurAmount: 0,
    tiltAmount: 0,
    rotationAmount: 0,
    holdDistance: 200,
    smoothScroll: true,
    snap: false,
    useWindowScroll: false,
    class: '',
  });

  const emit = defineEmits<{
    stackComplete: [];
  }>();

  const slots = useSlots();
  const rootRef = ref<HTMLElement | null>(null);
  const innerRef = ref<HTMLElement | null>(null);
  const endRef = ref<HTMLElement | null>(null);
  const mounted = ref(false);
  const reducedMotion = usePreferredReducedMotion();

  function entries() {
    const nodes = flattenSlot(slots.default?.() ?? []);
    return nodes.map((node, index) => ({
      node,
      index,
      key: node.key ?? index,
      spacer: index > 0 ? spacerStyle(index, nodes.length) : null,
      style: slotStyle(index, nodes.length),
    }));
  }

  function spacerStyle(index: number, count: number) {
    const gap = props.itemDistance - (count - index) * props.itemStackDistance;
    return {
      height: `${Math.max(0, gap)}px`,
      marginTop: `${Math.min(0, gap)}px`,
    };
  }

  function slotStyle(index: number, count: number) {
    return {
      top: `calc(${toLength(props.stackPosition)} + ${index * props.itemStackDistance}px)`,
      marginBottom: `${(count - 1 - index) * props.itemStackDistance}px`,
      zIndex: index + 1,
    };
  }

  const cache = new Map<string, string | number>();
  let frame = 0;
  let glide = 0;
  let rest = 0;
  let complete = false;
  let gliding = false;
  let pressed = false;
  let current = 0;
  let goal = 0;
  let written = 0;
  let last = 0;
  let points: number[] = [];
  let reach = 0;

  const windowed = () => props.useWindowScroll;
  const reduced = () => reducedMotion.value === 'reduce';

  function readScroll() {
    return windowed() ? window.scrollY : (rootRef.value?.scrollTop ?? 0);
  }

  function maxScroll() {
    const root = rootRef.value;
    if (windowed())
      return document.documentElement.scrollHeight - window.innerHeight;
    return root ? root.scrollHeight - root.clientHeight : 0;
  }

  function writeScroll(value: number) {
    written = value;
    const target = windowed() ? window : rootRef.value;
    target?.scrollTo({ top: value, behavior: 'instant' });
  }

  function write(
    key: string,
    value: string | number,
    apply: (value: string | number) => void,
  ) {
    if (cache.get(key) === value) return false;
    cache.set(key, value);
    apply(value);
    return true;
  }

  function update() {
    frame = 0;
    const root = rootRef.value;
    const inner = innerRef.value;
    const end = endRef.value;
    if (!root || !inner || !end) return;
    const slotEls = Array.from(inner.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child.hasAttribute('data-stack-slot'),
    );
    if (!slotEls.length) return;

    const isWindow = windowed();
    const viewHeight = isWindow ? window.innerHeight : root.clientHeight;
    const viewTop = isWindow
      ? 0
      : root.getBoundingClientRect().top + root.clientTop;
    const stackTop = resolveOffset(props.stackPosition, viewHeight);
    const offset = props.itemStackDistance;
    const heights = slotEls.map((slot) => slot.offsetHeight);
    const tops = slotEls.map((slot) => slot.getBoundingClientRect().top);
    const lastPin = stackTop + (slotEls.length - 1) * offset;
    const padTop = isWindow ? 0 : stackTop;
    const lastHeight = heights[heights.length - 1] ?? 0;
    const endHeight =
      props.holdDistance +
      (isWindow ? 0 : Math.max(0, viewHeight - lastPin - lastHeight));

    let moved = write('padTop', padTop, (value) => {
      inner.style.paddingTop = `${value}px`;
    });
    moved =
      write('endHeight', endHeight, (value) => {
        end.style.height = `${value}px`;
      }) || moved;

    let flow =
      inner.getBoundingClientRect().top - viewTop + readScroll() + padTop;
    points = heights.map((height, i) => {
      const point = flow - stackTop - i * offset;
      flow += height + props.itemDistance;
      return point;
    });
    reach = Math.max(40, ((heights[0] ?? 0) + props.itemDistance - offset) / 2);

    const depths = slotEls.map(() => 0);
    let lastCover = 0;
    for (let j = 1; j < slotEls.length; j++) {
      const pinBefore = viewTop + stackTop + (j - 1) * offset;
      const start = pinBefore + (heights[j - 1] ?? 0);
      const span = Math.max(1, start - pinBefore - offset);
      const cover = Math.min(1, Math.max(0, (start - (tops[j] ?? 0)) / span));
      for (let i = 0; i < j; i++) depths[i] = (depths[i] ?? 0) + cover;
      lastCover = cover;
    }

    const dimStep = Math.min(Math.max(props.dimAmount, 0), 1);
    slotEls.forEach((slot, i) => {
      const card = slot.firstElementChild;
      if (!(card instanceof HTMLElement)) return;
      const depth = depths[i] ?? 0;
      const lean = Math.min(depth, 1);
      const scale = Math.max(
        Math.min(props.baseScale, 1),
        1 - depth * props.itemScale,
      );
      const tilt = -lean * props.tiltAmount;
      const turn = lean * props.rotationAmount * (i % 2 ? -1 : 1);
      const blur = depth * props.blurAmount;
      const dim = 1 - Math.pow(1 - dimStep, depth);
      const transform =
        depth < 0.0005
          ? ''
          : `perspective(1200px) rotateX(${tilt.toFixed(2)}deg) rotate(${turn.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      write(`transform${i}`, transform, (value) => {
        card.style.transform = String(value);
      });
      write(
        `filter${i}`,
        blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : '',
        (value) => {
          card.style.filter = String(value);
        },
      );
      write(`dim${i}`, dim.toFixed(3), (value) => {
        card.style.setProperty('--scroll-stack-dim', String(value));
      });
    });

    const done = slotEls.length > 1 && lastCover >= 0.999;
    if (done !== complete) {
      complete = done;
      if (done) emit('stackComplete');
    }

    if (moved) schedule();
  }

  function schedule() {
    if (!mounted.value) return;
    if (!frame) frame = requestAnimationFrame(update);
  }

  function stopGlide() {
    gliding = false;
    cancelAnimationFrame(glide);
    glide = 0;
  }

  function step(now: number) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (Math.abs(readScroll() - written) > 2) {
      stopGlide();
      settleSoon();
      return;
    }
    current += (goal - current) * (1 - Math.pow(0.9, dt * 60));
    if (Math.abs(goal - current) < 0.5) current = goal;
    writeScroll(current);
    if (current === goal) {
      stopGlide();
      settleSoon();
      return;
    }
    glide = requestAnimationFrame(step);
  }

  function glideTo(value: number) {
    goal = Math.min(Math.max(value, 0), maxScroll());
    if (reduced()) {
      writeScroll(goal);
      return;
    }
    if (gliding) return;
    gliding = true;
    current = readScroll();
    written = current;
    last = performance.now();
    glide = requestAnimationFrame(step);
  }

  function settle() {
    rest = 0;
    if (!props.snap || gliding || pressed || !points.length) return;
    const now = readScroll();
    const nearest = points.reduce((best, point) =>
      Math.abs(point - now) < Math.abs(best - now) ? point : best,
    );
    const gap = Math.abs(nearest - now);
    if (gap > 1 && gap < reach) glideTo(nearest);
  }

  function settleSoon() {
    window.clearTimeout(rest);
    rest = window.setTimeout(settle, 140);
  }

  function onScroll() {
    schedule();
    if (!gliding) settleSoon();
  }

  function onWheel(event: WheelEvent) {
    const root = rootRef.value;
    if (
      !root ||
      !props.smoothScroll ||
      reduced() ||
      event.defaultPrevented ||
      event.ctrlKey
    )
      return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const isWindow = windowed();
    const page = isWindow ? window.innerHeight : root.clientHeight;
    const delta =
      event.deltaY *
      (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? page : 1);
    if (
      !delta ||
      scrollsInside(event.target, isWindow ? document.body : root, delta)
    )
      return;
    const base = gliding ? goal : readScroll();
    if ((delta < 0 && base <= 0) || (delta > 0 && base >= maxScroll() - 0.5))
      return;
    event.preventDefault();
    window.clearTimeout(rest);
    glideTo(base + delta);
  }

  function onPress() {
    pressed = true;
    window.clearTimeout(rest);
  }

  function onRelease() {
    if (!pressed) return;
    pressed = false;
    settleSoon();
  }

  const scrollTarget = computed(() => {
    if (!mounted.value) return null;
    return props.useWindowScroll ? window : rootRef.value;
  });
  const releaseTarget = computed(() => (mounted.value ? window : null));

  useEventListener(scrollTarget, 'scroll', onScroll, { passive: true });
  useEventListener(scrollTarget, 'wheel', onWheel, { passive: false });
  useEventListener(scrollTarget, 'pointerdown', onPress, { passive: true });
  useEventListener(releaseTarget, 'pointerup', onRelease, { passive: true });
  useEventListener(releaseTarget, 'pointercancel', onRelease, {
    passive: true,
  });
  useEventListener(releaseTarget, 'resize', schedule);
  useResizeObserver([rootRef, innerRef], schedule);

  watch(props, schedule);
  onUpdated(schedule);

  watch(
    () => props.useWindowScroll,
    () => {
      stopGlide();
      window.clearTimeout(rest);
      cache.clear();
      complete = false;
      schedule();
    },
  );

  onMounted(() => {
    mounted.value = true;
    update();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(frame);
    stopGlide();
    window.clearTimeout(rest);
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="
      cn(
        'scroll-stack relative w-full',
        useWindowScroll
          ? 'scroll-stack--window'
          : 'scroll-stack--contained h-full overflow-x-hidden overflow-y-auto',
        props.class,
      )
    "
  >
    <div
      ref="innerRef"
      class="scroll-stack__inner relative px-[clamp(1rem,6%,5rem)]"
    >
      <template v-for="entry in entries()" :key="entry.key">
        <div v-if="entry.spacer" aria-hidden="true" :style="entry.spacer" />
        <div
          data-stack-slot=""
          class="scroll-stack__slot sticky"
          :style="entry.style"
        >
          <component :is="entry.node" />
        </div>
      </template>
      <div ref="endRef" class="scroll-stack__end" aria-hidden="true" />
    </div>
  </div>
</template>
