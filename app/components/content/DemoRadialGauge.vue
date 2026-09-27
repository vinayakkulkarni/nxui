<script setup lang="ts">
  import { ref } from 'vue';
  import RadialGauge from '@registry/new-york/radial-gauge/RadialGauge.vue';
  import type { RadialGaugeThreshold } from '@registry/new-york/radial-gauge/types';

  const load = ref(68);
  const thresholds: RadialGaugeThreshold[] = [
    { from: 0, color: 'var(--chart-2)' },
    { from: 70, color: 'var(--chart-4)' },
    { from: 90, color: 'var(--chart-5)' },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import RadialGauge from '~/components/ui/radial-gauge/RadialGauge.vue';
  import type { RadialGaugeThreshold } from '~/components/ui/radial-gauge/types';

  const thresholds: RadialGaugeThreshold[] = [
    { from: 0, color: 'var(--chart-2)' },
    { from: 70, color: 'var(--chart-4)' },
    { from: 90, color: 'var(--chart-5)' },
  ];
</script>

<template>
  <RadialGauge :value=&quot;68&quot; unit=&quot;%&quot; label=&quot;CPU load&quot; :thresholds=&quot;thresholds&quot; />
</template>`"
  >
    <div
      class="flex size-full min-h-100 flex-col items-center justify-center gap-6 p-6"
    >
      <RadialGauge
        :value="load"
        unit="%"
        label="CPU load"
        :thresholds="thresholds"
      />
      <label
        class="flex w-full max-w-64 flex-col gap-2 text-sm text-muted-foreground"
      >
        <span class="flex justify-between">
          Load <span class="tabular-nums text-foreground">{{ load }}%</span>
        </span>
        <input
          v-model.number="load"
          type="range"
          min="0"
          max="100"
          class="accent-foreground"
          aria-label="CPU load"
        />
      </label>
    </div>
  </ComponentDemo>
</template>
