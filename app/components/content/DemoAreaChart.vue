<script setup lang="ts">
  import AreaChart from '@registry/new-york/area-chart/AreaChart.vue';
  import type { AreaChartDatum } from '@registry/new-york/area-chart/types';

  const revenue: AreaChartDatum[] = [
    { label: 'Jan', value: 18 },
    { label: 'Feb', value: 24 },
    { label: 'Mar', value: 21 },
    { label: 'Apr', value: 29 },
    { label: 'May', value: 34 },
    { label: 'Jun', value: 31 },
    { label: 'Jul', value: 38 },
    { label: 'Aug', value: 44 },
    { label: 'Sep', value: 41 },
    { label: 'Oct', value: 49 },
    { label: 'Nov', value: 53 },
    { label: 'Dec', value: 61 },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import AreaChart from '~/components/ui/area-chart/AreaChart.vue';
  import type { AreaChartDatum } from '~/components/ui/area-chart/types';

  const revenue: AreaChartDatum[] = [
    { label: 'Jan', value: 18 },
    { label: 'Feb', value: 24 },
    { label: 'Mar', value: 21 },
  ];
</script>

<template>
  <AreaChart :data=&quot;revenue&quot; :height=&quot;260&quot; aria-label=&quot;Monthly revenue&quot; />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <div class="w-full max-w-2xl rounded-xl border bg-card p-5 shadow-sm">
        <div class="mb-4 flex items-end justify-between gap-4">
          <div>
            <p class="text-sm text-muted-foreground">Monthly revenue</p>
            <p class="text-2xl font-semibold tracking-tight tabular-nums">
              $443k
            </p>
          </div>
          <span class="text-xs text-muted-foreground">in thousands, 2026</span>
        </div>
        <AreaChart
          :data="revenue"
          :height="260"
          aria-label="Monthly revenue, 2026"
        />
      </div>
    </div>
  </ComponentDemo>
</template>
