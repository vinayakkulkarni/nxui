<script setup lang="ts">
  import type { UsageMeterStat, UsageMeterStatsProps } from './types';
  import { formatDecimal } from './usage-meter';

  defineProps<UsageMeterStatsProps>();

  function fill(stat: UsageMeterStat): string {
    if (!stat.max) return '0%';
    return `${Math.min(100, (stat.value / stat.max) * 100)}%`;
  }

  function warns(stat: UsageMeterStat): boolean {
    return Boolean(stat.max) && stat.value / (stat.max ?? 1) >= 0.8;
  }

  function full(stat: UsageMeterStat): boolean {
    return Boolean(stat.max) && stat.value >= (stat.max ?? 0);
  }
</script>

<template>
  <dl class="grid grid-cols-3 gap-4 sm:gap-5">
    <div v-for="stat in stats" :key="stat.label" class="min-w-0">
      <dt class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span class="truncate">{{ stat.label }}</span>
        <span
          v-if="warns(stat)"
          :class="[
            'size-1.5 shrink-0 rounded-full bg-amber-500',
            full(stat) && 'ring-3 ring-amber-500/25',
          ]"
          aria-hidden="true"
        />
      </dt>
      <dd class="mt-0.5 truncate text-sm text-muted-foreground tabular-nums">
        <span class="font-medium text-foreground">{{
          formatDecimal(stat.value)
        }}</span>
        of
        <template v-if="stat.max"
          >{{ formatDecimal(stat.max)
          }}{{ stat.unit ? ` ${stat.unit}` : '' }}</template
        >
        <template v-else>∞</template>
        <span class="sr-only">{{ warns(stat) ? ', near the limit' : '' }}</span>
      </dd>
      <div
        :class="[
          'mt-2.5 h-1 overflow-hidden rounded-full',
          stat.max && 'bg-muted-foreground/15',
        ]"
      >
        <div
          v-if="stat.max"
          class="h-full rounded-full bg-foreground/75 transition-[width] duration-700 ease-out motion-reduce:transition-none"
          :style="{ width: fill(stat) }"
        />
        <div v-else class="um-hatch size-full text-muted-foreground/30" />
      </div>
    </div>
  </dl>
</template>

<style scoped>
  .um-hatch {
    background-image: repeating-linear-gradient(
      -45deg,
      currentColor 0 3px,
      transparent 3px 6px
    );
  }
</style>
