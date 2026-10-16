<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
  } from 'vue';
  import { usePreferredReducedMotion, useResizeObserver } from '@vueuse/core';
  import { animate, useMotionValue } from 'motion-v';
  import type {
    JellyRadioChipValues,
    JellyRadioOption,
    JellyRadioProps,
  } from './types';

  const SIZES = {
    sm: { h: 28, font: 12, px: 12 },
    md: { h: 36, font: 13, px: 16 },
    lg: { h: 44, font: 14, px: 20 },
  };

  const props = withDefaults(defineProps<JellyRadioProps>(), {
    items: () => ['Off', 'Low', 'Medium', 'High', 'Max'],
    modelValue: undefined,
    defaultValue: undefined,
    chipColor: 'var(--muted)',
    activeColor: 'var(--foreground)',
    textColor: 'var(--foreground)',
    activeTextColor: 'var(--background)',
    size: 'md',
    gap: 8,
    radius: 18,
    swell: 0.2,
    barge: 6,
    shrink: 0.05,
    jelly: 1,
    bounce: 0.25,
    stagger: 22,
    stiffness: 580,
    disabled: false,
    ariaLabel: 'Options',
    class: undefined,
  });

  const emit = defineEmits<{
    'update:modelValue': [value: string];
    change: [value: string, index: number];
  }>();

  const list = computed<JellyRadioOption[]>(() =>
    props.items.map((it) =>
      typeof it === 'string' ? { value: it, label: it } : it,
    ),
  );
  const inner = ref(props.defaultValue ?? list.value[0]?.value);
  const current = computed(() => props.modelValue ?? inner.value);
  const at = computed(() =>
    Math.max(
      0,
      list.value.findIndex((it) => it.value === current.value),
    ),
  );
  const reduceMotion = usePreferredReducedMotion();
  const reduce = computed(() => reduceMotion.value === 'reduce');
  const dims = computed(() => SIZES[props.size] ?? SIZES.md);
  const itemsKey = computed(() => list.value.map((it) => it.value).join('|'));

  const groupRef = ref<HTMLDivElement | null>(null);
  let widths: number[] = [];
  let applied = at.value;

  const mvs: JellyRadioChipValues[] = [];

  function chipAt(i: number) {
    const el = groupRef.value?.children[i];
    return el instanceof HTMLElement ? el : null;
  }

  function mvFor(i: number) {
    const existing = mvs[i];
    if (existing) return existing;
    const x = useMotionValue(0);
    const sx = useMotionValue(1);
    const sy = useMotionValue(1);
    const paint = () => {
      const el = chipAt(i);
      if (el)
        el.style.transform = `translateX(${x.get()}px) scale(${sx.get()}, ${sy.get()})`;
    };
    const offs = [
      x.on('change', paint),
      sx.on('change', paint),
      sy.on('change', paint),
    ];
    const created: JellyRadioChipValues = {
      x,
      sx,
      sy,
      off: () => offs.forEach((off) => off()),
    };
    mvs[i] = created;
    return created;
  }

  function spring(k: number, m: number, bounce: number) {
    return {
      type: 'spring' as const,
      stiffness: k,
      damping: 2 * Math.sqrt(k * m) * (1 - bounce),
      mass: m,
    };
  }

  function apply(sel: number, instant: boolean) {
    const group = groupRef.value;
    const rtl = group ? getComputedStyle(group).direction === 'rtl' : false;
    const push = ((widths[sel] ?? 0) * props.swell) / 2 + props.barge;
    const count = list.value.length;
    for (let i = 0; i < count; i++) {
      const mv = mvFor(i);
      const on = i === sel;
      const far = Math.abs(i - sel);
      const dir = Math.sign(i - sel) * (rtl ? -1 : 1);
      const x = dir * push;
      const s = on ? 1 + props.swell : 1 - props.shrink;
      if (instant || reduce.value) {
        mv.x.jump(x);
        mv.sx.jump(s);
        mv.sy.jump(s);
        const el = chipAt(i);
        if (el) el.style.transform = `translateX(${x}px) scale(${s}, ${s})`;
        continue;
      }
      const k = props.stiffness * (1 - 0.12 * Math.min(far, 3));
      const inFlight =
        mv.x.isAnimating() || mv.sx.isAnimating() || mv.sy.isAnimating();
      const delay = inFlight ? 0 : (far * props.stagger) / 1000;
      const j = props.jelly;
      animate(mv.x, x, { ...spring(k, 0.9, props.bounce), delay });
      animate(mv.sx, s, {
        ...spring(
          k * (1 + 0.24 * j),
          0.9 - 0.1 * j,
          Math.min(0.85, props.bounce + 0.3 * j),
        ),
        delay,
      });
      animate(mv.sy, s, {
        ...spring(k * (1 - 0.14 * j), 0.9 + 0.05 * j, props.bounce),
        delay: delay + 0.05 * j,
      });
    }
  }

  function measure() {
    const group = groupRef.value;
    if (!group) return;
    const chips = list.value.map((_, i) => chipAt(i));
    widths = chips.map((el) => el?.offsetWidth ?? 0);
    const chipH = chips[0]?.offsetHeight ?? 0;
    const maxW = Math.max(0, ...widths);
    group.style.setProperty(
      '--jr-pad-x',
      `${Math.ceil((maxW * props.swell * 1.3) / 2 + props.barge) + 2}px`,
    );
    group.style.setProperty(
      '--jr-pad-y',
      `${Math.ceil((chipH * props.swell) / 2) + 2}px`,
    );
  }

  function settle() {
    measure();
    apply(applied, true);
  }

  useResizeObserver(groupRef, settle);
  onMounted(() => {
    settle();
    void document.fonts?.ready.then(settle);
  });
  watch(
    [
      itemsKey,
      () => props.size,
      () => props.gap,
      () => props.swell,
      () => props.barge,
      () => props.shrink,
    ],
    () => {
      void nextTick(settle);
    },
  );
  watch(at, (next) => {
    if (applied === next) return;
    applied = next;
    apply(next, true);
  });

  onBeforeUnmount(() => {
    mvs.forEach((mv) => {
      mv.off();
      mv.x.destroy();
      mv.sx.destroy();
      mv.sy.destroy();
    });
  });

  function commit(i: number, instant: boolean) {
    const item = list.value[i];
    if (props.disabled || i === at.value || !item || item.disabled) return;
    applied = i;
    apply(i, instant);
    if (props.modelValue === undefined) inner.value = item.value;
    emit('update:modelValue', item.value);
    emit('change', item.value, i);
  }

  function stepFrom(i: number, dir: number) {
    const n = list.value.length;
    let j = i;
    for (let tries = 0; tries < n; tries++) {
      j = (j + dir + n) % n;
      if (!list.value[j]?.disabled) return j;
    }
    return i;
  }

  function onChipClick(event: MouseEvent, i: number) {
    commit(i, event.detail === 0);
  }

  function onKeyDown(event: KeyboardEvent, i: number) {
    let next: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
      next = stepFrom(i, 1);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      next = stepFrom(i, -1);
    else if (event.key === 'Home') next = stepFrom(-1, 1);
    else if (event.key === 'End') next = stepFrom(list.value.length, -1);
    else if (event.key === ' ' || event.key === 'Enter') next = i;
    if (next === null) return;
    event.preventDefault();
    commit(next, true);
    chipAt(next)?.focus();
  }

  const groupStyle = computed(() => ({
    '--jr-chip': props.chipColor,
    '--jr-active': props.activeColor,
    '--jr-text': props.textColor,
    '--jr-active-text': props.activeTextColor,
    '--jr-gap': `${props.gap}px`,
    '--jr-radius': `${props.radius}px`,
    '--jr-h': `${dims.value.h}px`,
    '--jr-font': `${dims.value.font}px`,
    '--jr-px': `${dims.value.px}px`,
  }));
