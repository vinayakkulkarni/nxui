<script setup lang="ts">
  import { ref } from 'vue';
  import PatternDonut from '@registry/new-york/pattern-donut/PatternDonut.vue';
  import type { PatternDonutCategory } from '@registry/new-york/pattern-donut/types';

  const stops: PatternDonutCategory[] = [
    {
      label: 'Tooling',
      value: 412,
      color: '#f5d03b',
      causes: [
        { label: 'Tool change', value: 220 },
        { label: 'Tool breakage', value: 118 },
        { label: 'Fixture swap', value: 74 },
      ],
    },
    {
      label: 'Maint',
      value: 318,
      color: '#a46cf5',
      causes: [
        { label: 'Breakdown repair', value: 196 },
        { label: 'PM overrun', value: 122 },
      ],
    },
    {
      label: 'Material',
      value: 221,
      color: '#3ee0d8',
      causes: [
        { label: 'Stock shortage', value: 132 },
        { label: 'Wrong batch', value: 89 },
      ],
    },
    {
      label: 'Setup',
      value: 168,
      color: '#f590b4',
      causes: [
        { label: 'Changeover', value: 104 },
        { label: 'First-off approval', value: 64 },
      ],
    },
    {
      label: 'Quality',
      value: 77,
      color: '#f2742b',
      causes: [{ label: 'Rework', value: 77 }],
    },
    {
      label: 'Other',
      value: 40,
      color: '#8a8a8a',
      causes: [{ label: 'Unlogged', value: 40 }],
    },
  ];

  const selected = ref<string | null>(null);
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import PatternDonut from '~/components/ui/pattern-donut/PatternDonut.vue';
  import type { PatternDonutCategory } from '~/components/ui/pattern-donut/types';

  const stops: PatternDonutCategory[] = [
    {
      label: 'Tooling',
      value: 412,
      color: '#f5d03b',
      causes: [
        { label: 'Tool change', value: 220 },
        { label: 'Tool breakage', value: 118 },
        { label: 'Fixture swap', value: 74 },
      ],
    },
    { label: 'Maint', value: 318, color: '#a46cf5', causes: [{ label: 'Breakdown repair', value: 196 }, { label: 'PM overrun', value: 122 }] },
    { label: 'Material', value: 221, color: '#3ee0d8', causes: [{ label: 'Stock shortage', value: 132 }, { label: 'Wrong batch', value: 89 }] },
    { label: 'Setup', value: 168, color: '#f590b4', causes: [{ label: 'Changeover', value: 104 }, { label: 'First-off approval', value: 64 }] },
    { label: 'Quality', value: 77, color: '#f2742b' },
    { label: 'Other', value: 40, color: '#8a8a8a' },
  ];

  const selected = ref<string | null>(null);
</script>

<template>
  <PatternDonut
    v-model:selected=&quot;selected&quot;
    :data=&quot;stops&quot;
    title=&quot;Why Lines Stop&quot;
    description=&quot;minutes · last 28 days&quot;
    unit=&quot;min&quot;
    :delta=&quot;-14&quot;
    delta-label=&quot;vs Aug&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <PatternDonut
        v-model:selected="selected"
        :data="stops"
        title="Why Lines Stop"
        description="minutes · last 28 days"
        unit="min"
        :delta="-14"
        delta-label="vs Aug"
      />
    </div>
  </ComponentDemo>
</template>
