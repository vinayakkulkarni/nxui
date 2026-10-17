<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { animate, useMotionValue, useMotionValueEvent } from 'motion-v';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { clamp, isThenable, onColor, velocityOf } from './slide-commit-utils';
  import type {
    SlideCommitGrip,
    SlideCommitPhase,
    SlideCommitProps,
  } from './types';

  const props = withDefaults(defineProps<SlideCommitProps>(), {
    label: 'Slide to pay',
    doneLabel: 'Paid',
    errorLabel: 'Payment failed',
    onConfirm: undefined,
    trackColor: '#262626',
    handleColor: '#f5f5f5',
    successColor: '#22c55e',
    dangerColor: '#e5484d',
    width: 280,
    height: 56,
    radius: 28,
    speed: 50,
    returnBounce: 0.38,
    landingDip: 0.026,
    holdMs: 1500,
    disabled: false,
    class: '',
  });

  const emit = defineEmits<{
    done: [];
    error: [reason: unknown];
  }>();

  const PAD = 4;
  const SQUASH_MAX = 0.08;
  const SQUASH_DIV = 110;
  const SWELL = 1.03;
  const MIN_PENDING = 300;
  const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
  const SHAKE = [0, -5, 5, -3, 3, -1, 0];

  const motionPref = usePreferredReducedMotion();
  const reduce = computed(() => motionPref.value === 'reduce');

  const phase = ref<SlideCommitPhase>('idle');
  const held = ref(false);
  const hot = ref(false);

  const gripSize = computed(() => props.height - PAD * 2);
  const inner = computed(() => props.width - PAD * 2);
  const travel = computed(() => Math.max(1, inner.value - gripSize.value));
  const r = computed(() => clamp(props.radius, 0, props.height / 2));
  const gripR = computed(() => Math.max(0, r.value - PAD));
  const stiffness = computed(
    () => 260 + (clamp(props.speed, 0, 100) / 100) * 640,
  );
  const MASS = 0.9;
  const critical = computed(() => 2 * Math.sqrt(stiffness.value * MASS));
  const fontSize = computed(() =>
    clamp(Math.round(props.height * 0.25), 13, 17),
  );
  const iconSize = computed(() => `${Math.round(gripSize.value * 0.42)}px`);
  const tickSize = computed(() => `${Math.round(gripSize.value * 0.38)}px`);
  const done = computed(() => phase.value === 'done');
  const swell = computed(() =>
    hot.value && !held.value && phase.value === 'idle' && !reduce.value
      ? SWELL
      : 1,
  );
  const liveText = computed(() => {
    if (phase.value === 'pending') return 'Working';
    if (phase.value === 'done') return props.doneLabel;
    if (phase.value === 'error') return props.errorLabel;
    return '';
  });

  const rootStyle = computed(() => ({
    width: `${props.width}px`,
    height: `${props.height}px`,
    '--sc-track': props.trackColor,
    '--sc-ink': props.handleColor,
    '--sc-ok': props.successColor,
    '--sc-no': props.dangerColor,
    '--sc-on-ink': onColor(props.handleColor),
    '--sc-on-ok': onColor(props.successColor),
    '--sc-on-no': onColor(props.dangerColor),
    '--sc-radius': `${r.value}px`,
    '--sc-grip-r': `${gripR.value}px`,
    '--sc-pad': `${PAD}px`,
    '--sc-font': `${fontSize.value}px`,
  }));

  const capsuleStart = computed(() => ({
    clipPath: `inset(0 ${inner.value - gripSize.value}px 0 0 round ${gripR.value}px)`,
    transformOrigin: '0px 50%',
  }));
  const contentStart = computed(() => ({
    transform: `translateX(${gripSize.value / 2 - inner.value / 2}px)`,
  }));

  const trackRef = ref<HTMLDivElement | null>(null);
  const labelRef = ref<HTMLSpanElement | null>(null);
  const capsuleRef = ref<HTMLDivElement | null>(null);
  const contentRef = ref<HTMLDivElement | null>(null);
  const arrowRef = ref<HTMLSpanElement | null>(null);
  const spinRef = ref<HTMLSpanElement | null>(null);

  let grip: SlideCommitGrip | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let homeTimer: ReturnType<typeof setTimeout> | undefined;
  let run = 0;
  let unwatch: (() => void) | null = null;
  let lastPercent = 0;

  const x = useMotionValue(0);
  const anchor = useMotionValue(0);
  const shown = useMotionValue(1);
  const spin = useMotionValue(0);
  const pulse = useMotionValue(1);
  const shake = useMotionValue(0);

  function render() {
    const T = travel.value;
    const G = gripSize.value;
    const I = inner.value;
    const xv = x.get();
    const seen = clamp(xv, 0, T);
    const edge = seen + G + clamp(anchor.get() - seen, 0, T);
    const capsule = capsuleRef.value;
    if (capsule) {
      const q = 1 - Math.min(SQUASH_MAX, Math.max(0, -xv) / SQUASH_DIV);
      capsule.style.clipPath = `inset(0 ${I - edge}px 0 0 round ${gripR.value}px)`;
      capsule.style.transform = `scale(${q * swell.value}, ${swell.value / q})`;
      capsule.style.transformOrigin = `${seen}px 50%`;
      const percent = Math.round((seen / T) * 100);
      if (percent !== lastPercent) {
        lastPercent = percent;
        capsule.setAttribute('aria-valuenow', String(percent));
        capsule.setAttribute('aria-valuetext', `${props.label}, ${percent}%`);
      }
    }
    if (contentRef.value)
      contentRef.value.style.transform = `translateX(${(seen + edge) / 2 - I / 2}px)`;
    if (labelRef.value)
      labelRef.value.style.opacity = String(clamp(1 - seen / (T * 0.55), 0, 1));
    if (arrowRef.value)
      arrowRef.value.style.opacity = String(
        shown.get() * clamp(1 - (seen - T * 0.55) / (T * 0.4), 0, 1),
      );
    if (spinRef.value) spinRef.value.style.opacity = String(spin.get());
    if (trackRef.value)
      trackRef.value.style.transform = `translateX(${shake.get()}px) scale(${pulse.get()})`;
  }

  useMotionValueEvent(x, 'change', render);
  useMotionValueEvent(anchor, 'change', render);
  useMotionValueEvent(shown, 'change', render);
  useMotionValueEvent(spin, 'change', render);
  useMotionValueEvent(pulse, 'change', render);
  useMotionValueEvent(shake, 'change', render);

  onMounted(render);
  watch(
    [
      () => props.width,
      () => props.height,
      () => props.radius,
      () => props.label,
      swell,
    ],
    render,
    { flush: 'post' },
  );

  function local(clientX: number): number {
    const rect = trackRef.value?.getBoundingClientRect();
    if (!rect) return 0;
    return (clientX - rect.left) / (rect.width / props.width || 1);
  }

  function goHome(velocity: number) {
    if (reduce.value) animate(x, 0, { duration: 0.2, ease: EASE_OUT });
    else
      animate(x, 0, {
        type: 'spring',
        stiffness: stiffness.value,
        damping: critical.value * (1 - clamp(props.returnBounce, 0, 0.5)),
        mass: MASS,
        velocity: Math.min(0, velocity),
      });
  }

  function settle() {
    phase.value = 'idle';
    animate(shown, 1, { duration: 0.2, delay: 0.12 });
    if (reduce.value) anchor.set(0);
    else animate(anchor, 0, { type: 'spring', duration: 0.3, bounce: 0 });
  }

  function resolve(viaKey: boolean) {
    phase.value = 'done';
    anchor.set(x.get());
    animate(spin, 0, { duration: 0.12 });
    if (reduce.value) x.set(0);
    else {
      animate(x, 0, {
        type: 'spring',
        stiffness: stiffness.value,
        damping: critical.value,
        mass: MASS,
      });
      if (!viaKey && props.landingDip > 0) {
        animate(pulse, [1, 1 - props.landingDip, 1], {
          duration: 0.46,
          times: [0, 0.62, 1],
          ease: EASE_OUT,
          delay: 0.1,
        });
      }
    }
    emit('done');
    if (props.holdMs > 0) timer = setTimeout(settle, props.holdMs);
  }

  function reject(reason: unknown) {
    phase.value = 'error';
    emit('error', reason);
    animate(spin, 0, { duration: 0.12 });
    animate(shown, 1, { duration: 0.2, delay: 0.12 });
    if (reduce.value) goHome(0);
    else {
      animate(shake, SHAKE, { duration: 0.45, ease: EASE_OUT });
      homeTimer = setTimeout(() => {
        if (!grip) goHome(0);
      }, 300);
    }
    timer = setTimeout(
      () => {
        phase.value = 'idle';
      },
      Math.max(props.holdMs, 1500),
    );
  }

  function commit(viaKey: boolean) {
    clearTimeout(timer);
    const id = ++run;
    x.set(travel.value);
    let out: unknown;
    try {
      out = props.onConfirm?.();
    } catch (reason) {
      reject(reason);
      return;
    }
    if (!isThenable(out)) {
      animate(shown, 0, { duration: 0.12 });
      resolve(viaKey);
      return;
    }
    phase.value = 'pending';
    animate(shown, 0, { duration: 0.2 });
    animate(spin, 1, { duration: 0.2 });
    const t0 = performance.now();
    const later = (fn: () => void) => {
      setTimeout(
        () => {
          if (id === run) fn();
        },
        Math.max(0, MIN_PENDING - (performance.now() - t0)),
      );
    };
    out.then(
      () => later(() => resolve(viaKey)),
      (reason: unknown) => later(() => reject(reason)),
    );
  }

  function onWindowMove(e: PointerEvent) {
    const g = grip;
    if (!e.isTrusted || !g || g.id !== e.pointerId) return;
    const at = local(e.clientX);
    if (g.grab === null) {
      g.grab = at - x.get();
      return;
    }
    const next = clamp(at - g.grab, 0, travel.value);
    if (Math.abs(next - x.get()) > 0.5) g.moved = true;
    g.hist.push([e.timeStamp, next]);
    if (g.hist.length > 4) g.hist.shift();
    x.set(next);
  }

  function release(pointerId: number) {
    const g = grip;
    if (!g || g.id !== pointerId) return;
    grip = null;
    unwatch?.();
    try {
      trackRef.value?.releasePointerCapture(pointerId);
    } catch {
      // Already released.
    }
    held.value = false;
    if (x.get() >= travel.value) commit(false);
    else if (g.moved) goHome(velocityOf(g.hist));
  }

  function onWindowUp(e: PointerEvent) {
    if (e.isTrusted) release(e.pointerId);
  }

  function onPointerDown(e: PointerEvent) {
    if (
      props.disabled ||
      grip ||
      phase.value === 'pending' ||
      phase.value === 'done' ||
      e.button !== 0
    )
      return;
    x.stop();
    grip = { id: e.pointerId, grab: null, moved: false, hist: [] };
    held.value = true;
    try {
      trackRef.value?.setPointerCapture(e.pointerId);
    } catch {
      // Pointer already gone.
    }
    unwatch?.();
    window.addEventListener('pointermove', onWindowMove);
    window.addEventListener('pointerup', onWindowUp);
    window.addEventListener('pointercancel', onWindowUp);
    unwatch = () => {
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
      unwatch = null;
    };
  }

  function onKeyDown(e: KeyboardEvent) {
    if (props.disabled || phase.value === 'pending' || phase.value === 'done')
      return;
    const T = travel.value;
    const step = T / 10;
    if (e.key === 'End') {
      e.preventDefault();
      commit(true);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(T, x.get() + step);
      x.set(next);
      if (next >= T) commit(true);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      x.set(Math.max(0, x.get() - step));
    } else if (e.key === 'Home' || e.key === 'Escape') {
      e.preventDefault();
      if (grip) release(grip.id);
      else x.set(0);
    }
  }

  function onPointerEnter(e: PointerEvent) {
    if (
      e.pointerType === 'mouse' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches
    )
      hot.value = true;
  }
  function onPointerLeave() {
    hot.value = false;
  }

  onBeforeUnmount(() => {
    clearTimeout(timer);
    clearTimeout(homeTimer);
    unwatch?.();
    run += 1;
  });
