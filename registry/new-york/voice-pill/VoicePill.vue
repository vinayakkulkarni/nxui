<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { useEventListener, useRafFn } from '@vueuse/core';
  import type {
    VoicePillProps,
    VoicePillStartDetail,
    VoicePillState,
    VoicePillStopDetail,
    VoicePillStopReason,
  } from './types';
  import {
    DT_MAX,
    SLIDE_MIN,
    clock,
    closeMic,
    drawWave,
    micLevel,
    openMic,
    simulatedLevel,
  } from './voice-pill-signal';

  const props = withDefaults(defineProps<VoicePillProps>(), {
    accentColor: '#f5f5f5',
    iconColor: '#a1a1aa',
    background: '#27272a',
    size: 28,
    shape: 'pill',
    reach: 8,
    showTime: true,
    waveform: true,
    slideToCancel: true,
    cancelDistance: 64,
    attack: 40,
    release: 240,
    sensitivity: 1,
    floor: 0.1,
    openDuration: 200,
    pressScale: 0.95,
    mode: 'auto',
    holdAfter: 300,
    reactive: 'simulated',
    disabled: false,
    ariaLabel: 'Dictate',
    class: '',
  });

  const emit = defineEmits<{
    start: [detail: VoicePillStartDetail];
    stop: [detail: VoicePillStopDetail];
  }>();

  const listening = ref(false);
  const pressed = ref(false);
  const input = ref<'pointer' | 'key'>('pointer');
  const root = ref<HTMLButtonElement | null>(null);
  const timeEl = ref<HTMLSpanElement | null>(null);
  const waveEl = ref<HTMLCanvasElement | null>(null);

  const st: VoicePillState = {
    listening: false,
    pointerId: null,
    ownPress: false,
    downX: 0,
    sliding: false,
    hist: [],
    tick: 0,
    acc: 0,
    downAt: 0,
    startedAt: 0,
    raf: 0,
    last: 0,
    env: 0,
    t0: 0,
    audio: null,
  };

  const { pause, resume } = useRafFn(({ timestamp }) => frame(timestamp), {
    immediate: false,
  });

  function frame(now: number) {
    const dt = Math.min((now - st.last) / 1000, DT_MAX);
    st.last = now;
    let target = 0;
    if (st.listening) {
      const a = st.audio;
      if (a?.analyser && a.buf) target = micLevel(a.analyser, a.buf);
      else if (props.reactive !== 'mic')
        target = simulatedLevel((now - st.t0) / 1000);
    }
    target = Math.min(1, target * props.sensitivity);
    const tau =
      Math.max(1, target > st.env ? props.attack : props.release) / 1000;
    st.env += (target - st.env) * (1 - Math.exp(-Math.max(0, dt) / tau));
    if (st.listening && props.showTime && timeEl.value) {
      const text = clock(now - st.startedAt);
      if (timeEl.value.textContent !== text) timeEl.value.textContent = text;
    }
    if (st.listening && props.waveform && waveEl.value) {
      drawWave(st, waveEl.value, st.env, props.accentColor, props.floor);
    }
    if (!st.listening) pause();
  }

  function begin(kind: 'pointer' | 'key') {
    if (st.listening || props.disabled) return;
    st.listening = true;
    st.hist = [];
    st.tick = 0;
    st.acc = 0;
    st.env = 0;
    st.startedAt = performance.now();
    st.t0 = st.startedAt;
    st.last = st.startedAt;
    if (timeEl.value) timeEl.value.textContent = '0:00';
    listening.value = true;
    input.value = kind;
    resume();
    emit('start', { source: props.reactive });
    if (props.reactive === 'mic') openMic(st).catch(() => end('mic-denied'));
  }

  function end(reason: VoicePillStopReason) {
    if (!st.listening) return;
    st.listening = false;
    closeMic(st);
    listening.value = false;
    input.value = reason === 'key' || reason === 'escape' ? 'key' : 'pointer';
    emit('stop', {
      reason,
      duration: Math.round(performance.now() - st.startedAt),
    });
  }

  function settleSlide() {
    st.sliding = false;
    const el = root.value;
    if (!el) return;
    delete el.dataset.sliding;
    el.style.setProperty('--vp-slide', '0px');
    el.style.setProperty('--vp-cancel', '0');
  }

  function onPointerMove(e: PointerEvent) {
    const el = root.value;
    if (
      !el ||
      st.pointerId !== e.pointerId ||
      !props.slideToCancel ||
      !st.listening ||
      !st.ownPress
    ) {
      return;
    }
    const dx = e.clientX - st.downX;
    if (!st.sliding && dx > -SLIDE_MIN) return;
    st.sliding = true;
    el.dataset.sliding = '';
    const pull = Math.min(props.cancelDistance + 24, Math.max(0, -dx));
    el.style.setProperty('--vp-slide', `${-pull}px`);
    const progress = Math.min(1, pull / props.cancelDistance);
    el.style.setProperty('--vp-cancel', progress.toFixed(3));
    if (progress >= 1) {
      settleSlide();
      end('cancel');
    }
  }

  function onPointerDown(e: PointerEvent) {
    if (
      props.disabled ||
      e.button !== 0 ||
      !e.isPrimary ||
      st.pointerId !== null
    )
      return;
    st.pointerId = e.pointerId;
    st.downX = e.clientX;
    st.downAt = performance.now();
    try {
      root.value?.setPointerCapture(e.pointerId);
    } catch {
      // capture is best effort
    }
    pressed.value = true;
    st.ownPress = !st.listening;
    if (!st.listening) begin('pointer');
  }

  function onPointerUp(e: PointerEvent) {
    if (e.pointerId !== st.pointerId) return;
    st.pointerId = null;
    pressed.value = false;
    if (st.sliding) settleSlide();
    try {
      if (root.value?.hasPointerCapture(e.pointerId))
        root.value.releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
    if (!st.listening) return;
    const held = performance.now() - st.downAt;
    const isHold =
      props.mode === 'hold' ||
      (props.mode === 'auto' && held >= props.holdAfter);
    if (st.ownPress) {
      if (isHold) end('release');
    } else {
      end(held < props.holdAfter ? 'tap' : 'release');
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      end('escape');
      return;
    }
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
      e.preventDefault();
      if (st.listening) end('key');
      else begin('key');
    }
  }

  function onClick(e: MouseEvent) {
    const fromPointer = e instanceof PointerEvent && e.pointerType !== '';
    if (e.detail === 0 && st.pointerId === null && !fromPointer) {
      if (st.listening) end('key');
      else begin('key');
    }
  }

  function onBlur() {
    if (pressed.value) end('blur');
  }

  function onVisibility() {
    if (pressed.value && document.hidden) end('blur');
  }

  useEventListener('blur', onBlur);
  onMounted(() => useEventListener(document, 'visibilitychange', onVisibility));

  watch(
    () => props.disabled,
    (off) => {
      if (off) end('disabled');
    },
  );

  onBeforeUnmount(() => {
    end('unmount');
    pause();
    void st.audio?.ctx.close();
  });

  const radius = computed(() =>
    props.shape === 'rounded' ? Math.round(props.size * 0.29) : props.size / 2,
  );
  const timeSize = computed(() => Math.max(10, Math.round(props.size * 0.36)));
  const clockW = computed(() =>
    props.showTime ? Math.round(timeSize.value * 2.5) + 4 : 0,
  );
  const waveW = computed(() =>
    props.waveform ? Math.round(props.size * 1.9) : 0,
  );

  const rootStyle = computed<Record<string, string>>(() => ({
    '--vp-accent': props.accentColor,
    '--vp-icon': props.iconColor,
    '--vp-bg': props.background,
    '--vp-size': `${props.size}px`,
    '--vp-radius': `${radius.value}px`,
    '--vp-reach': `${props.reach}px`,
    '--vp-extra': `${clockW.value + waveW.value}px`,
    '--vp-clock-w': `${clockW.value}px`,
    '--vp-wave-w': `${waveW.value}px`,
    '--vp-stop': `${Math.round(props.size * 0.32)}px`,
    '--vp-icon-size': `${Math.round(props.size * 0.54)}px`,
    '--vp-time-size': `${timeSize.value}px`,
    '--vp-open': `${props.openDuration}ms`,
    '--vp-press': String(props.pressScale),
    '--vp-hit': `${Math.max(0, Math.min(10, (44 - props.size) / 2))}px`,
  }));
