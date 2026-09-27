<script setup lang="ts">
  import KpiCard from '@registry/new-york/kpi-card/KpiCard.vue';
  import type { KpiAvatar } from '@registry/new-york/kpi-card/types';

  const team: KpiAvatar[] = [11, 32, 47, 5, 68, 23].map((n) => ({
    src: `https://i.pravatar.cc/64?img=${n}`,
    alt: `Team member ${n}`,
  }));
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import KpiCard from '~/components/ui/kpi-card/KpiCard.vue';
</script>

<template>
  <KpiCard
    label=&quot;Monthly revenue&quot;
    :value=&quot;48210&quot;
    format=&quot;currency&quot;
    :delta=&quot;12.4&quot;
    delta-label=&quot;vs last month&quot;
    icon=&quot;dollar-sign&quot;
    :trend=&quot;[12, 18, 15, 22, 19, 27, 24, 31, 36, 41]&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <div class="grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Monthly revenue"
          :value="48210"
          format="currency"
          :delta="12.4"
          delta-label="vs last month"
          icon="dollar-sign"
          :trend="[12, 18, 15, 22, 19, 27, 24, 31, 36, 41]"
        />
        <KpiCard
          label="Active customers"
          :value="9184"
          :delta="4.1"
          delta-label="vs last month"
          icon="users"
          :avatars="team"
        />
        <KpiCard
          label="Churn rate"
          :value="2.3"
          format="percent"
          :delta="-0.6"
          delta-label="vs last month"
          icon="user-minus"
          invert-delta
          :trend="[31, 29, 30, 27, 28, 25, 26, 23, 21, 19]"
        />
      </div>
    </div>
  </ComponentDemo>
</template>
