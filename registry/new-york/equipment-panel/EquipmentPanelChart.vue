<script setup lang="ts">
  import { computed, useTemplateRef } from 'vue';
  import { useElementSize } from '@vueuse/core';
  import { smoothPath } from './equipment-panel';
  import type { EquipmentChartProps } from './types';

  const props = defineProps<EquipmentChartProps>();

  const H = 40;
  const box = useTemplateRef<HTMLElement>('box');
  const { width } = useElementSize(box);
  const W = computed(() => Math.max(40, width.value || 200));

  const scale = computed(() => {
    const pts = props.chart.points;
    const lo = props.chart.min ?? Math.min(...pts) - 2;
    const hi = Math.max(props.chart.limit ?? Math.max(...pts), ...pts) + 0.5;
    return { lo, hi };
  });

  function y(v: number): number {
    const { lo, hi } = scale.value;
    return H - ((v - lo) / (hi - lo || 1)) * H;
  }

  const coords = computed<[number, number][]>(() => {
    const pts = props.chart.points;
    const step = pts.length > 1 ? (W.value - 4) / (pts.length - 1) : 0;
    return pts.map((v, i) => [i * step, y(v)]);
  });
  const path = computed(() => smoothPath(coords.value));
  const end = computed(() => coords.value.at(-1));
  const limitY = computed(() =>
    props.chart.limit === undefined ? null : y(props.chart.limit),
  );
</script>

<template>
  <div
    class="relative flex min-h-17 flex-1 items-end overflow-hidden rounded-xl border border-black bg-neutral-950 px-3 pt-2 pb-2.5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.85)] dark:border-white/6"
  >
    <span
      class="absolute top-2 left-3 text-[11px] font-medium tracking-[0.12em] uppercase opacity-60"
      :style="{ color: props.color }"
    >
      {{ props.chart.label }}
    </span>
    <div ref="box" class="mt-5 h-10 w-full @md:w-[58%]">
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        class="size-full overflow-visible"
        role="img"
        :aria-label="`${props.chart.label}: ${props.chart.points.at(-1)?.toFixed(1)}`"
      >
        <line
          v-if="limitY !== null"
          x1="0"
          :x2="W"
          :y1="limitY"
          :y2="limitY"
          :stroke="props.color"
          stroke-opacity="0.5"
          stroke-dasharray="2 3"
        />
        <path
          :d="path"
          fill="none"
          :stroke="props.color"
          stroke-width="1.6"
          stroke-linecap="round"
        />
        <circle
          v-if="end"
          :cx="end[0]"
          :cy="end[1]"
          r="2.6"
          :fill="props.color"
          :style="{ filter: `drop-shadow(0 0 3px ${props.color})` }"
        />
      </svg>
    </div>
    <div
      class="absolute top-1/2 right-3 hidden -translate-y-1/2 text-right text-[13px]/snug @md:block"
    >
      <p
        v-if="props.chart.limitLabel"
        class="opacity-55"
        :style="{ color: props.color }"
      >
        {{ props.chart.limitLabel }}
      </p>
      <p v-if="props.chart.note" :style="{ color: props.color }">
        {{ props.chart.note }}
      </p>
    </div>
  </div>
</template>
