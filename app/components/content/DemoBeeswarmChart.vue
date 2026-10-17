<script setup lang="ts">
  import { ref } from 'vue';
  import BeeswarmChart from '@registry/new-york/beeswarm-chart/BeeswarmChart.vue';
  import type {
    BeeswarmChartPart,
    BeeswarmChartSeries,
  } from '@registry/new-york/beeswarm-chart/types';

  const COUNT = 64;
  // Newest part finished at 11:43:30; one part every 45 s before that.
  const LAST_PART_AT = 11 * 3600 + 43 * 60 + 30;

  // Small seeded PRNG so the server and the client draw the same swarm.
  function prng(seed: number): () => number {
    let a = seed;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
    };
  }

  function clock(slot: number): string {
    const s = LAST_PART_AT - slot * 45;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = sorted.length / 2;
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }

  function round(value: number): number {
    return Math.round(value * 10) / 10;
  }

  function makeParts(
    seed: number,
    newestId: number,
    target: number,
    spread: number,
    range: [number, number],
    fixed: Record<number, Omit<BeeswarmChartPart, 'id' | 'time'>>,
  ): BeeswarmChartPart[] {
    const random = prng(seed);
    // Roughly normal noise: the mean of three uniforms.
    const noise = Array.from(
      { length: COUNT },
      () => (random() + random() + random() - 1.5) * 2 * spread,
    );
    let shift = target;
    let values: number[] = [];
    // Nudge the free values until the median lands exactly on the target.
    for (let pass = 0; pass < 8; pass++) {
      values = noise.map(
        (n, slot) =>
          fixed[slot]?.value ??
          round(Math.min(Math.max(shift + n, range[0]), range[1])),
      );
      const off = target - median(values);
      if (Math.abs(off) < 0.01) break;
      shift += off;
    }
    return values.map((value, slot) => ({
      id: newestId - slot,
      time: clock(slot),
      value,
      note: fixed[slot]?.note,
    }));
  }

  const series: BeeswarmChartSeries[] = [
    {
      value: 'cnc-04',
      label: 'CNC-04',
      parts: makeParts(4, 2311, 43.8, 1.1, [39.6, 44.9], {
        6: { value: 45.8, note: 'chip clearing' },
        19: { value: 46.4, note: 'probe retry' },
        33: { value: 47.6, note: 'insert swap' },
        48: { value: 45.3, note: 'chip clearing' },
        57: { value: 55.9, note: 'coolant top-up' },
      }),
    },
    {
      value: 'cnc-07',
      label: 'CNC-07',
      parts: makeParts(7, 1189, 42.6, 1.05, [40.6, 44.8], {
        2: { value: 58.4, note: 'tool change' },
        14: { value: 40.1 },
        30: { value: 39.8 },
        50: { value: 38.9 },
        23: { value: 47.1, note: 'chip clearing' },
        41: { value: 46.1, note: 'probe retry' },
      }),
    },
    {
      value: 'press-2',
      label: 'Press-2',
      parts: makeParts(2, 874, 46.3, 1.8, [41.2, 49.8], {
        11: { value: 53.2, note: 'die change' },
        37: { value: 56.7, note: 'misfeed' },
      }),
    },
  ];

  const machine = ref('cnc-07');
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import { ref } from 'vue';
  import BeeswarmChart from '~/components/ui/beeswarm-chart/BeeswarmChart.vue';
  import type { BeeswarmChartSeries } from '~/components/ui/beeswarm-chart/types';

  const series: BeeswarmChartSeries[] = [
    {
      value: 'cnc-07',
      label: 'CNC-07',
      parts: [
        { id: 1189, time: '11:43', value: 42.1 },
        { id: 1188, time: '11:42', value: 43.4 },
        { id: 1187, time: '11:42', value: 58.4, note: 'tool change' },
        // …61 more parts
      ],
    },
    { value: 'cnc-04', label: 'CNC-04', parts: [/* … */] },
    { value: 'press-2', label: 'Press-2', parts: [/* … */] },
  ];

  const machine = ref('cnc-07');
</script>

<template>
  <BeeswarmChart
    v-model:machine=&quot;machine&quot;
    :series=&quot;series&quot;
    :takt=&quot;45&quot;
    :domain=&quot;[38, 58]&quot;
    :break-at=&quot;50&quot;
    :ticks=&quot;[38, 44, 50, 58]&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <BeeswarmChart
        v-model:machine="machine"
        :series="series"
        :takt="45"
        :domain="[38, 58]"
        :break-at="50"
        :ticks="[38, 44, 50, 58]"
      />
    </div>
  </ComponentDemo>
</template>
