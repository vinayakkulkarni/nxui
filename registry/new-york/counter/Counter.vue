<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    ref,
    shallowRef,
    useId,
    useSlots,
    watch,
  } from 'vue';
  import {
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    COUNTER_DIRECTIONS,
    COUNTER_MASK,
    clamp,
    createFormatter,
    digitsFor,
    makeItem,
    mod,
    slotsFor,
    stepBetween,
    wrap,
  } from './counter-format';
  import type {
    CounterItem,
    CounterListSlot,
    CounterProps,
    CounterSettings,
  } from './types';

  const props = withDefaults(defineProps<CounterProps>(), {
    value: 0,
    locale: 'en-US',
    format: undefined,
    decimals: undefined,
    minDigits: 1,
    prefix: undefined,
    suffix: undefined,
    direction: 'auto',
    duration: 0.7,
    bounce: 0.2,
    stagger: 0.04,
    motionBlur: true,
    intro: true,
    fade: 0.3,
    fontSize: 100,
    fontWeight: 'inherit',
    textColor: 'inherit',
    gap: 0,
    padding: 0,
    tabular: true,
    digitStyle: undefined,
    class: '',
  });

  const slots = useSlots();
  const TAU = Math.PI * 2;

  const rootRef = ref<HTMLSpanElement | null>(null);
  const rowRef = ref<HTMLSpanElement | null>(null);
  const measureRef = ref<HTMLSpanElement | null>(null);
  const blurId = useId().replace(/[^\w-]/g, '');
  const reducedMotion = usePreferredReducedMotion();

  const amount = computed(() => {
    const value = Number(props.value);
    return Object.is(value, -0) ? 0 : value;
  });
  const formatKey = computed(() => JSON.stringify(props.format ?? {}));
  const localeKey = computed(() =>
    Array.isArray(props.locale) ? props.locale.join(',') : props.locale,
  );

  const formatter = computed(() => {
    const parsed: unknown = JSON.parse(formatKey.value);
    const options: Intl.NumberFormatOptions =
      typeof parsed === 'object' && parsed !== null ? { ...parsed } : {};
    if (props.decimals !== undefined) {
      const fixed = clamp(Math.round(props.decimals), 0, 20);
      options.minimumFractionDigits = fixed;
      options.maximumFractionDigits = fixed;
    }
    if (props.minDigits > 1) {
      options.minimumIntegerDigits = clamp(Math.round(props.minDigits), 1, 21);
    }
    const key = localeKey.value;
    return createFormatter(key.includes(',') ? key.split(',') : key, options);
  });

  const digits = computed(() => digitsFor(formatter.value));
  const slotList = computed(() =>
    slotsFor(formatter.value, digits.value, amount.value),
  );
  const label = computed(() => formatter.value.format(amount.value));

  const list = shallowRef<CounterListSlot[]>(
    slotList.value.map((slot) => ({
      ...slot,
      start: slot.kind === 'digit' ? slot.digit : 0,
    })),
  );

  const settings = computed<CounterSettings>(() => ({
    direction: COUNTER_DIRECTIONS.includes(props.direction)
      ? props.direction
      : 'auto',
    duration: Math.max(0.05, props.duration),
    bounce: clamp(props.bounce, 0, 0.9),
    stagger: Math.max(0, props.stagger),
    motionBlur: props.motionBlur,
    tabular: props.tabular,
  }));

  const rootStyle = computed(() => ({
    fontSize:
      typeof props.fontSize === 'number'
        ? `${props.fontSize}px`
        : props.fontSize,
    fontWeight: props.fontWeight,
    color: props.textColor,
    fontVariantNumeric: props.tabular ? 'tabular-nums' : undefined,
    '--counter-fade': `${Math.max(0, props.fade)}em`,
    '--counter-gap': `${Math.max(0, props.gap)}px`,
    '--counter-padding': `${Math.max(0, props.padding)}px`,
  }));

  const windowStyle = {
    maskImage: COUNTER_MASK,
    WebkitMaskImage: COUNTER_MASK,
  };

  const hasPrefix = computed(
    () => props.prefix !== undefined || Boolean(slots.prefix),
  );
  const hasSuffix = computed(
    () => props.suffix !== undefined || Boolean(slots.suffix),
  );

  // Engine (non-reactive, mutated every frame).
  const items = new Map<string, CounterItem>();
  let raf = 0;
  let last = 0;
  let previousValue = amount.value;
  let widths: number[] = [];
  let em = 16;
  let alive = true;

  for (const slot of slotList.value) {
    items.set(
      slot.key,
      makeItem(slot, slot.kind === 'digit' ? slot.digit : 0, 1),
    );
  }

  const isReduced = () => reducedMotion.value === 'reduce';

  function numeralTransform(n: number, start: number): string {
    return `translateY(${wrap(n - start) * 100}%)`;
  }

  function paint(item: CounterItem) {
    const el = item.el;
    if (!el) return;
    const s = settings.value;
    const shown = clamp(item.shown, 0, 1);
    const resting = item.pos === item.target && item.vel === 0;
    if (item.kind === 'digit') {
      item.numerals?.forEach((numeral, n) => {
        numeral.style.transform = `translateY(${(wrap(n - item.pos) * 100).toFixed(3)}%)`;
      });
      if (shown >= 1 && (s.tabular || resting)) {
        el.style.width = '';
      } else {
        const at = mod(item.pos, 10);
        const low = Math.floor(at);
        const from = widths[low % 10] ?? 0;
        const to = widths[(low + 1) % 10] ?? from;
        el.style.width = `${((from + (to - from) * (at - low)) * shown).toFixed(2)}px`;
      }
      if (item.blur && item.strip) {
        const radius = s.motionBlur
          ? clamp((Math.abs(item.vel) - 3) * 0.006, 0, 0.09) * em
          : 0;
        if (radius > 0.25) {
          item.blur.setAttribute('stdDeviation', `0 ${radius.toFixed(2)}`);
          if (!item.blurred) {
            item.strip.style.filter = `url(#${item.filter})`;
            item.blurred = true;
          }
        } else if (item.blurred) {
          item.strip.style.filter = '';
          item.blurred = false;
        }
      }
    } else {
      el.style.width =
        shown >= 1 ? '' : `${(item.natural * shown).toFixed(2)}px`;
    }
    el.style.setProperty('--counter-shown', shown >= 1 ? '' : shown.toFixed(3));
  }

  function frame(now: number) {
    raf = 0;
    const s = settings.value;
    const elapsed = clamp((now - last) / 1000, 0, 1 / 20);
    last = now;
    const reduced = isReduced();
    const omega = TAU / s.duration;
    const zeta = 1 - s.bounce;
    const presence = TAU / (s.duration * 0.85);
    const done: string[] = [];
    let busy = false;
    items.forEach((item, key) => {
      if (reduced) {
        item.wait = 0;
        item.pos = item.target;
        item.vel = 0;
        item.shown = item.shownTarget;
        item.shownVel = 0;
      } else {
        let left = elapsed;
        if (item.wait > 0) {
          const used = Math.min(item.wait, left);
          item.wait -= used;
          left -= used;
        }
        if (left > 0) {
          const steps = Math.ceil(left * 240);
          const dt = left / steps;
          for (let i = 0; i < steps; i++) {
            item.vel +=
              (-omega * omega * (item.pos - item.target) -
                2 * zeta * omega * item.vel) *
              dt;
            item.pos += item.vel * dt;
            item.shownVel +=
              (-presence * presence * (item.shown - item.shownTarget) -
                2 * presence * item.shownVel) *
              dt;
            item.shown += item.shownVel * dt;
          }
        }
      }
      const settled =
        item.wait <= 0 &&
        Math.abs(item.pos - item.target) < 0.002 &&
        Math.abs(item.vel) < 0.02 &&
        Math.abs(item.shown - item.shownTarget) < 0.002 &&
        Math.abs(item.shownVel) < 0.02;
      if (settled) {
        item.target = mod(Math.round(item.target), 10);
        item.pos = item.target;
        item.vel = 0;
        item.shown = item.shownTarget;
        item.shownVel = 0;
        if (item.exiting) done.push(key);
      } else {
        busy = true;
      }
      paint(item);
    });
    if (done.length) {
      done.forEach((key) => items.delete(key));
      list.value = list.value.filter((slot) => !done.includes(slot.key));
    }
    if (busy && alive) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (raf || !alive || typeof window === 'undefined') return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function update() {
    const s = settings.value;
    const next = slotList.value;
    const value = amount.value;
    const previous = previousValue;
    previousValue = value;
    const trend =
      s.direction !== 'auto'
        ? s.direction
        : Math.abs(value) > Math.abs(previous)
          ? 'up'
          : Math.abs(value) < Math.abs(previous)
            ? 'down'
            : 'shortest';
    const keys = new Set(next.map((slot) => slot.key));
    const moving: CounterItem[] = [];
    for (const slot of next) {
      let item = items.get(slot.key);
      if (!item) {
        item = makeItem(slot, 0, 0);
        items.set(slot.key, item);
      }
      item.exiting = false;
      item.shownTarget = 1;
      item.rank = slot.rank;
      if (slot.kind !== 'digit') continue;
      const step = stepBetween(
        mod(Math.round(item.target), 10),
        slot.digit,
        trend,
      );
      if (step !== 0 || item.shown < 1) {
        item.target += step;
        moving.push(item);
      }
    }
    items.forEach((item, key) => {
      if (keys.has(key) || item.exiting) return;
      item.exiting = true;
      item.shownTarget = 0;
      if (item.kind !== 'digit') return;
      item.target += stepBetween(mod(Math.round(item.target), 10), 0, trend);
      moving.push(item);
    });
    moving
      .sort((a, b) => b.rank - a.rank)
      .forEach((item, order) => {
        item.wait = order * s.stagger;
      });
    items.forEach((item, key) => {
      if (item.kind !== 'symbol' || key[0] !== 'g') return;
      const owner = items.get(`i${key.slice(1)}`);
      if (owner && (owner.shown < 1 || owner.shownTarget < 1)) {
        item.wait = owner.wait;
      }
    });

    const prev = list.value;
    const known = new Map(prev.map((slot) => [slot.key, slot]));
    const merged: CounterListSlot[] = next.map((slot) => ({
      ...slot,
      start: known.get(slot.key)?.start ?? 0,
    }));
    for (const slot of prev) {
      if (!keys.has(slot.key)) merged.push(slot);
    }
    merged.sort((a, b) => a.rank - b.rank);
    const same =
      merged.length === prev.length &&
      merged.every((slot, index) => {
        const other = prev[index];
        return (
          other !== undefined &&
          slot.key === other.key &&
          slot.digit === other.digit &&
          slot.text === other.text
        );
      });
    if (!same) list.value = merged;
    kick();
  }

  function bind() {
    const row = rowRef.value;
    if (!row) return;
    row.querySelectorAll<HTMLElement>('[data-slot]').forEach((el) => {
      const item = items.get(el.dataset.slot ?? '');
      if (!item) return;
      item.el = el;
      if (item.kind === 'digit') {
        item.numerals = [...el.querySelectorAll<HTMLElement>('[data-numeral]')];
        item.strip = el.querySelector<HTMLElement>('[data-strip]');
        item.blur = el.querySelector('feGaussianBlur');
        item.filter = el.querySelector('filter')?.id ?? '';
        if (!item.blur && item.strip) item.strip.style.filter = '';
        item.blurred = Boolean(item.blur && item.strip?.style.filter);
      } else if (item.shown < 1 || item.shownTarget < 1) {
        const child = el.firstElementChild;
        item.natural = child ? child.getBoundingClientRect().width : 0;
      }
      paint(item);
    });
  }

  function measure() {
    const row = measureRef.value;
    const root = rootRef.value;
    if (!row || !root || !alive) return;
    widths = [...row.children].map(
      (child) => child.getBoundingClientRect().width,
    );
    em = Number.parseFloat(getComputedStyle(root).fontSize) || 16;
  }

  function spin() {
    const s = settings.value;
    const turn = s.direction === 'down' ? -10 : 10;
    [...items.values()]
      .filter((item) => item.kind === 'digit' && !item.exiting)
      .sort((a, b) => a.rank - b.rank)
      .forEach((item, order) => {
        item.target += turn;
        item.wait = order * s.stagger;
      });
    kick();
  }

  const introObserver = useIntersectionObserver(
    rootRef,
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      introObserver.pause();
      spin();
    },
    { threshold: 0.5, immediate: false },
  );

  function armIntro() {
    if (!props.intro || isReduced()) return;
    if (typeof IntersectionObserver === 'undefined') {
      spin();
      return;
    }
    introObserver.resume();
  }

  useResizeObserver(measureRef, measure);

  watch(slotList, update);
  watch(
    () => props.motionBlur,
    () => bind(),
    { flush: 'post' },
  );
  watch(
    () => props.intro,
    (on) => {
      if (on) armIntro();
      else introObserver.pause();
    },
  );

  onUpdated(bind);

  onMounted(() => {
    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    bind();
    armIntro();
  });

  onBeforeUnmount(() => {
    alive = false;
    cancelAnimationFrame(raf);
    raf = 0;
  });
