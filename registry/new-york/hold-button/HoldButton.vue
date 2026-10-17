<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, useId } from 'vue';
  import { useEventListener, useResizeObserver } from '@vueuse/core';
  import HoldButtonLabels from './HoldButtonLabels.vue';
  import type {
    HoldButtonInput,
    HoldButtonPhase,
    HoldButtonProps,
  } from './types';

  const props = withDefaults(defineProps<HoldButtonProps>(), {
    doneLabel: 'Deleted',
    icon: undefined,
    doneIcon: undefined,
    backgroundColor: '#27272a',
    fillColor: '#5227FF',
    textColor: '#f5f5f5',
    fillTextColor: '#ffffff',
    size: 'md',
    radius: 14,
    fillDirection: 'right',
    holdTime: 2000,
    releaseTime: 200,
    pressScale: 0.97,
    wave: true,
    waveAmplitude: 6,
    glow: true,
    resetAfter: 1200,
    disabled: false,
    class: '',
  });

  const emit = defineEmits<{
    /** Fired once, on the frame the fill completes. */
    hold: [];
    /** Fired on a release shorter than 250ms that did not drift away. */
    tap: [];
  }>();

  const TAP_MS = 250;
  const HIT_PAD = 10;
  const linear = (t: number): number => t;
  const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

  const phase = ref<HoldButtonPhase>('idle');
  const input = ref<HoldButtonInput>(null);
  const buttonRef = ref<HTMLButtonElement | null>(null);
  const hintId = useId();

  const gesture: {
    pointerId: number | null;
    start: number;
    rect: DOMRect | null;
  } = {
    pointerId: null,
    start: 0,
    rect: null,
  };
  const timers = { complete: 0, reset: 0 };
  const motionState = { raf: 0, p: 0, from: 0, to: 0, start: 0 };

  function go(next: HoldButtonPhase, kind: HoldButtonInput = null) {
    phase.value = next;
    input.value = kind;
  }

  function clearTimers() {
    window.clearTimeout(timers.complete);
    window.clearTimeout(timers.reset);
  }

  function drive(to: number, duration: number, ease: (t: number) => number) {
    const m = motionState;
    cancelAnimationFrame(m.raf);
    m.from = m.p;
    m.to = to;
    m.start = performance.now();
    const step = (now: number) => {
      const t = duration > 0 ? Math.min(1, (now - m.start) / duration) : 1;
      m.p = m.from + (m.to - m.from) * ease(t);
      buttonRef.value?.style.setProperty('--hb-p', m.p.toFixed(4));
      if (t < 1) {
        m.raf = requestAnimationFrame(step);
        return;
      }
      m.raf = 0;
      if (m.to === 1) complete();
    };
    m.raf = requestAnimationFrame(step);
  }

  function complete() {
    if (phase.value !== 'holding') return;
    if (performance.now() - gesture.start < props.holdTime - 50) return;
    clearTimers();
    go('done', input.value);
    emit('hold');
    if (props.resetAfter > 0) {
      timers.reset = window.setTimeout(() => {
        go('idle');
        drive(0, props.releaseTime, easeOut);
      }, props.resetAfter);
    }
  }

  function begin(kind: HoldButtonInput): boolean {
    if (props.disabled || phase.value !== 'idle') return false;
    const button = buttonRef.value;
    if (!button) return false;
    gesture.start = performance.now();
    gesture.rect = button.getBoundingClientRect();
    go('holding', kind);
    drive(1, props.holdTime, linear);
    timers.complete = window.setTimeout(complete, props.holdTime + 100);
    return true;
  }

  function release(drifted = false) {
    if (phase.value !== 'holding') return;
    clearTimers();
    const held = performance.now() - gesture.start;
    go('idle');
    drive(0, props.releaseTime, easeOut);
    if (!drifted && held < TAP_MS) emit('tap');
  }

  function handlePointerDown(e: PointerEvent) {
    if (e.button !== 0 || !e.isPrimary || gesture.pointerId !== null) return;
    if (!begin('pointer')) return;
    gesture.pointerId = e.pointerId;
    try {
      buttonRef.value?.setPointerCapture(e.pointerId);
    } catch {
      // Pointer may already be gone.
    }
  }

  function endPointer(e: PointerEvent, drifted = false) {
    if (e.pointerId !== gesture.pointerId) return;
    gesture.pointerId = null;
    const button = buttonRef.value;
    try {
      if (button?.hasPointerCapture(e.pointerId))
        button.releasePointerCapture(e.pointerId);
    } catch {
      // Capture already released.
    }
    release(drifted);
  }

  function handlePointerUp(e: PointerEvent) {
    endPointer(e);
  }

  function handlePointerCancel(e: PointerEvent) {
    endPointer(e, true);
  }

  function handlePointerMove(e: PointerEvent) {
    if (e.pointerId !== gesture.pointerId) return;
    const r = gesture.rect;
    if (!r) return;
    const out =
      e.clientX < r.left - HIT_PAD ||
      e.clientX > r.right + HIT_PAD ||
      e.clientY < r.top - HIT_PAD ||
      e.clientY > r.bottom + HIT_PAD;
    if (out) endPointer(e, true);
  }

  function handlePointerLeave(e: PointerEvent) {
    if (e.pointerType !== 'touch') endPointer(e, true);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (input.value === 'key') release(true);
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!e.repeat) begin('key');
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (input.value === 'key') release();
    }
  }

  function handleContextMenu(e: Event) {
    e.preventDefault();
  }

  function measure() {
    const button = buttonRef.value;
    if (!button) return;
    button.style.setProperty('--hb-w', `${button.offsetWidth}px`);
    button.style.setProperty('--hb-h', `${button.offsetHeight}px`);
  }

  useResizeObserver(buttonRef, measure);

  function cancelHold() {
    if (phase.value === 'holding') release(true);
  }

  function handleVisibility() {
    if (document.hidden) cancelHold();
  }

  useEventListener('blur', cancelHold);
  useEventListener(
    () => (buttonRef.value ? document : null),
    'visibilitychange',
    handleVisibility,
  );

  onBeforeUnmount(() => {
    window.clearTimeout(timers.complete);
    window.clearTimeout(timers.reset);
    cancelAnimationFrame(motionState.raf);
  });

  const direction = computed(() =>
    props.fillDirection === 'up' ? 'up' : 'right',
  );

  const cssVars = computed(() => ({
    '--hb-radius': `${props.radius}px`,
    '--hb-bg': props.backgroundColor,
    '--hb-fill': props.fillColor,
    '--hb-text': props.textColor,
    '--hb-fill-text': props.fillTextColor,
    '--hb-hold': `${props.holdTime}ms`,
    '--hb-cycles': String(props.holdTime / 1100),
    '--hb-release': `${props.releaseTime}ms`,
    '--hb-press': String(props.pressScale),
    '--hb-wave': `${props.wave ? props.waveAmplitude : 0}px`,
  }));

  const labelProps = computed(() => ({
    phase: phase.value,
    doneLabel: props.doneLabel,
    icon: props.icon,
    doneIcon: props.doneIcon,
  }));

  const holdSeconds = computed(() => Math.round(props.holdTime / 100) / 10);
