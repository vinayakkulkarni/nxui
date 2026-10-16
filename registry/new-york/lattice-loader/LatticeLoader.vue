<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    LATTICE_MARKS,
    formatLatticeTime,
    resolveLatticePattern,
    speakLatticeTime,
  } from './lattice-patterns';
  import type { LatticeGrid, LatticeLoaderProps } from './types';

  const props = withDefaults(defineProps<LatticeLoaderProps>(), {
    label: 'Thinking',
    doneLabel: 'Done in',
    errorLabel: 'Failed after',
    status: 'working',
    pattern: 'orbit',
    grid: 3,
    shape: 'round',
    color: 'currentColor',
    doneColor: '#22c55e',
    errorColor: '#ef4444',
    cellSize: 6,
    gap: 2,
    fontSize: 14,
    step: 90,
    idleOpacity: 0.15,
    glow: false,
    glowColor: '',
    showTimer: true,
    elapsed: undefined,
    class: '',
  });

  const n = computed<LatticeGrid>(() => (props.grid === 4 ? 4 : 3));
  const pat = computed(() => resolveLatticePattern(props.pattern, n.value));
  const d = computed(() => props.step * pat.value.scale);
  const cycle = computed(() => Math.round(pat.value.loop * d.value));

  const mark = ref<'done' | 'error'>(
    props.status === 'error' ? 'error' : 'done',
  );
  const markCells = computed(() => LATTICE_MARKS[n.value][mark.value]);
  const timerRef = ref<HTMLSpanElement | null>(null);
  const announce = ref(`${props.label}, in progress`);
  const initialTime = formatLatticeTime(
    props.elapsed != null ? Math.round(props.elapsed * 10) : 0,
  );

  let ds = 0;
  let interval: ReturnType<typeof setInterval> | undefined;

  function paint(value: number) {
    ds = value;
    if (timerRef.value) timerRef.value.textContent = formatLatticeTime(value);
  }

  function stopClock() {
    if (interval !== undefined) clearInterval(interval);
    interval = undefined;
  }

  function syncClock() {
    stopClock();
    if (props.elapsed != null) {
      paint(Math.round(props.elapsed * 10));
      return;
    }
    if (props.status !== 'working') return;
    const startedAt = performance.now();
    paint(0);
    interval = setInterval(() => {
      paint(Math.floor((performance.now() - startedAt) / 100));
    }, 100);
  }

  function cellLit(unit: number | null): number | undefined {
    const lit = pat.value.lit;
    if (unit === null || !lit || lit === 0.62) return undefined;
    return Math.round(lit * 100);
  }

  function cellStyle(unit: number | null) {
    return unit === null
      ? undefined
      : { animationDelay: `${Math.round(unit * d.value)}ms` };
  }

  watch(
    () => props.status,
    (s) => {
      if (s !== 'working') mark.value = s;
    },
    { flush: 'pre' },
  );

  watch([() => props.status, () => props.elapsed], syncClock, {
    flush: 'post',
  });

  watch(
    () => props.status,
    (s) => {
      if (s === 'working') announce.value = `${props.label}, in progress`;
      else {
        const word = s === 'done' ? props.doneLabel : props.errorLabel;
        announce.value = `${word}${props.showTimer ? ` ${speakLatticeTime(ds)}` : ''}`;
      }
    },
    { flush: 'post' },
  );

  onMounted(syncClock);
  onBeforeUnmount(stopClock);

  const rootStyle = computed(() => {
    const markColor =
      props.status === 'error' ? props.errorColor : props.doneColor;
    return {
      '--ll-n': n.value,
      '--ll-cell': `${props.cellSize}px`,
      '--ll-gap': `${props.gap}px`,
      '--ll-font': `${props.fontSize}px`,
      '--ll-color': props.color,
      '--ll-mark': markColor,
      '--ll-idle': props.idleOpacity,
      '--ll-glow': props.glowColor || props.color,
      '--ll-mark-glow': props.glowColor || markColor,
      '--ll-cycle': `${cycle.value}ms`,
    };
  });
</script>

<template>
  <span
    role="status"
    :class="['lattice-loader', props.class]"
    :data-status="status"
    :data-shape="shape"
    :data-glow="glow ? '' : undefined"
    :style="rootStyle"
  >
    <span class="lattice-loader__grid" aria-hidden="true">
      <span class="lattice-loader__layer lattice-loader__run">
        <span
          v-for="(unit, i) in pat.cells"
          :key="`r${i}`"
          class="lattice-loader__cell"
          :data-hole="unit === null ? '' : undefined"
          :data-lit="cellLit(unit)"
          :style="cellStyle(unit)"
        ></span>
      </span>
      <span class="lattice-loader__layer lattice-loader__mark">
        <span
          v-for="(_, i) in pat.cells"
          :key="`m${i}`"
          class="lattice-loader__cell"
          :data-on="markCells.includes(i) ? '' : undefined"
        ></span>
      </span>
    </span>
    <span class="lattice-loader__label" aria-hidden="true">
      <span
        class="lattice-loader__text"
        :data-active="status === 'working' ? '' : undefined"
        >{{ label }}</span
      >
      <span
        class="lattice-loader__text"
        :data-active="status === 'done' ? '' : undefined"
        >{{ doneLabel }}</span
      >
      <span
        class="lattice-loader__text"
        :data-active="status === 'error' ? '' : undefined"
        >{{ errorLabel }}</span
      >
    </span>
    <span
      v-if="showTimer"
      ref="timerRef"
      class="lattice-loader__timer"
      aria-hidden="true"
      >{{ initialTime }}</span
    >
    <span class="lattice-loader__sr">{{ announce }}</span>
  </span>
