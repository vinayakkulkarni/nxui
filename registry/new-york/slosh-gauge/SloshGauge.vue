<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
  } from 'vue';
  import type { CSSProperties } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import type { SloshGaugeGrip, SloshGaugeProps, SloshGaugeSim } from './types';

  const props = withDefaults(defineProps<SloshGaugeProps>(), {
    modelValue: undefined,
    defaultValue: 60,
    interactive: false,
    showValue: true,
    disabled: false,
    liquidColor: '#f5f5f5',
    glassColor: '#27272a',
    width: 88,
    height: 180,
    radius: 20,
    ticks: 4,
    viscosity: 0.15,
    tilt: 0.45,
    splash: 0.42,
    unit: '%',
    ariaLabel: 'Level',
    class: '',
  });

  const emit = defineEmits<{
    'update:modelValue': [value: number];
    change: [value: number];
  }>();

  const clamp = (v: number, a: number, b: number) =>
    Math.min(b, Math.max(a, v));
  const H = 1 / 120;
  const DT_MAX = 0.05;
  const TILT_GAIN = 0.07;
  const TILT_MAX = 30;
  const REST_POS = 0.05;
  const REST_VEL = 2;
  const STEP = 2;
  const BIG = 10;
  const BAND = 10;

  function onColor(hex: string) {
    const raw = hex.replace('#', '');
    const full = raw.length === 3 ? [...raw].map((c) => c + c).join('') : raw;
    const n = Number.parseInt(full, 16);
    if (Number.isNaN(n)) return '#ffffff';
    return (((n >> 16) & 255) * 299 +
      ((n >> 8) & 255) * 587 +
      (n & 255) * 114) /
      1000 >=
      150
      ? '#111111'
      : '#ffffff';
  }

  const rootRef = ref<HTMLDivElement | null>(null);
  const liquidRef = ref<HTMLDivElement | null>(null);
  const markerRef = ref<HTMLDivElement | null>(null);
  const textA = ref<HTMLSpanElement | null>(null);
  const textB = ref<HTMLSpanElement | null>(null);
  const start = clamp(props.modelValue ?? props.defaultValue, 0, 100);
  const startLabel = `${Math.round(start)}${props.unit}`;
  const sim: SloshGaugeSim = { x: start, v: 0, L: start, raf: 0, last: 0 };
  let grip: SloshGaugeGrip | null = null;
  const reducedPref = usePreferredReducedMotion();
  const reduce = computed(() => reducedPref.value === 'reduce');
  const held = ref(false);

  function paint() {
    const { x, v, L } = sim;
    const th = reduce.value
      ? 0
      : clamp(props.tilt * v * TILT_GAIN, -TILT_MAX, TILT_MAX);
    const lean = (Math.tan((th * Math.PI) / 180) * props.width) / 2;
    const top = 100 - x;
    if (liquidRef.value) {
      liquidRef.value.style.clipPath = `polygon(0 calc(${top}% + ${lean}px), 100% calc(${top}% - ${lean}px), 100% 100%, 0 100%)`;
    }
    if (markerRef.value)
      markerRef.value.style.transform = `translateY(${((100 - L) * props.height) / 100}px)`;
  }

  function say() {
    const n = Math.round(sim.L);
    const s = `${n}${props.unit}`;
    rootRef.value?.setAttribute('aria-valuenow', String(n));
    if (textA.value) textA.value.textContent = s;
    if (textB.value) textB.value.textContent = s;
  }

  function tick(now: number) {
    const s = sim;
    const dt = s.last ? Math.min((now - s.last) / 1000, DT_MAX) : H;
    s.last = now;
    if (props.viscosity <= 0) {
      s.x = s.L;
      s.v = 0;
    } else {
      const vis = props.viscosity;
      const k = 1224 - 1044 * vis;
      const zeta = reduce.value ? 1 : 0.26 - 0.17 * vis;
      const c = 2 * zeta * Math.sqrt(k);
      const rest = reduce.value ? 0 : props.splash;
      for (let n = Math.ceil(dt / H), h = dt / n; n > 0; n -= 1) {
        s.v = s.v * Math.exp(-c * h) + k * (s.L - s.x) * h;
        s.x += s.v * h;
        if (s.x > 100) {
          s.x = 100;
          s.v = -s.v * rest;
        } else if (s.x < 0) {
          s.x = 0;
          s.v = -s.v * rest;
        }
      }
      if (!grip && Math.abs(s.L - s.x) < REST_POS && Math.abs(s.v) < REST_VEL) {
        s.x = s.L;
        s.v = 0;
      }
    }
    paint();
    const parked = !grip && s.x === s.L && s.v === 0;
    if (parked) {
      s.raf = 0;
      s.last = 0;
    } else {
      s.raf = requestAnimationFrame(tick);
    }
  }

  function wake() {
    if (!sim.raf) sim.raf = requestAnimationFrame(tick);
  }

  function setLevel(L: number, instant = false) {
    sim.L = clamp(L, 0, 100);
    if (instant) {
      sim.x = sim.L;
      sim.v = 0;
    }
    say();
    wake();
  }

  function emitValue(n: number) {
    emit('update:modelValue', n);
    emit('change', n);
  }

  watch(
    () => props.modelValue,
    (value) => {
      if (value === undefined) return;
      if (grip && Math.round(sim.L) === value) return;
      setLevel(value, false);
    },
  );

  watch(
    [
      () => props.width,
      () => props.height,
      () => props.tilt,
      () => props.showValue,
      () => props.interactive,
      () => props.disabled,
      () => props.unit,
    ],
    () => {
      nextTick(() => {
        say();
        paint();
      });
    },
  );

  onMounted(() => {
    say();
    paint();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(sim.raf);
    sim.raf = 0;
  });

  function levelAt(clientY: number, g: SloshGaugeGrip) {
    return clamp(
      ((g.rect.bottom - clientY) /
        g.scale /
        (rootRef.value?.offsetHeight || g.rect.height)) *
        100,
      0,
      100,
    );
  }

  function report() {
    const g = grip;
    const n = Math.round(sim.L);
    if (g && n !== g.sent) {
      g.sent = n;
      emitValue(n);
    }
  }

  function onPointerDown(e: PointerEvent) {
    const el = rootRef.value;
    if (!props.interactive || props.disabled || grip || e.button !== 0 || !el)
      return;
    const rect = el.getBoundingClientRect();
    const scale = rect.height / (el.offsetHeight || rect.height) || 1;
    const markerY = rect.top + ((100 - sim.L) / 100) * rect.height;
    const g: SloshGaugeGrip = {
      id: e.pointerId,
      rect,
      scale,
      band: Math.abs(e.clientY - markerY) <= BAND * scale,
      grab: null,
      at: sim.L,
      sent: Number.NaN,
    };
    grip = g;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // capture is best-effort
    }
    held.value = true;
    if (g.band) {
      wake();
    } else {
      setLevel(levelAt(e.clientY, g));
      report();
    }
  }

  function onPointerMove(e: PointerEvent) {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    const at = levelAt(e.clientY, g);
    if (g.band && g.grab === null) {
      g.grab = sim.L - at;
      return;
    }
    setLevel(at + (g.grab ?? 0));
    report();
  }

  function release(pointerId: number, reason?: 'escape' | 'cancel') {
    const g = grip;
    if (!g || g.id !== pointerId) return;
    grip = null;
    try {
      rootRef.value?.releasePointerCapture(pointerId);
    } catch {
      // release is best-effort
    }
    held.value = false;
    if (reason === 'escape') {
      setLevel(g.at);
      emitValue(Math.round(g.at));
    } else if (
      props.modelValue !== undefined &&
      Math.round(sim.L) !== props.modelValue
    ) {
      setLevel(props.modelValue);
    }
    wake();
  }

  function onPointerUp(e: PointerEvent) {
    release(e.pointerId);
  }
  function onPointerCancel(e: PointerEvent) {
    release(e.pointerId, 'cancel');
  }

  const KEY_DELTAS: Record<
    string,
    'up' | 'down' | 'pgup' | 'pgdn' | 'home' | 'end'
  > = {
    ArrowUp: 'up',
    ArrowRight: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'down',
    PageUp: 'pgup',
    PageDown: 'pgdn',
    Home: 'home',
    End: 'end',
  };

  function onKeyDown(e: KeyboardEvent) {
    if (!props.interactive || props.disabled) return;
    if (e.key === 'Escape') {
      if (grip) release(grip.id, 'escape');
      return;
    }
    const kind = KEY_DELTAS[e.key];
    if (!kind) return;
    const L = sim.L;
    const d = e.shiftKey ? BIG : STEP;
    const next =
      kind === 'up'
        ? L + d
        : kind === 'down'
          ? L - d
          : kind === 'pgup'
            ? L + BIG
            : kind === 'pgdn'
              ? L - BIG
              : kind === 'home'
                ? 0
                : 100;
    e.preventDefault();
    setLevel(next, true);
    emitValue(Math.round(sim.L));
  }

  const rootStyle = computed<CSSProperties>(() => ({
    '--sg-w': `${props.width}px`,
    '--sg-h': `${props.height}px`,
    '--sg-r': `${Math.min(props.radius, props.width / 2, props.height / 2)}px`,
    '--sg-glass': props.glassColor,
    '--sg-liquid': props.liquidColor,
    '--sg-on-liquid': onColor(props.liquidColor),
    '--sg-ticks': props.ticks,
    '--sg-font': `${clamp(Math.round(props.width * 0.16), 12, 20)}px`,
  }));
