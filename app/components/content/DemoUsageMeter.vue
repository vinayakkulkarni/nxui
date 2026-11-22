<script setup lang="ts">
  import { computed, ref, useTemplateRef } from 'vue';
  import {
    useElementHover,
    useElementVisibility,
    useIntervalFn,
  } from '@vueuse/core';
  import UsageMeter from '@registry/new-york/usage-meter/UsageMeter.vue';
  import type {
    UsageMeterCategory,
    UsageMeterRange,
  } from '@registry/new-york/usage-meter/types';

  const categories: UsageMeterCategory[] = [
    { key: 'chat', label: 'Chat', color: '#2f5bea', darkColor: '#6573f6' },
    { key: 'search', label: 'Search', color: '#7091f2', darkColor: '#4553c8' },
    { key: 'image', label: 'Image', color: '#b4c4f8', darkColor: '#2c357c' },
    { key: 'api', label: 'API', color: '#9d9da6', darkColor: '#64646d' },
  ];

  function scaleTo(weights: number[], total: number): number[] {
    const sum = weights.reduce((acc, weight) => acc + weight, 0);
    const values = weights.map((weight) => Math.round((weight / sum) * total));
    const drift = total - values.reduce((acc, value) => acc + value, 0);
    values[values.length - 1] = (values.at(-1) ?? 0) + drift;
    return values;
  }

  function labels(month: string, from: number, count: number): string[] {
    return Array.from(
      { length: count },
      (_, index) => `${month} ${from + index}`,
    );
  }

  const ranges: UsageMeterRange[] = [
    {
      value: 'month',
      label: 'This month',
      usage: { chat: 3980, search: 1640, image: 1120, api: 680 },
      daily: scaleTo(
        [5, 3, 3, 5, 9, 7, 8, 8, 3, 3, 7, 9, 7, 8, 9, 5, 4, 7, 8, 10, 10, 10],
        7420,
      ),
      days: 30,
      dayLabels: labels('Oct', 1, 30),
      stats: [
        { label: 'Seats', value: 8, max: 10 },
        { label: 'Storage', value: 3.2, max: 5, unit: 'GB' },
        { label: 'Projects', value: 12 },
      ],
    },
    {
      value: 'last',
      label: 'Last month',
      usage: { chat: 5210, search: 2140, image: 1690, api: 960 },
      daily: scaleTo(
        [
          4, 7, 8, 2, 2, 6, 6, 7, 7, 5, 2, 2, 5, 5, 7, 7, 7, 2, 2, 9, 6, 9, 6,
          10, 3, 3, 9, 10, 6, 7,
        ],
        10000,
      ),
      dayLabels: labels('Sep', 1, 30),
      stats: [
        { label: 'Seats', value: 10, max: 10 },
        { label: 'Storage', value: 2.9, max: 5, unit: 'GB' },
        { label: 'Projects', value: 11 },
      ],
    },
    {
      value: '7d',
      label: '7 days',
      usage: { chat: 1260, search: 540, image: 0, api: 340 },
      daily: [80, 150, 340, 425, 350, 330, 465],
      dayLabels: labels('Oct', 2, 7),
      stats: [
        { label: 'Seats', value: 8, max: 10 },
        { label: 'Storage', value: 3.2, max: 5, unit: 'GB' },
        { label: 'Projects', value: 12 },
      ],
    },
  ];

  const range = ref('month');
  const stage = useTemplateRef<HTMLElement>('stage');
  const hovering = useElementHover(stage);
  const visible = useElementVisibility(stage);
  const idle = computed(() => visible.value && !hovering.value);

  useIntervalFn(() => {
    if (!idle.value) return;
    const index = ranges.findIndex((item) => item.value === range.value);
    const next = ranges[(index + 1) % ranges.length];
    if (next) range.value = next.value;
  }, 3200);
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import UsageMeter from '~/components/ui/usage-meter/UsageMeter.vue';
  import type {
    UsageMeterCategory,
    UsageMeterRange,
  } from '~/components/ui/usage-meter/types';

  const categories: UsageMeterCategory[] = [
    { key: 'chat', label: 'Chat', color: '#2f5bea', darkColor: '#6573f6' },
    { key: 'search', label: 'Search', color: '#7091f2', darkColor: '#4553c8' },
    { key: 'image', label: 'Image', color: '#b4c4f8', darkColor: '#2c357c' },
    { key: 'api', label: 'API', color: '#9d9da6', darkColor: '#64646d' },
  ];

  const ranges: UsageMeterRange[] = [
    {
      value: 'month',
      label: 'This month',
      usage: { chat: 3980, search: 1640, image: 1120, api: 680 },
      daily: [310, 190, 180, 320, 560 /* … */],
      days: 30,
      stats: [
        { label: 'Seats', value: 8, max: 10 },
        { label: 'Storage', value: 3.2, max: 5, unit: 'GB' },
        { label: 'Projects', value: 12 },
      ],
    },
    // { value: 'last', … }, { value: '7d', … }
  ];

  const range = ref('month');
</script>

<template>
  <UsageMeter
    v-model:range=&quot;range&quot;
    workspace=&quot;nxui&quot;
    plan=&quot;Pro plan&quot;
    resets=&quot;Resets in 9 days&quot;
    :limit=&quot;10000&quot;
    :categories=&quot;categories&quot;
    :ranges=&quot;ranges&quot;
    @upgrade=&quot;openBilling&quot;
    @add-credits=&quot;openBilling&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <div ref="stage" class="flex w-full justify-center">
        <UsageMeter
          v-model:range="range"
          workspace="nxui"
          plan="Pro plan"
          resets="Resets in 9 days"
          :limit="10000"
          :categories="categories"
          :ranges="ranges"
        />
      </div>
    </div>
  </ComponentDemo>
</template>