</script>

<template>
  <div
    :class="['slide-commit', props.class]"
    :data-phase="phase"
    :data-held="held ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :style="rootStyle"
  >
    <div
      ref="trackRef"
      class="slide-commit__track"
      @pointerdown="onPointerDown"
    >
      <span ref="labelRef" class="slide-commit__label" aria-hidden="true">
        <span class="slide-commit__text slide-commit__text--plain">{{
          label
        }}</span>
        <span class="slide-commit__text slide-commit__text--error">{{
          errorLabel
        }}</span>
      </span>
      <div
        ref="capsuleRef"
        role="slider"
        :tabindex="disabled ? -1 : 0"
        :aria-label="label"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="0"
        :aria-busy="phase === 'pending' || undefined"
        :aria-disabled="disabled || undefined"
        class="slide-commit__capsule"
        :style="capsuleStart"
        @pointerenter="onPointerEnter"
        @pointerleave="onPointerLeave"
        @keydown="onKeyDown"
      >
        <div
          ref="contentRef"
          class="slide-commit__content"
          :style="contentStart"
        >
          <span ref="arrowRef" class="slide-commit__arrow" aria-hidden="true">
            <slot name="icon">
              <Icon name="lucide:arrow-right" :size="iconSize" />
            </slot>
          </span>
          <span
            ref="spinRef"
            class="slide-commit__spin"
            style="opacity: 0"
            aria-hidden="true"
          >
            <svg
              class="slide-commit__spinner"
              :width="iconSize"
              :height="iconSize"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-opacity="0.25"
              />
              <path
                d="M12 3a9 9 0 0 1 9 9"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
              />
            </svg>
          </span>
          <span
            class="slide-commit__done"
            :data-on="done ? '' : undefined"
            aria-hidden="true"
          >
            <Icon name="lucide:check" :size="tickSize" />
            {{ doneLabel }}
          </span>
        </div>
      </div>
      <span class="slide-commit__sr" aria-live="polite">{{ liveText }}</span>
    </div>
  </div>