</script>

<template>
  <span ref="rootRef" :class="cn('counter', props.class)" :style="rootStyle">
    <span class="counter__sr">
      <slot name="prefix">{{ prefix }}</slot
      >{{ label }}<slot name="suffix">{{ suffix }}</slot>
    </span>
    <span ref="rowRef" class="counter__row" aria-hidden="true">
      <span v-if="hasPrefix" class="counter__affix">
        <slot name="prefix">{{ prefix }}</slot>
      </span>
      <template v-for="entry in list" :key="entry.key">
        <span
          v-if="entry.kind === 'digit'"
          :data-slot="entry.key"
          class="counter__digit"
          :style="digitStyle"
        >
          <span class="counter__sizer">{{ digits[entry.digit] }}</span>
          <span class="counter__window" :style="windowStyle">
            <span class="counter__strip" data-strip="">
              <span
                v-for="(char, n) in digits"
                :key="n"
                class="counter__numeral"
                data-numeral=""
                :style="{ transform: numeralTransform(n, entry.start) }"
                >{{ char }}</span
              >
            </span>
          </span>
          <svg v-if="motionBlur" class="counter__blur" aria-hidden="true">
            <filter
              :id="`${blurId}-${entry.key}`"
              x="-10%"
              y="-50%"
              width="120%"
              height="200%"
              color-interpolation-filters="sRGB"
            >
              <feGaussianBlur stdDeviation="0 0" />
            </filter>
          </svg>
        </span>
        <span v-else :data-slot="entry.key" class="counter__symbol">
          <span class="counter__symbol-text">{{ entry.text }}</span>
        </span>
      </template>
      <span v-if="hasSuffix" class="counter__affix">
        <slot name="suffix">{{ suffix }}</slot>
      </span>
    </span>
    <span ref="measureRef" class="counter__measure" aria-hidden="true">
      <span v-for="(char, n) in digits" :key="n">{{ char }}</span>
    </span>
  </span>
