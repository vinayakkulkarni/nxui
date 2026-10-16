<script setup lang="ts">
  import { computed, onMounted, onUpdated, ref, watch } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import {
    frame,
    useMotionValue,
    useMotionValueEvent,
    useSpring,
    useVelocity,
  } from 'motion-v';
  import type { WakeSliderProps } from './types';

  const SETTLE = 9.23;
  const FULL_SPEED = 320;
  const MIN_REACH = 1.5;
  const FLAT = 0.002;

  const props = withDefaults(defineProps<WakeSliderProps>(), {
    modelValue: undefined,
    defaultValue: 50,
    min: 0,
    max: 100,
    step: 1,
    bars: 32,
    height: 56,
    restHeight: 12,
    gap: 4,
    fillColor: 'var(--foreground)',
    trackColor: 'var(--muted)',
    crestColor: '',
    sensitivity: 1,
    reach: 6,
    skew: 0.6,
    glide: 0.3,
    smoothing: 100,
    showValue: false,
    formatValue: undefined,
    disabled: false,
    ariaLabel: 'Value',
    class: undefined,
  });

  const emit = defineEmits<{
    'update:modelValue': [value: number];
    change: [value: number];
  }>();

  function clamp(v: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(lo, v));
  }
  function smoothstep(s: number) {
    return s * s * (3 - 2 * s);
  }
  function toPct(v: number, min: number, max: number) {
    return max > min ? ((v - min) / (max - min)) * 100 : 0;
  }
  function snap(v: number, min: number, max: number, step: number) {
    if (!(max > min)) return min;
    if (!(step > 0)) return clamp(v, min, max);
    const lastWhole =
      min + Math.floor(Number(((max - min) / step).toFixed(6))) * step;
    const grid = clamp(
      Math.round((v - min) / step) * step + min,
      min,
      lastWhole,
    );
    return Number(
      (lastWhole < max && Math.abs(v - max) <= Math.abs(v - grid)
        ? max
        : grid
      ).toFixed(6),
    );
  }

  const inner = ref(props.defaultValue);
  const value = computed(() =>
    clamp(props.modelValue ?? inner.value, props.min, props.max),
  );
  const pct = computed(() => toPct(value.value, props.min, props.max));
  const reduceMotion = usePreferredReducedMotion();
  const reduce = computed(() => reduceMotion.value === 'reduce');
  const rest = computed(
    () => Math.min(props.restHeight, props.height - 1) / props.height,
  );
  const text = computed(() =>
    props.formatValue ? props.formatValue(value.value) : String(value.value),
  );

  const rootRef = ref<HTMLDivElement | null>(null);
  const trackRef = ref<HTMLDivElement | null>(null);
  const handleRef = ref<HTMLButtonElement | null>(null);
  let pointerId: number | null = null;
  const pointerFocus = ref(false);
  let lastAmp = 0;
  let latest = value.value;
  watch(value, (v) => {
    latest = v;
  });

  const target = useMotionValue(pct.value);
  const headConfig = computed(() => {
    const w0 = SETTLE / props.glide;
    return { stiffness: w0 * w0, damping: 2 * w0, mass: 1 };
  });
  const head = useSpring(target, headConfig);
  const rawSpeed = useVelocity(head);
  const speedConfig = computed(() => {
    const wv = 2000 / props.smoothing;
    return { stiffness: wv * wv, damping: 2.5 * wv, mass: 1 };
  });
  const speed = useSpring(rawSpeed, speedConfig);

  watch(pct, (p) => {
    target.set(p);
  });

  function paint(force = false) {
    const track = trackRef.value;
    if (!track) return;
    const bars = props.bars;
    const h = ((reduce.value ? target.get() : head.get()) / 100) * (bars - 1);
    const v = reduce.value ? 0 : speed.get();
    const amp = smoothstep(
      clamp((Math.abs(v) * props.sensitivity) / FULL_SPEED, 0, 1),
    );
    const dir = Math.sign(v) || 1;
    const r = MIN_REACH + (props.reach - MIN_REACH) * amp;
    const behind = r * (1 + props.skew);
    const ahead = r * (1 - 0.5 * props.skew);
    const lit = Math.round(h);
    const flat = !force && amp < FLAT && lastAmp < FLAT;
    const els = track.children;
    for (let i = 0; i < bars; i++) {
      const el = els[i];
      if (!(el instanceof HTMLElement)) continue;
      const on = i <= lit ? 'true' : 'false';
      if (el.dataset.on !== on) el.dataset.on = on;
      if (flat) continue;
      const d = i - h;
      const reachHere = d * dir < 0 ? behind : ahead;
      const lift =
        Math.abs(d) < reachHere
          ? amp * Math.cos((Math.PI * d) / (2 * reachHere)) ** 2
          : 0;
      el.style.transform = `scaleY(${rest.value + lift * (1 - rest.value)})`;
      const crest = el.firstElementChild;
      if (crest instanceof HTMLElement) crest.style.opacity = String(lift);
    }
    lastAmp = amp;
  }

  function run() {
    paint();
  }
  function schedule() {
    frame.render(run, false, true);
  }
  useMotionValueEvent(head, 'change', schedule);
  useMotionValueEvent(speed, 'change', schedule);
  onMounted(() => paint(true));
  onUpdated(() => paint(true));

  function commit(next: number) {
    const clean = snap(next, props.min, props.max, props.step);
    if (clean === latest) return;
    latest = clean;
    if (props.modelValue === undefined) inner.value = clean;
    emit('update:modelValue', clean);
    emit('change', clean);
  }

  function commitFromX(clientX: number) {
    const track = trackRef.value;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (!rect.width) return;
    let ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    if (getComputedStyle(track).direction === 'rtl') ratio = 1 - ratio;
    commit(props.min + ratio * (props.max - props.min));
  }

  function onPointerDown(event: PointerEvent) {
    if (props.disabled || pointerId !== null) return;
    pointerId = event.pointerId;
    try {
      trackRef.value?.setPointerCapture(event.pointerId);
    } catch {
      // capture is best effort
    }
    rootRef.value?.removeAttribute('data-instant');
    pointerFocus.value = true;
    handleRef.value?.focus({ preventScroll: true });
    commitFromX(event.clientX);
  }

  function onPointerMove(event: PointerEvent) {
    if (event.pointerId === pointerId) commitFromX(event.clientX);
  }

  function endDrag(event: PointerEvent) {
    if (event.pointerId !== pointerId) return;
    try {
      trackRef.value?.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
    pointerId = null;
  }

  function onBlur() {
    pointerFocus.value = false;
  }

  function jumpFor(key: string) {
    const v = value.value;
    const s = props.step;
    switch (key) {
      case 'ArrowRight':
      case 'ArrowUp':
        return v + s;
      case 'ArrowLeft':
      case 'ArrowDown':
        return v - s;
      case 'PageUp':
        return v + s * 10;
      case 'PageDown':
        return v - s * 10;
      case 'Home':
        return props.min;
      case 'End':
        return props.max;
      default:
        return null;
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (props.disabled) return;
    const next = jumpFor(event.key);
    if (next === null) return;
    event.preventDefault();
    pointerFocus.value = false;
    const clean = snap(next, props.min, props.max, props.step);
    const p = toPct(clean, props.min, props.max);
    rootRef.value?.setAttribute('data-instant', 'true');
    head.jump(p);
    speed.jump(0);
    target.jump(p);
    commit(clean);
  }

  const rootStyle = computed(() => ({
    '--ws-fill': props.fillColor,
    '--ws-track': props.trackColor,
    '--ws-crest': props.crestColor || props.fillColor,
    '--ws-height': `${props.height}px`,
    '--ws-gap': `${props.gap}px`,
    '--ws-rest': String(rest.value),
  }));
</script>

<template>
  <div
    ref="rootRef"
    :class="['wake-slider', props.class]"
    :aria-disabled="disabled || undefined"
    :style="rootStyle"
  >
    <div
      ref="trackRef"
      class="wake-slider__track"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @lostpointercapture="endDrag"
    >
      <span v-for="i in bars" :key="i" class="wake-slider__bar">
        <span v-if="crestColor" class="wake-slider__crest" />
      </span>
      <button
        ref="handleRef"
        type="button"
        role="slider"
        class="wake-slider__handle"
        :tabindex="disabled ? -1 : 0"
        :aria-label="ariaLabel"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-valuenow="value"
        :aria-valuetext="text"
        :aria-disabled="disabled || undefined"
        :data-pointer="pointerFocus ? 'true' : undefined"
        @keydown="onKeyDown"
        @blur="onBlur"
      />
    </div>
    <span v-if="showValue" class="wake-slider__value" aria-hidden="true">{{
      text
    }}</span>
  </div>
</template>

<style scoped>
  .wake-slider {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    color: inherit;
  }

  .wake-slider[aria-disabled='true'] {
    opacity: 0.5;
    pointer-events: none;
  }

  .wake-slider__track {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    gap: var(--ws-gap);
    height: var(--ws-height);
    min-height: 44px;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  @media (hover: hover) and (pointer: fine) {
    .wake-slider__track {
      cursor: grab;
    }

    .wake-slider__track:active {
      cursor: grabbing;
    }
  }

  .wake-slider__bar {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    height: var(--ws-height);
    border-radius: 9999px;
    background: var(--ws-track);
    transform: scaleY(var(--ws-rest));
    transform-origin: 50% 50%;
    transition: background-color 120ms ease;
  }

  .wake-slider__bar[data-on='true'] {
    background: var(--ws-fill);
  }

  .wake-slider[data-instant='true'] .wake-slider__bar {
    transition-duration: 0ms;
  }

  .wake-slider__crest {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--ws-crest);
    opacity: 0;
  }

  .wake-slider__handle {
    position: absolute;
    inset: 0;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 12px;
    background: transparent;
    outline: none;
    cursor: inherit;
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
  }

  .wake-slider__handle:focus-visible:not([data-pointer='true']) {
    outline: 2px solid color-mix(in srgb, var(--ws-fill) 60%, transparent);
    outline-offset: 4px;
  }

  .wake-slider__value {
    min-width: 3ch;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    text-align: right;
    opacity: 0.6;
  }

  @media (prefers-reduced-motion: reduce) {
    .wake-slider__bar {
      transform: scaleY(var(--ws-rest)) !important;
    }
  }
</style>
