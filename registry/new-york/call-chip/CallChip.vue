<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import type { CallChipGlyph, CallChipProps, CallChipStatus } from './types';

  const props = withDefaults(defineProps<CallChipProps>(), {
    icon: 'terminal',
    name: 'bash',
    argument: 'npm test',
    status: 'running',
    expectedMs: 2500,
    size: 34,
    radius: 10,
    color: 'currentColor',
    surfaceColor: '#27272a',
    progressColor: 'currentColor',
    progressOpacity: 0.08,
    doneColor: '#22c55e',
    errorColor: '#ef4444',
    washOpacity: 0.14,
    shake: 6,
    showTimer: true,
    onRetry: undefined,
    class: '',
  });

  const HOLD_AT = 0.9;
  const SHAKE = [0, -1, 1, -0.66, 0.66, -0.33, 0];
  const ICONS: Record<string, string> = {
    terminal: 'lucide:square-terminal',
    file: 'lucide:file-text',
    search: 'lucide:search',
    edit: 'lucide:square-pen',
  };
  const WORDS: Record<CallChipStatus, string> = {
    running: 'running',
    done: 'done',
    error: 'failed',
    idle: 'queued',
  };

  function fmt(ms: number): string {
    return ms < 10000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
  }
  function glyphOf(s: CallChipStatus): CallChipGlyph {
    if (s === 'done') return 'check';
    if (s === 'error') return 'retry';
    return 'tool';
  }

  const reducedMotion = usePreferredReducedMotion();
  const rootRef = ref<HTMLSpanElement | null>(null);
  const fillRef = ref<HTMLSpanElement | null>(null);
  const timerRef = ref<HTMLSpanElement | null>(null);
  const mounted = ref(false);
  const pressed = ref(false);
  const glyphCur = ref<CallChipGlyph>(glyphOf(props.status));
  const glyphPrev = ref<CallChipGlyph | null>(null);
  const announce = ref(
    `${props.name} ${props.argument}, ${WORDS[props.status]}`,
  );

  let fraction = 0;
  let liveFraction = 0;
  let clockMs = 0;
  let shakeAnim: Animation | null = null;
  let raf = 0;
  let interval: ReturnType<typeof setInterval> | undefined;
  let startedAt = 0;

  const font = computed(() => Math.max(11, Math.round(props.size * 0.38)));
  const iconSize = computed(() => font.value + 2);
  const toolIcon = computed(() => ICONS[props.icon] ?? props.icon);

  const rootStyle = computed(() => ({
    '--cc-size': `${props.size}px`,
    '--cc-font': `${font.value}px`,
    '--cc-pad': `${Math.round(props.size * 0.35)}px`,
    '--cc-gap': `${Math.round(font.value * 0.55)}px`,
    '--cc-radius': `${props.radius}px`,
    '--cc-color': props.color,
    '--cc-surface': props.surfaceColor,
    '--cc-progress': props.progressColor,
    '--cc-progress-pct': `${props.progressOpacity * 100}%`,
    '--cc-done': props.doneColor,
    '--cc-error': props.errorColor,
    '--cc-wash-pct': `${props.washOpacity * 100}%`,
    '--cc-expected': `${props.expectedMs}ms`,
  }));

  function glyphState(g: CallChipGlyph): 'in' | 'out' | undefined {
    if (g === glyphCur.value) return 'in';
    if (g === glyphPrev.value) return 'out';
    return undefined;
  }

  function setFraction(f: number, instant: boolean) {
    const fill = fillRef.value;
    if (!fill) return;
    fraction = f;
    if (instant) fill.style.transition = 'none';
    fill.style.transform = `scaleX(${f})`;
    if (instant) {
      void fill.getBoundingClientRect();
      fill.style.transition = '';
    }
  }

  function readLiveFraction(): number {
    const fill = fillRef.value;
    if (!fill) return fraction;
    const t = getComputedStyle(fill).transform;
    return t && t !== 'none' ? new DOMMatrix(t).a : fraction;
  }

  function apply(s: CallChipStatus, animate: boolean) {
    if (s === 'running') {
      shakeAnim?.cancel();
      setFraction(0, true);
      if (animate) setFraction(HOLD_AT, false);
    } else if (s === 'done') {
      setFraction(1, !animate);
    } else if (s === 'error') {
      setFraction(Math.min(1, Math.max(0, liveFraction)), true);
      const root = rootRef.value;
      if (
        animate &&
        props.shake > 0 &&
        reducedMotion.value !== 'reduce' &&
        root
      ) {
        shakeAnim = root.animate(
          SHAKE.map((k) => ({
            transform: `translateX(${k * props.shake}px)`,
            easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
          })),
          { duration: 450, composite: 'add' },
        );
      }
    } else {
      setFraction(0, true);
    }
  }

  function writeClock(ms: number) {
    clockMs = ms;
    if (timerRef.value) timerRef.value.textContent = fmt(ms);
  }

  function stopClock() {
    const running = raf !== 0 || interval !== undefined;
    cancelAnimationFrame(raf);
    raf = 0;
    if (interval !== undefined) clearInterval(interval);
    interval = undefined;
    if (running) writeClock(performance.now() - startedAt);
  }

  function tick() {
    writeClock(performance.now() - startedAt);
    raf = requestAnimationFrame(tick);
  }

  function startClock(s: CallChipStatus) {
    if (s !== 'running') {
      if ((s === 'idle' || !clockMs) && timerRef.value)
        timerRef.value.textContent = '—';
      return;
    }
    startedAt = performance.now();
    writeClock(0);
    if (reducedMotion.value === 'reduce') {
      interval = setInterval(() => {
        writeClock(performance.now() - startedAt);
      }, 100);
      return;
    }
    tick();
  }

  function updateAnnounce(s: CallChipStatus) {
    const ms = props.showTimer && clockMs ? Math.round(clockMs) : 0;
    let when = '';
    if (s === 'done' && ms) when = ` in ${ms} ms`;
    else if (s === 'error' && ms) when = ` after ${ms} ms`;
    announce.value = `${props.name} ${props.argument}, ${WORDS[s] ?? s}${when}`;
  }

  // Before the DOM switches data-status (which swaps the fill's transition),
  // capture the in-flight fill fraction and roll the glyph.
  watch(
    () => props.status,
    (s) => {
      if (mounted.value) liveFraction = readLiveFraction();
      const g = glyphOf(s);
      if (g !== glyphCur.value) {
        glyphPrev.value = glyphCur.value;
        glyphCur.value = g;
      }
    },
    { flush: 'pre' },
  );

  watch(
    () => props.status,
    (s) => {
      if (!mounted.value) return;
      apply(s, true);
      stopClock();
      startClock(s);
      updateAnnounce(s);
    },
    { flush: 'post' },
  );

  onMounted(() => {
    mounted.value = true;
    apply(props.status, props.status === 'running');
    startClock(props.status);
  });

  onBeforeUnmount(() => {
    mounted.value = false;
    shakeAnim?.cancel();
    stopClock();
  });

  function onRetryClick() {
    props.onRetry?.();
  }
  function onPressStart() {
    pressed.value = true;
  }
  function onPressEnd() {
    pressed.value = false;
  }
