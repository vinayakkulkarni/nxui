<script setup lang="ts">
  import { useElementHover } from '@vueuse/core';
  import type { ContributionDay } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      username?: string;
      year?: number;
      colorScheme?: 'green' | 'blue' | 'purple';
      class?: string;
    }>(),
    {
      username: 'vinayakkulkarni',
      year: () => new Date().getFullYear(),
      colorScheme: 'green',
      class: '',
    },
  );

  const colorMap: Record<string, string[]> = {
    green: ['bg-neutral-800', 'bg-green-900', 'bg-green-700', 'bg-green-500', 'bg-green-300'],
    blue: ['bg-neutral-800', 'bg-blue-900', 'bg-blue-700', 'bg-blue-500', 'bg-blue-300'],
    purple: ['bg-neutral-800', 'bg-purple-900', 'bg-purple-700', 'bg-purple-500', 'bg-purple-300'],
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const contributions = computed<ContributionDay[]>(() => {
    const days: ContributionDay[] = [];
    const start = new Date(props.year, 0, 1);
    const end = new Date(props.year, 11, 31);
    const current = new Date(start);

    while (current <= end) {
      const rand = Math.random();
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (rand > 0.7) level = 1;
      if (rand > 0.8) level = 2;
      if (rand > 0.9) level = 3;
      if (rand > 0.95) level = 4;

      days.push({
        date: current.toISOString().split('T')[0],
        count: level * Math.ceil(Math.random() * 5),
        level,
      });
      current.setDate(current.getDate() + 1);
    }
    return days;
  });

  const weeks = computed(() => {
    const result: ContributionDay[][] = [];
    let week: ContributionDay[] = [];
    const startDay = new Date(props.year, 0, 1).getDay();

    for (let i = 0; i < startDay; i++) {
      week.push({ date: '', count: 0, level: 0 });
    }

    for (const day of contributions.value) {
      week.push(day);
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
    }
    if (week.length > 0) result.push(week);
    return result;
  });

  const colors = computed(() => colorMap[props.colorScheme] ?? colorMap.green);
</script>

<template>
  <div :class="cn('overflow-x-auto', props.class)">
    <div class="mb-1 flex gap-[3px] pl-8 text-[10px] text-muted-foreground">
      <span
        v-for="(month, i) in months"
        :key="month"
        :style="{ width: `${(weeks.length / 12) * 13}px` }"
      >
        {{ month }}
      </span>
    </div>
    <div class="flex gap-[3px]">
      <div class="flex flex-col gap-[3px] pr-1 text-[10px] text-muted-foreground">
        <span class="h-[13px]" ></span>
        <span class="h-[13px] leading-[13px]">Mon</span>
        <span class="h-[13px]" ></span>
        <span class="h-[13px] leading-[13px]">Wed</span>
        <span class="h-[13px]" ></span>
        <span class="h-[13px] leading-[13px]">Fri</span>
        <span class="h-[13px]" ></span>
      </div>
      <div v-for="(week, wi) in weeks" :key="wi" class="flex flex-col gap-[3px]">
        <div
          v-for="(day, di) in week"
          :key="di"
          class="size-[13px] rounded-sm transition-colors"
          :class="day.date ? colors[day.level] : 'bg-transparent'"
          :title="day.date ? `${day.date}: ${day.count} contributions` : ''"
        ></div>
      </div>
    </div>
  </div>
</template>
