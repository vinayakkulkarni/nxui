<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { cn } from '~/lib/utils';
  import SelfPoweredGaugeMeter from './SelfPoweredGaugeMeter.vue';
  import { splitPercent } from './self-powered-gauge';
  import type {
    SelfPoweredDay,
    SelfPoweredGaugeProps,
    SelfPoweredSource,
  } from './types';

  const props = withDefaults(defineProps<SelfPoweredGaugeProps>(), {
    value: 86,
    title: 'Self-powered',
    subtitle: 'Today, so far',
    badge: '+9 pts',
    label: 'Self-powered',
    zoneFrom: 80,
    sources: () => [
      { label: 'Solar, direct', value: 7.2, color: '#ff9a2e' },
      { label: 'Battery', value: 2.9, color: '#4ade80' },
      { label: 'Grid', value: 1.7, color: '#7ea6ff' },
    ],
    unit: 'kWh',
    sourcesLabel: 'Where it came from',
    history: () => [
      { label: 'F', name: 'Friday', value: 72 },
      { label: 'S', name: 'Saturday', value: 88 },
      { label: 'S', name: 'Sunday', value: 87 },
      { label: 'M', name: 'Monday', value: 68 },
      { label: 'T', name: 'Tuesday', value: 79 },
      { label: 'W', name: 'Wednesday', value: 80 },
      { label: 'T', name: 'Thursday', value: 86 },
    ],
    historyLabel: 'Last 7 days',
    segments: 10,
    jitter: 0.5,
    color: '#ff9a2e',
    class: '',
  });

  const emit = defineEmits<{ 'day-hover': [day: SelfPoweredDay | null] }>();

  const total = computed(() =>
    props.sources.reduce((sum, s) => sum + s.value, 0),
  );
  const percents = computed(() =>
    splitPercent(props.sources.map((s) => s.value)),
  );
  const activeSource = ref<number | null>(null);

  function sourceOpacity(i: number): number {
    return activeSource.value === null || activeSource.value === i ? 1 : 0.3;
  }
  function highlight(i: number): void {
    activeSource.value = i;
  }
  function clearHighlight(): void {
    activeSource.value = null;
  }

  function formatSource(s: SelfPoweredSource, i: number): string {
    return `${s.value.toFixed(1)} ${props.unit} · ${percents.value[i] ?? 0} %`;
  }

  // Today follows the live value.
  const days = computed(() =>
    props.history.map((d, i) =>
      i === props.history.length - 1 ? { ...d, value: props.value } : d,
    ),
  );
  const average = computed(() => {
    if (days.value.length === 0) return 0;
    const sum = days.value.reduce((acc, d) => acc + d.value, 0);
    return Math.round(sum / days.value.length);
  });
  const segmentRows = computed(() =>
    Array.from({ length: props.segments }, (_, i) => props.segments - 1 - i),
  );

  const hoveredDay = ref<number | null>(null);
  const historyText = computed(() => {
    const day =
      hoveredDay.value === null ? undefined : days.value[hoveredDay.value];
    if (!day) return `avg ${average.value} %`;
    return `${day.name ?? day.label} · ${Math.round(day.value)} %`;
  });

  function lit(day: SelfPoweredDay): number {
    return Math.round(
      (Math.min(100, Math.max(0, day.value)) / 100) * props.segments,
    );
  }

  function enterDay(i: number): void {
    hoveredDay.value = i;
    emit('day-hover', days.value[i] ?? null);
  }
  function leaveDay(): void {
    hoveredDay.value = null;
    emit('day-hover', null);
  }

  function segmentColor(dayIndex: number, row: number, count: number): string {
    if (row >= count) return '';
    const today = dayIndex === days.value.length - 1;
    const hovered = hoveredDay.value === dayIndex;
    if (today || hovered) return props.color;
    return 'color-mix(in oklab, var(--spg-accent) 60%, var(--spg-mix))';
  }
</script>