</script>

<template>
  <div
    ref="rootRef"
    :class="['slosh-gauge', props.class]"
    :role="interactive ? 'slider' : 'meter'"
    :tabindex="interactive && !disabled ? 0 : undefined"
    :aria-label="ariaLabel"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :aria-valuenow="Math.round(start)"
    :aria-orientation="interactive ? 'vertical' : undefined"
    :aria-disabled="disabled || undefined"
    :data-interactive="interactive ? 'true' : 'false'"
    :data-held="held ? 'true' : 'false'"
    :data-disabled="disabled ? 'true' : 'false'"
    :style="rootStyle"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @lostpointercapture="onPointerCancel"
    @keydown="onKeyDown"
  >
    <span
      v-if="showValue"
      ref="textA"
      class="slosh-gauge__value"
      aria-hidden="true"
      >{{ startLabel }}</span
    >
    <div ref="liquidRef" class="slosh-gauge__liquid" aria-hidden="true">
      <span v-if="showValue" ref="textB" class="slosh-gauge__value">{{
        startLabel
      }}</span>
    </div>
    <div v-if="ticks > 0" class="slosh-gauge__ticks" aria-hidden="true"></div>
    <div
      v-if="interactive && !disabled"
      ref="markerRef"
      class="slosh-gauge__marker"
      aria-hidden="true"
    ></div>
  </div>
