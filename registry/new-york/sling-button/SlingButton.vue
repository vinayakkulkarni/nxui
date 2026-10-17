<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';
  import { animate, useMotionValue, useMotionValueEvent } from 'motion-v';
  import type { AnimationPlaybackControls } from 'motion-v';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import type {
    SlingButtonGrip,
    SlingButtonProps,
    SlingButtonSample,
  } from './types';

  const props = withDefaults(defineProps<SlingButtonProps>(), {
    padColor: '#f5f5f5',
    iconColor: '#18181b',
    accentColor: '#f5f5f5',
    wellColor: '#27272a',
    bandColor: '#52525b',
    size: 56,
    strokeWidth: 3,
    armAt: 48,
    maxPull: 160,
    launchSpeed: 2600,
    recoil: 0.2,
    flight: 120,
    particles: 14,
    spread: 60,
    axis: 'any',
    tapSends: true,
    disabled: false,
    ariaLabel: 'Send',
    class: '',
  });

  const emit = defineEmits<{
    send: [];
  }>();

  const GAP = 4;
  const SLOP_FINE = 4;
  const SLOP_COARSE = 8;
  const FINGER_MAX = 3000;
  const HAND_MAX = 6000;
  const CANCEL = 0.5;
  const POWER_CAP = 1.5;
  const DOT_MS = 300;
  const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

  function clamp(v: number, lo: number, hi: number): number {
    return Math.min(hi, Math.max(lo, v));
  }
  function rubberband(o: number, dim: number, c = 0.55): number {
    return (o * dim * c) / (dim + c * Math.abs(o));
  }

  const motionPref = usePreferredReducedMotion();
  const reduce = computed(() => motionPref.value === 'reduce');

  const pull = computed(() => props.maxPull);
  const arm = computed(() => Math.min(props.armAt, 0.8 * props.maxPull));
  const wellR = computed(() => props.size / 2 + GAP + props.strokeWidth);
  const padR = computed(() => props.size / 2 - props.strokeWidth / 2);
  const half = computed(() => wellR.value + props.strokeWidth + 2);
  const dotSize = computed(() => Math.max(6, Math.round(props.size / 7)));
  const count = computed(() => Math.max(0, Math.round(props.particles)));
  const iconSize = computed(() => `${Math.round(props.size * 0.4)}px`);
  const viewBox = computed(
    () => `${-half.value} ${-half.value} ${2 * half.value} ${2 * half.value}`,
  );

  const rootStyle = computed(() => ({
    '--sl-size': `${props.size}px`,
    '--sl-svg': `${2 * half.value}px`,
    '--sl-pad': props.padColor,
    '--sl-icon': props.iconColor,
    '--sl-accent': props.accentColor,
    '--sl-well': props.wellColor,
    '--sl-band': props.bandColor,
    '--sl-stroke': `${props.strokeWidth}px`,
    '--sl-dot': `${dotSize.value}px`,
  }));

  const held = ref(false);
  const armed = ref(false);
  const sent = ref(false);
  const hintId = useId();

  const rootRef = ref<HTMLSpanElement | null>(null);
  const padRef = ref<HTMLButtonElement | null>(null);
  const moveRef = ref<HTMLSpanElement | null>(null);
  const fxRef = ref<SVGGElement | null>(null);
  const bandRef = ref<SVGPathElement | null>(null);
  const hotRef = ref<SVGPathElement | null>(null);
  const arcRef = ref<SVGCircleElement | null>(null);
  const iconRef = ref<HTMLSpanElement | null>(null);
  const dots: HTMLSpanElement[] = [];

  let power = 0;
  let grip: SlingButtonGrip | null = null;
  let dirX = 0;
  let dirY = -1;
  let animX: AnimationPlaybackControls | null = null;
  let animY: AnimationPlaybackControls | null = null;
  let armedNow = false;
  let dotPending = false;
  let dotTimer: ReturnType<typeof setTimeout> | undefined;
  let sentTimer: ReturnType<typeof setTimeout> | undefined;
  let reduceTimer: ReturnType<typeof setTimeout> | undefined;
  let paintFrame = 0;
  let skipClick = false;

  const px = useMotionValue(0);
  const py = useMotionValue(0);

  function setDot(el: unknown, i: number) {
    if (el instanceof HTMLSpanElement) dots[i] = el;
  }

  function relaxIcon() {
    const icon = iconRef.value;
    if (!icon) return;
    icon.style.transition = reduce.value
      ? 'none'
      : 'transform 360ms cubic-bezier(0.23, 1, 0.32, 1)';
    icon.style.transform = 'rotate(0deg)';
  }

  function aimIcon(dist: number) {
    const icon = iconRef.value;
    if (!icon) return;
    const angle = (Math.atan2(-dirY, -dirX) * 180) / Math.PI + 90;
    icon.style.transition = 'none';
    icon.style.transform = `rotate(${angle * clamp(dist / 12, 0, 1)}deg)`;
  }

  function launchDot() {
    dotPending = false;
    clearTimeout(dotTimer);
    relaxIcon();
    const base = Math.atan2(-dirY, -dirX);
    const cone = (props.spread * Math.PI) / 180;
    const push = 0.85 + 0.35 * power;
    const r = wellR.value;
    const flight = props.flight;
    for (let i = 0; i < count.value; i++) {
      const dot = dots[i];
      if (!dot) continue;
      const lead = i === 0;
      const angle =
        base + (lead ? 0 : (Math.random() + Math.random() - 1) * (cone / 2));
      const cx = Math.cos(angle);
      const cy = Math.sin(angle);
      const reach = (lead ? flight : flight * (0.3 + Math.random())) * push;
      const drift = lead ? 0 : (Math.random() - 0.5) * flight * 0.4;
      const scale = lead ? 1 : 0.3 + Math.random() * 0.6;
      const shrink = lead ? 0.6 : scale * (0.2 + Math.random() * 0.4);
      const duration = lead ? DOT_MS : DOT_MS * (0.7 + Math.random());
      const delay = lead ? 0 : Math.random() * 70;
      const to = r + reach;
      dot.animate(
        [
          { transform: `translate(${cx * r}px, ${cy * r}px) scale(${scale})` },
          {
            transform: `translate(${cx * to - cy * drift}px, ${cy * to + cx * drift}px) scale(${shrink})`,
          },
        ],
        { duration, delay, easing: EASE_OUT, fill: 'none' },
      );
      dot.animate(
        [
          { opacity: 1, offset: 0 },
          { opacity: 1, offset: 0.55 },
          { opacity: 0, offset: 1 },
        ],
        { duration, delay, easing: 'linear', fill: 'none' },
      );
    }
  }

  function bandPath(x: number, y: number, dist: number): string {
    if (dist <= 0.5) return '';
    const a = Math.atan2(y, x);
    const b = Math.acos(clamp((wellR.value - padR.value) / dist, -1, 1));
    let d = '';
    for (const t of [a + b, a - b]) {
      const cx = Math.cos(t);
      const cy = Math.sin(t);
      d += `M${(wellR.value * cx).toFixed(2)},${(wellR.value * cy).toFixed(2)}L${(x + padR.value * cx).toFixed(2)},${(y + padR.value * cy).toFixed(2)}`;
    }
    return d;
  }

  function paint() {
    paintFrame = 0;
    const band = bandRef.value;
    const hot = hotRef.value;
    const arc = arcRef.value;
    const fx = fxRef.value;
    if (!band || !hot || !arc || !fx) return;
    const x = px.get();
    const y = py.get();
    const proj = x * dirX + y * dirY;
    const p = clamp(proj / arm.value, 0, 1);
    const dist = Math.hypot(x, y);
    const d = bandPath(x, y, dist);
    band.setAttribute('d', d);
    hot.setAttribute('d', d);
    hot.style.opacity = String(p);
    fx.style.opacity = String(clamp(proj / 6, 0, 1));
    arc.setAttribute('stroke-dasharray', `${p} ${1 - p}`);
    arc.setAttribute('stroke-dashoffset', String(p / 2));
    arc.style.opacity = p > 0.01 ? '1' : '0';
    if (grip) aimIcon(dist);
    arc.setAttribute(
      'transform',
      `rotate(${(Math.atan2(-dirY, -dirX) * 180) / Math.PI})`,
    );
    if (dotPending && proj <= props.size / 4) launchDot();
  }

  function onMove() {
    const move = moveRef.value;
    if (move) move.style.transform = `translate(${px.get()}px, ${py.get()}px)`;
    if (paintFrame) return;
    paintFrame = requestAnimationFrame(paint);
  }
  useMotionValueEvent(px, 'change', onMove);
  useMotionValueEvent(py, 'change', onMove);

  function stopAnims() {
    animX?.stop();
    animY?.stop();
  }

  watch(
    [
      () => props.size,
      () => props.strokeWidth,
      () => props.armAt,
      () => props.maxPull,
      () => props.axis,
    ],
    () => {
      stopAnims();
      px.jump(0);
      py.jump(0);
      onMove();
    },
  );

  function settle(v0x: number, v0y: number) {
    if (reduce.value) {
      const fx = fxRef.value;
      if (fx) {
        fx.style.transition = 'opacity 200ms ease';
        fx.style.opacity = '0';
      }
      clearTimeout(reduceTimer);
      reduceTimer = setTimeout(() => {
        px.jump(0);
        py.jump(0);
        if (fx) fx.style.transition = '';
      }, 200);
      return;
    }
    animX = animate(px, 0, {
      type: 'spring',
      duration: 0.4,
      bounce: props.recoil,
      velocity: v0x,
    });
    animY = animate(py, 0, {
      type: 'spring',
      duration: 0.4,
      bounce: props.recoil,
      velocity: v0y,
    });
  }

  function onPointerDown(e: PointerEvent) {
    if (props.disabled || grip || e.button !== 0) return;
    const el = rootRef.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scale = rect.width / (el.offsetWidth || rect.width) || 1;
    stopAnims();
    const x = px.get();
    const y = py.get();
    const R = pull.value;
    const dNow = Math.hypot(x, y);
    const dClamped = Math.min(dNow, 0.95 * R);
    const rawNow = dNow > 0.5 ? (R * dClamped) / (R - dClamped) : 0;
    grip = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      scale,
      moved: false,
      hist: [],
      rawOrigin:
        dNow > 0.5
          ? { x: (rawNow * x) / dNow, y: (rawNow * y) / dNow }
          : { x: 0, y: 0 },
      slop: e.pointerType === 'touch' ? SLOP_COARSE : SLOP_FINE,
    };
    try {
      padRef.value?.setPointerCapture(e.pointerId);
    } catch {
      // Capture can fail if the pointer is already gone.
    }
    held.value = true;
  }

  function onPointerMove(e: PointerEvent) {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    const dx = (e.clientX - g.startX) / g.scale;
    const dy = (e.clientY - g.startY) / g.scale;
    let rx = g.rawOrigin.x + dx;
    let ry = g.rawOrigin.y + dy;
    if (props.axis === 'horizontal') ry = rubberband(ry, props.size / 4);
    else if (props.axis === 'vertical') rx = rubberband(rx, props.size / 4);
    if (!g.moved && Math.hypot(dx, dy) > g.slop) g.moved = true;
    const raw = Math.hypot(rx, ry);
    if (raw < 0.01) return;
    const R = pull.value;
    const d = (R * raw) / (R + raw);
    dirX = rx / raw;
    dirY = ry / raw;
    px.set(d * dirX);
    py.set(d * dirY);
    const t = performance.now();
    const sample: SlingButtonSample = { x: d * dirX, y: d * dirY, t };
    g.hist.push(sample);
    while (g.hist.length > 4 || t - (g.hist[0]?.t ?? t) > 80) g.hist.shift();
    const isArmed = d >= arm.value;
    if (isArmed !== armedNow) {
      armedNow = isArmed;
      armed.value = isArmed;
    }
  }

  function release(pointerId: number, cancelled: boolean) {
    const g = grip;
    if (!g || g.id !== pointerId) return;
    grip = null;
    skipClick = true;
    try {
      padRef.value?.releasePointerCapture(pointerId);
    } catch {
      // Already released.
    }
    const d = Math.hypot(px.get(), py.get());
    const p = d / arm.value;
    let vx = 0;
    let vy = 0;
    const first = g.hist[0];
    const last = g.hist[g.hist.length - 1];
    if (!cancelled && first && last && g.hist.length > 1) {
      const dt = last.t - first.t;
      if (dt > 0 && performance.now() - last.t < 50) {
        vx = ((last.x - first.x) / dt) * 1000;
        vy = ((last.y - first.y) / dt) * 1000;
      }
    }
    const fm = Math.hypot(vx, vy);
    if (fm > FINGER_MAX) {
      vx *= FINGER_MAX / fm;
      vy *= FINGER_MAX / fm;
    }
    if (!g.moved) {
      relaxIcon();
      if (props.tapSends && !cancelled) emit('send');
      if (d > 0.01) settle(0, 0);
    } else {
      const fire = armedNow && !cancelled;
      const launch = fire
        ? props.launchSpeed * Math.min(p, POWER_CAP)
        : CANCEL * props.launchSpeed * Math.min(p, 1);
      let v0x = vx - dirX * launch;
      let v0y = vy - dirY * launch;
      const m = Math.hypot(v0x, v0y);
      if (m > HAND_MAX) {
        v0x *= HAND_MAX / m;
        v0y *= HAND_MAX / m;
      }
      if (!fire) relaxIcon();
      if (fire) {
        emit('send');
        if (reduce.value) {
          sent.value = true;
          clearTimeout(sentTimer);
          sentTimer = setTimeout(() => {
            sent.value = false;
          }, 200);
        } else {
          power = clamp((Math.min(p, POWER_CAP) - 1) / (POWER_CAP - 1), 0, 1);
          dotPending = true;
          clearTimeout(dotTimer);
          dotTimer = setTimeout(launchDot, 150);
        }
      }
      settle(v0x, v0y);
    }
    armedNow = false;
    held.value = false;
    armed.value = false;
  }

  function onPointerUp(e: PointerEvent) {
    release(e.pointerId, false);
  }
  function onPointerCancel(e: PointerEvent) {
    release(e.pointerId, true);
  }
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && grip) release(grip.id, true);
  }
  function onClick() {
    if (skipClick) {
      skipClick = false;
      return;
    }
    if (!props.disabled) emit('send');
  }

  onBeforeUnmount(() => {
    stopAnims();
    clearTimeout(dotTimer);
    clearTimeout(sentTimer);
    clearTimeout(reduceTimer);
    if (paintFrame) cancelAnimationFrame(paintFrame);
  });
