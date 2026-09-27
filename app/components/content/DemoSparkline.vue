<script setup lang="ts">
  import Sparkline from '@registry/new-york/sparkline/Sparkline.vue';

  const metrics = [
    {
      label: 'Revenue',
      value: '$48.2k',
      delta: '+12.4%',
      up: true,
      color: 'var(--chart-2)',
      data: [12, 18, 15, 22, 19, 27, 24, 31, 29, 36, 33, 41],
    },
    {
      label: 'Active users',
      value: '9,184',
      delta: '+4.1%',
      up: true,
      color: 'var(--chart-1)',
      data: [40, 42, 39, 45, 44, 48, 47, 46, 51, 50, 54, 56],
    },
    {
      label: 'Churn',
      value: '2.3%',
      delta: '-0.6%',
      up: false,
      color: 'var(--chart-5)',
      data: [31, 29, 30, 27, 28, 25, 26, 23, 24, 22, 21, 19],
    },
  ];
</script>

<template>
  <ComponentDemo
    :code="`<script setup lang=&quot;ts&quot;>
  import Sparkline from '~/components/ui/sparkline/Sparkline.vue';
</script>

<template>
  <Sparkline
    :data=&quot;[12, 18, 15, 22, 19, 27, 24, 31, 29, 36]&quot;
    color=&quot;var(--chart-2)&quot;
    :height=&quot;48&quot;
    aria-label=&quot;Revenue, last 12 months&quot;
  />
</template>`"
  >
    <div class="flex size-full min-h-100 items-center justify-center p-6">
      <div class="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        <div
          v-for="metric in metrics"
          :key="metric.label"
          class="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm"
        >
          <p class="text-sm text-muted-foreground">{{ metric.label }}</p>
          <div class="flex items-baseline justify-between gap-2">
            <span class="text-2xl font-semibold tracking-tight tabular-nums">
              {{ metric.value }}
            </span>
            <span
              class="flex items-center gap-0.5 text-xs font-medium tabular-nums"
              :class="
                metric.up
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              "
            >
              <Icon
                :name="
                  metric.up ? 'lucide:trending-up' : 'lucide:trending-down'
                "
                class="size-3.5"
              />
              {{ metric.delta }}
            </span>
          </div>
          <Sparkline
            :data="metric.data"
            :color="metric.color"
            :aria-label="`${metric.label}, last 12 months`"
          />
        </div>
      </div>
    </div>
  </ComponentDemo>
</template>
