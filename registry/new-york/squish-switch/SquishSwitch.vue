<script setup lang="ts">
  import { computed, ref, useId, watch } from 'vue';
  import {
    animate,
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    useVelocity,
  } from 'motion-v';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import type { SquishSwitchGrip, SquishSwitchProps } from './types';

  const props = withDefaults(defineProps<SquishSwitchProps>(), {
    modelValue: undefined,
    defaultChecked: false,
    label: '',
    disabled: false,
    trackColor: '#27272a',
    trackOnColor: '#f5f5f5',
    thumbColor: '',
    thumbOnColor: '',
    width: 76,
    height: 38,
    radius: 19,
    speed: 50,
    stretch: 36,
    hoverScale: 1.035,
    colorDuration: 320,
    ariaLabel: undefined,
    id: undefined,
    class: '',
  });

  const emit = defineEmits<{
    'update:modelValue': [checked: boolean];
    change: [checked: boolean];
  }>();

  const FLOW_SPRING = { stiffness: 320, damping: 40, mass: 0.6 };
  const SWELL_SPRING = { stiffness: 520, damping: 34, mass: 0.6 };
  const MAX_STRETCH = 0.4;
  const STRETCH_SPEED = 600;
  const TAP_SLOP = { fine: 4, coarse: 8 };

  function clamp(value: number, lo: number, hi: number): number {
    return Math.min(hi, Math.max(lo, value));
  }

  const reducedMotion = usePreferredReducedMotion();
  const reduce = computed(() => reducedMotion.value === 'reduce');

  const inset = computed(() => Math.max(3, Math.round(props.height * 0.11)));
  const thumb = computed(() => props.height - inset.value * 2);
  const minX = computed(() => inset.value);
  const maxX = computed(() => props.width - inset.value - thumb.value);
  const midX = computed(() => (minX.value + maxX.value) / 2);
  const trackRadius = computed(() => Math.min(props.radius, props.height / 2));
  const thumbRadius = computed(() =>
    Math.max(2, trackRadius.value - inset.value),
  );

  const inner = ref(props.defaultChecked);
  const isControlled = computed(() => props.modelValue !== undefined);
  const on = computed(() =>
    isControlled.value ? Boolean(props.modelValue) : inner.value,
  );
  const dragging = ref(false);
  const trackRef = ref<HTMLSpanElement | null>(null);
  const autoId = useId();
  const buttonId = computed(() => props.id ?? autoId);

  let grip: SquishSwitchGrip | null = null;
  let current = on.value;
  let skipClick = false;
  watch(on, (v) => {
    current = v;
  });

  const x = useMotionValue(on.value ? maxX.value : minX.value);
  const flow = useSpring(useVelocity(x), FLOW_SPRING);
  const swell = useSpring(1, SWELL_SPRING);
  function stretchOf(v: number): number {
    const gain = reduce.value ? 0 : clamp(props.stretch, 0, 100) / 100;
    return 1 + Math.min(MAX_STRETCH, Math.abs(v) / STRETCH_SPEED) * gain;
  }
  const scaleX = useTransform([flow, swell], ([v, h]: number[]) => {
    return stretchOf(v ?? 0) * (h ?? 1);
  });
  const scaleY = useTransform([flow, swell], ([v, h]: number[]) => {
    return (h ?? 1) / stretchOf(v ?? 0);
  });

  function commit(next: boolean) {
    if (next === current) return;
    current = next;
    if (!isControlled.value) inner.value = next;
    emit('update:modelValue', next);
    emit('change', next);
  }

  watch(
    [on, dragging, minX, maxX, () => props.speed, reduce],
    (_, __, onCleanup) => {
      if (dragging.value) return;
      const target = on.value ? maxX.value : minX.value;
      if (reduce.value) {
        x.jump(target);
        return;
      }
      const controls = animate(x, target, {
        type: 'spring',
        stiffness: 170 - (50 - clamp(props.speed, 0, 100)) * 1.1,
        damping: 21.5,
        mass: 0.9,
        restDelta: 0.001,
        restSpeed: 0.01,
      });
      onCleanup(() => controls.stop());
    },
  );

  const rootStyle = computed(() => ({
    '--ss-w': `${props.width}px`,
    '--ss-h': `${props.height}px`,
    '--ss-inset': `${inset.value}px`,
    '--ss-thumb': `${thumb.value}px`,
    '--ss-r': `${trackRadius.value}px`,
    '--ss-thumb-r': `${thumbRadius.value}px`,
    '--ss-track': props.trackColor,
    '--ss-track-on': props.trackOnColor,
    '--ss-thumb-color':
      props.thumbColor ||
      `color-mix(in srgb, ${props.trackOnColor} 19%, ${props.trackColor})`,
    '--ss-thumb-on': props.thumbOnColor || props.trackColor,
    '--ss-fade': `${props.colorDuration}ms`,
  }));

  function localX(clientX: number): number {
    const el = trackRef.value;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const scale = rect.width / (el.offsetWidth || rect.width) || 1;
    return (clientX - rect.left) / scale;
  }

  function onPointerDown(e: PointerEvent) {
    if (props.disabled || grip || e.button !== 0) return;
    grip = {
      id: e.pointerId,
      grab: null,
      moved: false,
      startX: e.clientX,
      onAtPress: current,
      slop: e.pointerType === 'touch' ? TAP_SLOP.coarse : TAP_SLOP.fine,
    };
    const target = e.currentTarget;
    if (target instanceof HTMLElement) {
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // pointer already released
      }
    }
    dragging.value = true;
  }

  function onPointerMove(e: PointerEvent) {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    const lx = localX(e.clientX);
    if (g.grab === null) {
      g.grab = lx - x.get();
      return;
    }
    if (!g.moved && Math.abs(e.clientX - g.startX) > g.slop) g.moved = true;
    if (!g.moved) return;
    const nx = clamp(lx - g.grab, minX.value, maxX.value);
    x.set(nx);
    commit(nx > midX.value);
  }

  function release(
    pointerId: number,
    target: EventTarget | null,
    cancelled: boolean,
  ) {
    const g = grip;
    if (!g || g.id !== pointerId) return;
    grip = null;
    if (target instanceof HTMLElement) {
      try {
        target.releasePointerCapture(pointerId);
      } catch {
        // pointer already released
      }
    }
    if (cancelled) commit(g.onAtPress);
    else if (!g.moved) commit(!current);
    skipClick = true;
    setTimeout(() => {
      skipClick = false;
    }, 0);
    dragging.value = false;
  }

  function onPointerUp(e: PointerEvent) {
    release(e.pointerId, e.currentTarget, false);
  }
  function onPointerCancel(e: PointerEvent) {
    release(e.pointerId, e.currentTarget, true);
  }
  function onPointerEnter(e: PointerEvent) {
    if (e.pointerType === 'mouse' && !props.disabled)
      swell.set(props.hoverScale);
  }
  function onPointerLeave() {
    swell.set(1);
  }
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && grip) release(grip.id, e.currentTarget, true);
  }
  function onClick() {
    if (skipClick) {
      skipClick = false;
      return;
    }
    if (!props.disabled) commit(!current);
  }