</script>

<template>
  <span
    ref="rootRef"
    :class="['sling-button', props.class]"
    :data-armed="armed ? '' : undefined"
    :data-sent="sent ? '' : undefined"
    :style="rootStyle"
  >
    <svg class="sling-button__fx" :viewBox="viewBox" aria-hidden="true">
      <g ref="fxRef" class="sling-button__tension" style="opacity: 0">
        <path ref="bandRef" class="sling-button__band" />
        <path ref="hotRef" class="sling-button__band sling-button__band--hot" />
      </g>
      <circle class="sling-button__well" :r="wellR" />
      <circle
        ref="arcRef"
        class="sling-button__arc"
        :r="wellR"
        pathLength="1"
        stroke-dasharray="0 1"
        style="opacity: 0"
      />
    </svg>
    <span
      v-for="i in count"
      :key="i"
      :ref="(el) => setDot(el, i - 1)"
      class="sling-button__dot"
      aria-hidden="true"
    ></span>
    <span ref="moveRef" class="sling-button__move">
      <button
        ref="padRef"
        type="button"
        class="sling-button__pad"
        :aria-label="ariaLabel"
        :aria-describedby="hintId"
        :aria-disabled="disabled || undefined"
        :data-held="held ? '' : undefined"
        :data-armed="armed ? '' : undefined"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerCancel"
        @lostpointercapture="onPointerCancel"
        @keydown="onKeyDown"
        @click="onClick"
      >
        <span class="sling-button__face">
          <span ref="iconRef" class="sling-button__icon">
            <slot>
              <Icon name="lucide:arrow-up" :size="iconSize" />
            </slot>
          </span>
        </span>
      </button>
    </span>
    <span :id="hintId" class="sling-button__sr">
      Press Enter to send, or drag away and release.
    </span>
  </span>