</script>

<template>
  <button
    ref="buttonRef"
    type="button"
    :disabled="disabled"
    :class="['hold-button', `hold-button--${size}`, props.class]"
    :data-phase="phase"
    :data-input="input ?? undefined"
    :data-direction="direction"
    :data-glow="glow ? 'true' : undefined"
    :aria-describedby="hintId"
    :style="cssVars"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerCancel"
    @lostpointercapture="handlePointerCancel"
    @pointerleave="handlePointerLeave"
    @keydown="handleKeyDown"
    @keyup="handleKeyUp"
    @contextmenu="handleContextMenu"
  >
    <span class="hold-button__pulse" aria-hidden="true" />
    <HoldButtonLabels v-bind="labelProps">
      <slot>Hold to delete</slot>
      <template v-if="$slots.done" #done><slot name="done" /></template>
      <template v-if="$slots.icon" #icon><slot name="icon" /></template>
      <template v-if="$slots['done-icon']" #done-icon
        ><slot name="done-icon"
      /></template>
    </HoldButtonLabels>
    <span class="hold-button__clip" aria-hidden="true">
      <span class="hold-button__fill">
        <HoldButtonLabels v-bind="labelProps" fill>
          <slot>Hold to delete</slot>
          <template v-if="$slots.done" #done><slot name="done" /></template>
          <template v-if="$slots.icon" #icon><slot name="icon" /></template>
          <template v-if="$slots['done-icon']" #done-icon
            ><slot name="done-icon"
          /></template>
        </HoldButtonLabels>
      </span>
      <span class="hold-button__crest" aria-hidden="true">
        <HoldButtonLabels v-bind="labelProps" fill>
          <slot>Hold to delete</slot>
          <template v-if="$slots.done" #done><slot name="done" /></template>
          <template v-if="$slots.icon" #icon><slot name="icon" /></template>
          <template v-if="$slots['done-icon']" #done-icon
            ><slot name="done-icon"
          /></template>
        </HoldButtonLabels>
      </span>
    </span>
    <span :id="hintId" class="hold-button__sr">
      Press and hold for {{ holdSeconds }} seconds to confirm
    </span>
  </button>
