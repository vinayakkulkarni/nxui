<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, watch } from 'vue';
  import type { ComponentPublicInstance } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { PULSE_HEART_PATHS } from './pulse-heart-icons';
  import type {
    PulseHeartCell,
    PulseHeartProps,
    PulseHeartRoll,
  } from './types';

  const props = withDefaults(defineProps<PulseHeartProps>(), {
    liked: undefined,
    defaultLiked: false,
    count: 0,
    showCount: true,
    icon: 'heart',
    idleOutline: true,
    size: 40,
    corner: 32,
    likedColor: '#ff4d6d',
    idleColor: '#8b8b93',
    pillColor: '#232326',
    textColor: '#f5f5f5',
    duration: 560,
    dotSize: 0.3,
    overshoot: 1.7,
    beat: 3,
    rollDuration: 350,
    disabled: false,
    label: 'Like',
    class: '',
  });

  const emit = defineEmits<{
    /** Fired on every press with the next state. */
    change: [liked: boolean, count: number];
    /** Supports `v-model:liked`. */
    'update:liked': [liked: boolean];
  }>();

  const OUT = 0.4;

  function back(k: number, c: number): number {
    const u = k - 1;
    return 1 + (c + 1) * u ** 3 + c * u ** 2;
  }

  function swellOf(t: number, c: number): number {
    if (t <= 0) return 0;
    if (t < OUT) return 1 - (1 - t / OUT) ** 3;
    return 1 - back((t - OUT) / (1 - OUT), c);
  }

  const numberFormat = new Intl.NumberFormat('en-US');
  function format(n: number): string {
    return numberFormat.format(n);
  }

  const reducedMotion = usePreferredReducedMotion();

  const controlled = computed(() => props.liked !== undefined);
  const inner = ref(props.defaultLiked);
  const total = ref(props.count);
  const liked = computed(() =>
    props.liked !== undefined ? props.liked : inner.value,
  );
  const shown = ref({ liked: liked.value, count: total.value });
  const roll = ref<PulseHeartRoll | null>(null);

  const rootRef = ref<HTMLButtonElement | null>(null);
  const pillRef = ref<HTMLElement | null>(null);
  const heartRef = ref<HTMLElement | null>(null);
  const glyphRef = ref<SVGGElement | null>(null);
  let rollEl: HTMLElement | null = null;
  let raf = 0;
  let rollTimer = 0;
  let viaPointer = false;

  function setRollRef(el: Element | ComponentPublicInstance | null) {
    rollEl = el instanceof HTMLElement ? el : null;
  }

  watch(
    () => props.count,
    (c) => {
      total.value = c;
    },
  );

  watch([liked, total], ([l, c]) => {
    if (raf) return;
    if (shown.value.liked === l && shown.value.count === c) return;
    shown.value = { liked: l, count: c };
  });

  watch(
    shown,
    () => {
      const root = rootRef.value;
      if (!root || root.dataset.instant === undefined) return;
      root.getBoundingClientRect();
      delete root.dataset.instant;
    },
    { flush: 'post' },
  );

  watch(
    roll,
    (r) => {
      const el = rollEl;
      if (!el || !r) return;
      el.style.transition = 'none';
      el.style.transform = `translateY(${r.up ? '0' : '-1em'})`;
      el.getBoundingClientRect();
      el.style.transition = '';
      el.style.transform = `translateY(${r.up ? '-1em' : '0'})`;
    },
    { flush: 'post' },
  );

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf);
    window.clearTimeout(rollTimer);
  });

  function startRoll(from: number, to: number) {
    if (from === to) return;
    const a = format(from);
    const b = format(to);
    const changed =
      a.length === b.length
        ? [...b].flatMap((ch, i) => (ch !== a[i] ? [i] : []))
        : [];
    roll.value = {
      a,
      b,
      at: changed.length === 1 ? changed[0]! : -1,
      up: to > from,
    };
    window.clearTimeout(rollTimer);
    rollTimer = window.setTimeout(() => {
      roll.value = null;
    }, props.rollDuration);
  }

  function run(nextLiked: boolean, nextCount: number) {
    const root = rootRef.value;
    const heart = heartRef.value;
    const pill = pillRef.value;
    if (!root || !heart || !pill) return;
    const glyph = glyphRef.value;
    root.dataset.running = '';
    let swapped = false;
    let prev = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const D = props.duration;
      const t = Math.min(1, (now - t0) / D);
      const step = prev ? now - prev : 1000 / 60;
      prev = now;
      const s = swellOf(t, props.overshoot);
      const k = 1 - (1 - props.dotSize) * s;
      if (glyph)
        glyph.setAttribute(
          'transform',
          `translate(12 12) scale(${k}) translate(-12 -12)`,
        );
      else heart.style.transform = `scale(${k})`;
      pill.style.transform = `scale(${1 - (props.beat / 100) * s})`;
      if (!swapped && t + step / 2 / D >= OUT) {
        swapped = true;
        root.dataset.liked = String(nextLiked);
        startRoll(shown.value.count, nextCount);
        shown.value = { liked: nextLiked, count: nextCount };
      }
      if (t < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      raf = 0;
      if (glyph) glyph.removeAttribute('transform');
      heart.style.transform = '';
      pill.style.transform = '';
      delete root.dataset.running;
      if (
        liked.value !== shown.value.liked ||
        total.value !== shown.value.count
      ) {
        shown.value = { liked: liked.value, count: total.value };
      }
    };
    raf = requestAnimationFrame(tick);
  }

  function handlePointerDown(e: PointerEvent) {
    if (e.button !== 0 || props.disabled) return;
    viaPointer = true;
    if (reducedMotion.value !== 'reduce' && rootRef.value)
      rootRef.value.dataset.pressed = '';
  }

  function handlePointerUp() {
    if (rootRef.value) delete rootRef.value.dataset.pressed;
  }

  function handlePointerCancel() {
    viaPointer = false;
    handlePointerUp();
  }

  function handleKeyDown() {
    viaPointer = false;
  }

  function handleClick(e: MouseEvent) {
    if (props.disabled || raf) return;
    const pointer = viaPointer && e.detail !== 0;
    viaPointer = false;
    const nextLiked = !liked.value;
    const nextCount = total.value + (nextLiked ? 1 : -1);
    if (!controlled.value) inner.value = nextLiked;
    total.value = nextCount;
    emit('update:liked', nextLiked);
    emit('change', nextLiked, nextCount);
    if (pointer && reducedMotion.value !== 'reduce') run(nextLiked, nextCount);
    else if (rootRef.value) rootRef.value.dataset.instant = '';
  }

  const paths = computed(
    () => PULSE_HEART_PATHS[props.icon] ?? PULSE_HEART_PATHS.heart,
  );

  const cells = computed<PulseHeartCell[]>(() => {
    const r = roll.value;
    if (!r) return [...format(shown.value.count)].map((ch) => ({ ch }));
    if (r.at === -1)
      return [{ top: r.up ? r.a : r.b, bottom: r.up ? r.b : r.a }];
    return [...r.b].map((ch, i) =>
      i === r.at
        ? {
            top: r.up ? (r.a[i] ?? '') : ch,
            bottom: r.up ? ch : (r.a[i] ?? ''),
          }
        : { ch },
    );
  });

  function cellKey(cell: PulseHeartCell, i: number): string {
    return 'ch' in cell ? `c${i}` : `r${i}`;
  }

  const srText = computed(() =>
    props.showCount ? `${props.label}, ${format(total.value)}` : props.label,
  );

  const rootStyle = computed(() => ({
    '--ph-size': `${props.size}px`,
    '--ph-corner': `${props.corner}px`,
    '--ph-pill': props.pillColor,
    '--ph-idle': props.idleColor,
    '--ph-liked': props.likedColor,
    '--ph-text': props.textColor,
    '--ph-roll': `${props.rollDuration}ms`,
    '--ph-stroke': `${(1.5 * props.size) / 24}px`,
  }));
