<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import type { UsageMeterBarsProps } from './types';
  import { formatCount } from './usage-meter';

  const props = defineProps<UsageMeterBarsProps>();

  const active = ref(-1);

  const used = computed(() => props.days.filter((day) => !day.future));
  const peak = computed(() =>
    used.value.reduce((max, day) => Math.max(max, day.value), 0),
  );
  const average = computed(() => {
    if (used.value.length === 0) return 0;
    const sum = used.value.reduce((total, day) => total + day.value, 0);
    return Math.round(sum / used.value.length);
  });
  const activeDay = computed(() => props.days[active.value]);
  const dense = computed(() => props.days.length > 12);
  const accentStyle = computed(() => ({
    '--um-accent': props.accent,
    '--um-accent-dark': props.accentDark,
  }));

  watch(
    () => props.rangeKey,
    () => {
      active.value = -1;
    },
  );

  function heightOf(value: number): string {
    if (peak.value <= 0) return '0%';
    return `${Math.max(12, (value / peak.value) * 100)}%`;
  }

  function onEnter(index: number): void {
    const day = props.days[index];
    active.value = day && !day.future ? index : -1;
  }

  function onLeave(): void {
    active.value = -1;
  }

  function step(direction: number): void {
    const last = used.value.length - 1;
    if (last < 0) return;
    const start =
      active.value < 0 ? (direction > 0 ? -1 : last + 1) : active.value;
    active.value = Math.min(last, Math.max(0, start + direction));
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') step(1);
    else if (event.key === 'ArrowLeft') step(-1);
    else if (event.key === 'Home') active.value = 0;
    else if (event.key === 'End') active.value = used.value.length - 1;
    else if (event.key === 'Escape') active.value = -1;
    else return;
    event.preventDefault();
  }
</script>

<template>
  <div :style="accentStyle">
    <div
      class="flex items-baseline justify-between text-xs text-muted-foreground"
    >
      <span>Per day</span>
      <span aria-live="polite" class="tabular-nums">
        <template v-if="activeDay">
          {{ activeDay.label }} ·
          <span class="font-medium text-foreground">{{
            formatCount(activeDay.value)
          }}</span>
          {{ unit }}
        </template>
        <template v-else>
          Avg
          <span class="font-medium text-foreground">{{
            formatCount(average)
          }}</span>
          / day
        </template>
      </span>
    </div>
    <div
      role="group"
      tabindex="0"
      aria-label="Usage per day. Use the arrow keys to read each day."
      class="mt-2.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      @keydown="onKeydown"
      @mouseleave="onLeave"
      @blur="onLeave"
    >
      <div
        :key="rangeKey"
        :class="['flex h-9 items-end', dense ? 'gap-0.5' : 'gap-1.5']"
      >
        <div
          v-for="(day, index) in days"
          :key="index"
          class="flex h-full flex-1 items-end"
          @mouseenter="onEnter(index)"
        >
          <div
            v-if="day.future"
            class="h-0.5 w-full rounded-full bg-muted-foreground/15"
          />
          <div
            v-else
            :class="[
              'um-bar w-full rounded-[3px] transition-colors duration-150',
              index === active
                ? 'bg-(--um-accent) dark:bg-(--um-accent-dark)'
                : 'bg-muted-foreground/20 dark:bg-muted-foreground/25',
            ]"
            :style="{
              height: heightOf(day.value),
              animationDelay: `${index * 14}ms`,
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .um-bar {
    transform-origin: bottom;
    animation: um-grow 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes um-grow {
    from {
      transform: scaleY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .um-bar {
      animation: none;
    }
  }
</style>