</template>

<style scoped>
  .slosh-gauge {
    --sg-w: 88px;
    --sg-h: 180px;
    --sg-r: 20px;
    --sg-glass: #27272a;
    --sg-liquid: #f5f5f5;
    --sg-on-liquid: #111111;
    --sg-ticks: 4;
    --sg-font: 14px;

    position: relative;
    display: inline-block;
    box-sizing: border-box;
    width: var(--sg-w);
    height: var(--sg-h);
    border-radius: var(--sg-r);
    overflow: clip;
    isolation: isolate;
    background: var(--sg-glass);
    font-size: var(--sg-font);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    outline: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .slosh-gauge:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 55%, transparent);
  }

  .slosh-gauge[data-interactive='true'] {
    cursor: ns-resize;
    touch-action: none;
    -webkit-touch-callout: none;
  }

  .slosh-gauge[data-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .slosh-gauge__value {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: color-mix(in srgb, currentColor 65%, transparent);
    pointer-events: none;
  }

  .slosh-gauge__liquid {
    position: absolute;
    inset: 0;
    background: var(--sg-liquid);
    clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0 100%);
  }

  .slosh-gauge__liquid .slosh-gauge__value {
    color: var(--sg-on-liquid);
  }

  .slosh-gauge__ticks {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 22%;
    height: 100%;
    background-image: linear-gradient(
      to top,
      color-mix(in srgb, currentColor 22%, transparent) 0 1px,
      transparent 1px
    );
    background-size: 100% calc(100% / var(--sg-ticks));
    background-repeat: repeat-y;
    background-position: bottom;
    pointer-events: none;
  }

  .slosh-gauge__marker {
    position: absolute;
    top: 0;
    right: 10%;
    left: 10%;
    height: 2px;
    margin-top: -1px;
    border-radius: 1px;
    background: currentColor;
    opacity: 0;
    transition: opacity 150ms ease;
    pointer-events: none;
  }

  .slosh-gauge[data-held='true'] .slosh-gauge__marker {
    opacity: 1;
  }
</style>