</script>

<template>
  <span
    ref="rootRef"
    role="status"
    :aria-busy="status === 'running' || undefined"
    :data-status="status"
    :data-mounted="mounted ? '' : undefined"
    :data-pressed="pressed ? '' : undefined"
    :class="['call-chip', props.class]"
    :style="rootStyle"
  >
    <span ref="fillRef" class="call-chip__fill" aria-hidden="true"></span>
    <span class="call-chip__slot" aria-hidden="true">
      <span class="call-chip__glyph" :data-state="glyphState('tool')">
        <slot name="icon">
          <Icon :name="toolIcon" :size="iconSize" />
        </slot>
      </span>
      <span class="call-chip__glyph" :data-state="glyphState('check')">
        <Icon name="lucide:check" :size="iconSize" />
      </span>
      <span class="call-chip__glyph" :data-state="glyphState('retry')">
        <Icon name="lucide:refresh-cw" :size="iconSize" />
      </span>
    </span>
    <span class="call-chip__name" aria-hidden="true">{{ name }}</span>
    <span class="call-chip__arg" aria-hidden="true">{{ argument }}</span>
    <span
      v-if="showTimer"
      ref="timerRef"
      class="call-chip__timer"
      aria-hidden="true"
      >0 ms</span
    >
    <button
      v-if="status === 'error' && onRetry"
      type="button"
      class="call-chip__retry"
      :aria-label="`Retry ${name} ${argument}`"
      @click="onRetryClick"
      @pointerdown="onPressStart"
      @pointerup="onPressEnd"
      @pointercancel="onPressEnd"
      @pointerleave="onPressEnd"
    ></button>
    <span class="call-chip__sr">{{ announce }}</span>
  </span>
