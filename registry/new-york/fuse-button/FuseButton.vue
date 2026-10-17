<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import type {
    FuseButtonCommitReason,
    FuseButtonPhase,
    FuseButtonProps,
  } from './types';

  const props = withDefaults(defineProps<FuseButtonProps>(), {
    label: 'Archive',
    undoLabel: 'Undo',
    doneLabel: 'Archived',
    icon: 'lucide:archive',
    color: '#f5f5f5',
    background: '#27272a',
    fuseColor: '#f5a524',
    size: 'md',
    radius: 22,
    undoWindow: 4000,
    fuse: 'outline',
    fuseThickness: 1.5,
    crossfadeMs: 200,
    commitOn: 'press',
    pauseOnHover: true,
    settle: 'reset',
    disabled: false,
    type: 'button',
    class: '',
  });

  const emit = defineEmits<{
    /** The action. */
    commit: [reason: FuseButtonCommitReason];
    /** The undo face was used (click, Enter/Space or Escape). */
    undo: [];
    /** The fuse burned out. */
    fuseEnd: [];
    /** Every phase change. */
    phaseChange: [phase: FuseButtonPhase];
  }>();

  const LINE: Keyframe[] = [
    { transform: 'scaleX(1)' },
    { transform: 'scaleX(0)' },
  ];
  const OUTLINE: Keyframe[] = [
    { strokeDashoffset: 0 },
    { strokeDashoffset: -1 },
  ];
  const SIZES = {
    sm: { height: 36, font: 13, icon: 14, px: 16 },
    md: { height: 44, font: 14, icon: 15, px: 20 },
    lg: { height: 52, font: 15, icon: 17, px: 24 },
  };

  const phase = ref<FuseButtonPhase>('idle');
  const instant = ref(false);
  const rootRef = ref<HTMLElement | null>(null);
  const idleRef = ref<HTMLButtonElement | null>(null);
  const undoRef = ref<HTMLButtonElement | null>(null);
  const lineRef = ref<HTMLElement | null>(null);
  const rimRef = ref<SVGRectElement | null>(null);
  const statusId = useId();

  let anim: Animation | null = null;
  const pause = { hover: false, hidden: false, canHoverPause: false };
  let lastInput: 'pointer' | 'keyboard' = 'pointer';
  let windowMs = props.undoWindow;

  const preset = computed(() => SIZES[props.size] ?? SIZES.md);

  function go(next: FuseButtonPhase) {
    instant.value = lastInput === 'keyboard';
    phase.value = next;
    emit('phaseChange', next);
  }

  function syncPlayState() {
    const a = anim;
    if (!a) return;
    if (pause.hover || pause.hidden) {
      if (a.playState === 'running') a.pause();
    } else if (a.playState === 'paused') {
      a.play();
    }
  }

  function light(from = 0) {
    const el = props.fuse === 'outline' ? rimRef.value : lineRef.value;
    if (!el) return;
    anim?.cancel();
    const a = el.animate(props.fuse === 'outline' ? OUTLINE : LINE, {
      duration: windowMs,
      easing: 'linear',
      fill: 'forwards',
    });
    if (from) a.currentTime = from;
    a.onfinish = () => {
      emit('fuseEnd');
      if (props.commitOn === 'fuseEnd') emit('commit', 'fuseEnd');
      lastInput = 'pointer';
      go(props.settle === 'stay' ? 'settled' : 'idle');
    };
    anim = a;
    syncPlayState();
  }

  function arm() {
    if (props.disabled || phase.value !== 'idle') return;
    windowMs = props.undoWindow;
    light();
    pause.canHoverPause = false;
    pause.hover = false;
    if (props.commitOn === 'press') emit('commit', 'press');
    go('armed');
  }

  function undo() {
    if (phase.value !== 'armed') return;
    const a = anim;
    if (a) {
      a.onfinish = null;
      a.pause();
    }
    emit('undo');
    go('idle');
  }

  watch(
    phase,
    (next) => {
      const root = rootRef.value;
      const inside = root?.contains(document.activeElement) ?? false;
      if (next === 'armed') undoRef.value?.focus({ preventScroll: true });
      else if (inside)
        (next === 'idle' ? idleRef.value : root)?.focus({
          preventScroll: true,
        });
    },
    { flush: 'post' },
  );

  function handleVisibility() {
    pause.hidden = document.hidden;
    syncPlayState();
  }

  useEventListener(
    () => (rootRef.value ? document : null),
    'visibilitychange',
    handleVisibility,
  );

  onBeforeUnmount(() => {
    anim?.cancel();
  });

  // Switching fuse style mid-burn relights the new element from the same point.
  watch(
    () => props.fuse,
    async () => {
      const a = anim;
      if (!a || phase.value !== 'armed') return;
      await nextTick();
      light(Number(a.currentTime) || 0);
    },
  );

  watch(
    () => props.pauseOnHover,
    (on) => {
      if (on) return;
      pause.hover = false;
      syncPlayState();
    },
  );

  function handlePointerDown(e: PointerEvent) {
    lastInput = 'pointer';
    const pressable =
      phase.value === 'armed' || (phase.value === 'idle' && !props.disabled);
    if (e.button === 0 && pressable && rootRef.value)
      rootRef.value.dataset.pressed = '';
  }

  function release() {
    if (rootRef.value) delete rootRef.value.dataset.pressed;
  }

  function handlePointerEnter(e: PointerEvent) {
    if (
      props.pauseOnHover &&
      e.pointerType === 'mouse' &&
      pause.canHoverPause
    ) {
      pause.hover = true;
      syncPlayState();
    }
  }

  function handlePointerLeave(e: PointerEvent) {
    release();
    if (e.pointerType !== 'mouse') return;
    pause.canHoverPause = true;
    pause.hover = false;
    syncPlayState();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') lastInput = 'keyboard';
    if (e.key === 'Escape' && phase.value === 'armed') {
      e.preventDefault();
      lastInput = 'keyboard';
      undo();
    }
  }

  const rootStyle = computed(() => ({
    '--fb-ink': props.color,
    '--fb-bg': props.background,
    '--fb-fuse': props.fuseColor,
    '--fb-fuse-h': `${props.fuseThickness}px`,
    '--fb-radius': `${props.radius}px`,
    '--fb-fade': `${props.crossfadeMs}ms`,
    '--fb-h': `${preset.value.height}px`,
    '--fb-fs': `${preset.value.font}px`,
    '--fb-icon': `${preset.value.icon}px`,
    '--fb-px': `${preset.value.px}px`,
  }));
