<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    GLYPHS,
    MODES,
    NO_CHARS,
    bandAt,
    clamp,
    fitBand,
    makeEvent,
    pingPong,
    stepLength,
  } from './glitch-text-math';
  import type { ComponentPublicInstance, CSSProperties } from 'vue';
  import type { GlitchTextEvent, GlitchTextProps } from './types';

  const props = withDefaults(defineProps<GlitchTextProps>(), {
    speed: 0.5,
    enableShadows: true,
    enableOnHover: false,
    offset: 10,
    shadowColors: () => ['#ff0000', '#00ffff'],
    mode: 'slices',
    intensity: 0.5,
    skew: 0,
    flicker: false,
    trigger: 'always',
    burstDuration: 0.6,
    color: undefined,
    fontSize: undefined,
    fontWeight: undefined,
    class: '',
  });

  const rootRef = ref<HTMLDivElement | null>(null);
  const cells: (HTMLSpanElement | null)[] = [];
  const reducedMotion = usePreferredReducedMotion();

  const safeMode = computed(() =>
    MODES.includes(props.mode) ? props.mode : 'slices',
  );
  const activeTrigger = computed(() => {
    if (props.trigger === 'hover' || props.trigger === 'click') {
      return props.trigger;
    }
    return props.enableOnHover ? 'hover' : 'always';
  });
  const chars = computed(() =>
    safeMode.value === 'noise' ? Array.from(props.text) : NO_CHARS,
  );
  const isNoise = computed(() => safeMode.value === 'noise');

  const written = new Map<string, string>();
  const swaps = new Map<number, number>();
  let last = 0;
  let clock = 0;
  let visible = true;
  let hovering = false;
  let burstStart = 0;
  let burstEnd = 0;
  let nextStep = 0;
  let event: GlitchTextEvent | null = null;
  let alpha = 1;
  let jitter = [1, 1, 0, 0];

  function setCellRef(
    index: number,
    el: Element | ComponentPublicInstance | null,
  ): void {
    cells[index] = el instanceof HTMLSpanElement ? el : null;
  }

  function liveCells(): HTMLSpanElement[] {
    return cells
      .slice(0, chars.value.length)
      .filter((cell): cell is HTMLSpanElement => Boolean(cell));
  }

  function write(name: string, value: string): void {
    if (written.get(name) === value) return;
    written.set(name, value);
    rootRef.value?.style.setProperty(name, value);
  }

  function rest(): void {
    write('--glitch-a-top', '0%');
    write('--glitch-a-bottom', '100%');
    write('--glitch-b-top', '0%');
    write('--glitch-b-bottom', '100%');
    write('--glitch-a-x', '0px');
    write('--glitch-a-y', '0px');
    write('--glitch-b-x', '0px');
    write('--glitch-b-y', '0px');
    write('--glitch-a-shadow', 'none');
    write('--glitch-b-shadow', 'none');
    write('--glitch-skew', '0deg');
    write('--glitch-alpha', '1');
    write('--glitch-split', '0');
    const list = liveCells();
    swaps.forEach((_, i) => list[i]?.removeAttribute('data-glyph'));
    swaps.clear();
    event = null;
  }

  function isActive(now: number): boolean {
    return (
      reducedMotion.value !== 'reduce' &&
      visible &&
      (activeTrigger.value === 'always' ||
        (activeTrigger.value === 'hover' && hovering) ||
        now < burstEnd)
    );
  }

  function swap(
    list: HTMLSpanElement[],
    i: number,
    now: number,
    ms: number,
  ): void {
    const cell = list[i];
    if (!cell || cell.textContent === ' ') return;
    cell.setAttribute(
      'data-glyph',
      GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '#',
    );
    cell.style.setProperty(
      '--glitch-glyph',
      props.enableShadows ? props.shadowColors[i % 2]! : 'currentColor',
    );
    swaps.set(i, now + ms * (1 + Math.floor(Math.random() * 3)));
  }

  function step(now: number, power: number): void {
    const ms = stepLength(props.speed);
    if (event && now >= event.until) event = null;
    if (!event && Math.random() < power * power * 0.35) {
      event = makeEvent(now, ms);
    }
    jitter = [
      0.6 + Math.random() * 0.8,
      0.6 + Math.random() * 0.8,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
    ];
    alpha =
      props.flicker && Math.random() < 0.04 + 0.16 * power
        ? 0.45 + Math.random() * 0.35
        : 1;

    const list = liveCells();
    if (list.length) {
      swaps.forEach((until, i) => {
        if (now < until) return;
        list[i]?.removeAttribute('data-glyph');
        swaps.delete(i);
      });
      const chance = 0.01 + 0.16 * power * power;
      list.forEach((_, i) => {
        if (Math.random() < (swaps.has(i) ? 0.35 : chance)) {
          swap(list, i, now, ms);
        }
      });
      if (event?.fresh) {
        const start = Math.floor(Math.random() * list.length);
        const run = 2 + Math.floor(Math.random() * 3);
        for (let k = 0; k < run; k++) {
          swap(list, (start + k) % list.length, now, ms);
        }
      }
    }
    if (event) event.fresh = false;
    nextStep = now + ms * (0.7 + Math.random() * 0.6);
  }

  function frame(now: number): boolean {
    if (!isActive(now)) {
      rest();
      last = 0;
      return false;
    }

    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    clock += dt;

    const bursting = now < burstEnd;
    const burstLeft = bursting
      ? 1 - ((now - burstStart) / Math.max(1, burstEnd - burstStart)) * 0.55
      : 0;
    const power = Math.max(clamp(props.intensity, 0, 1), burstLeft);
    if (now >= nextStep) step(now, power);

    const live = event && now < event.until ? event : null;
    const scale = 0.4 + 1.2 * power;
    const off = Math.max(0, props.offset);
    const pace = Math.max(0.05, props.speed);
    let a: [number, number] = [0, 100];
    let b: [number, number] = [0, 100];
    let ax = 0;
    let ay = 0;
    let bx = 0;
    let by = 0;
    let split = 0;

    if (safeMode.value === 'slices') {
      a = bandAt(pingPong(clock, 3 * pace));
      b = bandAt(pingPong(clock, 2 * pace));
      ax = off * scale;
      bx = -off * scale;
      if (live) {
        a = [live.aTop, 100 - live.aTop - live.aHeight];
        b = [live.bTop, 100 - live.bTop - live.bHeight];
        ax = off * scale * live.ax;
        bx = off * scale * live.bx;
        ay = off * live.ay;
        by = off * live.by;
      }
    } else if (safeMode.value === 'rgb') {
      const spread = off * (0.22 + 0.45 * power);
      ax = spread * jitter[0]!;
      bx = -spread * jitter[1]!;
      ay = off * 0.06 * jitter[2]!;
      by = off * 0.06 * jitter[3]!;
      if (live) {
        ax = off * scale * Math.abs(live.ax);
        bx = -off * scale * Math.abs(live.bx);
        ay = off * live.ay;
        by = off * live.by;
      }
      split = props.enableShadows ? 0.9 : 0.4;
    } else if (safeMode.value === 'scan') {
      const pass = 2.4 * pace;
      const cycle = pass * (1 + (1 - power) * 1.2);
      const local = clock % cycle;
      const height = 9 + 9 * power;
      if (local < pass) {
        const dir = Math.floor(clock / cycle) % 2 ? -1 : 1;
        const center = -height + (local / pass) * (100 + 2 * height);
        const trail = center - height * 1.5;
        const thin = height * 0.35;
        a = [center - height / 2, 100 - (center + height / 2)];
        b = [trail - thin / 2, 100 - (trail + thin / 2)];
        ax = off * scale * 1.5 * dir * (0.75 + 0.25 * Math.sin(clock * 23));
        bx = -ax * 0.5;
      }
      if (live) {
        b = [live.bTop, 100 - live.bTop - live.bHeight];
        bx = off * scale * live.bx * 1.4;
      }
    }

    a = fitBand(a[0], a[1]);
    b = fitBand(b[0], b[1]);
    const shadows = props.enableShadows && safeMode.value !== 'rgb';
    const [colorA, colorB] = props.shadowColors;

    write('--glitch-a-top', `${a[0].toFixed(2)}%`);
    write('--glitch-a-bottom', `${a[1].toFixed(2)}%`);
    write('--glitch-b-top', `${b[0].toFixed(2)}%`);
    write('--glitch-b-bottom', `${b[1].toFixed(2)}%`);
    write('--glitch-a-x', `${ax.toFixed(2)}px`);
    write('--glitch-a-y', `${ay.toFixed(2)}px`);
    write('--glitch-b-x', `${bx.toFixed(2)}px`);
    write('--glitch-b-y', `${by.toFixed(2)}px`);
    write(
      '--glitch-a-shadow',
      shadows ? `${(-ax / 2).toFixed(2)}px 0 ${colorA}` : 'none',
    );
    write(
      '--glitch-b-shadow',
      shadows ? `${(-bx / 2).toFixed(2)}px 0 ${colorB}` : 'none',
    );
    write(
      '--glitch-skew',
      `${(live ? props.skew * live.skew : 0).toFixed(2)}deg`,
    );
    write('--glitch-alpha', alpha.toFixed(2));
    write('--glitch-split', String(split));
    return true;
  }

  const raf = useRafFn(
    ({ timestamp }) => {
      if (!frame(timestamp)) raf.pause();
    },
    { immediate: false },
  );

  function wake(): void {
    if (raf.isActive.value || !isActive(performance.now())) return;
    last = 0;
    raf.resume();
  }

  function onEnter(): void {
    if (activeTrigger.value !== 'hover') return;
    hovering = true;
    wake();
  }

  function onLeave(): void {
    hovering = false;
  }

  function onClick(): void {
    if (activeTrigger.value !== 'click') return;
    const now = performance.now();
    burstStart = now;
    burstEnd = now + Math.max(0.1, props.burstDuration) * 1000;
    event = makeEvent(now, stepLength(props.speed));
    nextStep = now;
    wake();
  }

  useIntersectionObserver(rootRef, (entries) => {
    const entry = entries[entries.length - 1];
    if (!entry) return;
    visible = entry.isIntersecting;
    if (visible) wake();
  });

  watch(
    [safeMode, activeTrigger, () => chars.value.length, reducedMotion],
    () => {
      raf.pause();
      rest();
      hovering = false;
      burstEnd = 0;
      wake();
    },
  );

  onMounted(wake);

  onBeforeUnmount(() => {
    raf.pause();
    rest();
  });

  const rootStyle = computed<CSSProperties>(() => ({
    color: props.color,
    fontSize:
      typeof props.fontSize === 'number'
        ? `${props.fontSize}px`
        : props.fontSize,
    fontWeight: props.fontWeight,
    '--glitch-color-a': props.enableShadows
      ? props.shadowColors[0]
      : 'currentColor',
    '--glitch-color-b': props.enableShadows
      ? props.shadowColors[1]
      : 'currentColor',
  }));
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('glitch', `glitch--${safeMode}`, props.class)"
    :style="rootStyle"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @click="onClick"
  >
    <span class="glitch__text" :aria-hidden="isNoise ? 'true' : undefined">
      <template v-if="isNoise">
        <span
          v-for="(char, i) in chars"
          :key="i"
          :ref="(el) => setCellRef(i, el)"
          class="glitch__char"
        >
          {{ char }}
        </span>
      </template>
      <template v-else>{{ text }}</template>
    </span>
    <span v-if="isNoise" class="glitch__sr">{{ text }}</span>
    <span class="glitch__slice glitch__slice--b" aria-hidden="true">
      {{ text }}
    </span>
    <span class="glitch__slice glitch__slice--a" aria-hidden="true">
      {{ text }}
    </span>
  </div>