<template>
  <article
    :class="
      cn(
        'flex w-full max-w-88 flex-col gap-4 rounded-[1.75rem] [--spg-mix:#ffffff] dark:[--spg-mix:#1c1c1e] border border-border bg-card p-3 text-card-foreground shadow-[0_24px_48px_-20px_rgb(0_0_0/0.25)] dark:border-white/8 dark:bg-[#1c1c1e] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_24px_48px_-16px_rgb(0_0_0/0.7)]',
        props.class,
      )
    "
    :style="{ '--spg-accent': props.color }"
  >
    <header class="flex items-center gap-3 px-1.5 pt-1.5">
      <span
        class="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.6)] dark:border-white/8 dark:bg-linear-to-b dark:from-[#2e2e30] dark:to-[#1f1f21] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_2px_6px_rgb(0_0_0/0.5)]"
      >
        <Icon name="lucide:gauge" class="size-4.5" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-[15px]/tight font-medium">{{ props.title }}</p>
        <p class="truncate text-sm/tight text-muted-foreground">
          {{ props.subtitle }}
        </p>
      </div>
      <span
        v-if="props.badge"
        class="rounded-full border border-border bg-muted px-2.5 py-1 text-sm/none text-muted-foreground tabular-nums dark:border-white/6 dark:bg-black/30"
      >
        {{ props.badge }}
      </span>
    </header>

    <SelfPoweredGaugeMeter
      :value="props.value"
      :zone-from="props.zoneFrom"
      :label="props.label"
      :jitter="props.jitter"
      :color="props.color"
    />

    <section class="flex flex-col gap-3 px-2" :aria-label="props.sourcesLabel">
      <div class="flex items-baseline justify-between text-sm">
        <span class="text-muted-foreground">{{ props.sourcesLabel }}</span>
        <span class="font-medium tabular-nums">
          {{ total.toFixed(1) }} {{ props.unit }}
        </span>
      </div>
      <div
        class="flex gap-1 rounded-full border border-border bg-muted p-1 dark:border-white/6 dark:bg-black/45 dark:shadow-[inset_0_1px_3px_rgb(0_0_0/0.7)]"
        aria-hidden="true"
      >
        <span
          v-for="(s, i) in props.sources"
          :key="s.label"
          class="h-3.5 min-w-2 rounded-full shadow-[inset_0_1px_0_rgb(255_255_255/0.35)] transition-[flex-grow,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          :style="{
            flexGrow: s.value,
            flexBasis: 0,
            backgroundColor: s.color,
            opacity: sourceOpacity(i),
          }"
          @mouseenter="highlight(i)"
          @mouseleave="clearHighlight"
        />
      </div>
      <ul class="flex flex-col gap-1.5">
        <li
          v-for="(s, i) in props.sources"
          :key="s.label"
          class="flex items-center gap-2.5 text-sm transition-opacity duration-200"
          :style="{
            opacity: activeSource === null || activeSource === i ? 1 : 0.45,
          }"
          @mouseenter="highlight(i)"
          @mouseleave="clearHighlight"
        >
          <span
            class="size-2 shrink-0 rounded-[2px] ring-1 ring-black/25 dark:ring-2 dark:ring-black/60"
            :style="{
              backgroundColor: s.color,
              boxShadow: `0 0 6px ${s.color}`,
            }"
          />
          <span class="flex-1 truncate text-muted-foreground">{{
            s.label
          }}</span>
          <span class="tabular-nums">{{ formatSource(s, i) }}</span>
        </li>
      </ul>
    </section>

    <section
      class="flex flex-col gap-3 px-2 pb-2"
      :aria-label="props.historyLabel"
    >
      <div class="flex items-baseline justify-between text-sm">
        <span class="text-muted-foreground">{{ props.historyLabel }}</span>
        <span class="font-medium tabular-nums" aria-live="polite">
          {{ historyText }}
        </span>
      </div>
      <div
        class="grid gap-3"
        :style="{
          gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
        }"
        @mouseleave="leaveDay"
      >
        <button
          v-for="(day, i) in days"
          :key="i"
          type="button"
          class="group flex flex-col items-stretch gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-(--spg-accent)/70 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          :aria-label="`${day.name ?? day.label}: ${Math.round(day.value)} %`"
          @mouseenter="enterDay(i)"
          @focus="enterDay(i)"
          @blur="leaveDay"
        >
          <span class="flex flex-col gap-0.5">
            <span
              v-for="row in segmentRows"
              :key="row"
              class="h-1.25 rounded-[1px] bg-black/8 transition-[background-color,box-shadow] duration-300 dark:bg-white/7"
              :style="
                row < lit(day)
                  ? {
                      backgroundColor: segmentColor(i, row, lit(day)),
                      boxShadow:
                        i === days.length - 1 || hoveredDay === i
                          ? `0 0 6px color-mix(in oklab, ${props.color} 60%, transparent)`
                          : undefined,
                    }
                  : undefined
              "
            />
          </span>
          <span
            class="text-center text-sm/none"
            :class="
              i === days.length - 1 || hoveredDay === i
                ? 'font-semibold text-foreground'
                : 'text-muted-foreground'
            "
          >
            {{ day.label }}
          </span>
        </button>
      </div>
    </section>
  </article>
</template>
