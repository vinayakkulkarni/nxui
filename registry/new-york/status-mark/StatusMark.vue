<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    useSlots,
    watch,
  } from 'vue';
  import { animate, useMotionValue } from 'motion-v';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import type { StatusMarkProps, StatusMarkStatus } from './types';

  const props = withDefaults(defineProps<StatusMarkProps>(), {
    status: 'pending',
    progress: undefined,
    label: undefined,
    color: 'currentColor',
    doneColor: '#22c55e',
    errorColor: '#ef4444',
    size: 20,
    strokeWidth: 2,
    dashes: 8,
    fontSize: 14,
    spinDuration: 1100,
    arcLength: 0.68,
    drawDuration: 240,
    fillOpacity: 0.06,
    strike: true,
    strikeDelay: 60,
    class: '',
  });

  const slots = useSlots();

  const UI = { type: 'spring' as const, duration: 0.3, bounce: 0 };
  const MORPH_EASE: [number, number, number, number] = [0.77, 0, 0.175, 1];
  const MORPH = { duration: 0.3, ease: MORPH_EASE };
  const CHECK = 'M7.5 12.25 10.5 15.25 16.75 8.75';
  const CROSS = 'M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5';
  const TEXT: Record<StatusMarkStatus, string> = {
    pending: 'Pending',
    running: 'In progress',
    done: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };
  const IDLE_DASH = 0.3;

  function clamp01(v: number): number {
    return Math.min(1, Math.max(0, v));
  }

  const reducedMotion = usePreferredReducedMotion();
  const reduce = computed(() => reducedMotion.value === 'reduce');

  const r = computed(() => 10 - props.strokeWidth / 2);
  const circumference = computed(() => 2 * Math.PI * r.value);
  const period = computed(
    () => circumference.value / Math.max(1, props.dashes),
  );
  const determinate = computed(
    () =>
      props.status === 'running' &&
      typeof props.progress === 'number' &&
      Number.isFinite(props.progress),
  );
  const indeterminate = computed(
    () => props.status === 'running' && !determinate.value,
  );
  const solid = computed(
    () =>
      props.status === 'running' ||
      props.status === 'done' ||
      props.status === 'failed',
  );
  const targetArc = computed(() => {
    if (indeterminate.value) return props.arcLength;
    if (determinate.value) return clamp01(props.progress ?? 0);
    return 1;
  });

  const mode = useMotionValue(solid.value ? 1 : 0);
  const arc = useMotionValue(targetArc.value);
  const travel = useMotionValue(0);
  const ringRef = ref<SVGCircleElement | null>(null);
  let gen = 0;

  function dashFor(m: number, a: number): string {
    const C = circumference.value;
    const P = period.value;
    const dash = IDLE_DASH * P + (a * C - IDLE_DASH * P) * m;
    const gap = (1 - IDLE_DASH) * P + ((1 - a) * C - (1 - IDLE_DASH) * P) * m;
    return `${Math.max(0, dash)} ${Math.max(0, gap)}`;
  }

  // SSR-stable first paint; motion values take over after mount.
  const initialDash = dashFor(mode.get(), arc.get());

  function writeDash() {
    ringRef.value?.setAttribute(
      'stroke-dasharray',
      dashFor(mode.get(), arc.get()),
    );
  }
  function writeOffset(v: number) {
    ringRef.value?.setAttribute('stroke-dashoffset', String(v));
  }

  const offs = [
    mode.on('change', writeDash),
    arc.on('change', writeDash),
    travel.on('change', writeOffset),
  ];

  function run() {
    const g = ++gen;
    if (reduce.value) {
      mode.jump(solid.value ? 1 : 0);
      arc.jump(targetArc.value);
      travel.jump(0);
      writeDash();
      writeOffset(0);
      return;
    }
    if (mode.get() === 0) arc.jump(targetArc.value);
    animate(mode, solid.value ? 1 : 0, MORPH);
    animate(arc, targetArc.value, UI);
    const C = circumference.value;
    if (indeterminate.value) {
      const t0 = travel.get();
      animate(travel, [t0, t0 - C], {
        duration: props.spinDuration / 1000,
        ease: 'linear',
        repeat: Infinity,
      });
      return;
    }
    const unit = determinate.value ? C : period.value;
    const to = Math.floor(travel.get() / unit) * unit;
    void animate(travel, to, UI).then(() => {
      if (gen === g) travel.jump(0);
    });
  }

  watch([circumference, period], () => {
    writeDash();
    writeOffset(travel.get());
  });

  watch(
    [
      () => props.status,
      determinate,
      targetArc,
      reduce,
      circumference,
      period,
      () => props.spinDuration,
    ],
    run,
  );

  onMounted(() => {
    writeDash();
    writeOffset(travel.get());
    run();
  });

  onBeforeUnmount(() => {
    for (const off of offs) off();
    mode.stop();
    arc.stop();
    travel.stop();
  });

  const hasLabel = computed(
    () =>
      (props.label !== undefined && props.label !== '') ||
      Boolean(slots.default),
  );
  const spoken = computed(
    () =>
      TEXT[props.status] +
      (determinate.value
        ? `, ${Math.round(clamp01(props.progress ?? 0) * 100)}%`
        : ''),
  );

  const rootStyle = computed(() => ({
    '--sm-size': `${props.size}px`,
    '--sm-stroke': props.strokeWidth,
    '--sm-color': props.color,
    '--sm-done': props.doneColor,
    '--sm-error': props.errorColor,
    '--sm-fill': props.fillOpacity,
    '--sm-font': `${props.fontSize}px`,
    '--sm-draw': `${props.drawDuration}ms`,
    '--sm-strike-delay': `${120 + props.strikeDelay}ms`,
  }));