</script>

<template>
  <div
    ref="groupRef"
    role="radiogroup"
    :aria-label="ariaLabel"
    :data-disabled="disabled ? '' : undefined"
    :class="['jelly-radio', props.class]"
    :style="groupStyle"
  >
    <button
      v-for="(it, i) in list"
      :key="it.value"
      type="button"
      role="radio"
      :aria-checked="i === at"
      :tabindex="i === at ? 0 : -1"
      :disabled="disabled || !!it.disabled"
      class="jelly-radio__chip"
      :data-on="i === at ? 'true' : 'false'"
      @click="onChipClick($event, i)"
      @keydown="onKeyDown($event, i)"
    >
      <span class="jelly-radio__skin">
        <span v-if="it.icon" class="jelly-radio__icon">
          <Icon :name="it.icon" class="size-[1.1em]" />
        </span>
        <span class="jelly-radio__label">{{ it.label }}</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
  .jelly-radio {
    --jr-pad-x: 16px;
    --jr-pad-y: 6px;
    --jr-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    display: inline-flex;
    align-items: center;
    gap: var(--jr-gap);
    padding: var(--jr-pad-y) var(--jr-pad-x);
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  .jelly-radio[data-disabled] {
    opacity: 0.5;
    pointer-events: none;
  }

  .jelly-radio__chip {
    position: relative;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    outline: none;
    transform-origin: 50% 50%;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .jelly-radio__chip[data-on='true'] {
    cursor: default;
  }

  .jelly-radio:not([data-disabled]) .jelly-radio__chip:disabled {
    cursor: default;
    opacity: 0.4;
  }

  .jelly-radio__skin {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4em;
    height: var(--jr-h);
    padding: 0 var(--jr-px);
    border-radius: var(--jr-radius);
    overflow: hidden;
    background: var(--jr-chip);
    color: var(--jr-text);
    font-size: var(--jr-font);
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
    transition:
      transform 160ms var(--jr-ease-out),
      background-color 200ms ease,
      color 200ms ease;
  }

  .jelly-radio__chip:focus-visible .jelly-radio__skin {
    outline: 2px solid color-mix(in srgb, var(--jr-text) 60%, transparent);
    outline-offset: 2px;
    overflow: visible;
  }

  .jelly-radio__skin::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--jr-text);
    opacity: 0;
    pointer-events: none;
    transition: opacity 160ms ease;
  }

  @media (hover: hover) and (pointer: fine) {
    .jelly-radio__chip[data-on='false']:not(:disabled):hover
      .jelly-radio__skin::before {
      opacity: 0.11;
    }
  }

  .jelly-radio__chip:active .jelly-radio__skin {
    transform: scale(0.97);
  }

  .jelly-radio__chip[data-on='true'] .jelly-radio__skin {
    background: var(--jr-active);
    color: var(--jr-active-text);
  }

  .jelly-radio__icon {
    display: inline-flex;
  }

  @media (prefers-reduced-motion: reduce) {
    .jelly-radio__chip:active .jelly-radio__skin {
      transform: none;
    }
  }
</style>
