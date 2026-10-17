<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import type { CSSProperties } from 'vue';
  import { animate, motionValue } from 'motion-v';
  import { useEventListener, usePreferredReducedMotion } from '@vueuse/core';
  import type {
    SwipeToastCloseReason,
    SwipeToastDrag,
    SwipeToastPhase,
    SwipeToastProps,
  } from './types';

  const props = withDefaults(defineProps<SwipeToastProps>(), {
    title: 'File archived',
    description: '',
    icon: '',
    actionLabel: '',
    open: true,
    background: '#27272a',
    color: '#f5f5f5',
    fuseColor: '#f5a524',
    width: 356,
    radius: 12,
    slideMs: 400,
    settleBounce: 0.2,
    swipeDistance: 40,
    duration: 4000,
    fuse: 'bottom',
    pauseOnHover: true,
    closeButton: false,
    inline: false,
    dismissible: true,
    class: '',
  });

  const emit = defineEmits<{
    action: [];
    close: [reason: SwipeToastCloseReason];
  }>();

  const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
  const FLICK = 0.11;
  const DEAD_ZONE = 3;
  const RESIST_PX = 24;
  const COLLAPSE_MS = 200;
  const EXIT = 0.7;
  const BURN: Keyframe[] = [
    { transform: 'scaleX(1)' },
    { transform: 'scaleX(0)' },
  ];

  const reduced = usePreferredReducedMotion();
  const phase = ref<SwipeToastPhase>('open');
  const instant = ref(false);
  const mounted = ref(false);
  const swiping = ref(false);
  const cardRef = ref<HTMLDivElement | null>(null);
  const fuseRef = ref<HTMLElement | null>(null);

  let fuseAnim: Animation | null = null;
  let drag: SwipeToastDrag | null = null;
  const flags = {
    hover: false,
    interacting: false,
    focus: false,
    hidden: false,
  };
  let lastInput: 'pointer' | 'keyboard' = 'pointer';
  let pendingClose: SwipeToastCloseReason | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let leaving = false;

  const y = motionValue(0);
  const fade = motionValue(1);
  const unsubY = y.on('change', paintY);
  const unsubFade = fade.on('change', paintFade);

  function paintY(v: number) {
    if (cardRef.value) cardRef.value.style.transform = `translateY(${v}px)`;
  }
  function paintFade(v: number) {
    if (cardRef.value) cardRef.value.style.opacity = String(v);
  }

  function rubberband(over: number, dim: number, c = 0.55) {
    return (over * dim * c) / (dim + c * Math.abs(over));
  }
  function velocityOf(hist: Array<[number, number]>) {
    const first = hist[0];
    const last = hist[hist.length - 1];
    if (hist.length < 2 || !first || !last) return 0;
    return performance.now() - last[0] > 100
      ? 0
      : (last[1] - first[1]) / Math.max(1, last[0] - first[0]);
  }

  function syncFuse() {
    const a = fuseAnim;
    if (!a) return;
    if (flags.hover || flags.interacting || flags.focus || flags.hidden)
      a.pause();
    else if (a.playState === 'paused') a.play();
  }

  function finish(why: SwipeToastCloseReason) {
    phase.value = 'gone';
    leaving = false;
    if (props.inline)
      closeTimer = setTimeout(() => emit('close', why), COLLAPSE_MS);
    else emit('close', why);
  }

  function close(why: SwipeToastCloseReason) {
    if (phase.value !== 'open' || leaving) return;
    if (drag) {
      pendingClose = why;
      return;
    }
    fuseAnim?.pause();
    const now =
      why === 'escape' ||
      ((why === 'action' || why === 'close') && lastInput === 'keyboard');
    instant.value = now;
    phase.value = 'closing';
    clearTimeout(closeTimer);
    closeTimer = setTimeout(
      () => finish(why),
      now ? 0 : props.slideMs * EXIT + 60,
    );
  }

  function rescue() {
    clearTimeout(closeTimer);
    instant.value = false;
    y.set(0);
    fade.set(1);
    phase.value = 'open';
  }

  function armFuse(onCleanup?: (fn: () => void) => void) {
    if (phase.value !== 'open' || props.duration <= 0 || !fuseRef.value) return;
    fuseAnim?.cancel();
    const a = fuseRef.value.animate(BURN, {
      duration: props.duration,
      easing: 'linear',
      fill: 'forwards',
    });
    a.onfinish = () => close('timeout');
    fuseAnim = a;
    syncFuse();
    onCleanup?.(() => {
      a.onfinish = null;
      a.pause();
    });
  }

  watch(
    () => props.open,
    (open) => {
      if (!open) close('programmatic');
      else if (phase.value !== 'open') rescue();
    },
  );

  watch([phase, () => props.duration], (_v, _o, onCleanup) => {
    armFuse(onCleanup);
  });

  watch(
    () => props.pauseOnHover,
    (on) => {
      if (!on) {
        flags.hover = false;
        syncFuse();
      }
    },
  );

  useEventListener(
    () => (mounted.value ? document : null),
    'visibilitychange',
    () => {
      flags.hidden = document.hidden;
      syncFuse();
    },
  );

  onMounted(() => {
    paintY(y.get());
    paintFade(fade.get());
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        mounted.value = true;
      }),
    );
    armFuse();
    if (!props.open) close('programmatic');
  });

  onBeforeUnmount(() => {
    clearTimeout(closeTimer);
    fuseAnim?.cancel();
    y.stop();
    fade.stop();
    unsubY();
    unsubFade();
  });

  function swipeOut(dy: number, v: number) {
    fuseAnim?.pause();
    leaving = true;
    pendingClose = null;
    if (reduced.value !== 'reduce' && cardRef.value) {
      animate(y, dy + cardRef.value.offsetHeight, {
        type: 'spring',
        duration: 0.3,
        bounce: 0,
        velocity: v * 1000,
      });
    }
    animate(fade, 0, { duration: 0.2, ease: EASE_OUT }).then(() =>
      finish('swipe'),
    );
  }

  function onPointerDown(e: PointerEvent) {
    lastInput = 'pointer';
    const target = e.target;
    if (
      e.button !== 0 ||
      !props.dismissible ||
      drag ||
      leaving ||
      (target instanceof Element && target.closest('button'))
    )
      return;
    if (phase.value === 'closing') rescue();
    try {
      cardRef.value?.setPointerCapture(e.pointerId);
    } catch {
      // capture is best-effort
    }
    y.stop();
    drag = {
      id: e.pointerId,
      startY: e.clientY,
      grab: null,
      moved: false,
      hist: [[performance.now(), y.get()]],
    };
    flags.interacting = true;
    syncFuse();
  }

  function onPointerMove(e: PointerEvent) {
    const d = drag;
    if (!d || d.id !== e.pointerId) return;
    if (d.grab === null) {
      if (Math.abs(e.clientY - d.startY) < DEAD_ZONE) return;
      d.grab = e.clientY - y.get();
      swiping.value = true;
    }
    const raw = e.clientY - d.grab;
    const next = raw >= 0 ? raw : rubberband(raw, RESIST_PX);
    y.set(next);
    d.moved = true;
    d.hist.push([performance.now(), next]);
    if (d.hist.length > 4) d.hist.shift();
  }

  function onPointerUp(e: PointerEvent) {
    const d = drag;
    if (!d || d.id !== e.pointerId) return;
    drag = null;
    swiping.value = false;
    try {
      cardRef.value?.releasePointerCapture(e.pointerId);
    } catch {
      // release is best-effort
    }
    flags.interacting = false;
    const dy = y.get();
    const v = velocityOf(d.hist);
    if (dy > 0 && (v > FLICK || (dy >= props.swipeDistance && v >= 0))) {
      swipeOut(dy, v);
      return;
    }
    if (d.moved) {
      animate(
        y,
        0,
        reduced.value === 'reduce'
          ? { duration: 0.2, ease: EASE_OUT }
          : {
              type: 'spring',
              duration: 0.5,
              bounce: props.settleBounce,
              velocity: v * 1000,
            },
      );
    }
    const queued = pendingClose;
    pendingClose = null;
    if (queued) close(queued);
    else syncFuse();
  }

  function onPointerEnter(e: PointerEvent) {
    if (props.pauseOnHover && e.pointerType === 'mouse') {
      flags.hover = true;
      syncFuse();
    }
  }
  function onPointerLeave(e: PointerEvent) {
    if (e.pointerType === 'mouse') {
      flags.hover = false;
      syncFuse();
    }
  }
  function onFocus() {
    flags.focus = true;
    syncFuse();
  }
  function onBlur(e: FocusEvent) {
    const next = e.relatedTarget;
    if (!(next instanceof Node) || !cardRef.value?.contains(next)) {
      flags.focus = false;
      syncFuse();
    }
  }
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') lastInput = 'keyboard';
    if (e.key === 'Escape' && props.dismissible) {
      e.stopPropagation();
      close('escape');
    }
  }
  function onAction() {
    emit('action');
    close('action');
  }
  function onClose() {
    close('close');
  }

  const rootStyle = computed<CSSProperties>(() => ({
    '--st-bg': props.background,
    '--st-ink': props.color,
    '--st-fuse': props.fuseColor,
    '--st-w': `${props.width}px`,
    '--st-radius': `${props.radius}px`,
    '--st-slide': `${props.slideMs}ms`,
    '--st-gap': '10px',
  }));
