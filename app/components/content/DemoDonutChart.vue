<script setup lang="ts">
  import DonutChart from '@registry/new-york/donut-chart/DonutChart.vue';
  import type { DonutChartDatum } from '@registry/new-york/donut-chart/types';

  const traffic: DonutChartDatum[] = [
    { label: 'Direct', value: 4312 },
    { label: 'Search', value: 3120 },
    { label: 'Social', value: 1894 },
    { label: 'Referral', value: 1236 },
    { label: 'Email', value: 642 },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import DonutChart from '~/components/ui/donut-chart/DonutChart.vue';
  import type { DonutChartDatum } from '~/components/ui/donut-chart/types';

  const traffic: DonutChartDatum[] = [
    { label: 'Direct', value: 4312 },
    { label: 'Search', value: 3120 },
    { label: 'Social', value: 1894 },
  ];
</script>

<template>
  <DonutChart :data=&quot;traffic&quot; center-label=&quot;Visits&quot; aria-label=&quot;Visits by source&quot; />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <DonutChart
        :data="traffic"
        center-label="Visits"
        aria-label="Visits by source"
      />
    </div>
  </ComponentDemo>
</template>