</script>

<template>
  <span
    :class="['status-mark', props.class]"
    :data-status="status"
    :data-indeterminate="indeterminate ? '' : undefined"
    :data-strike="strike ? '' : undefined"
    :style="rootStyle"
  >
    <svg
      class="status-mark__glyph"
      viewBox="0 0 24 24"
      :width="size"
      :height="size"
      :role="hasLabel ? undefined : 'img'"
      :aria-label="hasLabel ? undefined : spoken"
      :aria-hidden="hasLabel || undefined"
    >
      <circle
        class="status-mark__track"
        cx="12"
        cy="12"
        :r="r"
        transform="rotate(-90 12 12)"
      />
      <circle
        ref="ringRef"
        class="status-mark__ring"
        cx="12"
        cy="12"
        :r="r"
        transform="rotate(-90 12 12)"
        :stroke-dasharray="initialDash"
        stroke-dashoffset="0"
      />
      <path class="status-mark__check" :d="CHECK" pathLength="1" />
      <path class="status-mark__cross" :d="CROSS" pathLength="1" />
    </svg>
    <span v-if="hasLabel" class="status-mark__sr">{{ spoken }}: </span>
    <span v-if="hasLabel" class="status-mark__label">
      <slot>{{ label }}</slot>
      <span class="status-mark__strike" aria-hidden="true"></span>
    </span>
  </span>
</template>

<style scoped>
  .status-mark {
    --sm-muted: 0.55;
    --sm-check-delay: 120ms;
    --sm-label-o: 0.65;
    --sm-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
    --sm-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);

    position: relative;
    display: inline-flex;
    align-items: center;
    gap: calc(var(--sm-size) * 0.5);
    vertical-align: middle;
    line-height: 1;
  }

  .status-mark__glyph {
    flex: none;
    overflow: visible;
    color: var(--sm-color);
    transition: color 200ms ease;
  }

  .status-mark[data-status='done'] .status-mark__glyph {
    color: var(--sm-done);
  }

  .status-mark[data-status='failed'] .status-mark__glyph {
    color: var(--sm-error);
  }

  .status-mark__track {
    fill: currentColor;
    stroke: currentColor;
    stroke-width: var(--sm-stroke);
    fill-opacity: 0;
    stroke-opacity: 0;
    transition:
      fill-opacity 180ms ease,
      stroke-opacity 200ms ease;
  }

  .status-mark[data-status='running'] .status-mark__track {
    stroke-opacity: 0.2;
  }

  .status-mark[data-status='done'] .status-mark__track,
  .status-mark[data-status='failed'] .status-mark__track {
    fill-opacity: var(--sm-fill);
  }

  .status-mark__ring {
    fill: none;
    stroke: currentColor;
    stroke-width: var(--sm-stroke);
    stroke-linecap: round;
    opacity: var(--sm-muted);
    transition: opacity 200ms ease;
  }

  .status-mark[data-status='running'] .status-mark__ring,
  .status-mark[data-status='done'] .status-mark__ring,
  .status-mark[data-status='failed'] .status-mark__ring {
    opacity: 1;
  }

  .status-mark__check,
  .status-mark__cross {
    fill: none;
    stroke: currentColor;
    stroke-width: var(--sm-stroke);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 1 2;
    stroke-dashoffset: 1.05;
    opacity: 0;
    transition:
      stroke-dashoffset 160ms var(--sm-ease-out),
      opacity 0ms linear 160ms;
  }

  .status-mark[data-status='done'] .status-mark__check,
  .status-mark[data-status='failed'] .status-mark__cross,
  .status-mark[data-status='cancelled'] .status-mark__cross {
    stroke-dashoffset: 0;
    opacity: 1;
    transition:
      stroke-dashoffset var(--sm-draw) var(--sm-ease-out) var(--sm-check-delay),
      opacity 0ms linear var(--sm-check-delay);
  }

  .status-mark__label {
    position: relative;
    color: var(--sm-color);
    font-size: var(--sm-font);
    line-height: 1.25;
    opacity: var(--sm-label-o);
    transition: opacity 200ms ease;
  }

  .status-mark[data-status='running'] {
    --sm-label-o: 1;
  }

  .status-mark[data-status='done'] {
    --sm-label-o: 0.6;
  }

  .status-mark[data-status='failed'] {
    --sm-label-o: 1;
  }

  .status-mark[data-status='cancelled'] {
    --sm-label-o: 0.55;
  }

  .status-mark__strike {
    position: absolute;
    top: 50%;
    right: 0;
    left: 0;
    height: max(1px, calc(var(--sm-font) / 14));
    background: currentColor;
    transform: scaleX(0);
    transform-origin: left center;
    translate: 0 -50%;
    pointer-events: none;
    transition: transform 160ms var(--sm-ease-out);
  }

  .status-mark[data-status='done'][data-strike] .status-mark__strike {
    transform: scaleX(1);
    transition: transform 280ms var(--sm-ease-out) var(--sm-strike-delay);
  }

  .status-mark__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @keyframes sm-breathe {
    50% {
      opacity: 0.45;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .status-mark[data-indeterminate] .status-mark__ring {
      animation: sm-breathe 1400ms var(--sm-ease-in-out) infinite;
    }

    .status-mark__check,
    .status-mark__cross {
      stroke-dashoffset: 0;
      transition: opacity 200ms ease;
    }

    .status-mark__strike {
      opacity: 0;
      transform: scaleX(1) !important;
      transition: opacity 200ms ease;
    }

    .status-mark[data-status='done'][data-strike] .status-mark__strike {
      opacity: 1;
    }
  }
</style>