</script>

<template>
  <span
    ref="rootRef"
    tabindex="-1"
    :class="['fuse-button', props.class]"
    :data-phase="phase"
    :data-fuse="fuse"
    :data-instant="instant ? '' : undefined"
    :aria-disabled="phase === 'settled' || undefined"
    :style="rootStyle"
    @pointerdown="handlePointerDown"
    @pointerup="release"
    @pointercancel="release"
    @pointerenter="handlePointerEnter"
    @pointerleave="handlePointerLeave"
    @keydown="handleKeyDown"
  >
    <button
      ref="idleRef"
      :type="type"
      class="fuse-button__face fuse-button__idle"
      :disabled="disabled"
      :inert="phase !== 'idle'"
      @click="arm"
    >
      <span class="fuse-button__icon" aria-hidden="true">
        <slot name="icon"><Icon :name="icon" /></slot>
      </span>
      {{ label }}
    </button>
    <button
      ref="undoRef"
      type="button"
      class="fuse-button__face fuse-button__undo"
      :aria-describedby="statusId"
      aria-keyshortcuts="Escape"
      :inert="phase !== 'armed'"
      @click="undo"
    >
      <span
        class="fuse-button__icon fuse-button__icon--undo"
        aria-hidden="true"
      >
        <Icon name="lucide:rotate-ccw" />
      </span>
      {{ undoLabel }}
      <i
        v-if="fuse !== 'outline'"
        ref="lineRef"
        class="fuse-button__fuse"
        aria-hidden="true"
      />
    </button>
    <span
      class="fuse-button__face fuse-button__settled"
      :inert="phase !== 'settled'"
    >
      <span class="fuse-button__icon" aria-hidden="true">
        <Icon name="lucide:check" />
      </span>
      {{ doneLabel }}
    </span>
    <svg v-if="fuse === 'outline'" class="fuse-button__rim" aria-hidden="true">
      <rect ref="rimRef" pathLength="1" />
    </svg>
    <span
      :id="statusId"
      class="fuse-button__status"
      role="status"
      aria-live="polite"
    >
      {{ phase === 'idle' ? '' : doneLabel }}
    </span>
  </span>
</template>

