<script setup lang="ts">
  import { computed, nextTick, onMounted, ref, watch } from 'vue';
  import {
    useElementVisibility,
    useIntervalFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import SegmentDisplay from '../segment-display/SegmentDisplay.vue';
  import PowerMonitorChart from './PowerMonitorChart.vue';
  import {
    createPowerMonitorDaySeries,
    createPowerMonitorSeries,
    formatReading,
  } from './power-monitor';
  import type {
    PowerMonitorCursor,
    PowerMonitorProps,
    PowerMonitorRange,
    PowerMonitorSeries,
    PowerMonitorSummaryRow,
  } from './types';

  const props = withDefaults(defineProps<PowerMonitorProps>(), {
    title: 'Power now',
    subtitle: undefined,
    status: 'Live',
    solar: 4.82,
    peak: 5.7,
    home: 2.14,
    toBattery: 1.96,
    exportPower: 0.72,
    live: true,
    interval: 3000,
    series: undefined,
    rowsUp: 11,
    rowsDown: 8,
    color: '#ff9a2e',
    homeColor: '#e9e9e9',
    batteryColor: '#4ade80',
    exportColor: '#7ea6ff',
    class: '',
  });

  const range = defineModel<PowerMonitorRange>('range', { default: 'day' });
  const emit = defineEmits<{ cursor: [value: PowerMonitorCursor | null] }>();

  const SAMPLE = createPowerMonitorSeries();
  const FALLBACK = createPowerMonitorDaySeries();
  const allSeries = computed(() => props.series ?? SAMPLE);
  const current = computed<PowerMonitorSeries>(
    () =>
      allSeries.value.find((s) => s.range === range.value) ??
      allSeries.value[0] ??
      FALLBACK,
  );

  // Live readings drift around the props without leaving them.
  const step = ref(0);
  const secondsAgo = ref(2);
  const drift = (seed: number, amount: number): number =>
    1 +
    amount *
      (Math.sin(step.value * 1.7 + seed) * 0.6 +
        Math.sin(step.value * 0.63 + seed * 2.3) * 0.4);

  const liveSolar = computed(() => props.solar * drift(0.4, 0.035));
  const liveHome = computed(() => props.home * drift(2.1, 0.05));
  const surplus = computed(() => Math.max(0, liveSolar.value - liveHome.value));
  const baseSurplus = computed(() =>
    Math.max(0.001, props.toBattery + props.exportPower),
  );
  const liveExport = computed(
    () => (props.exportPower / baseSurplus.value) * surplus.value,
  );
  const liveBattery = computed(() => surplus.value - liveExport.value);

  const root = ref<HTMLElement | null>(null);
  const visible = useElementVisibility(root);

  const ticker = useIntervalFn(
    () => {
      step.value += 1;
      secondsAgo.value = 0;
    },
    () => props.interval,
    { immediate: false },
  );
  const clock = useIntervalFn(
    () => {
      secondsAgo.value += 1;
    },
    1000,
    { immediate: false },
  );

  function syncTimers(): void {
    if (props.live && visible.value) {
      ticker.resume();
      clock.resume();
    } else {
      ticker.pause();
      clock.pause();
    }
  }
  watch([() => props.live, visible], syncTimers);
  onMounted(syncTimers);

  const subtitleText = computed(
    () =>
      props.subtitle ??
      (props.live ? `Live · updated ${secondsAgo.value} s ago` : 'Paused'),
  );

  // The day chart's "now" column follows the live reading.
  const chartSolar = computed(() => {
    const s = current.value;
    if (s.range !== 'day') return s.solar;
    return s.solar.map((v, i) => (i === s.now ? liveSolar.value : v));
  });

  const cursor = ref<number | null>(null);
  watch(range, () => {
    cursor.value = null;
  });

  const inspecting = computed(() => cursor.value !== null);
  const bigValue = computed(() => {
    if (cursor.value === null) return liveSolar.value;
    return chartSolar.value[cursor.value] ?? 0;
  });
  const bigUnit = computed(() =>
    cursor.value === null ? 'kW' : current.value.unit,
  );
  const bigLabel = computed(() => {
    if (cursor.value === null) return 'Solar producing';
    const label = current.value.columnLabels[cursor.value] ?? '';
    return cursor.value > current.value.now
      ? `Forecast · ${label}`
      : `Solar · ${label}`;
  });
  const peakText = computed(() => {
    if (current.value.range === 'day') return `Peak ${props.peak} kW`;
    const max = Math.max(...current.value.solar);
    return `Peak ${formatReading(max)} ${current.value.unit}`;
  });

  watch(cursor, (index) => {
    if (index === null) {
      emit('cursor', null);
      return;
    }
    const s = current.value;
    emit('cursor', {
      index,
      label: s.columnLabels[index] ?? '',
      solar: chartSolar.value[index] ?? 0,
      home: s.home[index] ?? 0,
      forecast: index > s.now,
    });
  });

  const readings = computed(() => [
    { label: 'Home', value: liveHome.value, color: props.homeColor },
    {
      label: 'To battery',
      value: liveBattery.value,
      color: props.batteryColor,
    },
    { label: 'Export', value: liveExport.value, color: props.exportColor },
  ]);

  const summary = computed(() =>
    current.value.summary.map((row: PowerMonitorSummaryRow, i: number) => ({
      ...row,
      color: row.color || (i === 1 ? props.homeColor : props.color),
    })),
  );

  // Segmented control with a sliding pill.
  const tabs = ref<HTMLButtonElement[]>([]);
  const tabList = ref<HTMLElement | null>(null);
  const pill = ref({ left: 0, width: 0 });
  const activeIndex = computed(() =>
    Math.max(
      0,
      allSeries.value.findIndex((s) => s.range === range.value),
    ),
  );

  function measurePill(): void {
    const el = tabs.value[activeIndex.value];
    if (!el) return;
    pill.value = { left: el.offsetLeft, width: el.offsetWidth };
  }
  useResizeObserver(tabList, measurePill);
  watch(activeIndex, () => nextTick(measurePill));
  onMounted(measurePill);

  function select(value: PowerMonitorRange): void {
    range.value = value;
  }

  function onTabKeydown(event: KeyboardEvent): void {
    const count = allSeries.value.length;
    let next = activeIndex.value;
    if (event.key === 'ArrowRight') next = (next + 1) % count;
    else if (event.key === 'ArrowLeft') next = (next - 1 + count) % count;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    else return;
    event.preventDefault();
    const target = allSeries.value[next];
    if (!target) return;
    range.value = target.range;
    nextTick(() => tabs.value[next]?.focus());
  }
</script>

<template>
  <article
    ref="root"
    :class="
      cn(
        'flex w-full max-w-88 flex-col gap-3.5 rounded-[1.75rem] border border-border bg-card p-3 text-card-foreground shadow-[0_24px_48px_-20px_rgb(0_0_0/0.25)] dark:border-white/8 dark:bg-[#1c1c1e] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_24px_48px_-16px_rgb(0_0_0/0.7)]',
        props.class,
      )
    "
    :style="{ '--pm-accent': props.color }"
  >
    <header class="flex items-center gap-3 px-1.5 pt-1.5">
      <span
        class="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.6)] dark:border-white/8 dark:bg-linear-to-b dark:from-[#2e2e30] dark:to-[#1f1f21] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_2px_6px_rgb(0_0_0/0.5)]"
      >
        <Icon name="lucide:sun" class="size-4.5" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-[15px]/tight font-medium">{{ props.title }}</p>
        <p class="truncate text-sm/tight text-muted-foreground tabular-nums">
          {{ subtitleText }}
        </p>
      </div>
      <span
        class="flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-sm/none text-muted-foreground dark:border-white/6 dark:bg-black/30"
      >
        <span
          class="size-1.5 rounded-full bg-(--pm-accent) shadow-[0_0_6px_var(--pm-accent)]"
          :class="props.live ? 'motion-safe:animate-pulse' : ''"
        />
        {{ props.status }}
      </span>
    </header>

    <section
      class="rounded-[1.25rem] border border-black/40 bg-[#0d0d0d] px-3.5 pt-3.5 pb-3 text-white shadow-[inset_0_2px_10px_rgb(0_0_0/0.8),0_1px_0_rgb(255_255_255/0.05)] dark:border-white/6"
      aria-label="Live power"
    >
      <div
        class="flex items-baseline justify-between text-sm tracking-wider text-(--pm-accent)/65"
      >
        <span class="uppercase">{{ bigLabel }}</span>
        <span class="tracking-normal tabular-nums">{{ peakText }}</span>
      </div>
      <div class="mt-2 flex items-end gap-2">
        <SegmentDisplay
          :value="formatReading(bigValue)"
          :digits="3"
          :color="
            inspecting && (cursor ?? 0) > current.now
              ? `color-mix(in oklab, ${props.color} 55%, black)`
              : props.color
          "
          :label="`${formatReading(bigValue)} ${bigUnit}`"
          class="text-6xl"
        />
        <span class="pb-1 text-base text-(--pm-accent)/80">{{ bigUnit }}</span>
      </div>
      <div class="mt-3 grid grid-cols-3 gap-2">
        <div v-for="item in readings" :key="item.label" class="min-w-0">
          <p
            class="truncate text-sm tracking-wider text-(--pm-accent)/60 uppercase"
          >
            {{ item.label }}
          </p>
          <p class="mt-1 flex items-end gap-1.5">
            <SegmentDisplay
              :value="item.value.toFixed(2)"
              :digits="3"
              :color="item.color"
              class="text-xl"
            />
            <span class="text-sm/none text-white/45">kW</span>
          </p>
        </div>
      </div>
      <PowerMonitorChart
        v-model:cursor="cursor"
        class="mt-3"
        :solar="chartSolar"
        :home="current.home"
        :column-labels="current.columnLabels"
        :ticks="current.ticks"
        :now="current.now"
        :reveal-key="current.range"
        :rows-up="props.rowsUp"
        :rows-down="props.rowsDown"
        :color="props.color"
        :home-color="props.homeColor"
      />
    </section>

    <div class="flex items-center justify-between gap-2 px-0.5">
      <div
        ref="tabList"
        role="tablist"
        aria-label="Chart range"
        class="relative flex rounded-full border border-border bg-muted p-1 dark:border-white/6 dark:bg-black/35 dark:shadow-[inset_0_1px_3px_rgb(0_0_0/0.6)]"
      >
        <span
          class="absolute inset-y-1 rounded-full bg-background shadow-sm transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none dark:bg-[#3a3a3c] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_2px_6px_rgb(0_0_0/0.5)]"
          :style="{ left: `${pill.left}px`, width: `${pill.width}px` }"
          aria-hidden="true"
        />
        <button
          v-for="s in allSeries"
          :key="s.range"
          ref="tabs"
          type="button"
          role="tab"
          :aria-selected="s.range === range"
          :tabindex="s.range === range ? 0 : -1"
          :class="[
            'relative rounded-full px-3 py-1.5 text-sm/none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-(--pm-accent)/70',
            s.range === range
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="select(s.range)"
          @keydown="onTabKeydown"
        >
          {{ s.label }}
        </button>
      </div>
      <span class="truncate text-sm text-muted-foreground tabular-nums">
        {{ current.date }}
      </span>
    </div>

    <ul class="flex flex-col gap-2.5 px-2 pb-2">
      <li
        v-for="row in summary"
        :key="row.label"
        class="flex items-center gap-2.5 text-sm"
      >
        <span
          class="size-2 shrink-0 rounded-[2px] ring-1 ring-black/25 dark:ring-2 dark:ring-black/60"
          :style="{
            backgroundColor: row.dim
              ? `color-mix(in oklab, ${row.color} 40%, black)`
              : row.color,
            boxShadow: row.dim ? undefined : `0 0 6px ${row.color}`,
          }"
        />
        <span class="flex-1 truncate text-muted-foreground">{{
          row.label
        }}</span>
        <span
          class="tabular-nums"
          :class="row.dim ? 'text-muted-foreground' : 'text-foreground'"
        >
          {{ row.value }}
        </span>
      </li>
    </ul>
  </article>
</template>