</template>

<style>
  .hold-button {
    --hb-radius: 14px;
    --hb-bg: #27272a;
    --hb-fill: #5227ff;
    --hb-text: #f5f5f5;
    --hb-fill-text: #ffffff;
    --hb-hold: 2000ms;
    --hb-release: 200ms;
    --hb-press: 0.97;
    --hb-wave: 6px;
    --hb-w: 0px;
    --hb-h: 0px;
    --hb-cycles: 2;
    --hb-p: 0;
    --hb-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
    --hb-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
    --hb-glow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 10px 32px -6px color-mix(in srgb, var(--hb-fill) 70%, transparent);

    position: relative;
    display: inline-grid;
    place-items: center;
    isolation: isolate;
    margin: 0;
    border: 0;
    border-radius: var(--hb-radius);
    background: var(--hb-bg);
    color: var(--hb-text);
    font-family: inherit;
    font-weight: 500;
    letter-spacing: 0.01em;
    line-height: 1;
    box-shadow: var(--hb-shadow);
    cursor: pointer;
    outline: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition:
      transform 160ms var(--hb-ease-out),
      background-color 160ms ease,
      box-shadow var(--hb-release) var(--hb-ease-out);
  }

  .hold-button--sm {
    height: 36px;
    padding: 0 16px;
    font-size: 13px;
  }

  .hold-button--md {
    height: 44px;
    padding: 0 22px;
    font-size: 15px;
  }

  .hold-button--lg {
    height: 52px;
    padding: 0 28px;
    font-size: 17px;
  }

  @media (hover: hover) and (pointer: fine) {
    .hold-button:not(:disabled):hover {
      background: color-mix(in srgb, var(--hb-bg) 92%, #fff);
    }
  }

  .hold-button[data-phase='holding'][data-input='pointer'] {
    transform: scale(var(--hb-press));
  }

  .hold-button[data-glow='true'][data-phase='holding'],
  .hold-button[data-glow='true'][data-phase='done'] {
    box-shadow: var(--hb-glow);
  }

  .hold-button[data-glow='true'][data-phase='holding'] {
    transition:
      transform 160ms var(--hb-ease-out),
      background-color 160ms ease,
      box-shadow var(--hb-hold) linear;
  }

  .hold-button:focus-visible {
    outline: 2px solid var(--hb-fill);
    outline-offset: 3px;
  }

  .hold-button:disabled {
    opacity: 0.5;
    cursor: default;
    pointer-events: none;
  }

  .hold-button__pulse {
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: var(--hb-radius);
    pointer-events: none;
    opacity: 0;
  }

  .hold-button[data-glow='true'][data-phase='done'] .hold-button__pulse {
    animation: hb-pulse 600ms var(--hb-ease-out) forwards;
  }

  @keyframes hb-pulse {
    from {
      opacity: 1;
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--hb-fill) 55%, transparent);
    }
    to {
      opacity: 0;
      box-shadow: 0 0 0 14px color-mix(in srgb, var(--hb-fill) 0%, transparent);
    }
  }

  .hold-button__label {
    position: relative;
    z-index: 2;
    display: grid;
    place-items: center;
  }

  .hold-button__label > span {
    grid-area: 1 / 1;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    transition:
      opacity 200ms ease,
      filter 200ms ease;
  }

  .hold-button__icon {
    display: inline-flex;
    flex: none;
  }

  .hold-button__icon > svg {
    display: block;
  }

  .hold-button__done {
    opacity: 0;
    filter: blur(2px);
  }

  .hold-button[data-phase='done'] .hold-button__idle {
    opacity: 0;
    filter: blur(2px);
  }

  .hold-button[data-phase='done'] .hold-button__done {
    opacity: 1;
    filter: blur(0);
  }

  .hold-button__clip {
    position: absolute;
    inset: 0;
    z-index: 3;
    clip-path: inset(0 round var(--hb-radius));
    pointer-events: none;
  }

  .hold-button__fill {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: var(--hb-fill);
    color: var(--hb-fill-text);
    clip-path: inset(
      0
        calc(
          (1 - var(--hb-p)) * (100% + 0.75 * var(--hb-wave)) - var(--hb-p) *
            0.25 * var(--hb-wave)
        )
        0 0
    );
  }

  .hold-button[data-direction='up'] .hold-button__fill {
    clip-path: inset(
      calc(
          (1 - var(--hb-p)) * (100% + 0.75 * var(--hb-wave)) - var(--hb-p) *
            0.25 * var(--hb-wave)
        )
        0 0 0
    );
  }

  .hold-button__crest {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: var(--hb-fill);
    color: var(--hb-fill-text);
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='200' viewBox='0 0 20 200' preserveAspectRatio='none'%3E%3Cpath d='M0 0H10C18 8 18 25.3 10 33.3S2 58.7 10 66.7S18 92 10 100S2 125.3 10 133.3S18 158.7 10 166.7S2 192 10 200H0Z'/%3E%3C/svg%3E");
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='200' viewBox='0 0 20 200' preserveAspectRatio='none'%3E%3Cpath d='M0 0H10C18 8 18 25.3 10 33.3S2 58.7 10 66.7S18 92 10 100S2 125.3 10 133.3S18 158.7 10 166.7S2 192 10 200H0Z'/%3E%3C/svg%3E");
    -webkit-mask-repeat: repeat-y;
    mask-repeat: repeat-y;
    -webkit-mask-size: var(--hb-wave) calc(var(--hb-h) * 2);
    mask-size: var(--hb-wave) calc(var(--hb-h) * 2);
    -webkit-mask-position-x: calc(
      -1 * var(--hb-wave) + var(--hb-p) * (var(--hb-w) + var(--hb-wave))
    );
    mask-position-x: calc(
      -1 * var(--hb-wave) + var(--hb-p) * (var(--hb-w) + var(--hb-wave))
    );
    -webkit-mask-position-y: calc(
      -1 * var(--hb-p) * var(--hb-cycles) * var(--hb-h)
    );
    mask-position-y: calc(-1 * var(--hb-p) * var(--hb-cycles) * var(--hb-h));
  }

  .hold-button[data-direction='up'] .hold-button__crest {
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='20' viewBox='0 0 200 20' preserveAspectRatio='none'%3E%3Cpath d='M0 20V10C12 2 38 2 50 10S88 18 100 10S138 2 150 10S188 18 200 10V20Z'/%3E%3C/svg%3E");
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='20' viewBox='0 0 200 20' preserveAspectRatio='none'%3E%3Cpath d='M0 20V10C12 2 38 2 50 10S88 18 100 10S138 2 150 10S188 18 200 10V20Z'/%3E%3C/svg%3E");
    -webkit-mask-repeat: repeat-x;
    mask-repeat: repeat-x;
    -webkit-mask-size: calc(var(--hb-w) * 2) var(--hb-wave);
    mask-size: calc(var(--hb-w) * 2) var(--hb-wave);
    -webkit-mask-position-x: calc(
      -1 * var(--hb-p) * var(--hb-cycles) * var(--hb-w)
    );
    mask-position-x: calc(-1 * var(--hb-p) * var(--hb-cycles) * var(--hb-w));
    -webkit-mask-position-y: calc(
      var(--hb-h) - var(--hb-p) * (var(--hb-h) + var(--hb-wave))
    );
    mask-position-y: calc(
      var(--hb-h) - var(--hb-p) * (var(--hb-h) + var(--hb-wave))
    );
  }

  .hold-button__label--fill {
    z-index: auto;
  }

  .hold-button__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (prefers-contrast: more) {
    .hold-button {
      outline: 1px solid var(--hb-text);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hold-button {
      transition:
        background-color 160ms ease,
        box-shadow var(--hb-release) ease;
      transform: none !important;
    }

    .hold-button__fill,
    .hold-button[data-direction='up'] .hold-button__fill {
      clip-path: inset(0);
      opacity: 0;
      transition: opacity var(--hb-release) ease;
    }

    .hold-button__crest {
      display: none;
    }

    .hold-button[data-phase='holding'] .hold-button__fill,
    .hold-button[data-phase='done'] .hold-button__fill {
      opacity: 1;
      transition: opacity var(--hb-hold) linear;
    }

    .hold-button__pulse {
      animation: none !important;
    }

    .hold-button__label > span {
      transition: opacity 200ms ease;
      filter: none !important;
    }
  }
</style>