</template>

<style scoped>
  .slide-commit {
    position: relative;
    display: inline-block;
    vertical-align: middle;
    font-family: inherit;
  }

  .slide-commit[data-disabled] {
    opacity: 0.55;
    pointer-events: none;
  }

  .slide-commit__track {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: var(--sc-radius);
    background: var(--sc-track);
    cursor: grab;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  .slide-commit[data-held] .slide-commit__track {
    cursor: grabbing;
  }

  .slide-commit[data-phase='pending'] .slide-commit__track,
  .slide-commit[data-phase='done'] .slide-commit__track {
    cursor: default;
  }

  .slide-commit__label {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    pointer-events: none;
    font-size: var(--sc-font);
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.006em;
    white-space: nowrap;
  }

  .slide-commit__text {
    grid-area: 1 / 1;
    color: color-mix(in srgb, var(--sc-ink) 45%, transparent);
    transition:
      opacity 200ms ease,
      filter 200ms ease;
  }

  .slide-commit__text--error {
    color: var(--sc-no);
    opacity: 0;
    filter: blur(2px);
  }

  .slide-commit[data-phase='error'] .slide-commit__text--plain {
    opacity: 0;
    filter: blur(2px);
  }

  .slide-commit[data-phase='error'] .slide-commit__text--error {
    opacity: 1;
    filter: none;
  }

  .slide-commit__capsule {
    position: absolute;
    top: var(--sc-pad);
    left: var(--sc-pad);
    width: calc(100% - var(--sc-pad) * 2);
    height: calc(100% - var(--sc-pad) * 2);
    background: var(--sc-ink);
    color: var(--sc-on-ink);
    outline: none;
    transition:
      background-color 200ms ease,
      color 200ms ease;
  }

  .slide-commit[data-phase='done'] .slide-commit__capsule {
    background: var(--sc-ok);
    color: var(--sc-on-ok);
  }

  .slide-commit[data-phase='error'] .slide-commit__capsule {
    background: var(--sc-no);
    color: var(--sc-on-no);
  }

  .slide-commit__capsule:focus-visible {
    box-shadow: inset 0 0 0 2px var(--sc-track);
  }

  .slide-commit__content {
    position: absolute;
    inset: 0;
  }

  .slide-commit__arrow,
  .slide-commit__spin,
  .slide-commit__done {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    pointer-events: none;
    font-size: var(--sc-font);
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.006em;
    white-space: nowrap;
  }

  .slide-commit__done {
    opacity: 0;
    transform: scale(0.95);
    transition:
      opacity 200ms cubic-bezier(0.23, 1, 0.32, 1),
      transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
  }

  .slide-commit__done[data-on] {
    opacity: 1;
    transform: scale(1);
  }

  .slide-commit__spinner {
    display: block;
  }

  .slide-commit__arrow,
  .slide-commit__spin {
    transition: filter 200ms ease;
  }

  .slide-commit[data-phase='pending'] .slide-commit__arrow {
    filter: blur(2px);
  }

  .slide-commit:not([data-phase='pending']) .slide-commit__spin {
    filter: blur(2px);
  }

  .slide-commit__spinner {
    animation: slide-commit-spin 1s linear infinite;
    animation-play-state: paused;
  }

  .slide-commit[data-phase='pending'] .slide-commit__spinner {
    animation-play-state: running;
  }

  @keyframes slide-commit-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .slide-commit__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .slide-commit__done {
      transform: none;
    }

    .slide-commit__spinner {
      animation: slide-commit-breathe 1.4s ease-in-out infinite;
      animation-play-state: paused;
    }

    .slide-commit[data-phase='pending'] .slide-commit__spinner {
      animation-play-state: running;
    }

    @keyframes slide-commit-breathe {
      0%,
      100% {
        opacity: 1;
      }

      50% {
        opacity: 0.4;
      }
    }
  }
</style>
