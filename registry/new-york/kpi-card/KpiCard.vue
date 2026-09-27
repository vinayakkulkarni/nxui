<script setup lang="ts">
  import { computed } from 'vue';
  import Sparkline from '../sparkline/Sparkline.vue';
  import { useChartTween } from '../chart/use-chart-tween';
  import type { KpiCardProps } from './types';

  const props = withDefaults(defineProps<KpiCardProps>(), {
    format: 'number',
    currency: 'USD',
    delta: undefined,
    deltaLabel: '',
    invertDelta: false,
    icon: '',
    trend: () => [],
    avatars: () => [],
    maxAvatars: 4,
    class: '',
  });

  const shown = useChartTween(() => props.value, 1100);

  const formatter = computed(() => {
    switch (props.format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: props.currency,
          maximumFractionDigits: 0,
        });
      case 'percent':
        return new Intl.NumberFormat('en-US', {
          style: 'percent',
          maximumFractionDigits: 1,
        });
      case 'compact':
        return new Intl.NumberFormat('en-US', {
          notation: 'compact',
          maximumFractionDigits: 1,
        });
      default:
        return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
    }
  });

  // Percent values are passed as percentages (42.5), Intl expects fractions.
  const display = computed(() =>
    formatter.value.format(
      props.format === 'percent' ? shown.value / 100 : shown.value,
    ),
  );

  const good = computed(() => {
    if (props.delta === undefined || props.delta === 0) return null;
    return props.invertDelta ? props.delta < 0 : props.delta > 0;
  });

  const deltaText = computed(() => {
    if (props.delta === undefined) return '';
    const sign = props.delta > 0 ? '+' : '';
    return `${sign}${props.delta.toFixed(1)}%`;
  });

  const trendColor = computed(() => {
    if (good.value === null) return 'var(--chart-1)';
    return good.value ? 'var(--chart-2)' : 'var(--chart-5)';
  });

  const visibleAvatars = computed(() =>
    props.avatars.slice(0, props.maxAvatars),
  );
  const hiddenAvatars = computed(() =>
    Math.max(0, props.avatars.length - props.maxAvatars),
  );
</script>

<template>
  <article
    :class="[
      'flex flex-col gap-4 rounded-2xl border bg-card p-5 text-card-foreground shadow-sm',
      props.class,
    ]"
  >
    <header class="flex items-center justify-between gap-3">
      <p class="text-sm text-muted-foreground">{{ props.label }}</p>
      <span
        v-if="props.icon"
        class="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"
      >
        <Icon :name="`lucide:${props.icon}`" class="size-4" />
      </span>
    </header>

    <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span class="text-3xl font-semibold tracking-tight tabular-nums">
        {{ display }}
      </span>
      <span
        v-if="props.delta !== undefined"
        :class="[
          'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
          good === null
            ? 'bg-muted text-muted-foreground'
            : good
              ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-500/12 text-rose-700 dark:text-rose-400',
        ]"
      >
        <Icon
          :name="
            props.delta > 0
              ? 'lucide:arrow-up-right'
              : props.delta < 0
                ? 'lucide:arrow-down-right'
                : 'lucide:minus'
          "
          class="size-3.5"
        />
        {{ deltaText }}
      </span>
      <span v-if="props.deltaLabel" class="text-xs text-muted-foreground">
        {{ props.deltaLabel }}
      </span>
    </div>

    <Sparkline
      v-if="props.trend.length > 1"
      :data="props.trend"
      :color="trendColor"
      :height="44"
      :aria-label="`${props.label} trend`"
    />

    <footer
      v-if="props.avatars.length"
      class="flex items-center justify-between gap-3 border-t pt-3"
    >
      <div class="flex -space-x-2">
        <img
          v-for="avatar in visibleAvatars"
          :key="avatar.src"
          :src="avatar.src"
          :alt="avatar.alt"
          width="28"
          height="28"
          loading="lazy"
          class="size-7 rounded-full bg-muted object-cover ring-2 ring-card"
        />
        <span
          v-if="hiddenAvatars"
          class="flex size-7 items-center justify-center rounded-full bg-muted text-[0.6875rem] font-medium text-muted-foreground ring-2 ring-card"
        >
          +{{ hiddenAvatars }}
        </span>
      </div>
      <slot name="footer" />
    </footer>
  </article>
</template>
