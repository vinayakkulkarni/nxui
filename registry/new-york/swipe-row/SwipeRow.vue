<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';
  import { animate, motionValue } from 'motion-v';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import type { CSSProperties } from 'vue';
  import type {
    SwipeAction,
    SwipeRowGrip,
    SwipeRowPhase,
    SwipeRowProps,
  } from './types';
  import {
    EASE_OUT,
    FLICK,
    HYST,
    VMAX,
    clamp,
    onColor,
    project,
    rubber,
    unrubber,
    velocityOf,
  } from './swipe-row-math';

  const SPRING_UI = { type: 'spring', duration: 0.3, bounce: 0 } as const;

  const props = withDefaults(defineProps<SwipeRowProps>(), {
    actions: () => [{ id: 'delete', label: 'Delete' }],
    actionColor: '#e5484d',
    drawerColor: '#3f3f46',
    rowColor: '#27272a',
    textColor: '#f5f5f5',
    height: 64,
    radius: 16,
    actionWidth: 80,
    direction: 'left',
    snapBounce: 0.2,
    resistance: 0.55,
    collapseMs: 200,
    commitAt: 0.6,
    fullSwipe: true,
    disabled: false,
    open: undefined,
    closeOnAction: true,
    haptic: true,
    label: 'List item',
    class: '',
  });

  const emit = defineEmits<{
    'update:open': [open: boolean];
    action: [action: SwipeAction];
    commit: [action: SwipeAction];
  }>();

  const uid = useId();
  const railId = `${uid}-rail`;
  const motionPref = usePreferredReducedMotion();
  const reduce = computed(() => motionPref.value === 'reduce');

  const s = computed(() => (props.direction === 'left' ? -1 : 1));
  const A = computed(() => props.actionWidth);
  const n = computed(() => props.actions.length);
  const D = computed(() => n.value * A.value);
  const c = computed(() => clamp(props.resistance, 0.05, 1));
  const primary = computed<SwipeAction | undefined>(() => props.actions[0]);
  const secondary = computed(() => props.actions.slice(1));

  const openState = ref(false);
  const phase = ref<SwipeRowPhase>('idle');
  const say = ref('');
  const dragging = ref(false);
  const isOpen = computed(() => props.open ?? openState.value);

  const root = ref<HTMLElement | null>(null);
  const surface = ref<HTMLElement | null>(null);
  const w = ref(360);
  let grip: SwipeRowGrip | null = null;
  let unwatch: (() => void) | null = null;
  let foldTimer: ReturnType<typeof setTimeout> | undefined;
  let heading: number | null = null;

  const x = motionValue(0);
  const spread = motionValue(0);
  const landed = motionValue(0);
  const xv = ref(0);
  const spreadv = ref(0);
  const landedv = ref(0);
  const offX = x.on('change', (v) => (xv.value = v));
  const offSpread = spread.on('change', (v) => (spreadv.value = v));
  const offLanded = landed.on('change', (v) => (landedv.value = v));

  const exposedOf = (v: number) => s.value * v;
  const exposed = computed(() => exposedOf(xv.value));
  const commitPoint = () =>
    Math.max(props.commitAt * w.value, D.value + A.value / 2);
  const canCommit = () =>
    props.fullSwipe && n.value > 0 && commitPoint() <= w.value;

  const surfaceStyle = computed<CSSProperties>(() => ({
    transform: `translateX(${xv.value}px)`,
  }));
  const railStyle = computed<CSSProperties>(() => ({
    transform: `translateX(${-s.value * Math.max(0, D.value - exposed.value)}px)`,
  }));
  const shift = computed(
    () => spreadv.value * Math.max(0, exposed.value - A.value),
  );
  const blockStyle = computed<CSSProperties>(() => ({
    transform: `translateX(${s.value * shift.value}px)`,
  }));
  const glyphStyle = computed<CSSProperties>(() => ({
    transform: `translateX(${-s.value * landedv.value * (shift.value - (w.value - A.value) / 2)}px)`,
  }));

  const rootStyle = computed<Record<string, string>>(() => ({
    '--sr-h': `${props.height}px`,
    '--sr-r': `${props.radius}px`,
    '--sr-a': `${A.value}px`,
    '--sr-row': props.rowColor,
    '--sr-text': props.textColor,
    '--sr-drawer': props.drawerColor,
    '--sr-on-drawer': onColor(props.drawerColor),
    '--sr-action': props.actionColor,
    '--sr-on-action': onColor(props.actionColor),
    '--sr-collapse': `${props.collapseMs}ms`,
  }));

  function secondaryStyle(a: SwipeAction, i: number): CSSProperties {
    const bg = a.color ?? props.drawerColor;
    const offset = `${(i + 1) * A.value}px`;
    return s.value < 0
      ? { right: offset, background: bg, color: onColor(bg) }
      : { left: offset, background: bg, color: onColor(bg) };
  }

  function map(raw: number): number {
    const W = w.value;
    const k = c.value;
    const d = D.value;
    if (raw < 0) return rubber(raw, W, k);
    if (raw <= d) return raw;
    if (!canCommit()) return d + rubber(raw - d, W, k);
    const C = commitPoint();
    const knee = d + (C - d) / k;
    return raw <= knee ? d + k * (raw - d) : C + rubber(raw - knee, W, k);
  }

  function inv(ex: number): number {
    const W = w.value;
    const k = c.value;
    const d = D.value;
    if (ex < 0) return unrubber(ex, W, k);
    if (ex <= d) return ex;
    if (!canCommit()) return d + unrubber(ex - d, W, k);
    const C = commitPoint();
    const knee = d + (C - d) / k;
    return ex <= C ? d + (ex - d) / k : knee + unrubber(ex - C, W, k);
  }

  useResizeObserver(root, (entries) => {
    const width = entries[0]?.contentRect.width;
    if (width) w.value = width;
  });

  function setOpen(next: boolean) {
    if (next === isOpen.value) return;
    openState.value = next;
    emit('update:open', next);
  }

  function settle(target: number, v = 0) {
    heading = target;
    if (reduce.value) {
      animate(x, s.value * target, { duration: 0.2, ease: EASE_OUT });
      return;
    }
    const flick = Math.abs(v) >= FLICK;
    animate(
      x,
      s.value * target,
      flick
        ? {
            type: 'spring',
            duration: 0.4,
            bounce: props.snapBounce,
            velocity: s.value * clamp(v, -VMAX, VMAX),
          }
        : { ...SPRING_UI, velocity: s.value * v },
    );
  }

  function setSpread(on: boolean) {
    if ((spread.get() === 1) === on) return;
    if (reduce.value) spread.set(on ? 1 : 0);
    else animate(spread, on ? 1 : 0, SPRING_UI);
    if (on && primary.value) {
      say.value = `Release to ${primary.value.label}`;
      if (props.haptic && grip?.touch) navigator.vibrate?.(8);
    }
  }

  function commit(a: SwipeAction, viaKey: boolean, v = 0) {
    const leap = a === primary.value;
    phase.value = 'committing';
    say.value = a.label;
    setOpen(false);
    const fold = () => {
      phase.value = 'collapsing';
      foldTimer = setTimeout(() => {
        emit('commit', a);
        a.onSelect?.();
      }, props.collapseMs);
    };
    const edge = s.value * w.value;
    if (viaKey || reduce.value) {
      if (leap) {
        spread.set(1);
        landed.set(1);
      }
      if (viaKey) {
        x.set(edge);
        fold();
      } else {
        animate(x, edge, { duration: 0.2, ease: EASE_OUT }).then(fold);
      }
      return;
    }
    if (leap) {
      if (spread.get() < 1) animate(spread, 1, SPRING_UI);
      animate(landed, 1, SPRING_UI);
    }
    animate(x, edge, { ...SPRING_UI, velocity: s.value * v }).then(fold);
  }

  watch([isOpen, D], () => {
    if (props.open === undefined || grip || phase.value !== 'idle') return;
    const target = isOpen.value ? D.value : 0;
    if (heading === target) return;
    if (Math.abs(exposed.value - target) > 0.5) settle(target);
  });

  function stopWatching() {
    unwatch?.();
    unwatch = null;
  }

  function onWindowMove(e: PointerEvent) {
    if (e.isTrusted) move(e);
  }

  function onWindowUp(e: PointerEvent) {
    if (e.isTrusted) up(e);
  }

  function down(e: PointerEvent) {
    if (
      props.disabled ||
      n.value === 0 ||
      phase.value !== 'idle' ||
      grip ||
      e.button !== 0
    )
      return;
    x.stop();
    heading = null;
    grip = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      grab: null,
      moved: false,
      hist: [],
      touch: e.pointerType === 'touch',
    };
    try {
      surface.value?.setPointerCapture(e.pointerId);
    } catch {
      // capture is best effort; the window listeners still track the drag
    }
    stopWatching();
    const stops = [
      useEventListener('pointermove', onWindowMove),
      useEventListener('pointerup', onWindowUp),
      useEventListener('pointercancel', onWindowUp),
    ];
    unwatch = () => stops.forEach((stop) => stop());
  }

  function move(e: PointerEvent) {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    if (g.grab === null) {
      const dx = e.clientX - g.x0;
      const dy = e.clientY - g.y0;
      if (Math.abs(dx) < HYST || Math.abs(dx) < Math.abs(dy)) return;
      g.grab = s.value * (g.x0 + Math.sign(dx) * HYST) - inv(exposed.value);
      g.moved = true;
      dragging.value = true;
    }
    const ex = map(s.value * e.clientX - g.grab);
    x.set(s.value * ex);
    g.hist.push([performance.now(), ex]);
    if (g.hist.length > 4) g.hist.shift();
    setSpread(canCommit() && ex >= commitPoint());
  }

  function up(e: PointerEvent) {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    grip = null;
    stopWatching();
    dragging.value = false;
    try {
      surface.value?.releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
    const ex = exposed.value;
    const v = velocityOf(g.hist);
    if (!g.moved) {
      if (isOpen.value) {
        setOpen(false);
        settle(0);
      }
      return;
    }
    if (primary.value && canCommit() && ex >= commitPoint()) {
      commit(primary.value, false, v);
      return;
    }
    const d = D.value;
    const target =
      Math.abs(v) >= FLICK ? (v > 0 ? d : 0) : ex + project(v) > d / 2 ? d : 0;
    setSpread(false);
    setOpen(target === d);
    settle(target, v);
  }

  function act(a: SwipeAction, e: MouseEvent) {
    if (phase.value !== 'idle') return;
    emit('action', a);
    if (a === primary.value || a.dismiss) {
      commit(a, e.detail === 0);
      return;
    }
    a.onSelect?.();
    if (!props.closeOnAction) return;
    setOpen(false);
    if (e.detail === 0) {
      heading = 0;
      x.set(0);
    } else settle(0);
  }

  function onPrimaryClick(e: MouseEvent) {
    if (primary.value) act(primary.value, e);
  }

  function openNow() {
    heading = D.value;
    x.set(s.value * D.value);
    setOpen(true);
    say.value = `${n.value} actions revealed`;
  }

  function closeNow() {
    heading = 0;
    x.set(0);
    setOpen(false);
  }

  function onToggleKey(e: KeyboardEvent) {
    if (props.disabled || phase.value !== 'idle' || n.value === 0) return;
    const openKey = s.value < 0 ? 'ArrowLeft' : 'ArrowRight';
    const closeKey = s.value < 0 ? 'ArrowRight' : 'ArrowLeft';
    const toggle = e.key === 'Enter' || e.key === ' ';
    if (e.key === openKey || (toggle && !isOpen.value)) {
      e.preventDefault();
      openNow();
    } else if (
      e.key === closeKey ||
      e.key === 'Escape' ||
      (toggle && isOpen.value)
    ) {
      e.preventDefault();
      closeNow();
    } else if (
      (e.key === 'Delete' || e.key === 'Backspace') &&
      isOpen.value &&
      primary.value &&
      canCommit()
    ) {
      e.preventDefault();
      commit(primary.value, true);
    }
  }

  function onToggleClick(e: MouseEvent) {
    if (
      e.detail !== 0 ||
      props.disabled ||
      phase.value !== 'idle' ||
      n.value === 0
    )
      return;
    if (isOpen.value) closeNow();
    else openNow();
  }

  onBeforeUnmount(() => {
    clearTimeout(foldTimer);
    stopWatching();
    x.stop();
    spread.stop();
    landed.stop();
    offX();
    offSpread();
    offLanded();
  });
</script>

<template>
  <div
    ref="root"
    role="group"
    :aria-label="label"
    :class="['swipe-row', props.class]"
    :data-direction="direction"
    :data-open="isOpen ? '' : undefined"
    :data-phase="phase"
    :data-disabled="disabled ? '' : undefined"
    :data-dragging="dragging ? '' : undefined"
    :style="rootStyle"
  >
    <div class="swipe-row__clip">
      <div
        :id="railId"
        class="swipe-row__rail"
        :style="railStyle"
        :inert="!isOpen"
        :aria-hidden="!isOpen"
      >
        <button
          v-for="(a, i) in secondary"
          :key="a.id"
          type="button"
          class="swipe-row__action"
          :style="secondaryStyle(a, i)"
          @click="act(a, $event)"
        >
          <span class="swipe-row__glyph">
            <span v-if="a.icon" class="swipe-row__icon">
              <Icon :name="a.icon" />
            </span>
            <span>{{ a.label }}</span>
          </span>
        </button>
        <div v-if="primary" class="swipe-row__block" :style="blockStyle">
          <button
            type="button"
            class="swipe-row__action swipe-row__action--commit"
            :style="glyphStyle"
            @click="onPrimaryClick"
          >
            <span class="swipe-row__glyph">
              <span class="swipe-row__icon">
                <Icon :name="primary.icon ?? 'lucide:trash-2'" />
              </span>
              <span>{{ primary.label }}</span>
            </span>
          </button>
        </div>
      </div>
      <div
        ref="surface"
        class="swipe-row__surface"
        :style="surfaceStyle"
        @pointerdown="down"
      >
        <slot />
        <button
          type="button"
          class="swipe-row__toggle"
          :tabindex="disabled ? -1 : 0"
          :aria-expanded="isOpen"
          :aria-controls="railId"
          :aria-keyshortcuts="s < 0 ? 'ArrowLeft' : 'ArrowRight'"
          @keydown="onToggleKey"
          @click="onToggleClick"
        >
          {{ n }} {{ n === 1 ? 'action' : 'actions' }}
        </button>
      </div>
    </div>
    <span class="swipe-row__sr" aria-live="polite">{{ say }}</span>
  </div>
</template>

<style scoped>
  .swipe-row {
    --sr-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    position: relative;
    height: var(--sr-h);
    overflow: hidden;
    opacity: 1;
    transition:
      height var(--sr-collapse) var(--sr-ease-out),
      margin-bottom var(--sr-collapse) var(--sr-ease-out),
      opacity var(--sr-collapse) var(--sr-ease-out);
  }

  .swipe-row[data-phase='collapsing'] {
    height: 0 !important;
    margin-bottom: 0 !important;
    opacity: 0;
  }

  .swipe-row[data-disabled] {
    opacity: 0.55;
    pointer-events: none;
  }

  .swipe-row__clip {
    position: relative;
    height: var(--sr-h);
    border-radius: var(--sr-r);
    overflow: hidden;
    background: var(--sr-row);
  }

  .swipe-row__rail {
    position: absolute;
    inset: 0;
    background: var(--sr-drawer);
  }

  .swipe-row__action {
    position: absolute;
    top: 0;
    display: grid;
    place-items: center;
    width: var(--sr-a);
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    background: var(--sr-drawer);
    color: var(--sr-on-drawer);
    font: inherit;
    cursor: pointer;
    outline: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .swipe-row__action:focus-visible {
    box-shadow: inset 0 0 0 2px currentColor;
  }

  .swipe-row__action::after {
    content: '';
    position: absolute;
    inset: 0;
    background: #fff;
    opacity: 0;
    pointer-events: none;
  }

  @media (hover: hover) and (pointer: fine) {
    .swipe-row__action::after {
      transition: opacity 150ms ease;
    }

    .swipe-row__action:hover::after {
      opacity: 0.08;
    }
  }

  .swipe-row__glyph {
    display: grid;
    justify-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.01em;
    line-height: 1;
    transition: transform 160ms var(--sr-ease-out);
  }

  .swipe-row__icon {
    display: inline-flex;
    font-size: 20px;
  }

  .swipe-row__action:active .swipe-row__glyph {
    transform: scale(0.97);
  }

  .swipe-row__block {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    background: var(--sr-action);
  }

  .swipe-row[data-direction='left'] .swipe-row__block {
    left: calc(100% - var(--sr-a));
  }

  .swipe-row[data-direction='right'] .swipe-row__block {
    right: calc(100% - var(--sr-a));
  }

  .swipe-row__action--commit {
    background: transparent;
    color: var(--sr-on-action);
  }

  .swipe-row[data-direction='left'] .swipe-row__action--commit {
    left: 0;
  }

  .swipe-row[data-direction='right'] .swipe-row__action--commit {
    right: 0;
  }

  .swipe-row__surface {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    height: 100%;
    padding: 0 16px;
    background: var(--sr-row);
    color: var(--sr-text);
    touch-action: pan-y;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  @media (hover: hover) and (pointer: fine) {
    .swipe-row__surface {
      cursor: grab;
    }

    .swipe-row[data-dragging] .swipe-row__surface {
      cursor: grabbing;
    }
  }

  @media (pointer: coarse) {
    .swipe-row__surface {
      user-select: none;
      -webkit-user-select: none;
    }
  }

  .swipe-row[data-dragging] .swipe-row__surface,
  .swipe-row[data-dragging] .swipe-row__surface :deep(*) {
    user-select: none;
    -webkit-user-select: none;
  }

  .swipe-row__toggle {
    position: absolute;
    top: 50%;
    width: 1px;
    height: 1px;
    margin: 0;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip-path: inset(50%);
    background: transparent;
    color: var(--sr-text);
    font: inherit;
    outline: none;
  }

  .swipe-row[data-direction='left'] .swipe-row__toggle {
    right: 12px;
  }

  .swipe-row[data-direction='right'] .swipe-row__toggle {
    left: 12px;
  }

  .swipe-row__toggle:focus-visible {
    width: auto;
    height: 24px;
    padding: 0 10px;
    border-radius: 12px;
    overflow: visible;
    clip-path: none;
    background: color-mix(in srgb, var(--sr-text) 12%, transparent);
    font-size: 12px;
    white-space: nowrap;
    transform: translateY(-50%);
  }

  .swipe-row__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  @media (prefers-reduced-motion: reduce) {
    .swipe-row__action:active .swipe-row__glyph {
      transform: none;
    }
  }
</style>