</template>

<style scoped>
  .counter {
    position: relative;
    display: inline-flex;
    align-items: baseline;
    line-height: 1;
    white-space: nowrap;
    direction: ltr;
    unicode-bidi: isolate;
  }

  .counter__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  .counter__row {
    display: inline-flex;
    align-items: baseline;
    margin: 0 calc(var(--counter-gap, 0px) / -2);
    user-select: none;
    -webkit-user-select: none;
  }

  .counter__affix,
  .counter__digit,
  .counter__symbol {
    margin: 0 calc(var(--counter-gap, 0px) / 2 * var(--counter-shown, 1));
    opacity: var(--counter-shown, 1);
  }

  .counter__affix {
    white-space: pre;
  }

  .counter__digit {
    position: relative;
    display: inline-block;
    box-sizing: content-box;
    line-height: calc(1em + var(--counter-padding, 0px));
    text-align: center;
  }

  .counter__sizer {
    visibility: hidden;
  }

  .counter__window {
    position: absolute;
    top: calc(var(--counter-fade, 0em) * -1);
    right: 0;
    bottom: calc(var(--counter-fade, 0em) * -1);
    left: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .counter__strip {
    position: absolute;
    inset: 0;
  }

  .counter__numeral {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    will-change: transform;
  }

  .counter__symbol {
    position: relative;
    display: inline-flex;
    justify-content: center;
    clip-path: inset(-0.5em 0);
  }

  .counter__symbol-text {
    display: inline-block;
    white-space: pre;
  }

  .counter__blur {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
  }

  .counter__measure {
    position: absolute;
    top: 0;
    left: 0;
    height: 0;
    overflow: hidden;
    white-space: nowrap;
    visibility: hidden;
    pointer-events: none;
  }

  .counter__measure > span {
    display: inline-block;
  }
</style>
