<script setup lang="ts">
  import {
    computed,
    nextTick,
    onMounted,
    ref,
    useTemplateRef,
    watch,
    watchEffect,
  } from 'vue';
  import type { CSSProperties } from 'vue';
  import {
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
  } from '@vueuse/core';
  import { motion, useMotionValue, useSpring } from 'motion-v';
  import { cn } from '~/lib/utils';
  import {
    HOVER_SPEED,
    MAX_FLING,
    clamp,
    letterAngles,
  } from './circular-text-layout';
  import type { CircularTextMotionState } from './circular-text-layout';
  import type { CircularTextProps } from './types';

  const props = withDefaults(defineProps<CircularTextProps>(), {
    spinDuration: 20,
    onHover: 'speedUp',
    direction: 'clockwise',
    size: 200,
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: 0,
    color: '',
    startAngle: 0,
    fill: true,
    repeat: 1,
    ring: false,
    ringColor: '',
    tilt: 0,
    hoverTilt: 0,
    draggable: false,
    class: '',
  });

  const rootEl = useTemplateRef<HTMLElement>('rootEl');
  const reducedMotion = usePreferredReducedMotion();
  const reduce = computed(() => reducedMotion.value === 'reduce');

  const rotation = useMotionValue(0);
  const speed = useSpring(1, { stiffness: 60, damping: 18 });
  const scale = useSpring(1, { stiffness: 300, damping: 20 });
  const tiltX = useSpring(0, { stiffness: 150, damping: 18 });
  const tiltY = useSpring(0, { stiffness: 150, damping: 18 });

  const advances = ref<number[] | null>(null);
  const settled = ref(false);
  const dragging = ref(false);

  const glyphs = computed(() => Array.from(props.text ?? ''));
  const copies = computed(() => Math.max(1, Math.round(props.repeat) || 1));
  const letters = computed(() =>
    Array.from({ length: copies.value }, () => glyphs.value).flat(),
  );

  const angles = computed(() =>
    letterAngles({
      glyphs: glyphs.value,
      copies: copies.value,
      fill: props.fill,
      startAngle: props.startAngle,
      size: props.size,
      fontSize: props.fontSize,
      letterSpacing: props.letterSpacing,
      advances: advances.value,
    }),
  );

  const state: CircularTextMotionState = {
    hovering: false,
    dragging: false,
    fling: 0,
    cruise: 0,
    angle: null,
    travel: 0,
    samples: [],
  };

  function measure() {
    if (props.fill) return;
    const root = rootEl.value;
    if (!root) return;
    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>('[data-glyph]'),
    ).slice(0, glyphs.value.length);
    const widths = nodes.map((node) => node.offsetWidth);
    const prev = advances.value;
    if (
      prev &&
      prev.length === widths.length &&
      prev.every((width, i) => width === widths[i])
    ) {
      return;
    }
    advances.value = widths;
  }

  watch(
    [
      () => props.fill,
      glyphs,
      () => props.fontSize,
      () => props.fontWeight,
      () => props.class,
    ],
    () => nextTick(measure),
  );

  onMounted(() => {
    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    requestAnimationFrame(() => {
      settled.value = true;
    });
  });

  watchEffect(() => {
    const turn = props.direction === 'counterclockwise' ? -1 : 1;
    state.cruise =
      props.spinDuration > 0 && !reduce.value
        ? (360 / props.spinDuration) * turn
        : 0;
  });

  const { pause, resume } = useRafFn(
    ({ delta }) => {
      if (state.dragging || reduce.value) return;
      const dt = Math.min(delta, 100) / 1000;
      state.fling *= Math.exp(-dt / 0.7);
      if (Math.abs(state.fling) < 1) state.fling = 0;
      const velocity = state.cruise * speed.get() + state.fling;
      if (velocity) rotation.set((rotation.get() + velocity * dt) % 360);
    },
    { immediate: false },
  );

  useIntersectionObserver(rootEl, (entries) => {
    if (entries[0]?.isIntersecting) resume();
    else pause();
  });

  watch([() => props.hoverTilt, reduce], () => {
    if (props.hoverTilt && !reduce.value) return;
    tiltX.set(0);
    tiltY.set(0);
  });

  function applyScale() {
    const bonkers =
      state.hovering && props.onHover === 'goBonkers' && !reduce.value;
    scale.set((bonkers ? 0.8 : 1) * (state.dragging ? 0.96 : 1));
  }

  function pointerAngle(event: PointerEvent): number | null {
    const root = rootEl.value;
    if (!root) return null;
    const rect = root.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    if (Math.hypot(dx, dy) < rect.width * 0.06) return null;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }

  function onEnter() {
    state.hovering = true;
    if (props.onHover && !reduce.value) speed.set(HOVER_SPEED[props.onHover]);
    applyScale();
  }

  function onLeave() {
    state.hovering = false;
    speed.set(1);
    tiltX.set(0);
    tiltY.set(0);
    applyScale();
  }

  function onMove(event: PointerEvent) {
    const root = rootEl.value;
    if (!root) return;

    if (state.dragging) {
      const angle = pointerAngle(event);
      if (angle !== null) {
        if (state.angle !== null) {
          let delta = angle - state.angle;
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;
          state.travel += delta;
          rotation.set((rotation.get() + delta) % 360);
          state.samples.push([event.timeStamp, state.travel]);
          while (
            state.samples.length > 2 &&
            event.timeStamp - (state.samples[0]?.[0] ?? 0) > 100
          ) {
            state.samples.shift();
          }
        }
        state.angle = angle;
      }
    }

    if (!props.hoverTilt || reduce.value || event.pointerType === 'touch') {
      return;
    }
    const rect = root.getBoundingClientRect();
    const nx = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    const ny = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    tiltX.set(-ny * props.hoverTilt);
    tiltY.set(nx * props.hoverTilt);
  }

  function onDown(event: PointerEvent) {
    if (!props.draggable) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    state.dragging = true;
    state.fling = 0;
    state.angle = pointerAngle(event);
    state.travel = 0;
    state.samples = [[event.timeStamp, 0]];
    rootEl.value?.setPointerCapture(event.pointerId);
    dragging.value = true;
    applyScale();
  }

  function onUp(event: PointerEvent) {
    if (!state.dragging) return;
    state.dragging = false;
    dragging.value = false;
    applyScale();
    const [startTime, startTravel] = state.samples[0] ?? [event.timeStamp, 0];
    const lastTime = state.samples.at(-1)?.[0] ?? event.timeStamp;
    const elapsed = event.timeStamp - startTime;
    const velocity =
      elapsed > 0 && event.timeStamp - lastTime < 80
        ? ((state.travel - startTravel) / elapsed) * 1000
        : 0;
    state.fling = reduce.value
      ? 0
      : clamp(velocity, -MAX_FLING, MAX_FLING) - state.cruise * speed.get();
  }

  const rootStyle = computed<CSSProperties>(() => ({
    width: `${props.size}px`,
    height: `${props.size}px`,
    fontSize: `${props.fontSize}px`,
    fontWeight: props.fontWeight,
    color: props.color || undefined,
    perspective: `${props.size * 2.5}px`,
    cursor: props.draggable
      ? dragging.value
        ? 'grabbing'
        : 'grab'
      : undefined,
    touchAction: props.draggable ? 'none' : undefined,
    userSelect: props.draggable ? 'none' : undefined,
    WebkitUserSelect: props.draggable ? 'none' : undefined,
  }));

  const planeStyle = computed<CSSProperties | undefined>(() =>
    props.tilt ? { transform: `rotateX(${props.tilt}deg)` } : undefined,
  );

  const lineStyle = computed<CSSProperties>(() => ({
    borderWidth: `${Math.max(1, props.fontSize / 16)}px`,
    borderColor: props.ringColor || undefined,
    opacity: props.ring ? 1 : 0,
  }));