<style>
  .fuse-button {
    --fb-ink: #f5f5f5;
    --fb-bg: #27272a;
    --fb-fuse: #f5a524;
    --fb-fuse-h: 1.5px;
    --fb-radius: 22px;
    --fb-fade: 200ms;
    --fb-press: 0.97;
    --fb-h: 44px;
    --fb-fs: 14px;
    --fb-icon: 15px;
    --fb-px: 20px;
    --fb-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    position: relative;
    display: inline-grid;
    grid-template-columns: minmax(0, 1fr);
    height: var(--fb-h);
    border-radius: var(--fb-radius);
    background: var(--fb-bg);
    color: var(--fb-ink);
    font-family: inherit;
    font-size: var(--fb-fs);
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0.01em;
    overflow: hidden;
    isolation: isolate;
    outline: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition: transform 160ms var(--fb-ease-out);
  }

  .fuse-button[data-pressed] {
    transform: scale(var(--fb-press));
  }

  .fuse-button:has(:focus-visible) {
    outline: 2px solid color-mix(in srgb, var(--fb-ink) 60%, transparent);
    outline-offset: 3px;
  }

  .fuse-button__idle:focus-visible,
  .fuse-button__undo:focus-visible {
    outline: none;
  }

  @supports not selector(:has(a)) {
    .fuse-button__idle:focus-visible,
    .fuse-button__undo:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--fb-ink) 60%, transparent);
      outline-offset: -3px;
    }
  }

  .fuse-button__face {
    position: relative;
    grid-area: 1 / 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 100%;
    min-width: 0;
    margin: 0;
    padding: 0 var(--fb-px);
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    white-space: nowrap;
    cursor: pointer;
    opacity: 0;
    filter: blur(2px);
    visibility: hidden;
    transition:
      opacity var(--fb-fade) ease,
      filter var(--fb-fade) ease,
      visibility 0s linear var(--fb-fade),
      background-color 160ms ease;
  }

  .fuse-button[data-phase='idle'] .fuse-button__idle,
  .fuse-button[data-phase='armed'] .fuse-button__undo,
  .fuse-button[data-phase='settled'] .fuse-button__settled {
    opacity: 1;
    filter: blur(0);
    visibility: visible;
    transition-delay: 0s;
  }

  .fuse-button[data-instant] .fuse-button__face {
    transition-duration: 0s;
  }

  .fuse-button__idle:disabled,
  .fuse-button__settled {
    cursor: default;
  }

  .fuse-button[data-phase='idle']:has(.fuse-button__idle:disabled) {
    opacity: 0.55;
  }

  .fuse-button__icon {
    display: inline-flex;
    width: var(--fb-icon);
    height: var(--fb-icon);
  }

  .fuse-button__icon svg,
  .fuse-button__icon .iconify {
    width: 100%;
    height: 100%;
  }

  .fuse-button__icon--undo {
    transform: rotate(-70deg);
    transition: transform var(--fb-fade) var(--fb-ease-out);
  }

  .fuse-button[data-phase='armed'] .fuse-button__icon--undo {
    transform: rotate(0deg);
  }

  .fuse-button__fuse {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: var(--fb-fuse-h);
    background: var(--fb-fuse);
    box-shadow: 0 0 6px color-mix(in srgb, var(--fb-fuse) 55%, transparent);
    transform-origin: left center;
    pointer-events: none;
  }

  .fuse-button[data-fuse='top'] .fuse-button__fuse {
    bottom: auto;
    top: 0;
  }

  .fuse-button__rim {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
    opacity: 0;
    filter: drop-shadow(
      0 0 3px color-mix(in srgb, var(--fb-fuse) 60%, transparent)
    );
    transition: opacity var(--fb-fade) ease;
  }

  .fuse-button[data-phase='armed'] .fuse-button__rim {
    opacity: 1;
  }

  .fuse-button[data-instant] .fuse-button__rim {
    transition-duration: 0s;
  }

  .fuse-button__rim rect {
    x: calc(var(--fb-fuse-h) / 2);
    y: calc(var(--fb-fuse-h) / 2);
    width: calc(100% - var(--fb-fuse-h));
    height: calc(100% - var(--fb-fuse-h));
    rx: max(0px, calc(var(--fb-radius) - var(--fb-fuse-h) / 2));
    fill: none;
    stroke: var(--fb-fuse);
    stroke-width: var(--fb-fuse-h);
    stroke-linecap: round;
    stroke-dasharray: 1;
  }

  .fuse-button__status {
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

  @media (hover: hover) and (pointer: fine) {
    .fuse-button__idle:not(:disabled):hover,
    .fuse-button__undo:hover {
      background: color-mix(in srgb, var(--fb-ink) 7%, transparent);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .fuse-button[data-pressed] {
      transform: none;
    }

    .fuse-button .fuse-button__face {
      filter: none;
      transition:
        opacity var(--fb-fade) ease,
        visibility 0s linear var(--fb-fade);
    }

    .fuse-button .fuse-button__icon--undo {
      transform: none;
      transition: none;
    }
  }

  @media (prefers-contrast: more) {
    .fuse-button {
      box-shadow: inset 0 0 0 1px
        color-mix(in srgb, var(--fb-ink) 40%, transparent);
    }
  }

  @media (forced-colors: active) {
    .fuse-button__fuse {
      background: Highlight;
    }

    .fuse-button__rim rect {
      stroke: Highlight;
    }
  }
</style>
