<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    useTemplateRef,
    watch,
  } from 'vue';
  import { animate, motionValue } from 'motion-v';
  import type { MotionValue } from 'motion-v';
  import { usePreferredReducedMotion, useResizeObserver } from '@vueuse/core';
  import type {
    RubberSegmentDrag,
    RubberSegmentOption,
    RubberSegmentProps,
    RubberSegmentSlot,
  } from './types';
  import {
    DEADZONE,
    DILATE,
    EASE_OUT,
    FLICK,
    HANDOFF,
    MAX_VELOCITY,
    SIZES,
    SLOP,
    SPRING_MOMENTUM,
    SPRING_RELAX,
    SPRING_UI,
    clamp,
    nearestSlot,
    project,
    rubber,
    velocityOf,
  } from './rubber-segment-math';

  const props = withDefaults(defineProps<RubberSegmentProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    trackColor: '#27272a',
    thumbColor: '#fafafa',
    textColor: '#fafafa',
    activeTextColor: '#18181b',
    size: 'md',
    radius: 10,
    inset: 3,
    equalSlots: true,
    stretch: 100,
    squash: 3,
    speed: 1,
    glide: 75,
    draggable: true,
    disabled: false,
    ariaLabel: 'Segmented control',
    class: '',
  });

  const emit = defineEmits<{
    'update:modelValue': [value: string];
    change: [value: string, index: number];
  }>();

  const list = computed<RubberSegmentOption[]>(() =>
    props.items.map((item) =>
      typeof item === 'string' ? { value: item, label: item } : item,
    ),
  );
  const inner = ref<string | undefined>(
    props.defaultValue ?? list.value[0]?.value,
  );
  const current = computed(() =>
    props.modelValue !== undefined ? props.modelValue : inner.value,
  );
  const index = computed(() =>
    Math.max(
      0,
      list.value.findIndex((item) => item.value === current.value),
    ),
  );

  const reducedMotion = usePreferredReducedMotion();
  const reduce = computed(() => reducedMotion.value === 'reduce');

  const trackRef = useTemplateRef<HTMLDivElement>('track');
  const thumbRef = useTemplateRef<HTMLDivElement>('thumb');

  let slots: RubberSegmentSlot[] = [];
  let box: DOMRect | null = null;
  let committed = index.value;
  let handoff: ReturnType<typeof setTimeout> | undefined;
  let drag: RubberSegmentDrag | null = null;
  let gen = 0;
  let measured = false;

  const edgeL = motionValue(0);
  const edgeR = motionValue(0);
  const innerW = motionValue(0);
  const thumbRadius = computed(() => Math.max(0, props.radius - props.inset));
  const preset = computed(() => SIZES[props.size] ?? SIZES.md);

  const trackStyle = computed(() => ({
    '--rs-track': props.trackColor,
    '--rs-thumb': props.thumbColor,
    '--rs-ink': props.textColor,
    '--rs-ink-active': props.activeTextColor,
    '--rs-radius': `${props.radius}px`,
    '--rs-inset': `${props.inset}px`,
    '--rs-thumb-radius': `${thumbRadius.value}px`,
    '--rs-h': `${preset.value.height}px`,
    '--rs-font': `${preset.value.font}px`,
    '--rs-pad': `${preset.value.pad}px`,
    '--rs-min': `${preset.value.min}px`,
  }));

  function paint() {
    const el = thumbRef.value;
    if (!el || !measured) return;
    const right = Math.max(0, innerW.get() - edgeR.get());
    const left = Math.max(0, edgeL.get());
    el.style.clipPath = `inset(0 ${right}px 0 ${left}px round ${thumbRadius.value}px)`;
  }

  const unsubscribers = [
    edgeL.on('change', paint),
    edgeR.on('change', paint),
    innerW.on('change', paint),
  ];

  function t(seconds: number): number {
    return seconds / props.speed;
  }

  function buttons(): HTMLButtonElement[] {
    const track = trackRef.value;
    if (!track) return [];
    return Array.from(
      track.querySelectorAll<HTMLButtonElement>(
        ':scope > .rubber-segment__item',
      ),
    );
  }

  function jumpTo(i: number) {
    const s = slots[i];
    if (!s) return;
    clearTimeout(handoff);
    gen += 1;
    edgeL.jump(s.l);
    edgeR.jump(s.r);
  }

  function measure() {
    const track = trackRef.value;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    box = rect;
    const els = buttons();
    slots = list.value.map((_, i) => {
      const el = els[i];
      if (!el) return { l: 0, r: 0 };
      const r = el.getBoundingClientRect();
      return {
        l: r.left - rect.left - props.inset,
        r: r.right - rect.left - props.inset,
      };
    });
    measured = true;
    innerW.set(rect.width - props.inset * 2);
    jumpTo(committed);
    paint();
  }

  useResizeObserver(trackRef, measure);

  onMounted(() => {
    measure();
    document.fonts?.ready.then(measure);
  });

  watch(
    [
      () => list.value.map((item) => item.value).join('|'),
      () => props.size,
      () => props.inset,
      () => props.equalSlots,
      () => props.radius,
    ],
    measure,
    { flush: 'post' },
  );

  watch(
    index,
    (i) => {
      if (!drag && committed !== i) {
        committed = i;
        jumpTo(i);
      }
    },
    { flush: 'post' },
  );

  onBeforeUnmount(() => {
    clearTimeout(handoff);
    edgeL.stop();
    edgeR.stop();
    unsubscribers.forEach((off) => off());
  });

  function commit(i: number) {
    committed = i;
    if (i === index.value) return;
    const item = list.value[i];
    if (!item) return;
    if (props.modelValue === undefined) inner.value = item.value;
    emit('update:modelValue', item.value);
    emit('change', item.value, i);
  }

  function velocityFor(mv: MotionValue<number>, v: number | null): number {
    return clamp(
      v === null ? mv.getVelocity() : v,
      -MAX_VELOCITY,
      MAX_VELOCITY,
    );
  }

  function land(
    to: number,
    v: number | null,
    flick: boolean,
    withSquash: boolean,
  ) {
    const b = slots[to];
    if (!b) return;
    gen += 1;
    const g = gen;
    const dir =
      Math.sign((b.l + b.r) / 2 - (edgeL.get() + edgeR.get()) / 2) || 1;
    const lead = dir > 0 ? edgeR : edgeL;
    const leadTo = dir > 0 ? b.r : b.l;
    const trail = dir > 0 ? edgeL : edgeR;
    const trailTo = dir > 0 ? b.l : b.r;
    animate(lead, leadTo, {
      ...(flick ? SPRING_MOMENTUM : SPRING_UI),
      duration: t(flick ? 0.4 : 0.3),
      velocity: velocityFor(lead, v),
    });
    const trailVelocity = velocityFor(trail, v);
    if (!withSquash || props.squash <= 0) {
      animate(trail, trailTo, {
        ...SPRING_UI,
        duration: t(0.3),
        velocity: trailVelocity,
      });
      return;
    }
    animate(trail, trailTo + dir * props.squash, {
      ...SPRING_UI,
      duration: t(0.3),
      velocity: trailVelocity,
    }).then(() => {
      if (gen === g) {
        animate(trail, trailTo, { ...SPRING_RELAX, duration: t(0.16) });
      }
    });
  }

  function travel(from: number, to: number) {
    const a = slots[from];
    const b = slots[to];
    if (!a || !b) return;
    clearTimeout(handoff);
    gen += 1;
    if (reduce.value) {
      edgeL.jump(b.l);
      edgeR.jump(b.r);
      return;
    }
    const u = props.stretch / 100;
    const tween = { duration: t(DILATE), ease: EASE_OUT };
    animate(edgeL, b.l + (Math.min(a.l, b.l) - b.l) * u, tween);
    animate(edgeR, b.r + (Math.max(a.r, b.r) - b.r) * u, tween);
    handoff = setTimeout(() => land(to, null, false, true), t(HANDOFF) * 1000);
  }

  function localX(e: PointerEvent): number {
    return e.clientX - (box ? box.left : 0) - props.inset;
  }

  function slotOf(e: Event): number {
    const target = e.currentTarget;
    if (!(target instanceof HTMLElement)) return -1;
    return Number(target.dataset.index ?? -1);
  }

  function handlePointerDown(e: PointerEvent) {
    if (props.disabled || drag || e.button !== 0) return;
    const target = e.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    const i = slotOf(e);
    box = trackRef.value?.getBoundingClientRect() ?? null;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // capture is best-effort
    }
    const x = localX(e);
    const onThumb = props.draggable && x >= edgeL.get() && x <= edgeR.get();
    drag = {
      id: e.pointerId,
      x0: x,
      slot: i,
      onThumb,
      live: false,
      offset: 0,
      w: 0,
      hist: [[e.timeStamp, x]],
    };
    if (onThumb) {
      clearTimeout(handoff);
      gen += 1;
      edgeL.stop();
      edgeR.stop();
    } else if (!reduce.value) {
      target.dataset.pressed = '';
    }
  }

  function handlePointerMove(e: PointerEvent) {
    const d = drag;
    if (!d || e.pointerId !== d.id || !d.onThumb) return;
    const x = localX(e);
    d.hist.push([e.timeStamp, x]);
    if (d.hist.length > 8) d.hist.shift();
    if (!d.live) {
      if (Math.abs(x - d.x0) < DEADZONE) return;
      d.live = true;
      d.offset = x - edgeL.get();
      d.w = edgeR.get() - edgeL.get();
      if (trackRef.value) trackRef.value.dataset.held = '';
    }
    const width = innerW.get();
    const l = x - d.offset;
    const maxL = width - d.w;
    if (reduce.value) {
      const c = clamp(l, 0, maxL);
      edgeL.set(c);
      edgeR.set(c + d.w);
    } else if (l < 0) {
      edgeL.set(0);
      edgeR.set(d.w - rubber(-l, d.w));
    } else if (l > maxL) {
      edgeR.set(width);
      edgeL.set(maxL + rubber(l - maxL, d.w));
    } else {
      edgeL.set(l);
      edgeR.set(l + d.w);
    }
  }

  function release(d: RubberSegmentDrag) {
    drag = null;
    if (trackRef.value) delete trackRef.value.dataset.held;
    const el = buttons()[d.slot];
    if (el) delete el.dataset.pressed;
  }

  function handlePointerUp(e: PointerEvent) {
    const d = drag;
    if (!d || e.pointerId !== d.id) return;
    release(d);
    const x = localX(e);
    if (!d.live) {
      if (Math.abs(x - d.x0) <= SLOP && d.slot !== committed) {
        const from = committed;
        commit(d.slot);
        travel(from, d.slot);
      }
      return;
    }
    const v = velocityOf(d.hist, e.timeStamp);
    const flick = Math.abs(v) > FLICK;
    let to = nearestSlot(
      slots,
      (edgeL.get() + edgeR.get()) / 2 + project(v, props.glide),
    );
    if (flick && to === committed) {
      to = clamp(to + Math.sign(v), 0, list.value.length - 1);
    }
    commit(to);
    if (reduce.value) jumpTo(to);
    else land(to, v, flick, flick);
  }

  function handlePointerCancel(e: PointerEvent) {
    const d = drag;
    if (!d || e.pointerId !== d.id) return;
    release(d);
    if (!d.live) return;
    if (reduce.value) jumpTo(committed);
    else land(committed, null, false, false);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (props.disabled) return;
    const last = list.value.length - 1;
    const i = index.value;
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown')
      next = Math.min(last, i + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
      next = Math.max(0, i - 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    if (next === null) return;
    e.preventDefault();
    if (next === i) return;
    commit(next);
    jumpTo(next);
    buttons()[next]?.focus();
  }
</script>

<template>
  <div
    ref="track"
    role="radiogroup"
    :aria-label="ariaLabel"
    :aria-disabled="disabled || undefined"
    :data-equal="equalSlots ? '' : undefined"
    :data-draggable="draggable && !disabled ? '' : undefined"
    :class="['rubber-segment', props.class]"
    :style="trackStyle"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerCancel"
    @lostpointercapture="handlePointerCancel"
  >
    <button
      v-for="(item, i) in list"
      :key="item.value"
      type="button"
      role="radio"
      class="rubber-segment__item"
      :data-index="i"
      :aria-checked="i === index"
      :tabindex="i === index ? 0 : -1"
      :disabled="disabled"
      @pointerdown="handlePointerDown"
      @keydown="handleKeyDown"
    >
      <Icon v-if="item.icon" :name="item.icon" class="size-3.5" />
      {{ item.label }}
    </button>
    <div
      ref="thumb"
      class="rubber-segment__thumb"
      aria-hidden="true"
      style="clip-path: inset(0 100% 0 0)"
    >
      <span
        v-for="item in list"
        :key="item.value"
        class="rubber-segment__item rubber-segment__copy"
      >
        <Icon v-if="item.icon" :name="item.icon" class="size-3.5" />
        {{ item.label }}
      </span>
    </div>
  </div>
</template>

<style scoped>
  .rubber-segment {
    --rs-idle: 0.7;
    --rs-hover: 0.9;
    --rs-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    position: relative;
    display: inline-grid;
    grid-auto-flow: column;
    grid-auto-columns: auto;
    vertical-align: middle;
    padding: var(--rs-inset);
    border-radius: var(--rs-radius);
    background: var(--rs-track);
    font-family: inherit;
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  .rubber-segment[data-equal] {
    grid-auto-columns: minmax(0, 1fr);
  }

  .rubber-segment[aria-disabled='true'] {
    opacity: 0.5;
    pointer-events: none;
  }

  .rubber-segment__item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: calc(var(--rs-h) - var(--rs-inset) * 2);
    min-width: var(--rs-min);
    margin: 0;
    padding: 0 var(--rs-pad);
    border: 0;
    border-radius: var(--rs-thumb-radius);
    background: none;
    color: var(--rs-ink);
    opacity: var(--rs-idle);
    font: inherit;
    font-size: var(--rs-font);
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    outline: none;
    transition:
      opacity 160ms ease,
      transform 160ms var(--rs-ease-out);
  }

  .rubber-segment__item[aria-checked='true'] {
    cursor: default;
  }

  .rubber-segment[data-draggable] .rubber-segment__item[aria-checked='true'] {
    cursor: grab;
  }

  .rubber-segment[data-held],
  .rubber-segment[data-held] .rubber-segment__item {
    cursor: grabbing;
  }

  .rubber-segment__item[data-pressed] {
    transform: scale(0.96);
  }

  .rubber-segment__item:focus-visible {
    outline: 2px solid var(--rs-thumb);
    outline-offset: 3px;
  }

  @media (hover: hover) and (pointer: fine) {
    .rubber-segment__item[aria-checked='false']:hover {
      opacity: var(--rs-hover);
    }
  }

  .rubber-segment__thumb {
    position: absolute;
    inset: var(--rs-inset);
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: auto;
    background: var(--rs-thumb);
    color: var(--rs-ink-active);
    pointer-events: none;
  }

  .rubber-segment[data-equal] .rubber-segment__thumb {
    grid-auto-columns: minmax(0, 1fr);
  }

  .rubber-segment__copy {
    color: inherit;
    opacity: 1;
    cursor: default;
  }

  @media (prefers-reduced-motion: reduce) {
    .rubber-segment__item {
      transition: opacity 160ms ease;
    }
  }
</style>
