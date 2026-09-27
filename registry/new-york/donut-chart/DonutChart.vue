<script setup lang="ts">
  import { computed, ref } from 'vue';
  import {
    Chart,
    defineChart,
    pie,
    polar,
    radialArc,
  } from '../chart/chart-backend';
  import { useChartTween } from '../chart/use-chart-tween';
  import type { DonutChartProps } from './types';

  const props = withDefaults(defineProps<DonutChartProps>(), {
    size: 220,
    thickness: 28,
    gap: 0.03,
    cornerRadius: 4,
    centerLabel: 'Total',
    legend: true,
    ariaLabel: 'Donut chart',
    class: '',
  });

  const TAU = Math.PI * 2;
  const PALETTE = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ];

  const active = ref<number | null>(null);
  const sweep = useChartTween(1, 1000);

  const slices = computed(() =>
    props.data.map((d, index) => ({
      ...d,
      index,
      color: d.color ?? PALETTE[index % PALETTE.length]!,
    })),
  );
  const total = computed(() => props.data.reduce((sum, d) => sum + d.value, 0));
  const shownTotal = useChartTween(() => total.value, 1000);

  const outer = computed(() => props.size / 2 - 8);
  const inner = computed(() => outer.value - props.thickness);

  const definition = computed(() => {
    // Gaps scale with the sweep so a partial sweep always has room to draw.
    const arcs =
      sweep.value > 0
        ? pie(slices.value, {
            value: 'value',
            endAngle: TAU * sweep.value,
            gapAngle: props.gap * sweep.value,
          })
        : [];
    const focused = active.value;
    const shape = {
      startAngle: 'startAngle',
      endAngle: 'endAngle',
      innerRadius: inner.value,
      cornerRadius: props.cornerRadius,
    } as const;
    return defineChart({
      marks: [
        polar({
          marks: [
            radialArc(
              arcs.filter((arc) => arc.sourceIndexes[0] !== focused),
              {
                ...shape,
                outerRadius: outer.value,
                fill: (arc) => arc.color,
                fillOpacity: focused === null ? 1 : 0.35,
              },
            ),
            radialArc(
              arcs.filter((arc) => arc.sourceIndexes[0] === focused),
              {
                ...shape,
                outerRadius: outer.value + 6,
                fill: (arc) => arc.color,
              },
            ),
          ],
          scales: { angle: null, radius: null },
        }),
      ],
      scales: { x: null, y: null },
    });
  });

  function percent(value: number): string {
    return total.value > 0
      ? `${Math.round((value / total.value) * 100)}%`
      : '0%';
  }

  function setActive(index: number | null): void {
    active.value = index;
  }
</script>

<template>
  <div :class="['flex flex-col items-center gap-5', props.class]">
    <div
      class="relative"
      :style="{ width: `${props.size}px`, height: `${props.size}px` }"
    >
      <Chart
        :definition="definition"
        :width="props.size"
        :height="props.size"
        v-bind="{ ariaLabel: props.ariaLabel }"
      />
      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
      >
        <span
          class="text-3xl font-semibold tracking-tight tabular-nums text-foreground"
        >
          {{ Math.round(shownTotal).toLocaleString() }}
        </span>
        <span class="text-xs text-muted-foreground">{{
          props.centerLabel
        }}</span>
      </div>
    </div>
    <ul
      v-if="props.legend"
      class="flex flex-wrap justify-center gap-x-4 gap-y-2"
    >
      <li v-for="slice in slices" :key="slice.label">
        <button
          type="button"
          class="flex items-center gap-2 rounded-md px-1.5 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          :aria-pressed="active === slice.index"
          @mouseenter="setActive(slice.index)"
          @mouseleave="setActive(null)"
          @focus="setActive(slice.index)"
          @blur="setActive(null)"
        >
          <span
            class="size-2.5 rounded-full"
            :style="{ background: slice.color }"
          />
          {{ slice.label }}
          <span class="tabular-nums text-foreground">{{
            percent(slice.value)
          }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