</script>

<template>
  <span :class="['squish-switch-root', props.class]">
    <button
      :id="buttonId"
      type="button"
      role="switch"
      :aria-checked="on"
      :aria-disabled="disabled || undefined"
      :aria-label="ariaLabel"
      class="squish-switch"
      :data-on="on ? '' : undefined"
      :data-held="dragging ? '' : undefined"
      :style="rootStyle"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
      @pointerenter="onPointerEnter"
      @pointerleave="onPointerLeave"
      @keydown="onKeyDown"
      @click="onClick"
    >
      <span ref="trackRef" class="squish-switch__track">
        <component
          :is="motion.span"
          class="squish-switch__thumb"
          aria-hidden="true"
          :style="{ x, scaleX, scaleY }"
        />
      </span>
    </button>
    <label v-if="label" :for="buttonId" class="squish-switch__label">{{
      label
    }}</label>
  </span>
</template>

<style scoped>
  .squish-switch-root {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .squish-switch {
    position: relative;
    display: inline-block;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--ss-r);
    background: none;
    cursor: pointer;
    outline: none;
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  .squish-switch:focus-visible {
    outline: 2px solid var(--ss-track-on);
    outline-offset: 3px;
  }

  .squish-switch::after {
    content: '';
    position: absolute;
    inset: -8px;
  }

  .squish-switch[data-held] {
    cursor: grabbing;
  }

  .squish-switch[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .squish-switch__track {
    position: relative;
    display: block;
    width: var(--ss-w);
    height: var(--ss-h);
    border-radius: var(--ss-r);
    background: var(--ss-track);
    transition: background-color var(--ss-fade) ease;
  }

  .squish-switch[data-on] .squish-switch__track {
    background: var(--ss-track-on);
  }

  .squish-switch__thumb {
    position: absolute;
    top: var(--ss-inset);
    left: 0;
    width: var(--ss-thumb);
    height: var(--ss-thumb);
    border-radius: var(--ss-thumb-r);
    background: var(--ss-thumb-color);
    transition: background-color var(--ss-fade) ease;
  }

  .squish-switch[data-on] .squish-switch__thumb {
    background: var(--ss-thumb-on);
  }

  .squish-switch__label {
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .squish-switch__track,
    .squish-switch__thumb {
      transition-duration: 1ms;
    }
  }
</style>
