<script setup lang="ts">
  import IsoStackedBars from '@registry/new-york/iso-stacked-bars/IsoStackedBars.vue';
  import type {
    IsoStackedBarsDatum,
    IsoStackedBarsSeries,
  } from '@registry/new-york/iso-stacked-bars/types';

  const series: IsoStackedBarsSeries[] = [
    {
      key: 'housing',
      label: 'Housing',
      color: '#3ee0d8',
      row: 'back',
      texture: 'dots',
    },
    { key: 'bracket', label: 'Bracket', color: '#f5d03b', row: 'back' },
    { key: 'shaft', label: 'Shaft', color: '#34d07f', row: 'back' },
    {
      key: 'cap',
      label: 'Cap',
      color: '#a46cf5',
      row: 'back',
      texture: 'grid',
    },
    {
      key: 'rework',
      label: 'Rework',
      color: '#f590b4',
      row: 'front',
      texture: 'dots',
    },
    { key: 'scrap', label: 'Scrap', color: '#f2742b', row: 'front' },
  ];

  // Sep 15 – Sep 24, 41,208 units in total.
  const data: IsoStackedBarsDatum[] = [
    {
      label: 'Sep 15',
      values: {
        housing: 540,
        bracket: 3250,
        shaft: 270,
        cap: 650,
        rework: 58,
        scrap: 58,
      },
    },
    {
      label: 'Sep 16',
      values: {
        housing: 520,
        bracket: 3240,
        shaft: 250,
        cap: 630,
        rework: 64,
        scrap: 52,
      },
    },
    {
      label: 'Sep 17',
      values: {
        housing: 560,
        bracket: 2900,
        shaft: 230,
        cap: 610,
        rework: 52,
        scrap: 49,
      },
    },
    {
      label: 'Sep 18',
      values: {
        housing: 600,
        bracket: 2930,
        shaft: 240,
        cap: 620,
        rework: 49,
        scrap: 55,
      },
    },
    {
      label: 'Sep 19',
      values: {
        housing: 580,
        bracket: 2620,
        shaft: 300,
        cap: 560,
        rework: 55,
        scrap: 47,
      },
    },
    {
      label: 'Sep 20',
      values: {
        housing: 610,
        bracket: 2340,
        shaft: 180,
        cap: 590,
        rework: 47,
        scrap: 44,
      },
    },
    {
      label: 'Sep 21',
      values: {
        housing: 560,
        bracket: 2610,
        shaft: 190,
        cap: 620,
        rework: 50,
        scrap: 51,
      },
    },
    {
      label: 'Sep 22',
      values: {
        housing: 590,
        bracket: 2520,
        shaft: 170,
        cap: 570,
        rework: 184,
        scrap: 46,
      },
    },
    {
      label: 'Sep 23',
      values: {
        housing: 600,
        bracket: 2490,
        shaft: 160,
        cap: 560,
        rework: 46,
        scrap: 60,
      },
    },
    {
      label: 'Sep 24',
      values: {
        housing: 520,
        bracket: 2638,
        shaft: 160,
        cap: 430,
        rework: 61,
        scrap: 57,
      },
    },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import IsoStackedBars from '~/components/ui/iso-stacked-bars/IsoStackedBars.vue';
  import type {
    IsoStackedBarsDatum,
    IsoStackedBarsSeries,
  } from '~/components/ui/iso-stacked-bars/types';

  const series: IsoStackedBarsSeries[] = [
    { key: 'housing', label: 'Housing', color: '#3ee0d8', row: 'back', texture: 'dots' },
    { key: 'bracket', label: 'Bracket', color: '#f5d03b', row: 'back' },
    { key: 'shaft', label: 'Shaft', color: '#34d07f', row: 'back' },
    { key: 'cap', label: 'Cap', color: '#a46cf5', row: 'back', texture: 'grid' },
    { key: 'rework', label: 'Rework', color: '#f590b4', row: 'front', texture: 'dots' },
    { key: 'scrap', label: 'Scrap', color: '#f2742b', row: 'front' },
  ];

  const data: IsoStackedBarsDatum[] = [
    { label: 'Sep 15', values: { housing: 540, bracket: 3250, shaft: 270, cap: 650, rework: 58, scrap: 58 } },
    { label: 'Sep 16', values: { housing: 520, bracket: 3240, shaft: 250, cap: 630, rework: 64, scrap: 52 } },
    // …
    { label: 'Sep 22', values: { housing: 590, bracket: 2520, shaft: 170, cap: 570, rework: 184, scrap: 46 } },
  ];
</script>

<template>
  <IsoStackedBars
    title=&quot;Output &amp; Scrap&quot;
    subtitle=&quot;units per day · by product&quot;
    note=&quot;scrap 2.4 %&quot;
    :series=&quot;series&quot;
    :data=&quot;data&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <IsoStackedBars
        title="Output & Scrap"
        subtitle="units per day · by product"
        note="scrap 2.4 %"
        :series="series"
        :data="data"
      />
    </div>
  </ComponentDemo>
</template>