</template>

<style scoped>
  .glitch {
    --glitch-mask-a: linear-gradient(
      #000 var(--glitch-a-top, 0%),
      transparent var(--glitch-a-top, 0%),
      transparent calc(100% - var(--glitch-a-bottom, 100%)),
      #000 calc(100% - var(--glitch-a-bottom, 100%))
    );
    --glitch-mask-b: linear-gradient(
      #000 var(--glitch-b-top, 0%),
      transparent var(--glitch-b-top, 0%),
      transparent calc(100% - var(--glitch-b-bottom, 100%)),
      #000 calc(100% - var(--glitch-b-bottom, 100%))
    );
    position: relative;
    margin: 0 auto;
    font-size: clamp(2rem, 10vw, 8rem);
    font-weight: 900;
    white-space: nowrap;
    user-select: none;
    cursor: pointer;
  }

  .glitch__text {
    display: block;
    opacity: var(--glitch-alpha, 1);
    transform: skewX(var(--glitch-skew, 0deg));
    transform-origin: 0 50%;
    -webkit-mask-image: var(--glitch-mask-a), var(--glitch-mask-b);
    mask-image: var(--glitch-mask-a), var(--glitch-mask-b);
    -webkit-mask-composite: source-in;
    mask-composite: intersect;
  }

  .glitch__slice {
    position: absolute;
    top: 0;
    left: 0;
    overflow: hidden;
    pointer-events: none;
    opacity: var(--glitch-alpha, 1);
    transform-origin: 0 50%;
  }

  .glitch__slice--a {
    text-shadow: var(--glitch-a-shadow, none);
    clip-path: inset(var(--glitch-a-top, 0%) 0 var(--glitch-a-bottom, 100%) 0);
    transform: translate3d(var(--glitch-a-x, 0px), var(--glitch-a-y, 0px), 0)
      skewX(var(--glitch-skew, 0deg));
  }

  .glitch__slice--b {
    text-shadow: var(--glitch-b-shadow, none);
    clip-path: inset(var(--glitch-b-top, 0%) 0 var(--glitch-b-bottom, 100%) 0);
    transform: translate3d(var(--glitch-b-x, 0px), var(--glitch-b-y, 0px), 0)
      skewX(var(--glitch-skew, 0deg));
    -webkit-mask-image: var(--glitch-mask-a);
    mask-image: var(--glitch-mask-a);
  }

  .glitch--rgb .glitch__text {
    position: relative;
    z-index: 1;
    -webkit-mask-image: none;
    mask-image: none;
  }

  .glitch--rgb .glitch__slice {
    clip-path: none;
    text-shadow: none;
    -webkit-mask-image: none;
    mask-image: none;
    opacity: calc(var(--glitch-alpha, 1) * var(--glitch-split, 0));
  }

  .glitch--rgb .glitch__slice--a {
    color: var(--glitch-color-a, currentColor);
  }

  .glitch--rgb .glitch__slice--b {
    color: var(--glitch-color-b, currentColor);
  }

  .glitch--noise .glitch__slice {
    display: none;
  }

  .glitch__char {
    position: relative;
  }

  .glitch__char[data-glyph] {
    visibility: hidden;
  }

  .glitch__char::after {
    content: attr(data-glyph);
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    overflow: hidden;
    visibility: visible;
    text-align: center;
    color: var(--glitch-glyph, currentColor);
  }

  .glitch__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
