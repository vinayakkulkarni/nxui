<script setup lang="ts">
  import { computed, ref, useId, useTemplateRef } from 'vue';
  import { onClickOutside, onKeyStroke } from '@vueuse/core';
  import { clockAt, formatStamp, parseStamp } from './downtime-time';
  import type {
    DowntimeAxisLabel,
    DowntimeBar,
    DowntimeLogProps,
    DowntimeParsedTime,
    DowntimeReason,
    DowntimeSort,
    DowntimeStop,
    DowntimeTick,
    DowntimeTrack,
  } from './types';

  const props = withDefaults(defineProps<DowntimeLogProps>(), {
    machines: () => [],
    title: 'Downtime Log',
    period: 'this week',
    threshold: 30,
    windowHours: 24,
    axisStep: 6,
    tickMinutes: 20,
    visibleRows: 5,
    class: '',
  });

  const emit = defineEmits<{
    export: [stops: DowntimeStop[]];
    assign: [stops: DowntimeStop[]];
  }>();

  const selected = defineModel<string[]>('selected', { default: () => [] });
  const hiddenReasons = defineModel<string[]>('hiddenReasons', {
    default: () => [],
  });
  const sort = defineModel<DowntimeSort>('sort', { default: 'newest' });

  const SORTS: DowntimeSort[] = ['newest', 'oldest', 'longest'];
  const SORT_LABELS: Record<DowntimeSort, string> = {
    newest: 'Newest',
    oldest: 'Oldest',
    longest: 'Longest',
  };
  const FALLBACK_COLOR = '#8a8a8a';

  const reasonMap = computed(
    () => new Map(props.reasons.map((reason) => [reason.value, reason])),
  );

  function reasonOf(stop: DowntimeStop): DowntimeReason | undefined {
    return reasonMap.value.get(stop.reason);
  }

  function colorOf(stop: DowntimeStop): string {
    return reasonOf(stop)?.color ?? FALLBACK_COLOR;
  }

  const times = computed(
    () =>
      new Map<string, DowntimeParsedTime>(
        props.stops.map((stop) => [stop.id, parseStamp(stop.startedAt)]),
      ),
  );

  function startOf(stop: DowntimeStop): number {
    return times.value.get(stop.id)?.total ?? 0;
  }

  function stampOf(stop: DowntimeStop): string {
    const time = times.value.get(stop.id);
    return time ? formatStamp(time) : stop.startedAt;
  }

  // Filtering and sorting
  const hiddenSet = computed(() => new Set(hiddenReasons.value));
  const activeFilterCount = computed(
    () =>
      props.reasons.filter((reason) => hiddenSet.value.has(reason.value))
        .length,
  );

  const rows = computed(() => {
    const visible = props.stops.filter(
      (stop) => !hiddenSet.value.has(stop.reason),
    );
    const mode = sort.value;
    return visible.sort((a, b) => {
      if (mode === 'longest') return b.minutes - a.minutes;
      if (mode === 'oldest') return startOf(a) - startOf(b);
      return startOf(b) - startOf(a);
    });
  });

  function cycleSort(): void {
    const index = SORTS.indexOf(sort.value);
    sort.value = SORTS[(index + 1) % SORTS.length] ?? 'newest';
  }

  const filterOpen = ref(false);
  const filterWrap = useTemplateRef<HTMLElement>('filterWrap');
  const filterId = useId();

  onClickOutside(filterWrap, () => {
    filterOpen.value = false;
  });
  onKeyStroke('Escape', () => {
    filterOpen.value = false;
  });

  function toggleReason(value: string): void {
    hiddenReasons.value = hiddenSet.value.has(value)
      ? hiddenReasons.value.filter((item) => item !== value)
      : [...hiddenReasons.value, value];
  }

  function showAllReasons(): void {
    hiddenReasons.value = [];
  }

  // Selection
  const selectedSet = computed(() => new Set(selected.value));
  const selectedStops = computed(() =>
    props.stops.filter((stop) => selectedSet.value.has(stop.id)),
  );
  const selectedMinutes = computed(() =>
    selectedStops.value.reduce((sum, stop) => sum + stop.minutes, 0),
  );
  const visibleSelectedCount = computed(
    () => rows.value.filter((stop) => selectedSet.value.has(stop.id)).length,
  );
  const masterState = computed<boolean | 'mixed'>(() => {
    if (visibleSelectedCount.value === 0) return false;
    if (visibleSelectedCount.value === rows.value.length) return true;
    return 'mixed';
  });

  function toggle(id: string): void {
    selected.value = selectedSet.value.has(id)
      ? selected.value.filter((item) => item !== id)
      : [...selected.value, id];
    activeId.value = id;
  }

  function toggleAll(): void {
    const visibleIds = new Set(rows.value.map((stop) => stop.id));
    if (masterState.value === true) {
      selected.value = selected.value.filter((id) => !visibleIds.has(id));
      return;
    }
    const next = new Set(selected.value);
    for (const id of visibleIds) next.add(id);
    selected.value = [...next];
  }

  function onRowKey(event: KeyboardEvent, id: string): void {
    const target = event.currentTarget;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle(id);
      return;
    }
    if (!(target instanceof HTMLElement)) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const sibling =
        event.key === 'ArrowDown'
          ? target.nextElementSibling
          : target.previousElementSibling;
      if (sibling instanceof HTMLElement) sibling.focus();
    }
  }

  // Row ↔ timeline linking
  const hoveredId = ref<string | null>(null);
  const activeId = ref<string | null>(selected.value[0] ?? null);
  const highlightId = computed(() => hoveredId.value ?? activeId.value);
  const highlightMachine = computed(
    () =>
      props.stops.find((stop) => stop.id === highlightId.value)?.machine ?? '',
  );

  function hover(id: string): void {
    hoveredId.value = id;
  }

  function unhover(): void {
    hoveredId.value = null;
  }

  function focusRow(id: string): void {
    activeId.value = id;
  }

  // Timeline
  const nowTime = computed(() => parseStamp(props.now));
  const windowEnd = computed(() => nowTime.value.total);
  const windowStart = computed(() => {
    const raw = windowEnd.value - props.windowHours * 60;
    return Math.floor(raw / 60) * 60;
  });
  const span = computed(() => Math.max(windowEnd.value - windowStart.value, 1));

  function percentAt(total: number): number {
    return ((total - windowStart.value) / span.value) * 100;
  }

  const tickTimes = computed(() => {
    const step = Math.max(props.tickMinutes, 1);
    const list: number[] = [];
    for (let t = windowStart.value; t <= windowEnd.value; t += step) {
      list.push(t);
    }
    return list;
  });

  const tickHalf = computed(
    () => ((Math.max(props.tickMinutes, 1) / span.value) * 100) / 2,
  );

  const machineList = computed(() => {
    if (props.machines.length) return props.machines;
    return [...new Set(props.stops.map((stop) => stop.machine))];
  });

  function ticksCovered(start: number, end: number): number[] {
    const step = Math.max(props.tickMinutes, 1);
    const from =
      windowStart.value + Math.floor((start - windowStart.value) / step) * step;
    const covered = tickTimes.value.filter((t) => t >= from && t <= end);
    if (covered.length) return covered;
    const nearest = tickTimes.value.reduce<number | null>(
      (best, t) =>
        best === null || Math.abs(t - start) < Math.abs(best - start)
          ? t
          : best,
      null,
    );
    return nearest === null ? [] : [nearest];
  }

  const tracks = computed<DowntimeTrack[]>(() =>
    machineList.value.map((machine) => {
      const used = new Set<number>();
      const bars: DowntimeBar[] = [];
      for (const stop of rows.value) {
        if (stop.machine !== machine) continue;
        const start = startOf(stop);
        const end = Math.min(start + stop.minutes, windowEnd.value);
        if (end < windowStart.value || start > windowEnd.value) continue;
        const covered = ticksCovered(Math.max(start, windowStart.value), end);
        const first = covered[0];
        const last = covered.at(-1);
        if (first === undefined || last === undefined) continue;
        for (const t of covered) used.add(t);
        const left = percentAt(first) - tickHalf.value;
        const width = percentAt(last) - percentAt(first) + tickHalf.value * 2;
        const ticks: DowntimeTick[] = covered.map((t) => ({
          key: `${stop.id}-${t}`,
          left: ((percentAt(t) - left) / width) * 100,
        }));
        bars.push({ stop, color: colorOf(stop), left, width, ticks });
      }
      const ticks: DowntimeTick[] = tickTimes.value
        .filter((t) => !used.has(t))
        .map((t) => ({ key: `${machine}-${t}`, left: percentAt(t) }));
      return { machine, ticks, bars };
    }),
  );

  const axisLabels = computed<DowntimeAxisLabel[]>(() => {
    const step = Math.max(props.axisStep, 1) * 60;
    const list: DowntimeAxisLabel[] = [];
    // Keep the last label clear of the "now" marker.
    for (
      let t = windowStart.value;
      t <= windowEnd.value - step / 3;
      t += step
    ) {
      list.push({ label: clockAt(t), left: percentAt(t) });
    }
    return list;
  });

  const nowLabel = computed(() =>
    clockAt(nowTime.value.hour * 60 + nowTime.value.minute),
  );

  function barStyle(bar: DowntimeBar): Record<string, string> {
    return { left: `${bar.left}%`, width: `${bar.width}%` };
  }

  function barTickStyle(
    bar: DowntimeBar,
    tick: DowntimeTick,
  ): Record<string, string> {
    const lit = highlightId.value === bar.stop.id;
    return {
      left: `${tick.left}%`,
      backgroundColor: bar.color,
      boxShadow: lit ? `0 0 8px ${bar.color}` : 'none',
    };
  }

  function barClass(bar: DowntimeBar): string {
    if (hoveredId.value === null) return 'opacity-100';
    return hoveredId.value === bar.stop.id ? 'opacity-100' : 'opacity-35';
  }

  function barLabel(bar: DowntimeBar): string {
    const reason = reasonOf(bar.stop)?.label ?? bar.stop.reason;
    return `${bar.stop.machine}: ${reason} at ${stampOf(bar.stop)}, ${bar.stop.minutes} min`;
  }

  function rowLabel(stop: DowntimeStop): string {
    const reason = reasonOf(stop)?.label ?? stop.reason;
    return `${stampOf(stop)}, ${reason}, ${stop.minutes} min, ${stop.machine}`;
  }

  const listStyle = computed(() => ({
    maxHeight: `${props.visibleRows * 2.75}rem`,
  }));

  function onExport(): void {
    emit('export', rows.value);
  }

  function onAssign(): void {
    emit('assign', selectedStops.value);
  }
