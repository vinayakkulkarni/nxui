<script setup lang="ts">
  import { computed } from 'vue';
  import { Chart, defineChart, polar, radialArc } from '../chart/chart-backend';
  import { useChartTween } from '../chart/use-chart-tween';
  import type { ProgressRingProps } from './types';

  const props = withDefaults(defineProps<ProgressRingProps>(), {
    size: 120,
    thickness: 10,
    color: 'var(--chart-1)',
    trackColor: 'var(--muted)',
    label: '',
    ariaLabel: '',
    class: '',
  });

  const TAU = Math.PI * 2;
  const clamped = computed(() => Math.min(100, Math.max(0, props.value)));
  const shown = useChartTween(() => clamped.value, 1000);

  const definition = computed(() => {
    const outer = props.size / 2 - 2;
    const inner = outer - props.thickness;
    return defineChart({
      marks: [
        polar({
          marks: [
            radialArc([{ a: 0, b: TAU }], {
              startAngle: 'a',
              endAngle: 'b',
              innerRadius: inner,
              outerRadius: outer,
              fill: props.trackColor,
            }),
            radialArc([{ a: 0, b: (TAU * shown.value) / 100 }], {
              startAngle: 'a',
              endAngle: 'b',
              innerRadius: inner,
              outerRadius: outer,
              cornerRadius: props.thickness / 2,
              fill: props.color,
            }),
          ],
          scales: { angle: null, radius: null },
        }),
      ],
      scales: { x: null, y: null },
    });
  });

  const accessibleName = computed(
    () =>
      props.ariaLabel ||
      `${props.label || 'Progress'}: ${Math.round(clamped.value)}%`,
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
      <slot :value="shown">
        <span class="text-2xl font-semibold tabular-nums text-foreground">
          {{ Math.round(shown) }}%
        </span>
        <span v-if="props.label" class="text-xs text-muted-foreground">
          {{ props.label }}
        </span>
      </slot>
    </div>
  </div>
</template>