</template>

<style scoped>
  .lattice-loader {
    --ll-peak: 1;
    --ll-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
    --ll-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);

    position: relative;
    display: inline-flex;
    align-items: center;
    gap: calc(var(--ll-font) * 0.625);
    font-family: inherit;
    font-size: var(--ll-font);
    line-height: 1;
  }

  .lattice-loader__grid {
    display: grid;
    flex: none;
  }

  .lattice-loader__layer {
    grid-area: 1 / 1;
    display: grid;
    grid-template-columns: repeat(var(--ll-n), var(--ll-cell));
    gap: var(--ll-gap);
  }

  .lattice-loader__cell {
    width: var(--ll-cell);
    height: var(--ll-cell);
    border-radius: max(1px, calc(var(--ll-cell) * 0.25));
    background: var(--ll-color);
    opacity: var(--ll-idle);
  }

  .lattice-loader[data-shape='round'] .lattice-loader__cell {
    border-radius: 50%;
  }

  .lattice-loader[data-glow]
    .lattice-loader__run
    .lattice-loader__cell:not([data-hole]) {
    box-shadow: 0 0 calc(var(--ll-cell) * 1.2) calc(var(--ll-cell) * 0.12)
      var(--ll-glow);
  }

  .lattice-loader[data-glow]
    .lattice-loader__mark
    .lattice-loader__cell[data-on] {
    box-shadow: 0 0 calc(var(--ll-cell) * 1.2) calc(var(--ll-cell) * 0.12)
      var(--ll-mark-glow);
  }

  .lattice-loader__run {
    transition: opacity 200ms ease;
  }

  .lattice-loader__run .lattice-loader__cell {
    animation: lattice-on var(--ll-cycle) var(--ll-ease-in-out) infinite;
  }

  .lattice-loader__run .lattice-loader__cell[data-lit='45'] {
    animation-name: lattice-on-45;
  }

  .lattice-loader__run .lattice-loader__cell[data-lit='35'] {
    animation-name: lattice-on-35;
  }

  .lattice-loader__run .lattice-loader__cell[data-lit='25'] {
    animation-name: lattice-on-25;
  }

  .lattice-loader__run .lattice-loader__cell[data-hole] {
    animation: none;
    opacity: calc(var(--ll-idle) * 0.47);
  }

  .lattice-loader__mark {
    opacity: 0;
    transform: scale(0.9);
    transform-origin: center;
    transition:
      opacity 160ms var(--ll-ease-out),
      transform 160ms var(--ll-ease-out);
  }

  .lattice-loader__mark .lattice-loader__cell {
    transition:
      opacity 200ms ease,
      background-color 200ms ease;
  }

  .lattice-loader__mark .lattice-loader__cell[data-on] {
    background: var(--ll-mark);
    opacity: var(--ll-peak);
  }

  .lattice-loader:not([data-status='working']) .lattice-loader__run {
    opacity: 0;
  }

  .lattice-loader:not([data-status='working'])
    .lattice-loader__run
    .lattice-loader__cell {
    animation-play-state: paused;
  }

  .lattice-loader:not([data-status='working']) .lattice-loader__mark {
    opacity: 1;
    transform: none;
    transition:
      opacity 200ms ease,
      transform 200ms var(--ll-ease-out);
  }

  .lattice-loader__label {
    position: relative;
    display: inline-block;
    font-weight: 500;
  }

  .lattice-loader__text {
    position: absolute;
    top: 0;
    left: 0;
    white-space: nowrap;
    opacity: 0;
    filter: blur(2px);
    transition:
      opacity 200ms ease,
      filter 200ms ease;
  }

  .lattice-loader__text[data-active] {
    position: static;
    opacity: 1;
    filter: blur(0);
  }

  .lattice-loader__timer {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: calc(var(--ll-font) * 0.875);
    font-variant-numeric: tabular-nums;
    opacity: 0.6;
  }

  .lattice-loader__sr {
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

  @keyframes lattice-on {
    0%,
    100% {
      opacity: var(--ll-idle);
    }

    18%,
    42% {
      opacity: var(--ll-peak);
    }

    62% {
      opacity: var(--ll-idle);
    }
  }

  @keyframes lattice-on-45 {
    0%,
    100% {
      opacity: var(--ll-idle);
    }

    13%,
    31% {
      opacity: var(--ll-peak);
    }

    45% {
      opacity: var(--ll-idle);
    }
  }

  @keyframes lattice-on-35 {
    0%,
    100% {
      opacity: var(--ll-idle);
    }

    10%,
    24% {
      opacity: var(--ll-peak);
    }

    35% {
      opacity: var(--ll-idle);
    }
  }

  @keyframes lattice-on-25 {
    0%,
    100% {
      opacity: var(--ll-idle);
    }

    7%,
    17% {
      opacity: var(--ll-peak);
    }

    25% {
      opacity: var(--ll-idle);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .lattice-loader__run {
      --ll-peak: 0.7;
    }

    .lattice-loader__run .lattice-loader__cell {
      animation-delay: 0ms !important;
      animation-duration: 1400ms !important;
    }

    .lattice-loader .lattice-loader__mark {
      transform: none;
    }

    .lattice-loader .lattice-loader__text {
      filter: none;
    }
  }
</style>
