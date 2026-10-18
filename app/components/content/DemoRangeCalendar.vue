<script setup lang="ts">
  import { ref } from 'vue';
  import RangeCalendar from '@registry/new-york/range-calendar/RangeCalendar.vue';
  import type { RangeCalendarDay } from '@registry/new-york/range-calendar/types';

  // Stops on Line 3 per day, September 2026 (up to the 28th).
  const STOPS = [
    142, 61, 58, 33, 66, 72, 64, 196, 104, 28, 188, 55, 47, 31, 69, 38, 183,
    200, 26, 52, 34, 63, 131, 177, 22, 57, 49, 74,
  ];

  const days: RangeCalendarDay[] = STOPS.map((value, index) => ({
    date: `2026-09-${String(index + 1).padStart(2, '0')}`,
    value,
  }));

  const start = ref('2026-09-04');
  const end = ref('2026-09-25');
  const preset = ref('1M');
  const compare = ref(true);
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import RangeCalendar from '~/components/ui/range-calendar/RangeCalendar.vue';
  import type { RangeCalendarDay } from '~/components/ui/range-calendar/types';

  const days: RangeCalendarDay[] = [
    { date: '2026-09-01', value: 142 },
    { date: '2026-09-02', value: 61 },
    // …one entry per day with data
  ];

  const start = ref('2026-09-04');
  const end = ref('2026-09-25');
  const preset = ref('1M');
  const compare = ref(true);
</script>

<template>
  <RangeCalendar
    v-model:start=&quot;start&quot;
    v-model:end=&quot;end&quot;
    v-model:preset=&quot;preset&quot;
    v-model:compare=&quot;compare&quot;
    today=&quot;2026-09-28&quot;
    :days=&quot;days&quot;
    title=&quot;Time Range&quot;
    subtitle=&quot;Line 3 · all cells&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <RangeCalendar
        v-model:start="start"
        v-model:end="end"
        v-model:preset="preset"
        v-model:compare="compare"
        today="2026-09-28"
        :days="days"
        title="Time Range"
        subtitle="Line 3 · all cells"
      />
    </div>
  </ComponentDemo>
</template>
