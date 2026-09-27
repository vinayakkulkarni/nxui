<script setup lang="ts">
  import { ref } from 'vue';
  import KpiCarousel from '@registry/new-york/kpi-carousel/KpiCarousel.vue';
  import type { KpiCarouselItem } from '@registry/new-york/kpi-carousel/types';

  const best: KpiCarouselItem[] = [
    {
      title: 'Best Contributor',
      caption: 'Most significant contributor',
      value: 'TCS',
      delta: 4.2,
      tone: 'best',
    },
    {
      title: 'Runner-up',
      caption: 'Second largest contributor',
      value: 'INFY',
      delta: 2.85,
      tone: 'best',
    },
    {
      title: 'Steady Gainer',
      caption: 'Five sessions in the green',
      value: 'HDFCB',
      delta: 1.12,
      tone: 'best',
    },
  ];

  const worst: KpiCarouselItem[] = [
    {
      title: 'Top Mover',
      caption: 'Largest intraday swing',
      value: 'ADANI',
      delta: 3.4,
      tone: 'best',
    },
    {
      title: 'Worst Contributor',
      caption: 'Most significant contributor',
      value: 'RELNC',
      delta: 0.26,
      tone: 'worst',
    },
    {
      title: 'Neutral Contributor',
      caption: 'Most neutral contributor',
      value: '45.52',
      tone: 'neutral',
    },
  ];

  const neutral: KpiCarouselItem[] = [
    {
      title: 'Worst Contributor',
      caption: 'Largest drag on the index',
      value: 'WIPRO',
      delta: -1.84,
      tone: 'worst',
    },
    {
      title: 'Median Move',
      caption: 'Across all constituents',
      value: '0.08%',
      tone: 'neutral',
    },
    {
      title: 'Neutral Contributor',
      caption: 'Most neutral contributor',
      value: '45.52',
      tone: 'neutral',
    },
  ];

  const worstIndex = ref(1);
  const neutralIndex = ref(2);
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import KpiCarousel from '~/components/ui/kpi-carousel/KpiCarousel.vue';
  import type { KpiCarouselItem } from '~/components/ui/kpi-carousel/types';

  const items: KpiCarouselItem[] = [
    { title: 'Best Contributor', caption: 'Most significant contributor', value: 'TCS', delta: 4.2, tone: 'best' },
    { title: 'Worst Contributor', caption: 'Most significant contributor', value: 'RELNC', delta: 0.26, tone: 'worst' },
    { title: 'Neutral Contributor', caption: 'Most neutral contributor', value: '45.52', tone: 'neutral' },
  ];
</script>

<template>
  <KpiCarousel title=&quot;Active Top Names&quot; :items=&quot;items&quot; />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <div class="flex w-full max-w-lg flex-col gap-3">
        <KpiCarousel title="Active Top Names" :items="best" />
        <KpiCarousel
          v-model="worstIndex"
          title="Active Bottom Highlights"
          :items="worst"
        />
        <KpiCarousel
          v-model="neutralIndex"
          title="Neutral KPI"
          :items="neutral"
        />
      </div>
    </div>
  </ComponentDemo>
</template>