</template>

<style scoped>
  .call-chip {
    --cc-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--cc-gap);
    box-sizing: border-box;
    height: var(--cc-size);
    padding: 0 var(--cc-pad);
    border-radius: var(--cc-radius);
    overflow: hidden;
    background: var(--cc-surface);
    color: var(--cc-color);
    font-size: var(--cc-font);
    line-height: 1;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    transition: transform 160ms var(--cc-ease-out);
  }

  .call-chip[data-status='error'] {
    cursor: pointer;
  }

  .call-chip[data-pressed] {
    transform: scale(0.97);
  }

  .call-chip:has(.call-chip__retry:focus-visible) {
    overflow: visible;
    outline: 2px solid var(--cc-error);
    outline-offset: 2px;
  }

  .call-chip__fill {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: color-mix(
      in srgb,
      var(--cc-progress) var(--cc-progress-pct),
      transparent
    );
    transform: scaleX(0);
    transform-origin: left center;
    clip-path: inset(0 0 0 0);
    pointer-events: none;
  }

  .call-chip[data-status='running'] .call-chip__fill {
    transition: transform var(--cc-expected) linear;
  }

  .call-chip[data-status='done'] .call-chip__fill {
    background: color-mix(
      in srgb,
      var(--cc-done) var(--cc-wash-pct),
      transparent
    );
    clip-path: inset(100% 0 0 0);
    transition:
      transform 200ms var(--cc-ease-out),
      background-color 120ms ease,
      clip-path 400ms var(--cc-ease-out) 200ms;
  }

  .call-chip[data-status='error'] .call-chip__fill {
    background: color-mix(
      in srgb,
      var(--cc-error) var(--cc-wash-pct),
      transparent
    );
    transition: background-color 200ms ease;
  }

  .call-chip:not([data-mounted]) .call-chip__fill,
  .call-chip:not([data-mounted]) .call-chip__glyph {
    transition: none !important;
  }

  .call-chip__slot {
    position: relative;
    flex: none;
    width: calc(var(--cc-font) + 2px);
    height: calc(var(--cc-font) + 2px);
    overflow: hidden;
  }

  .call-chip__glyph {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    opacity: 0;
    transform: translateY(70%);
    filter: blur(3px);
  }

  .call-chip__glyph[data-state='in'] {
    opacity: 1;
    transform: none;
    filter: blur(0);
    transition:
      opacity 240ms var(--cc-ease-out),
      transform 240ms var(--cc-ease-out),
      filter 240ms var(--cc-ease-out);
  }

  .call-chip__glyph[data-state='out'] {
    transform: translateY(-70%);
    transition:
      opacity 160ms var(--cc-ease-out),
      transform 160ms var(--cc-ease-out),
      filter 160ms var(--cc-ease-out);
  }

  .call-chip[data-status='done'] .call-chip__glyph[data-state='in'] {
    color: var(--cc-done);
  }

  .call-chip[data-status='error'] .call-chip__glyph[data-state='in'] {
    color: var(--cc-error);
  }

  .call-chip__name,
  .call-chip__arg,
  .call-chip__timer {
    position: relative;
  }

  .call-chip__name {
    font-weight: 500;
  }

  .call-chip__arg {
    opacity: 0.72;
  }

  .call-chip__timer {
    min-width: 6ch;
    font-variant-numeric: tabular-nums;
    text-align: right;
    opacity: 0.5;
  }

  .call-chip__retry {
    position: absolute;
    inset: -5px;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--cc-radius);
    background: transparent;
    appearance: none;
    cursor: pointer;
    outline: none;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .call-chip__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .call-chip[data-status='done'] .call-chip__fill {
      clip-path: inset(0 0 0 0);
      transition: background-color 120ms ease;
    }

    .call-chip__glyph {
      transform: none !important;
      filter: none !important;
    }

    .call-chip[data-pressed] {
      transform: none;
    }
  }
</style>
