<script setup lang="ts">
  import { motion, AnimatePresence } from 'motion-v';
  import type {
    GithubContributionDay,
    GithubCalendarColorSchema,
  } from '~/types/components';
  import { cn } from '~/lib/utils';
  import {
    getLevelClass,
    getShapeClass,
    getGlowColor,
  } from './github-calendar-utils';

  const props = defineProps<{
    weeks: GithubContributionDay[][];
    variant: 'default' | 'city-lights' | 'minimal';
    shape: string;
    glowIntensity: number;
    colorSchema: GithubCalendarColorSchema;
  }>();

  const hoveredDate = ref<string | null>(null);
  const hoveredCount = ref<number | null>(null);
  const mousePos = ref({ x: 0, y: 0 });

  function handleCellHover(day: GithubContributionDay, e: MouseEvent) {
    hoveredDate.value = day.date;
    hoveredCount.value = day.contributionCount;
    const target = e.currentTarget as HTMLElement;
    const parent = target.offsetParent as HTMLElement;
    if (!parent) return;
    const rect = target.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    mousePos.value = {
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top - parentRect.top,
    };
  }

  function clearHover() {
    hoveredDate.value = null;
    hoveredCount.value = null;
  }

  function getCellGlow(level: string, count: number) {
    if (props.variant !== 'city-lights' || level === 'NONE') return undefined;
    const size = count > 3 ? props.glowIntensity * 1.5 : props.glowIntensity;
    return { boxShadow: `0 0 ${size}px ${getGlowColor(props.colorSchema)}` };
  }
</script>

<template>
  <div
    class="relative flex flex-nowrap gap-[3px] w-max max-w-full"
    @mouseleave="clearHover"
  >
    <AnimatePresence>
      <component
        :is="motion.div"
        v-if="hoveredDate"
        :initial="{ opacity: 0, y: 10, scale: 0.9 }"
        :animate="{ opacity: 1, y: 0, scale: 1 }"
        :exit="{ opacity: 0, y: 5, scale: 0.9 }"
        :transition="{ duration: 0.2 }"
        class="absolute z-50 pointer-events-none px-3 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs rounded-md shadow-xl whitespace-nowrap"
        :style="{
          left: `${mousePos.x}px`,
          top: `${mousePos.y - 40}px`,
          transform: 'translateX(-50%)',
        }"
      >
        <span class="font-bold mr-1">{{ hoveredCount }}</span>
        <span class="text-zinc-400 dark:text-zinc-500"
          >contributions on {{ hoveredDate }}</span
        >
      </component>
    </AnimatePresence>
    <div
      v-for="(week, weekIndex) in weeks"
      :key="weekIndex"
      class="flex flex-col gap-[3px] w-[14px]"
    >
      <component
        :is="motion.div"
        v-for="(day, dayIndex) in week"
        :key="day.date"
        :initial="{ opacity: 0, scale: 0 }"
        :animate="{ opacity: 1, scale: 1 }"
        :transition="{
          delay: weekIndex * 0.01 + dayIndex * 0.01,
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }"
        :class="
          cn(
            'w-full aspect-square transition-colors duration-200',
            getLevelClass(day.contributionLevel, colorSchema),
            variant === 'city-lights' && day.contributionCount > 0 && 'z-10',
            getShapeClass(shape),
            variant === 'minimal' && 'rounded-full scale-75',
          )
        "
        :style="getCellGlow(day.contributionLevel, day.contributionCount)"
        @mouseenter="handleCellHover(day, $event)"
      />
    </div>
  </div>
</template>
