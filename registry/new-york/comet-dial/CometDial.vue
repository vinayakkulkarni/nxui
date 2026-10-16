<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { animate, useMotionValue } from 'motion-v';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import {
    arcPath,
    clamp,
    decimalsOf,
    pointAt,
    velocityOf,
  } from './comet-dial-math';
  import type {
    CometDialChangeEndDetail,
    CometDialGrip,
    CometDialProps,
  } from './types';

  const props = withDefaults(defineProps<CometDialProps>(), {
    modelValue: undefined,
    defaultValue: 62,
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    label: 'Level',
    accent: '#f5f5f5',
    ink: '#fdfdfd',
    size: 250,
    sweep: 320,
    thickness: 5,
    speed: 25,
    tapBounce: 0.2,
    flickBounce: 0.1,
    momentum: 1,
    cometReach: 180,
    cometWidth: 12,
    disabled: false,
    class: '',
  });

  const emit = defineEmits<{
    'update:modelValue': [value: number];
    changeEnd: [value: number, detail: CometDialChangeEndDetail];
  }>();

  const DEAD = 44;
  const K = 12;
  const V_FULL = 4;
  const V_FLICK = 2;
  const TAU_FOLLOW = 0.06;
  const TAU_V = 0.05;
  const DECEL = 0.99;
  const DRAG_PX = 10;
  const STALE_MS = 80;

  const motionPref = usePreferredReducedMotion();
  const reduce = computed(() => motionPref.value === 'reduce');

  const range = computed(() => Math.max(1e-9, props.max - props.min));
  const gap = computed(() => 360 - props.sweep);
  const start = computed(() => 90 + gap.value / 2);
  const end = computed(() => start.value + props.sweep);
  const decimals = computed(() => decimalsOf(props.step));
  const stiffness = computed(
    () => 200 + (clamp(props.speed, 0, 100) / 100) * 700,
  );
  const crit = computed(() => 2 * Math.sqrt(stiffness.value));
  const trackPath = computed(() => arcPath(start.value, end.value));
  const headR = computed(() => props.thickness * 1.8);

  const rootStyle = computed(() => ({
    '--cd-accent': props.accent,
    '--cd-ink': props.ink,
    '--cd-size': `${props.size}px`,
    '--cd-figure': `${Math.round(props.size * 0.16)}px`,
  }));

  function snap(v: number): number {
    const { min, max, step } = props;
    return step > 0
      ? clamp(Math.round((v - min) / step) * step + min, min, max)
      : clamp(v, min, max);
  }

  let target = clamp(
    props.modelValue ?? props.defaultValue,
    props.min,
    props.max,
  );
  const initialValue = target;
  const initialText = `${target}${props.unit}`;
  const initialFigure = target.toFixed(decimalsOf(props.step));
  const initialAngle =
    90 +
    (360 - props.sweep) / 2 +
    clamp((target - props.min) / Math.max(1e-9, props.max - props.min), 0, 1) *
      props.sweep;
  const initialLit = arcPath(90 + (360 - props.sweep) / 2, initialAngle);
  const [initialCx, initialCy] = pointAt(initialAngle);

  const dragging = ref(false);
  const svgRef = ref<SVGSVGElement | null>(null);
  const litRef = ref<SVGPathElement | null>(null);
  const headRef = ref<SVGCircleElement | null>(null);
  const figureRef = ref<HTMLSpanElement | null>(null);
  const comet: SVGPathElement[] = [];

  let grip: CometDialGrip | null = null;
  let unbind: (() => void) | null = null;
  let raf = 0;
  let last = 0;
  let vel = 0;
  let rPrev: number | null = null;
  let text = '';
  let valueText = '';

  const reading = useMotionValue(target);

  function setComet(el: unknown, j: number) {
    if (el instanceof SVGPathElement) comet[j] = el;
  }

  function commit(
    v: number,
    finished: boolean,
    detail?: CometDialChangeEndDetail,
  ) {
    const s = snap(v);
    if (s !== target) {
      target = s;
      emit('update:modelValue', s);
    }
    if (finished)
      emit('changeEnd', s, detail ?? { velocity: 0, bounce: props.tapBounce });
  }

  function wake() {
    if (raf) return;
    last = performance.now();
    rPrev = null;
    raf = requestAnimationFrame(paint);
  }

  function launch(
    to: number,
    bounce: number,
    velocity = reading.getVelocity(),
  ) {
    reading.stop();
    if (reduce.value) {
      reading.jump(to);
      wake();
      return;
    }
    animate(reading, to, {
      type: 'spring',
      stiffness: stiffness.value,
      damping: crit.value * (1 - clamp(bounce, 0, 0.9)),
      mass: 1,
      velocity,
    });
    wake();
  }

  function paint(now: number) {
    const svg = svgRef.value;
    if (!svg) {
      raf = 0;
      return;
    }
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    const g = grip;
    if (g && g.at != null) {
      if (reduce.value) reading.jump(g.at);
      else
        reading.set(
          reading.get() +
            (g.at - reading.get()) * (1 - Math.exp(-dt / TAU_FOLLOW)),
        );
    }
    const r = reading.get();
    const vRaw =
      rPrev == null || dt === 0 || reduce.value
        ? 0
        : (r - rPrev) / dt / range.value;
    rPrev = r;
    vel += (vRaw - vel) * (1 - Math.exp(-dt / TAU_V));
    const s = clamp(Math.abs(vel) / V_FULL, 0, 1);
    const dir = Math.sign(vel) || 1;
    const f = clamp((r - props.min) / range.value, 0, 1);
    const a0s = start.value;
    const a1e = end.value;
    const ang = a0s + f * props.sweep;
    litRef.value?.setAttribute('d', f > 0.0005 ? arcPath(a0s, ang) : '');
    if (headRef.value) {
      const [cx, cy] = pointAt(ang);
      headRef.value.setAttribute('cx', cx.toFixed(3));
      headRef.value.setAttribute('cy', cy.toFixed(3));
    }
    const seg = (props.cometReach * s) / K;
    for (let j = 0; j < K; j++) {
      const el = comet[j];
      if (!el) continue;
      let a0 = dir > 0 ? ang - (j + 1) * seg : ang + j * seg;
      let a1 = dir > 0 ? ang - j * seg : ang + (j + 1) * seg;
      a0 = clamp(a0, a0s, a1e);
      a1 = clamp(a1, a0s, a1e);
      if (seg < 0.01 || a1 - a0 < 0.01) {
        if (el.style.opacity !== '0') el.style.opacity = '0';
        continue;
      }
      const w = 1 - j / K;
      el.setAttribute('d', arcPath(a0, a1));
      el.setAttribute(
        'stroke-width',
        (props.thickness + props.cometWidth * w * s).toFixed(2),
      );
      el.style.opacity = (w * s).toFixed(3);
    }
    const shown = clamp(r, props.min, props.max).toFixed(decimals.value);
    if (shown !== text) {
      text = shown;
      if (figureRef.value) figureRef.value.textContent = shown;
      svg.setAttribute('aria-valuenow', shown);
    }
    const vt = `${target}${props.unit}`;
    if (vt !== valueText) {
      valueText = vt;
      svg.setAttribute('aria-valuetext', vt);
    }
    const moving = !!g || reading.isAnimating() || Math.abs(vel) > 0.002;
    if (!moving) {
      for (const el of comet)
        if (el && el.style.opacity !== '0') el.style.opacity = '0';
    }
    raf = moving ? requestAnimationFrame(paint) : 0;
  }

  function localPoint(cx: number, cy: number): [number, number] {
    const svg = svgRef.value;
    if (!svg) return [0, 0];
    const b = svg.getBoundingClientRect();
    return [
      ((cx - b.left) / b.width) * 200 - 100,
      ((cy - b.top) / b.height) * 200 - 100,
    ];
  }

  function angleAt(cx: number, cy: number): number {
    const [x, y] = localPoint(cx, cy);
    const sweep = props.sweep;
    let rel = ((Math.atan2(y, x) * 180) / Math.PI - start.value + 720) % 360;
    const g = grip;
    if (rel > sweep) {
      if (g && g.side) rel = g.side === 'hi' ? sweep : 0;
      else rel = rel < sweep + gap.value / 2 ? sweep : 0;
    } else if (g) g.side = rel > sweep / 2 ? 'hi' : 'lo';
    return props.min + (rel / sweep) * range.value;
  }

  function onWindowMove(e: PointerEvent) {
    const g = grip;
    if (!e.isTrusted || !g || g.id !== e.pointerId) return;
    if (!g.moved) {
      if (Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < DRAG_PX) return;
      g.moved = true;
      reading.stop();
    }
    g.at = angleAt(e.clientX, e.clientY);
    g.hist.push([performance.now(), g.at]);
    if (g.hist.length > 4) g.hist.shift();
    commit(g.at, false);
    wake();
  }

  function onWindowUp(e: PointerEvent) {
    const g = grip;
    if (!e.isTrusted || !g || g.id !== e.pointerId) return;
    grip = null;
    unbind?.();
    unbind = null;
    dragging.value = false;
    try {
      svgRef.value?.releasePointerCapture(e.pointerId);
    } catch {
      // Already released.
    }
    if (!g.moved) {
      commit(target, true);
      return;
    }
    const lastSample = g.hist[g.hist.length - 1];
    const stale = !lastSample || performance.now() - lastSample[0] > STALE_MS;
    const v = e.type === 'pointercancel' || stale ? 0 : velocityOf(g.hist);
    const bounce =
      props.tapBounce +
      (props.flickBounce - props.tapBounce) *
        clamp(Math.abs(v) / range.value / V_FLICK, 0, 1);
    const to = snap(
      (g.at ?? target) + (v / 1000) * (DECEL / (1 - DECEL)) * props.momentum,
    );
    commit(to, true, { velocity: v, bounce });
    launch(to, bounce, v);
  }

  function onPointerDown(e: PointerEvent) {
    if (props.disabled || grip || e.button > 0) return;
    const [x, y] = localPoint(e.clientX, e.clientY);
    if (Math.hypot(x, y) < DEAD) return;
    e.preventDefault();
    const svg = svgRef.value;
    if (!svg) return;
    try {
      svg.setPointerCapture(e.pointerId);
    } catch {
      // Pointer already gone.
    }
    svg.focus({ preventScroll: true });
    grip = {
      id: e.pointerId,
      at: null,
      hist: [],
      side: null,
      moved: false,
      x0: e.clientX,
      y0: e.clientY,
    };
    const at = angleAt(e.clientX, e.clientY);
    grip.hist.push([performance.now(), at]);
    dragging.value = true;
    commit(at, false);
    launch(snap(at), props.tapBounce);
    window.addEventListener('pointermove', onWindowMove);
    window.addEventListener('pointerup', onWindowUp);
    window.addEventListener('pointercancel', onWindowUp);
    unbind = () => {
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
    };
  }

  function onKeyDown(e: KeyboardEvent) {
    if (props.disabled) return;
    const t = target;
    const step = props.step;
    const big = e.shiftKey ? 10 : 1;
    let to: number;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        to = t + step * big;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        to = t - step * big;
        break;
      case 'PageUp':
        to = t + step * 10;
        break;
      case 'PageDown':
        to = t - step * 10;
        break;
      case 'Home':
        to = props.min;
        break;
      case 'End':
        to = props.max;
        break;
      default:
        return;
    }
    e.preventDefault();
    to = snap(to);
    reading.stop();
    reading.jump(to);
    commit(to, true);
    wake();
  }

  function repaint() {
    text = '';
    valueText = '';
    paint(performance.now());
  }

  onMounted(repaint);

  watch(
    [
      () => props.min,
      () => props.max,
      () => props.step,
      () => props.sweep,
      () => props.thickness,
      () => props.cometReach,
      () => props.cometWidth,
      () => props.unit,
    ],
    repaint,
    { flush: 'post' },
  );

  watch(
    () => props.modelValue,
    (value) => {
      if (value === undefined || grip) return;
      const s = snap(value);
      if (s === target) return;
      target = s;
      launch(s, props.tapBounce);
    },
  );

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf);
    unbind?.();
    reading.stop();
  });
