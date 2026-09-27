<script setup lang="ts">
  import KpiCarousel from '@registry/new-york/kpi-carousel/KpiCarousel.vue';
  import type { KpiCarouselItem } from '@registry/new-york/kpi-carousel/types';

  const items: KpiCarouselItem[] = [
    {
      title: 'Top region',
      value: '$184.3k',
      caption: 'North America grew 18% quarter over quarter.',
      tone: 'best',
    },
    {
      title: 'Lowest conversion',
      value: '1.2%',
      caption: 'Mobile checkout dropped 0.8 points after the last release.',
      tone: 'worst',
    },
    {
      title: 'Average order value',
      value: '$64.90',
      caption: 'Unchanged from last month across all channels.',
      tone: 'neutral',
    },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import KpiCarousel from '~/components/ui/kpi-carousel/KpiCarousel.vue';
  import type { KpiCarouselItem } from '~/components/ui/kpi-carousel/types';

  const items: KpiCarouselItem[] = [
    { title: 'Top region', value: '$184.3k', caption: 'North America grew 18%.', tone: 'best' },
    { title: 'Lowest conversion', value: '1.2%', caption: 'Mobile checkout dropped.', tone: 'worst' },
    { title: 'Average order value', value: '$64.90', caption: 'Unchanged.', tone: 'neutral' },
  ];
</script>

<template>
  <KpiCarousel :items=&quot;items&quot; :interval=&quot;5000&quot; />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <KpiCarousel :items="items" class="max-w-md" />
    </div>
  </ComponentDemo>
</template>
