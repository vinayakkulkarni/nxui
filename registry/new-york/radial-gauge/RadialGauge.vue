<script setup lang="ts">
  import { computed } from 'vue';
  import { Chart, defineChart, polar, radialArc } from '../chart/chart-backend';
  import { useChartTween } from '../chart/use-chart-tween';
  import type { RadialGaugeProps } from './types';

  const props = withDefaults(defineProps<RadialGaugeProps>(), {
    min: 0,
    max: 100,
    label: '',
    unit: '',
    size: 220,
    thickness: 16,
    sweep: 270,
    color: 'var(--chart-2)',
    thresholds: () => [],
    ariaLabel: '',
    class: '',
  });

  const clamped = computed(() =>
    Math.min(props.max, Math.max(props.min, props.value)),
  );
  const shown = useChartTween(() => clamped.value, 1100);

  const fraction = computed(() => {
    const span = props.max - props.min;
    return span === 0 ? 0 : (shown.value - props.min) / span;
  });

  const tone = computed(() => {
    const band = [...props.thresholds]
      .sort((a, b) => a.from - b.from)
      .filter((t) => clamped.value >= t.from)
      .at(-1);
    return band?.color ?? props.color;
  });

  const angles = computed(() => {
    const half = ((props.sweep / 2) * Math.PI) / 180;
    return { start: -half, end: half };
  });

  const definition = computed(() => {
    const { start, end } = angles.value;
    const outer = props.size / 2 - 4;
    const shape = {
      startAngle: 'a',
      endAngle: 'b',
      innerRadius: outer - props.thickness,
      outerRadius: outer,
      cornerRadius: props.thickness / 2,
    } as const;
    return defineChart({
      marks: [
        polar({
          marks: [
            radialArc([{ a: start, b: end }], {
              ...shape,
              fill: 'var(--muted)',
            }),
            radialArc(
              [{ a: start, b: start + (end - start) * fraction.value }],
              {
                ...shape,
                fill: tone.value,
              },
            ),
          ],
          scales: { angle: null, radius: null },
        }),
      ],
      scales: { x: null, y: null },
    });
  });

  const readout = computed(() => `${Math.round(shown.value)}${props.unit}`);
  const accessibleName = computed(
    () =>
      props.ariaLabel ||
      `${props.label || 'Gauge'}: ${Math.round(clamped.value)}${props.unit}`,
  );
</script>

<template>
  <div
    :class="['relative', props.class]"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
  >
    <Chart
      :definition="definition"
      :width="props.size"
      :height="props.size"
      v-bind="{ ariaLabel: accessibleName }"
    />
    <div
      class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
    >
      <span
        class="text-4xl font-semibold tracking-tight tabular-nums text-foreground"
      >
        {{ readout }}
      </span>
      <span v-if="props.label" class="mt-1 text-xs text-muted-foreground">
        {{ props.label }}
      </span>
    </div>
    <div
      class="pointer-events-none absolute inset-x-0 bottom-[12%] flex justify-between px-[22%] text-xs tabular-nums text-muted-foreground"
    >
      <span>{{ props.min }}</span>
      <span>{{ props.max }}</span>
    </div>
  </div>
</template>