</script>

<template>
  <div
    :class="['comet-dial', props.class]"
    :data-dragging="dragging ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :style="rootStyle"
  >
    <svg
      ref="svgRef"
      class="comet-dial__ring"
      viewBox="0 0 200 200"
      role="slider"
      :tabindex="disabled ? -1 : 0"
      :aria-label="label"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="initialValue"
      :aria-valuetext="initialText"
      :aria-disabled="disabled || undefined"
      @pointerdown="onPointerDown"
      @keydown="onKeyDown"
    >
      <path
        class="comet-dial__track"
        :d="trackPath"
        :stroke-width="thickness"
      />
      <path
        ref="litRef"
        class="comet-dial__lit"
        :d="initialLit"
        :stroke-width="thickness"
      />
      <g class="comet-dial__comet">
        <path
          v-for="j in K"
          :key="j"
          :ref="(el) => setComet(el, j - 1)"
          style="opacity: 0"
        />
      </g>
      <circle
        ref="headRef"
        class="comet-dial__head"
        :cx="initialCx"
        :cy="initialCy"
        :r="headR"
      />
    </svg>
    <div class="comet-dial__readout" aria-hidden="true">
      <span class="comet-dial__value">
        <span ref="figureRef" class="comet-dial__figure">{{
          initialFigure
        }}</span>
        <span v-if="unit" class="comet-dial__unit">{{ unit }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
  .comet-dial {
    position: relative;
    width: var(--cd-size);
    height: var(--cd-size);
    color: var(--cd-ink);
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  .comet-dial__ring {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    outline: none;
    cursor: grab;
    touch-action: none;
  }

  .comet-dial__ring:focus-visible {
    outline: 2px solid var(--cd-accent);
    outline-offset: 4px;
  }

  .comet-dial[data-dragging] .comet-dial__ring {
    cursor: grabbing;
  }

  .comet-dial__track,
  .comet-dial__lit,
  .comet-dial__comet path {
    fill: none;
    stroke-linecap: round;
  }

  .comet-dial__track {
    stroke: var(--cd-ink);
    opacity: 0.24;
  }

  .comet-dial__lit {
    stroke: var(--cd-accent);
    opacity: 0.7;
  }

  .comet-dial__comet path {
    stroke: var(--cd-accent);
  }

  .comet-dial__head {
    fill: var(--cd-accent);
  }

  .comet-dial__readout {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    pointer-events: none;
  }

  .comet-dial__value {
    display: inline-flex;
    align-items: baseline;
    gap: 0.06em;
    font-size: var(--cd-figure);
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.04em;
    font-variant-numeric: tabular-nums;
  }

  .comet-dial__unit {
    font-size: 0.5em;
    opacity: 0.5;
  }

  .comet-dial[data-disabled] {
    opacity: 0.55;
  }

  .comet-dial[data-disabled] .comet-dial__ring {
    cursor: default;
    pointer-events: none;
  }
</style>
