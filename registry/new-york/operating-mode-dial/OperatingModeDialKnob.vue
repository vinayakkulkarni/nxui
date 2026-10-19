<script setup lang="ts">
  import { computed, ref, useId } from 'vue';
  import { motion } from 'motion-v';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import {
    DIAL_LIMIT,
    arcDots,
    nearestStop,
    polar,
  } from './operating-mode-dial';
  import type { OperatingModeDialKnobProps } from './types';

  const props = defineProps<OperatingModeDialKnobProps>();

  const emit = defineEmits<{ select: [index: number] }>();

  const KNOB = 118;
  const DOT_RADIUS = 74;
  const TICKS = Array.from({ length: 96 }, (_, i) => i * 3.75);

  const reduced = usePreferredReducedMotion();
  const gradientId = `knob-face-${useId()}`;

  const dragging = ref(false);
  const dragAngle = ref(0);
  const preview = ref(-1);
  let startPointer = 0;
  let startKnob = 0;
  let moved = false;

  const active = computed(() =>
    dragging.value && preview.value >= 0 ? preview.value : props.index,
  );
  const current = computed(() => props.stops[props.index]);
  const rotation = computed(() =>
    dragging.value ? dragAngle.value : (current.value?.angle ?? 0),
  );
  const transition = computed(() =>
    dragging.value || reduced.value === 'reduce'
      ? { duration: 0 }
      : { type: 'spring' as const, stiffness: 240, damping: 16, mass: 0.9 },
  );

  const dots = computed(() =>
    arcDots(props.stops).map((a) => polar(DOT_RADIUS, a)),
  );

  const marks = computed(() =>
    props.stops.map((stop, i) => {
      const p = polar(DOT_RADIUS, stop.angle);
      const side = Math.abs(p.x) < 12 ? 'center' : p.x < 0 ? 'left' : 'right';
      const lift = p.y < 0 ? -7 : 6;
      const labelStyle: Record<string, string> = {
        top: `calc(50% + ${p.y + lift}px)`,
      };
      if (side === 'left') labelStyle.right = `calc(50% + ${-p.x + 12}px)`;
      else if (side === 'right') labelStyle.left = `calc(50% + ${p.x + 12}px)`;
      else {
        labelStyle.left = '50%';
        labelStyle.top = `calc(50% + ${p.y + (p.y < 0 ? -18 : 18)}px)`;
      }
      return {
        key: stop.option.value,
        label: stop.option.label,
        lit: i === active.value,
        side,
        dotStyle: { left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)` },
        labelStyle,
      };
    }),
  );

  function pointerAngle(event: PointerEvent, el: HTMLElement): number {
    const rect = el.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    return (Math.atan2(dx, -dy) * 180) / Math.PI;
  }

  function onPointerDown(event: PointerEvent): void {
    const el = event.currentTarget;
    if (!(el instanceof HTMLElement)) return;
    el.setPointerCapture(event.pointerId);
    el.focus();
    startPointer = pointerAngle(event, el);
    startKnob = current.value?.angle ?? 0;
    dragAngle.value = startKnob;
    preview.value = props.index;
    moved = false;
    dragging.value = true;
  }

  function onPointerMove(event: PointerEvent): void {
    const el = event.currentTarget;
    if (!dragging.value || !(el instanceof HTMLElement)) return;
    let delta = pointerAngle(event, el) - startPointer;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    if (Math.abs(delta) > 2) moved = true;
    const next = Math.min(DIAL_LIMIT, Math.max(-DIAL_LIMIT, startKnob + delta));
    dragAngle.value = next;
    preview.value = nearestStop(props.stops, next);
  }

  function onPointerUp(): void {
    if (!dragging.value) return;
    const target = moved ? preview.value : props.index;
    dragging.value = false;
    preview.value = -1;
    if (target !== props.index) emit('select', target);
  }

  function onKeydown(event: KeyboardEvent): void {
    const last = props.stops.length - 1;
    let next = props.index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp')
      next = Math.min(last, next + 1);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown')
      next = Math.max(0, next - 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;
    event.preventDefault();
    if (next !== props.index) emit('select', next);
  }
</script>

<template>
  <div class="relative h-50 w-full">
    <svg
      class="pointer-events-none absolute top-1/2 left-1/2 size-42 -translate-1/2 overflow-visible"
      viewBox="-84 -84 168 168"
      aria-hidden="true"
    >
      <circle
        v-for="(dot, i) in dots"
        :key="i"
        :cx="dot.x"
        :cy="dot.y"
        r="0.9"
        class="fill-neutral-400 dark:fill-neutral-500"
      />
    </svg>

    <span
      v-for="mark in marks"
      :key="`dot-${mark.key}`"
      class="pointer-events-none absolute size-2 -translate-1/2 rounded-full transition-[background-color,box-shadow] duration-300 motion-reduce:transition-none"
      :class="mark.lit ? '' : 'bg-neutral-300 dark:bg-neutral-700'"
      :style="
        mark.lit
          ? {
              ...mark.dotStyle,
              backgroundColor: props.accent,
              boxShadow: `0 0 10px 1px ${props.accent}`,
            }
          : mark.dotStyle
      "
    />

    <button
      v-for="(mark, i) in marks"
      :key="`label-${mark.key}`"
      type="button"
      class="absolute -translate-y-1/2 rounded-md px-1 text-[13px] whitespace-nowrap transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
      :class="[
        mark.lit
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground',
        mark.side === 'center' ? '-translate-x-1/2' : '',
      ]"
      :style="mark.labelStyle"
      :aria-pressed="mark.lit"
      @click="emit('select', i)"
    >
      {{ mark.label }}
    </button>

    <div
      class="absolute top-1/2 left-1/2 size-29.5 -translate-1/2 cursor-grab touch-none rounded-full shadow-[0_14px_28px_-6px_rgba(0,0,0,0.35),0_2px_4px_rgba(0,0,0,0.2)] outline-none select-none [--knob-hi:#fafafa] [--knob-lo:#d4d4d4] focus-visible:ring-2 focus-visible:ring-orange-400/60 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent active:cursor-grabbing dark:shadow-[0_16px_30px_-4px_rgba(0,0,0,0.75),0_2px_4px_rgba(0,0,0,0.5)] dark:[--knob-hi:#424242] dark:[--knob-lo:#1c1c1c]"
      role="slider"
      tabindex="0"
      :aria-label="props.label"
      :aria-valuemin="0"
      :aria-valuemax="props.stops.length - 1"
      :aria-valuenow="active"
      :aria-valuetext="props.stops[active]?.option.label"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown="onKeydown"
    >
      <svg
        class="absolute inset-0 size-full"
        :viewBox="`-${KNOB / 2} -${KNOB / 2} ${KNOB} ${KNOB}`"
      >
        <defs>
          <radialGradient :id="gradientId" cx="35%" cy="28%" r="80%">
            <stop offset="0%" :style="{ stopColor: 'var(--knob-hi)' }" />
            <stop offset="100%" :style="{ stopColor: 'var(--knob-lo)' }" />
          </radialGradient>
        </defs>
        <circle
          r="58.5"
          :fill="`url(#${gradientId})`"
          class="stroke-neutral-400/70 dark:stroke-black/80"
          stroke-width="1"
        />
        <circle
          r="49"
          fill="none"
          class="stroke-black/10 dark:stroke-white/10"
          stroke-width="0.8"
        />
        <circle
          r="39"
          fill="none"
          class="stroke-black/6 dark:stroke-white/6"
          stroke-width="0.8"
        />
        <circle
          r="31"
          fill="none"
          class="stroke-black/5 dark:stroke-white/5"
          stroke-width="0.8"
        />
      </svg>
      <component
        :is="motion.div"
        class="absolute inset-0"
        :initial="false"
        :animate="{ rotate: rotation }"
        :transition="transition"
      >
        <svg
          class="size-full"
          :viewBox="`-${KNOB / 2} -${KNOB / 2} ${KNOB} ${KNOB}`"
          aria-hidden="true"
        >
          <line
            v-for="t in TICKS"
            :key="t"
            x1="0"
            y1="-51.5"
            x2="0"
            y2="-56.5"
            :transform="`rotate(${t})`"
            class="stroke-black/20 dark:stroke-white/16"
            stroke-width="0.9"
          />
          <line
            x1="0"
            y1="-16"
            x2="0"
            y2="-41"
            stroke-width="4"
            stroke-linecap="round"
            class="stroke-neutral-800 dark:stroke-neutral-100"
          />
        </svg>
      </component>
    </div>
  </div>
</template>