</template>

<style scoped>
  .sling-button {
    --sl-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    position: relative;
    display: inline-block;
    width: var(--sl-size);
    height: var(--sl-size);
  }

  .sling-button__fx {
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--sl-svg);
    height: var(--sl-svg);
    margin: calc(var(--sl-svg) / -2) 0 0 calc(var(--sl-svg) / -2);
    overflow: visible;
    pointer-events: none;
    shape-rendering: geometricPrecision;
  }

  .sling-button__well {
    fill: var(--sl-well);
    transition: fill 200ms ease;
  }

  .sling-button[data-sent] .sling-button__well {
    fill: var(--sl-accent);
  }

  .sling-button__band {
    fill: none;
    stroke: var(--sl-band);
    stroke-width: var(--sl-stroke);
    stroke-linecap: round;
    transition: stroke-width 160ms var(--sl-ease-out);
  }

  .sling-button[data-armed] .sling-button__band {
    stroke-width: calc(var(--sl-stroke) * 1.5);
  }

  .sling-button__band--hot {
    stroke: var(--sl-accent);
  }

  .sling-button__arc {
    fill: none;
    stroke: var(--sl-accent);
    stroke-width: var(--sl-stroke);
    stroke-linecap: butt;
    transition: stroke-width 160ms var(--sl-ease-out);
  }

  .sling-button[data-armed] .sling-button__arc {
    stroke-width: calc(var(--sl-stroke) * 1.5);
  }

  .sling-button__move {
    position: absolute;
    inset: 0;
  }

  .sling-button__pad {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    cursor: grab;
    outline: none;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  .sling-button__pad::after {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
  }

  .sling-button__pad:focus-visible::after {
    outline: 2px solid var(--sl-accent);
    outline-offset: 2px;
  }

  .sling-button__pad[data-held] {
    cursor: grabbing;
  }

  .sling-button__pad[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .sling-button__face {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--sl-pad);
    color: var(--sl-icon);
    transition: transform 160ms var(--sl-ease-out);
  }

  .sling-button__pad[data-held] .sling-button__face {
    transform: scale(0.97);
  }

  .sling-button__pad[data-armed] .sling-button__face {
    transform: scale(1.04);
  }

  @media (hover: hover) and (pointer: fine) {
    .sling-button__pad:not([data-held]):not([aria-disabled='true']):hover
      .sling-button__face {
      transform: scale(1.02);
    }
  }

  .sling-button__icon {
    display: inline-flex;
    will-change: transform;
  }

  .sling-button__dot {
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--sl-dot);
    height: var(--sl-dot);
    margin: calc(var(--sl-dot) / -2) 0 0 calc(var(--sl-dot) / -2);
    border-radius: 50%;
    background: var(--sl-accent);
    opacity: 0;
    pointer-events: none;
  }

  .sling-button__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .sling-button__face {
      transform: none !important;
      transition: none;
    }
  }
</style>