</script>

<template>
  <section
    :class="[
      'w-full max-w-90 rounded-3xl border bg-card p-2 text-card-foreground shadow-sm dark:border-white/6 dark:bg-muted',
      props.class,
    ]"
    :aria-label="props.title"
  >
    <header class="flex items-start justify-between gap-3 px-3 pt-3 pb-4">
      <div class="min-w-0">
        <h3 class="text-base/snug font-medium">{{ props.title }}</h3>
        <p class="text-sm text-muted-foreground">
          {{ props.stops.length }} stops · {{ props.period }}
        </p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-xl border bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring dark:border-transparent dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        @click="onExport"
      >
        Export
      </button>
    </header>

    <div class="rounded-2xl bg-muted/60 p-2 dark:bg-black/20">
      <div class="grid grid-cols-2 gap-2">
        <div ref="filterWrap" class="relative">
          <button
            type="button"
            :aria-expanded="filterOpen"
            :aria-controls="filterId"
            aria-haspopup="menu"
            class="flex h-10 w-full items-center gap-2 rounded-xl bg-black/5 px-3 text-sm transition-colors hover:bg-black/8 focus-visible:outline-2 focus-visible:outline-ring dark:bg-white/5 dark:hover:bg-white/8"
            @click="filterOpen = !filterOpen"
          >
            <Icon name="lucide:list-filter" class="size-4" />
            <span>Filter</span>
            <span
              v-if="activeFilterCount"
              class="ml-auto flex size-5 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white tabular-nums"
              :aria-label="`${activeFilterCount} active filters`"
            >
              {{ activeFilterCount }}
            </span>
          </button>
          <Transition
            enter-active-class="motion-safe:transition motion-safe:duration-150"
            enter-from-class="opacity-0 -translate-y-1"
            leave-active-class="motion-safe:transition motion-safe:duration-100"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <div
              v-if="filterOpen"
              :id="filterId"
              role="menu"
              aria-label="Filter by reason"
              class="absolute top-full left-0 z-20 mt-2 w-52 rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
            >
              <button
                v-for="reason in props.reasons"
                :key="reason.value"
                type="button"
                role="menuitemcheckbox"
                :aria-checked="!hiddenSet.has(reason.value)"
                class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                @click="toggleReason(reason.value)"
              >
                <span
                  :class="[
                    'flex size-4 shrink-0 items-center justify-center rounded-sm border',
                    hiddenSet.has(reason.value)
                      ? 'border-muted-foreground/40'
                      : 'border-blue-500 bg-blue-500 text-white',
                  ]"
                >
                  <Icon
                    v-if="!hiddenSet.has(reason.value)"
                    name="lucide:check"
                    class="size-3"
                  />
                </span>
                <span
                  class="size-2 rotate-45 rounded-xs"
                  :style="{ backgroundColor: reason.color }"
                />
                <span class="flex-1">{{ reason.label }}</span>
              </button>
              <div class="my-1 h-px bg-border" />
              <button
                type="button"
                role="menuitem"
                class="w-full rounded-lg px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                @click="showAllReasons"
              >
                Show all
              </button>
            </div>
          </Transition>
        </div>

        <button
          type="button"
          :aria-label="`Sort: ${SORT_LABELS[sort]}. Change sort order`"
          class="flex h-10 items-center gap-2 rounded-xl bg-black/5 px-3 text-sm transition-colors hover:bg-black/8 focus-visible:outline-2 focus-visible:outline-ring dark:bg-white/5 dark:hover:bg-white/8"
          @click="cycleSort"
        >
          <Icon name="lucide:arrow-down-wide-narrow" class="size-4" />
          <span :title="SORT_LABELS[sort]">Sort</span>
          <Icon
            name="lucide:chevrons-up-down"
            class="ml-auto size-4 text-muted-foreground"
          />
        </button>
      </div>

      <div
        class="mt-2 grid grid-cols-[1.25rem_1fr_auto_2.25rem] items-center gap-3 px-2.5 py-2 text-sm text-muted-foreground"
      >
        <button
          type="button"
          role="checkbox"
          :aria-checked="masterState"
          aria-label="Select all stops"
          :class="[
            'flex size-5 items-center justify-center rounded-md border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            masterState === false
              ? 'border-muted-foreground/40'
              : 'border-blue-500 bg-blue-500 text-white',
          ]"
          @click="toggleAll"
        >
          <Icon
            v-if="masterState === 'mixed'"
            name="lucide:minus"
            class="size-3.5"
          />
          <Icon v-else-if="masterState" name="lucide:check" class="size-3.5" />
        </button>
        <span>Started</span>
        <span class="text-right">Reason</span>
        <span class="text-right">min</span>
      </div>

      <div
        role="group"
        aria-label="Stops"
        class="-mx-1 overflow-y-auto px-1 scrollbar-thin"
        :style="listStyle"
      >
        <div
          v-for="stop in rows"
          :key="stop.id"
          role="checkbox"
          tabindex="0"
          :aria-checked="selectedSet.has(stop.id)"
          :aria-label="rowLabel(stop)"
          :class="[
            'grid h-11 cursor-pointer grid-cols-[1.25rem_1fr_auto_2.25rem] items-center gap-3 rounded-xl border px-2.5 outline-none motion-safe:transition-colors focus-visible:border-ring',
            highlightId === stop.id
              ? 'border-border bg-background/70 dark:border-white/12 dark:bg-white/4'
              : 'border-transparent',
          ]"
          @click="toggle(stop.id)"
          @keydown="onRowKey($event, stop.id)"
          @focus="focusRow(stop.id)"
          @mouseenter="hover(stop.id)"
          @mouseleave="unhover"
        >
          <span
            aria-hidden="true"
            :class="[
              'flex size-5 items-center justify-center rounded-md border-2 motion-safe:transition-colors',
              selectedSet.has(stop.id)
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-muted-foreground/40',
            ]"
          >
            <Icon
              v-if="selectedSet.has(stop.id)"
              name="lucide:check"
              class="size-3.5"
            />
          </span>
          <span
            :class="[
              'truncate font-mono text-sm tracking-wide whitespace-nowrap tabular-nums',
              selectedSet.has(stop.id)
                ? 'font-medium text-foreground'
                : 'text-muted-foreground',
            ]"
          >
            {{ stampOf(stop) }}
          </span>
          <span
            class="flex items-center gap-1.5 justify-self-end rounded-full bg-black/5 px-2 py-0.5 text-[0.8125rem] dark:bg-white/6"
          >
            <span
              class="size-2 rotate-45 rounded-xs"
              :style="{ backgroundColor: colorOf(stop) }"
            />
            {{ reasonOf(stop)?.label ?? stop.reason }}
          </span>
          <span
            :class="[
              'text-right font-mono text-sm tabular-nums',
              stop.minutes > props.threshold
                ? 'text-[#f2742b]'
                : 'text-foreground',
            ]"
          >
            {{ stop.minutes }}
          </span>
        </div>
        <p
          v-if="rows.length === 0"
          class="py-6 text-center text-sm text-muted-foreground"
        >
          No stops match the filter.
        </p>
      </div>

      <div class="mt-2 rounded-xl bg-background/70 p-3 dark:bg-white/4">
        <div class="mb-3 flex items-center justify-between text-sm">
          <span class="text-foreground/80">Last {{ props.windowHours }} h</span>
          <span class="font-mono text-xs text-muted-foreground tabular-nums">
            now {{ nowLabel }}
          </span>
        </div>
        <div class="flex gap-2">
          <div class="flex flex-col gap-1.5">
            <span
              v-for="track in tracks"
              :key="track.machine"
              :class="[
                'flex h-4 items-center font-mono text-xs whitespace-nowrap motion-safe:transition-colors',
                highlightMachine === track.machine
                  ? 'text-foreground'
                  : 'text-muted-foreground',
              ]"
            >
              {{ track.machine }}
            </span>
          </div>
          <div class="relative min-w-0 flex-1">
            <div class="flex flex-col gap-1.5 pr-1">
              <div
                v-for="track in tracks"
                :key="track.machine"
                class="relative h-4"
              >
                <span
                  v-for="tick in track.ticks"
                  :key="tick.key"
                  aria-hidden="true"
                  class="absolute top-1/2 h-2.5 w-px -translate-1/2 rounded-full bg-muted-foreground/50"
                  :style="{ left: `${tick.left}%` }"
                />
                <span
                  v-for="bar in track.bars"
                  :key="bar.stop.id"
                  role="img"
                  :aria-label="barLabel(bar)"
                  :class="[
                    'absolute inset-y-0 cursor-pointer motion-safe:transition-opacity',
                    barClass(bar),
                  ]"
                  :style="barStyle(bar)"
                  @mouseenter="hover(bar.stop.id)"
                  @mouseleave="unhover"
                  @click="toggle(bar.stop.id)"
                >
                  <span
                    v-for="tick in bar.ticks"
                    :key="tick.key"
                    class="absolute inset-y-0 w-0.75 -translate-x-1/2 rounded-xs"
                    :style="barTickStyle(bar, tick)"
                  />
                </span>
              </div>
            </div>
            <div
              aria-hidden="true"
              class="absolute -top-1.5 right-0 bottom-6 w-px bg-foreground/80"
            >
              <span
                class="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-foreground"
              />
            </div>
            <div class="relative mt-2 h-5" aria-hidden="true">
              <span
                v-for="label in axisLabels"
                :key="label.label"
                class="absolute top-0 flex flex-col items-start gap-0.5 font-mono text-xs text-muted-foreground tabular-nums"
                :style="{ left: `${label.left}%` }"
              >
                <span class="h-1.5 w-px bg-muted-foreground/50" />
                {{ label.label }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer class="flex items-center justify-between gap-3 px-3 pt-3 pb-2">
      <p class="text-sm text-muted-foreground" aria-live="polite">
        {{ selectedStops.length }} selected · {{ selectedMinutes }} min
      </p>
      <button
        type="button"
        :disabled="selectedStops.length === 0"
        class="rounded-xl bg-black/5 px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-black/8 focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/8 dark:hover:bg-white/12"
        @click="onAssign"
      >
        Assign Cause
      </button>
    </footer>
  </section>
</template>