</script>

<template>
  <div
    ref="rootEl"
    :class="
      cn(
        'group relative mx-auto cursor-pointer rounded-full text-center',
        props.class,
      )
    "
    :data-settled="settled ? '' : undefined"
    :style="rootStyle"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @pointermove="onMove"
    @pointerdown="onDown"
    @pointerup="onUp"
    @pointercancel="onUp"
  >
    <motion.div
      class="absolute inset-0 transform-3d"
      :style="{ rotateX: tiltX, rotateY: tiltY, scale }"
    >
      <div
        class="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        :style="planeStyle"
      >
        <span
          aria-hidden="true"
          class="pointer-events-none absolute inset-[1.3em] rounded-full border-solid border-current transition-opacity duration-400 ease-[ease]"
          :style="lineStyle"
        ></span>
        <motion.div
          class="absolute inset-0"
          role="img"
          :aria-label="text"
          :style="{ rotate: rotation }"
        >
          <span
            v-for="(letter, i) in letters"
            :key="i"
            class="absolute inset-0 inline-block whitespace-pre group-data-settled:transition-transform group-data-settled:duration-500 group-data-settled:ease-[cubic-bezier(0,0,0,1)]"
            :style="{ transform: `rotate(${angles[i] ?? 0}deg)` }"
            ><span :data-glyph="i < glyphs.length ? '' : undefined">{{
              letter
            }}</span></span
          >
        </motion.div>
      </div>
      <div
        v-if="$slots.default"
        class="absolute inset-0 flex items-center justify-center"
      >
        <slot></slot>
      </div>
    </motion.div>
  </div>
</template>