</script>

<template>
  <button
    ref="root"
    type="button"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :aria-pressed="listening"
    :class="['voice-pill', props.class]"
    :data-state="listening ? 'listening' : 'idle'"
    :data-pressed="pressed ? '' : undefined"
    :data-input="input"
    :data-time="showTime ? '' : undefined"
    :style="rootStyle"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @lostpointercapture="onPointerUp"
    @keydown="onKeyDown"
    @click="onClick"
    @contextmenu.prevent
  >
    <span class="voice-pill__capsule" aria-hidden="true" />
    <canvas
      v-if="waveform"
      ref="waveEl"
      class="voice-pill__wave"
      aria-hidden="true"
    />
    <span v-if="slideToCancel" class="voice-pill__cancel" aria-hidden="true">
      <Icon name="lucide:chevron-left" class="voice-pill__cancel-icon" />
      <span>Cancel</span>
    </span>
    <span
      v-if="showTime"
      ref="timeEl"
      class="voice-pill__time"
      aria-hidden="true"
      >0:00</span
    >
    <span class="voice-pill__glyph">
      <span class="voice-pill__mic">
        <Icon name="lucide:mic" />
      </span>
      <span class="voice-pill__stop" aria-hidden="true" />
    </span>
  </button>
</template>

<style scoped>
  .voice-pill {
    --vp-slide: 0px;
    --vp-cancel: 0;
    --vp-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    position: relative;
    display: inline-grid;
    place-items: center;
    isolation: isolate;
    width: var(--vp-size);
    height: var(--vp-size);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--vp-radius);
    background: transparent;
    color: var(--vp-icon);
    font-family: inherit;
    cursor: pointer;
    outline: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: none;
    transition:
      transform 160ms var(--vp-ease-out),
      color 150ms ease;
  }

  .voice-pill:focus-visible .voice-pill__capsule {
    box-shadow: 0 0 0 2px var(--vp-accent);
  }

  .voice-pill::before {
    content: '';
    position: absolute;
    inset: calc(-1 * var(--vp-hit));
  }

  .voice-pill[data-state='listening'] {
    z-index: 1;
    color: var(--vp-accent);
  }

  .voice-pill[data-pressed] {
    transform: scale(var(--vp-press));
  }

  .voice-pill:disabled {
    opacity: 0.55;
    cursor: default;
    pointer-events: none;
  }

  .voice-pill__capsule {
    position: absolute;
    inset: 0 0 0 calc(-1 * (var(--vp-reach) + var(--vp-extra)));
    border-radius: var(--vp-radius);
    background: var(--vp-bg);
    clip-path: inset(
      0 0 0 calc(var(--vp-reach) + var(--vp-extra)) round var(--vp-radius)
    );
    pointer-events: none;
    transition:
      clip-path var(--vp-open) var(--vp-ease-out),
      background-color 150ms ease;
  }

  @media (hover: hover) and (pointer: fine) {
    .voice-pill[data-state='idle']:not(:disabled):hover .voice-pill__capsule {
      background: color-mix(in srgb, var(--vp-icon) 10%, var(--vp-bg));
    }
  }

  .voice-pill[data-state='listening'] .voice-pill__capsule {
    clip-path: inset(0 0 round var(--vp-radius));
  }

  .voice-pill__time {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 100%;
    display: grid;
    place-items: center;
    width: var(--vp-clock-w);
    box-sizing: border-box;
    color: var(--vp-accent);
    font-size: var(--vp-time-size);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    opacity: 0;
    filter: blur(2px);
    transform: translateX(var(--vp-slide));
    pointer-events: none;
    transition:
      opacity 200ms ease,
      filter 200ms ease,
      transform 240ms var(--vp-ease-out);
  }

  .voice-pill[data-state='listening'] .voice-pill__time {
    opacity: calc(1 - var(--vp-cancel));
    filter: blur(0);
  }

  .voice-pill__wave {
    position: absolute;
    top: 18%;
    right: calc(100% + var(--vp-clock-w));
    width: var(--vp-wave-w);
    height: 64%;
    opacity: 0;
    filter: blur(2px);
    transform: translateX(var(--vp-slide));
    pointer-events: none;
    transition:
      opacity 200ms ease,
      filter 200ms ease,
      transform 240ms var(--vp-ease-out);
  }

  .voice-pill[data-state='listening'] .voice-pill__wave {
    opacity: calc(1 - var(--vp-cancel));
    filter: blur(0);
  }

  .voice-pill__cancel {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    width: var(--vp-extra);
    color: var(--vp-accent);
    font-size: var(--vp-time-size);
    font-weight: 500;
    line-height: 1;
    opacity: var(--vp-cancel);
    pointer-events: none;
  }

  .voice-pill__cancel-icon {
    font-size: 12px;
  }

  .voice-pill[data-sliding] .voice-pill__time,
  .voice-pill[data-sliding] .voice-pill__wave,
  .voice-pill[data-sliding] .voice-pill__glyph {
    transition-property: opacity, filter;
  }

  .voice-pill__glyph {
    position: relative;
    display: grid;
    place-items: center;
    width: var(--vp-size);
    height: var(--vp-size);
    transform: translateX(var(--vp-slide));
    transition: transform 240ms var(--vp-ease-out);
  }

  .voice-pill__glyph > * {
    grid-area: 1 / 1;
    transition:
      opacity 200ms ease,
      filter 200ms ease,
      transform 200ms var(--vp-ease-out);
  }

  .voice-pill__mic {
    display: inline-flex;
    font-size: var(--vp-icon-size);
  }

  .voice-pill__stop {
    width: var(--vp-stop);
    height: var(--vp-stop);
    border-radius: 22%;
    background: currentColor;
    opacity: 0;
    filter: blur(2px);
    transform: scale(0.6);
  }

  .voice-pill[data-state='listening'] .voice-pill__mic {
    opacity: 0;
    filter: blur(2px);
    transform: scale(0.7);
  }

  .voice-pill[data-state='listening'] .voice-pill__stop {
    opacity: 1;
    filter: blur(0);
    transform: scale(1);
  }

  .voice-pill[data-input='key'] .voice-pill__capsule,
  .voice-pill[data-input='key'] .voice-pill__time,
  .voice-pill[data-input='key'] .voice-pill__glyph > * {
    transition-duration: 0ms;
  }

  @media (prefers-reduced-motion: reduce) {
    .voice-pill {
      transform: none !important;
      transition: color 150ms ease;
    }

    .voice-pill__capsule {
      transition: background-color 150ms ease;
    }

    .voice-pill__glyph > * {
      filter: none !important;
      transform: none !important;
      transition: opacity 200ms ease;
    }

    .voice-pill__time,
    .voice-pill__wave,
    .voice-pill__glyph {
      filter: none !important;
      transition-property: opacity;
    }
  }
</style>
