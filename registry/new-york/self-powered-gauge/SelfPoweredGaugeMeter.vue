<script setup lang="ts">
  import { computed, onMounted, ref, useId, watch } from 'vue';
  import {
    useElementVisibility,
    usePreferredReducedMotion,
    useRafFn,
  } from '@vueuse/core';
  import SegmentDisplay from '../segment-display/SegmentDisplay.vue';
  import type { SelfPoweredGaugeMeterProps } from './types';

  const props = defineProps<SelfPoweredGaugeMeterProps>();

  // Scale geometry in a 320×178 box. The pivot sits just below the face.
  const CX = 160;
  const CY = 186;
  const R = 128;
  const SWEEP = 56;

  const clamp = (v: number): number => Math.min(100, Math.max(0, v));
  const angle = (v: number): number => -SWEEP + (2 * SWEEP * clamp(v)) / 100;
  const at = (r: number, deg: number): [number, number] => {
    const rad = (deg * Math.PI) / 180;
    return [CX + r * Math.sin(rad), CY - r * Math.cos(rad)];
  };
  const fmt = (n: number): string => n.toFixed(2);

  function arc(r: number, from: number, to: number): string {
    const [x1, y1] = at(r, angle(from));
    const [x2, y2] = at(r, angle(to));
    return `M${fmt(x1)} ${fmt(y1)}A${r} ${r} 0 0 1 ${fmt(x2)} ${fmt(y2)}`;
  }

  const ticks = Array.from({ length: 41 }, (_, i) => {
    const v = i * 2.5;
    const major = v % 25 === 0;
    const a = angle(v);
    const [x1, y1] = at(R - 2, a);
    const [x2, y2] = at(R + (major ? 11 : v % 5 === 0 ? 6 : 4.5), a);
    return { v, major, x1, y1, x2, y2 };
  });
  const labels = [0, 25, 50, 75, 100].map((v) => {
    const [x, y] = at(R + 24, angle(v));
    return { v, x, y };
  });

  const zonePath = computed(() => arc(R + 3.5, props.zoneFrom, 100));
  const innerArc = arc(R - 9, 0, 100);

  // Damped spring: a small overshoot, then it settles.
  const reduced = usePreferredReducedMotion();
  const position = ref(0);
  const velocity = ref(0);
  const tremble = ref(0);
  let time = 0;

  const root = ref<HTMLElement | null>(null);
  const visible = useElementVisibility(root);

  const raf = useRafFn(
    ({ delta }) => {
      const dt = Math.min(delta, 50) / 1000;
      time += dt;
      const force = 78 * (props.value - position.value) - 11.5 * velocity.value;
      velocity.value += force * dt;
      position.value += velocity.value * dt;
      tremble.value =
        props.jitter *
        (Math.sin(time * 9.1) * 0.5 +
          Math.sin(time * 3.7 + 1.3) * 0.35 +
          Math.sin(time * 17.3) * 0.15);
      const settled =
        Math.abs(props.value - position.value) < 0.01 &&
        Math.abs(velocity.value) < 0.01;
      if (settled && props.jitter === 0) {
        position.value = props.value;
        raf.pause();
      }
    },
    { immediate: false },
  );

  function sync(): void {
    if (reduced.value === 'reduce') {
      raf.pause();
      position.value = props.value;
      velocity.value = 0;
      tremble.value = 0;
      return;
    }
    if (visible.value) raf.resume();
    else raf.pause();
  }
  watch([() => props.value, () => props.jitter, visible, reduced], sync);
  onMounted(sync);

  const needle = computed(() => {
    const [x, y] = at(R + 14, angle(position.value + tremble.value));
    return { x, y };
  });
  const readout = computed(() => String(Math.round(clamp(position.value))));
  const faceId = `spg-face-${useId()}`;
</script>

<template>
  <div
    ref="root"
    class="@container relative aspect-320/178 overflow-hidden rounded-[1.25rem] border border-black/50 bg-[#0e0c0a] shadow-[inset_0_2px_14px_rgb(0_0_0/0.85),0_1px_0_rgb(255_255_255/0.05)] dark:border-white/6"
    :style="{ '--spg-accent': props.color }"
    role="meter"
    :aria-valuenow="Math.round(props.value)"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="props.label"
    :aria-valuetext="`${Math.round(props.value)} %`"
  >
    <svg
      viewBox="0 0 320 178"
      class="absolute inset-0 size-full"
      aria-hidden="true"
    >
      <defs>
        <radialGradient :id="faceId" cx="50%" cy="30%" r="80%">
          <stop offset="0" stop-color="#3a2f22" />
          <stop offset="0.55" stop-color="#1b1712" />
          <stop offset="1" stop-color="#0c0b09" />
        </radialGradient>
      </defs>
      <rect width="320" height="178" :fill="`url(#${faceId})`" />
      <path
        :d="innerArc"
        fill="none"
        stroke="#e8e0cf"
        stroke-opacity="0.22"
        stroke-width="0.9"
      />
      <path
        :d="zonePath"
        fill="none"
        :stroke="props.color"
        stroke-width="7"
        style="filter: drop-shadow(0 0 4px var(--spg-accent))"
      />
      <line
        v-for="t in ticks"
        :key="t.v"
        :x1="t.x1"
        :y1="t.y1"
        :x2="t.x2"
        :y2="t.y2"
        :stroke="t.v >= props.zoneFrom ? '#2a1a08' : '#ddd5c4'"
        :stroke-opacity="t.v >= props.zoneFrom ? 0.55 : 0.85"
        :stroke-width="t.major ? 1.8 : 1.1"
      />
      <text
        v-for="l in labels"
        :key="l.v"
        :x="l.x"
        :y="l.y + 4"
        text-anchor="middle"
        font-size="12.5"
        :fill="l.v >= props.zoneFrom ? props.color : '#d8d0bf'"
        :fill-opacity="l.v >= props.zoneFrom ? 1 : 0.85"
      >
        {{ l.v }}
      </text>
      <line
        :x1="CX + 2"
        :y1="CY + 3"
        :x2="needle.x + 2"
        :y2="needle.y + 3"
        stroke="#000000"
        stroke-opacity="0.45"
        stroke-width="2.4"
        stroke-linecap="round"
      />
      <line
        :x1="CX"
        :y1="CY"
        :x2="needle.x"
        :y2="needle.y"
        stroke="#f6eedf"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <circle
        :cx="CX"
        :cy="CY + 4"
        r="38"
        fill="#090807"
        stroke="#ffffff"
        stroke-opacity="0.07"
      />
    </svg>
    <div
      class="pointer-events-none absolute top-[56%] left-1/2 flex -translate-1/2 items-end gap-[1.2cqw]"
    >
      <SegmentDisplay
        :value="readout"
        :digits="2"
        :color="props.color"
        :label="`${readout} %`"
        class="text-[8.4cqw]"
      />
      <span class="pb-[0.3cqw] text-[4.4cqw] text-(--spg-accent)">%</span>
    </div>
    <span
      class="pointer-events-none absolute bottom-[6%] left-[6%] text-[4.6cqw] tracking-wider text-[#d8d0bf]/45 uppercase"
    >
      {{ props.label }}
    </span>
  </div>
</template>