</script>

<template>
  <button
    ref="rootRef"
    type="button"
    :aria-pressed="liked"
    :disabled="disabled"
    :data-liked="String(shown.liked)"
    :data-solid="idleOutline ? undefined : ''"
    :data-no-count="showCount ? undefined : ''"
    :class="['pulse-heart', props.class]"
    :style="rootStyle"
    @pointerdown="handlePointerDown"
    @pointerup="handlePointerUp"
    @pointerleave="handlePointerUp"
    @pointercancel="handlePointerCancel"
    @keydown="handleKeyDown"
    @click="handleClick"
  >
    <span ref="pillRef" class="pulse-heart__pill">
      <span ref="heartRef" class="pulse-heart__heart" aria-hidden="true">
        <slot name="icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <g ref="glyphRef">
              <path
                v-for="d in paths"
                :key="d"
                :d="d"
                vector-effect="non-scaling-stroke"
              />
            </g>
          </svg>
        </slot>
      </span>
      <span v-if="showCount" class="pulse-heart__count" aria-hidden="true">
        <template v-for="(cell, i) in cells" :key="cellKey(cell, i)">
          <span v-if="'ch' in cell">{{ cell.ch }}</span>
          <span v-else class="pulse-heart__slot">
            <span :ref="setRollRef" class="pulse-heart__roll">
              <span>{{ cell.top }}</span>
              <span>{{ cell.bottom }}</span>
            </span>
          </span>
        </template>
      </span>
      <span class="pulse-heart__sr">{{ srText }}</span>
    </span>
  </button>