</script>

<template>
  <div
    :class="['swipe-toast', props.class]"
    :data-phase="phase"
    :data-inline="inline ? 'true' : 'false'"
    :data-fuse="duration > 0 ? fuse : 'none'"
    :data-dismissible="dismissible ? 'true' : 'false'"
    :data-instant="instant ? '' : undefined"
    :data-mounted="mounted ? 'true' : 'false'"
    :style="rootStyle"
  >
    <div class="swipe-toast__gate">
      <div class="swipe-toast__lift">
        <div
          ref="cardRef"
          class="swipe-toast__card"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          tabindex="0"
          :data-swiping="swiping ? '' : undefined"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @pointerenter="onPointerEnter"
          @pointerleave="onPointerLeave"
          @focus="onFocus"
          @blur="onBlur"
          @keydown="onKeyDown"
        >
          <span
            v-if="icon || $slots.icon"
            class="swipe-toast__icon"
            aria-hidden="true"
          >
            <slot name="icon">
              <Icon :name="icon" />
            </slot>
          </span>
          <span class="swipe-toast__body">
            <span class="swipe-toast__title">
              <slot name="title">{{ title }}</slot>
            </span>
            <span
              v-if="description || $slots.description"
              class="swipe-toast__desc"
            >
              <slot name="description">{{ description }}</slot>
            </span>
          </span>
          <button
            v-if="actionLabel"
            type="button"
            class="swipe-toast__action"
            @click="onAction"
          >
            {{ actionLabel }}
          </button>
          <button
            v-if="closeButton"
            type="button"
            class="swipe-toast__close"
            aria-label="Close"
            @click="onClose"
          >
            <Icon name="lucide:x" class="size-3" />
          </button>
          <i ref="fuseRef" class="swipe-toast__fuse" aria-hidden="true"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .swipe-toast {
    --st-bg: #27272a;
    --st-ink: #f5f5f5;
    --st-fuse: #f5a524;
    --st-fuse-h: 2px;
    --st-w: 356px;
    --st-radius: 12px;
    --st-slide: 400ms;
    --st-gap: 10px;
    --st-offset: 32px;
    --st-z: 999999999;
    --st-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    display: grid;
    grid-template-rows: 1fr;
    width: min(var(--st-w), 100%);
    color: var(--st-ink);
    font-family: inherit;
    font-size: 13px;
    line-height: 1.5;
  }

  .swipe-toast[data-inline='false'] {
    position: fixed;
    right: var(--st-offset);
    bottom: calc(var(--st-offset) + env(safe-area-inset-bottom, 0px));
    z-index: var(--st-z);
    width: min(var(--st-w), calc(100vw - 2 * var(--st-offset)));
  }

  @media (max-width: 600px) {
    .swipe-toast[data-inline='false'] {
      --st-offset: 16px;
    }
  }

  .swipe-toast[data-inline='true'] {
    transition: grid-template-rows var(--st-slide) var(--st-ease-out);
  }

  .swipe-toast[data-inline='true'][data-mounted='false'] {
    grid-template-rows: 0fr;
  }

  .swipe-toast[data-inline='true'][data-phase='closing'],
  .swipe-toast[data-inline='true'][data-phase='gone'] {
    grid-template-rows: 0fr;
  }

  .swipe-toast[data-inline='true'][data-phase='closing'] {
    transition-duration: calc(var(--st-slide) * 0.7);
  }

  .swipe-toast[data-inline='true'][data-phase='gone'] {
    transition-duration: 200ms;
  }

  .swipe-toast__gate {
    min-height: 0;
  }

  .swipe-toast[data-inline='true'] .swipe-toast__lift {
    margin-top: var(--st-gap);
  }

  .swipe-toast__lift {
    opacity: 1;
    transform: translateY(0);
    transition:
      transform var(--st-slide) var(--st-ease-out),
      opacity calc(var(--st-slide) * 0.6) ease;
  }

  .swipe-toast[data-mounted='false'] .swipe-toast__lift {
    opacity: 0;
    transform: translateY(100%);
  }

  .swipe-toast[data-phase='closing'] .swipe-toast__lift {
    opacity: 0;
    transform: translateY(100%);
    transition:
      transform calc(var(--st-slide) * 0.7) var(--st-ease-out),
      opacity calc(var(--st-slide) * 0.5) ease;
  }

  .swipe-toast[data-phase='gone'] .swipe-toast__lift {
    opacity: 0;
    visibility: hidden;
    transform: translateY(100%);
  }

  .swipe-toast[data-instant] .swipe-toast__lift {
    transition-duration: 0s;
  }

  .swipe-toast__card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px;
    border-radius: var(--st-radius);
    overflow: hidden;
    background: var(--st-bg);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.05),
      0 4px 12px rgba(0, 0, 0, 0.1);
    cursor: grab;
    outline: none;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  .swipe-toast__card:focus-visible {
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--st-ink) 45%, transparent),
      0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .swipe-toast__card[data-swiping] {
    cursor: grabbing;
  }

  .swipe-toast[data-dismissible='false'] .swipe-toast__card {
    cursor: default;
    touch-action: auto;
  }

  .swipe-toast__icon {
    display: inline-flex;
    flex: none;
    width: 18px;
    height: 18px;
  }

  .swipe-toast__icon :deep(svg) {
    width: 100%;
    height: 100%;
  }

  .swipe-toast__body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .swipe-toast__title {
    font-weight: 500;
    line-height: 1.5;
  }

  .swipe-toast__desc {
    color: color-mix(in srgb, var(--st-ink) 66%, transparent);
    font-weight: 400;
    line-height: 1.4;
  }

  .swipe-toast__action,
  .swipe-toast__close {
    flex: none;
    border: 0;
    font: inherit;
    cursor: pointer;
    outline: none;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition:
      transform 160ms var(--st-ease-out),
      background-color 160ms ease,
      opacity 160ms ease;
  }

  .swipe-toast__action:focus-visible,
  .swipe-toast__close:focus-visible {
    box-shadow: 0 0 0 2px var(--st-fuse);
  }

  .swipe-toast__action {
    height: 24px;
    padding: 0 8px;
    border-radius: 5px;
    background: var(--st-ink);
    color: var(--st-bg);
    font-size: 12px;
    font-weight: 500;
  }

  .swipe-toast__close {
    position: relative;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 5px;
    background: transparent;
    color: inherit;
  }

  .swipe-toast__close::before {
    content: '';
    position: absolute;
    inset: -8px;
  }

  .swipe-toast__action:active,
  .swipe-toast__close:active {
    transform: scale(0.97);
  }

  @media (hover: hover) and (pointer: fine) {
    .swipe-toast__action:hover {
      opacity: 0.88;
    }

    .swipe-toast__close:hover {
      background: color-mix(in srgb, var(--st-ink) 10%, transparent);
    }
  }

  .swipe-toast__fuse {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: var(--st-fuse-h);
    background: linear-gradient(
      90deg,
      transparent 0%,
      color-mix(in srgb, var(--st-fuse) 18%, transparent) 9%,
      color-mix(in srgb, var(--st-fuse) 50%, transparent) 18%,
      color-mix(in srgb, var(--st-fuse) 84%, transparent) 28%,
      var(--st-fuse) 38%,
      var(--st-fuse) 62%,
      color-mix(in srgb, var(--st-fuse) 84%, transparent) 72%,
      color-mix(in srgb, var(--st-fuse) 50%, transparent) 82%,
      color-mix(in srgb, var(--st-fuse) 18%, transparent) 91%,
      transparent 100%
    );
    transform-origin: left center;
    pointer-events: none;
  }

  .swipe-toast[data-fuse='top'] .swipe-toast__fuse {
    top: 0;
    bottom: auto;
  }

  .swipe-toast[data-fuse='none'] .swipe-toast__fuse {
    opacity: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .swipe-toast__lift {
      transform: none !important;
      transition: opacity 200ms ease;
    }

    .swipe-toast__action:active,
    .swipe-toast__close:active {
      transform: none;
    }
  }
</style>