</template>

<style>
  .pulse-heart {
    --ph-size: 40px;
    --ph-corner: 32px;
    --ph-pill: #232326;
    --ph-idle: #8b8b93;
    --ph-liked: #ff4d6d;
    --ph-text: #f5f5f5;
    --ph-roll: 350ms;
    --ph-stroke: 2.5px;
    --ph-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--ph-corner);
    background: none;
    color: var(--ph-text);
    font-family: inherit;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    outline: none;
    transition: transform 160ms var(--ph-ease-out);
  }

  .pulse-heart[data-pressed] {
    transform: scale(0.97);
  }

  .pulse-heart:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--ph-liked) 60%, transparent);
    outline-offset: 3px;
  }

  .pulse-heart:disabled {
    opacity: 0.55;
    cursor: default;
  }

  .pulse-heart__pill {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--ph-size) * 0.25);
    padding: calc(var(--ph-size) * 0.3);
    padding-inline-end: calc(var(--ph-size) * 0.4);
    border-radius: var(--ph-corner);
    background: var(--ph-pill);
    transform-origin: center;
  }

  .pulse-heart[data-no-count] .pulse-heart__pill {
    padding-inline-end: calc(var(--ph-size) * 0.3);
  }

  .pulse-heart__heart {
    display: block;
    width: var(--ph-size);
    height: var(--ph-size);
    color: var(--ph-idle);
    transform-origin: center;
    transition: color 160ms ease;
  }

  .pulse-heart__heart svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
    fill: none;
    stroke: currentColor;
    stroke-width: var(--ph-stroke);
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .pulse-heart[data-solid] .pulse-heart__heart svg,
  .pulse-heart[data-liked='true'] .pulse-heart__heart svg {
    fill: currentColor;
  }

  .pulse-heart[data-liked='true'] .pulse-heart__heart {
    color: var(--ph-liked);
  }

  .pulse-heart[data-running] .pulse-heart__heart,
  .pulse-heart[data-instant] .pulse-heart__heart {
    transition: none;
  }

  @media (hover: hover) and (pointer: fine) {
    .pulse-heart:not([data-liked='true']):not(:disabled):hover
      .pulse-heart__heart {
      color: color-mix(in srgb, var(--ph-idle) 45%, var(--ph-liked));
    }
  }

  .pulse-heart__count {
    display: inline-flex;
    font-size: calc(var(--ph-size) * 0.5);
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.1px;
    font-variant-numeric: tabular-nums;
    color: var(--ph-text);
  }

  .pulse-heart__count > span {
    display: block;
    height: 1em;
  }

  .pulse-heart__slot {
    position: relative;
    overflow: hidden;
  }

  .pulse-heart__roll {
    display: flex;
    flex-direction: column;
    transition: transform var(--ph-roll) var(--ph-ease-out);
  }

  .pulse-heart__roll > span {
    display: block;
    height: 1em;
    line-height: 1;
  }

  .pulse-heart__sr {
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

  @media (pointer: coarse) {
    .pulse-heart {
      min-width: 44px;
      min-height: 44px;
    }
  }

  @media (prefers-contrast: more) {
    .pulse-heart__pill {
      box-shadow: inset 0 0 0 1px
        color-mix(in srgb, var(--ph-text) 25%, transparent);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pulse-heart {
      transition: none;
    }

    .pulse-heart__heart {
      transition: color 200ms ease;
    }

    .pulse-heart__roll {
      transition: none;
    }
  }
</style>
