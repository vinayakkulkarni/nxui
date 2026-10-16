<script setup lang="ts">
  import { computed, nextTick, ref, useId, useTemplateRef } from 'vue';
  import {
    DEFAULT_PRESETS,
    LEVELS,
    NO_DAYS,
    clamp,
    dayToDate,
    dayToIso,
    heatLevel,
    isoToDay,
    monthBounds,
    monthWeeks,
    weekdayLabels,
  } from './range-calendar';
  import type {
    RangeCalendarCell,
    RangeCalendarPreset,
    RangeCalendarProps,
  } from './types';

  const props = withDefaults(defineProps<RangeCalendarProps>(), {
    month: '',
    days: () => NO_DAYS,
    title: 'Time Range',
    subtitle: '',
    presets: () => DEFAULT_PRESETS,
    unit: 'stops',
    legendLow: '',
    legendHigh: 'more',
    compareTitle: 'Compare',
    compareLabel: '',
    locale: 'en-US',
    class: '',
  });

  const start = defineModel<string>('start', { default: '' });
  const end = defineModel<string>('end', { default: '' });
  const compare = defineModel<boolean>('compare', { default: false });
  const preset = defineModel<string>('preset', { default: '' });

  const uid = useId();
  const grid = useTemplateRef<HTMLElement>('grid');

  const todayDay = computed(() => isoToDay(props.today) ?? 0);
  const monthKey = computed(() => props.month || props.today.slice(0, 7));
  const bounds = computed(() => monthBounds(monthKey.value));
  const weeks = computed(() => monthWeeks(monthKey.value));

  const valueByDay = computed(() => {
    const map = new Map<number, number>();
    for (const entry of props.days) {
      const day = isoToDay(entry.date);
      if (day !== null) map.set(day, entry.value);
    }
    return map;
  });
  const maxValue = computed(() => Math.max(0, ...valueByDay.value.values()));

  // Selection: the first click sets an anchor, the second closes the range.
  const anchor = ref<number | null>(null);
  const hovered = ref<number | null>(null);
  const focused = ref<number | null>(null);

  const startDay = computed(() => isoToDay(start.value));
  const endDay = computed(() => isoToDay(end.value));

  const previewDay = computed(() => {
    if (anchor.value === null) return null;
    return hovered.value ?? focused.value;
  });

  // The range drawn right now: the hover preview while picking, else the model.
  const shown = computed(() => {
    if (anchor.value !== null && previewDay.value !== null) {
      return {
        lo: Math.min(anchor.value, previewDay.value),
        hi: Math.max(anchor.value, previewDay.value),
      };
    }
    if (startDay.value === null) return null;
    const other = endDay.value ?? startDay.value;
    return {
      lo: Math.min(startDay.value, other),
      hi: Math.max(startDay.value, other),
    };
  });

  const activePreset = computed(() =>
    props.presets.find((item) => item.value === preset.value),
  );

  const shortDate = computed(
    () =>
      new Intl.DateTimeFormat(props.locale, {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }),
  );
  const longDate = computed(
    () =>
      new Intl.DateTimeFormat(props.locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }),
  );
  const monthLabel = computed(() => {
    if (!bounds.value) return '';
    return new Intl.DateTimeFormat(props.locale, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(dayToDate(bounds.value.first));
  });
  const weekdays = computed(() => weekdayLabels(props.locale));

  function plural(count: number, word: string): string {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
  }

  const rangeLength = computed(() =>
    shown.value ? shown.value.hi - shown.value.lo + 1 : 0,
  );

  const rangeText = computed(() => {
    const range = shown.value;
    if (!range) return 'Pick a start day';
    const from = shortDate.value.format(dayToDate(range.lo));
    const hours = activePreset.value?.hours;
    if (hours && anchor.value === null) return `${from} · last ${hours}h`;
    if (range.lo === range.hi) {
      return anchor.value === null
        ? `${from} · 1 day`
        : `${from} – pick an end day`;
    }
    const to = shortDate.value.format(dayToDate(range.hi));
    return `${from} – ${to} · ${plural(rangeLength.value, 'day')}`;
  });

  const compareText = computed(() => {
    if (props.compareLabel) return props.compareLabel;
    const item = activePreset.value;
    if (item?.hours) return `previous ${item.hours} hours`;
    const length = item?.days ?? rangeLength.value;
    if (length <= 1) return 'previous day';
    return `previous ${length} days`;
  });

  const lowLabel = computed(() => props.legendLow || `fewer ${props.unit}`);

  function isDisabled(day: number): boolean {
    if (day > todayDay.value) return true;
    return props.days.length > 0 && !valueByDay.value.has(day);
  }

  function inRange(day: number): boolean {
    const range = shown.value;
    return range !== null && day >= range.lo && day <= range.hi;
  }

  function isEdge(day: number): boolean {
    const range = shown.value;
    return range !== null && (day === range.lo || day === range.hi);
  }

  // The band runs along a week row and rounds off at the range ends and the row ends.
  function bandClass(cell: RangeCalendarCell): string {
    if (!inRange(cell.day)) return '';
    const range = shown.value;
    const roundStart =
      cell.weekday === 0 ||
      cell.day === range?.lo ||
      cell.day === bounds.value?.first;
    const roundEnd =
      cell.weekday === 6 ||
      cell.day === range?.hi ||
      cell.day === bounds.value?.last;
    return [
      'bg-foreground/6 dark:bg-white/5',
      roundStart ? 'rounded-l-xl' : '',
      roundEnd ? 'rounded-r-xl' : '',
    ].join(' ');
  }

  const LEVEL_CLASSES = [
    'bg-foreground/6 text-foreground/45 dark:bg-white/5',
    'bg-foreground/12 text-foreground/75 dark:bg-white/10',
    'bg-foreground/28 text-foreground/90 dark:bg-white/22',
    'bg-foreground/45 text-foreground dark:bg-white/34',
    'bg-foreground text-background font-semibold',
  ];

  function levelClass(level: number): string {
    return LEVEL_CLASSES[clamp(level, 1, LEVELS) - 1] ?? '';
  }

  function levelOf(day: number): number {
    return heatLevel(valueByDay.value.get(day) ?? 0, maxValue.value, LEVELS);
  }

  function cellClass(cell: RangeCalendarCell): string {
    if (isDisabled(cell.day)) {
      return 'cursor-not-allowed border border-dashed border-foreground/20 text-foreground/30';
    }
    return [
      'cursor-pointer hover:ring-2 hover:ring-foreground/25',
      levelClass(levelOf(cell.day)),
      isEdge(cell.day) ? 'ring-2 ring-blue-500 hover:ring-blue-500' : '',
    ].join(' ');
  }

  function cellLabel(cell: RangeCalendarCell): string {
    const date = longDate.value.format(dayToDate(cell.day));
    if (cell.day > todayDay.value) return `${date}, upcoming`;
    const value = valueByDay.value.get(cell.day);
    if (value === undefined) return `${date}, no data`;
    return `${date}, ${value} ${props.unit}`;
  }

  // Roving tabindex: one day in the grid is tabbable at a time.
  const tabDay = computed(() => {
    const range = bounds.value;
    if (!range) return null;
    const candidates = [focused.value, endDay.value, startDay.value];
    for (const day of candidates) {
      if (day !== null && day >= range.first && day <= range.last) return day;
    }
    return clamp(todayDay.value, range.first, range.last);
  });

  function select(cell: RangeCalendarCell): void {
    if (isDisabled(cell.day)) return;
    preset.value = '';
    if (anchor.value === null) {
      anchor.value = cell.day;
      start.value = cell.iso;
      end.value = cell.iso;
      return;
    }
    const lo = Math.min(anchor.value, cell.day);
    const hi = Math.max(anchor.value, cell.day);
    anchor.value = null;
    start.value = dayToIso(lo);
    end.value = dayToIso(hi);
  }

  function applyPreset(item: RangeCalendarPreset): void {
    anchor.value = null;
    preset.value = item.value;
    const length = item.hours ? 1 : Math.max(item.days, 1);
    start.value = dayToIso(todayDay.value - length + 1);
    end.value = dayToIso(todayDay.value);
  }

  function onEnter(cell: RangeCalendarCell): void {
    hovered.value = cell.day;
  }

  function onGridLeave(): void {
    hovered.value = null;
  }

  function onFocus(cell: RangeCalendarCell): void {
    focused.value = cell.day;
  }

  const KEY_STEPS: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7,
  };

  function onCellKey(event: KeyboardEvent, cell: RangeCalendarCell): void {
    const range = bounds.value;
    if (!range) return;
    let target: number | null = null;
    const step = KEY_STEPS[event.key];
    if (step !== undefined) target = cell.day + step;
    else if (event.key === 'Home') target = cell.day - cell.weekday;
    else if (event.key === 'End') target = cell.day + (6 - cell.weekday);
    else if (event.key === 'Escape' && anchor.value !== null) {
      event.preventDefault();
      anchor.value = null;
      return;
    }
    if (target === null) return;
    event.preventDefault();
    const next = clamp(target, range.first, range.last);
    focused.value = next;
    nextTick(() => {
      grid.value
        ?.querySelector<HTMLButtonElement>(`[data-day="${next}"]`)
        ?.focus();
    });
  }

  function toggleCompare(): void {
    compare.value = !compare.value;
  }
</script>

<template>
  <section
    :class="[
      'w-full max-w-80 rounded-3xl border border-border/70 bg-card p-1.5 text-card-foreground shadow-sm dark:border-white/6 dark:bg-neutral-800',
      props.class,
    ]"
    :aria-labelledby="`${uid}-title`"
  >
    <header class="px-4 pt-3.5 pb-3">
      <h3 :id="`${uid}-title`" class="text-sm/snug font-medium">
        {{ props.title }}
      </h3>
      <p v-if="props.subtitle" class="text-xs/snug text-muted-foreground">
        {{ props.subtitle }}
      </p>
    </header>

    <div class="rounded-[1.375rem] bg-muted/70 p-3.5 dark:bg-white/3">
      <p
        class="flex h-10 items-center gap-2.5 rounded-2xl bg-foreground/6 px-3.5 text-sm font-medium dark:bg-white/6"
        aria-live="polite"
      >
        <Icon
          name="lucide:calendar"
          class="size-4 shrink-0 text-muted-foreground"
        />
        <span class="truncate">{{ rangeText }}</span>
      </p>

      <div
        role="group"
        aria-label="Presets"
        class="mt-3 grid grid-cols-5 gap-0.5 rounded-2xl bg-foreground/7 p-1 dark:bg-black/35"
      >
        <button
          v-for="item in props.presets"
          :key="item.value"
          type="button"
          :aria-pressed="preset === item.value"
          :class="[
            'h-8 rounded-xl text-xs transition-colors focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none',
            preset === item.value
              ? 'bg-background text-foreground shadow-xs dark:bg-white/18'
              : 'text-foreground/65 hover:text-foreground',
          ]"
          @click="applyPreset(item)"
        >
          {{ item.label }}
        </button>
      </div>

      <div
        ref="grid"
        role="grid"
        :aria-label="monthLabel"
        class="mt-3.5 flex flex-col gap-0.5"
        @mouseleave="onGridLeave"
      >
        <div role="row" class="grid grid-cols-7">
          <span
            v-for="(label, index) in weekdays"
            :key="`${label}-${index}`"
            role="columnheader"
            class="pb-1.5 text-center text-[0.6875rem] text-muted-foreground"
          >
            {{ label }}
          </span>
        </div>
        <div
          v-for="(week, row) in weeks"
          :key="`week-${row}`"
          role="row"
          class="grid grid-cols-7"
        >
          <template v-for="(cell, col) in week" :key="`c-${row}-${col}`">
            <div
              v-if="cell"
              role="gridcell"
              :aria-selected="inRange(cell.day)"
              :class="[
                'p-0.75 transition-colors motion-reduce:transition-none',
                bandClass(cell),
              ]"
            >
              <button
                type="button"
                :data-day="cell.day"
                :tabindex="tabDay === cell.day ? 0 : -1"
                :aria-label="cellLabel(cell)"
                :aria-disabled="isDisabled(cell.day)"
                :aria-current="cell.day === todayDay ? 'date' : undefined"
                :class="[
                  'grid aspect-square w-full place-items-center rounded-lg font-mono text-xs tabular-nums transition-[background-color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none',
                  cellClass(cell),
                ]"
                @click="select(cell)"
                @mouseenter="onEnter(cell)"
                @focus="onFocus(cell)"
                @keydown="onCellKey($event, cell)"
              >
                {{ cell.date }}
              </button>
            </div>
            <div v-else role="gridcell" aria-hidden="true" />
          </template>
        </div>
      </div>

      <div class="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span class="mr-1">{{ lowLabel }}</span>
        <span
          v-for="level in LEVELS"
          :key="`legend-${level}`"
          aria-hidden="true"
          :class="['size-3 rounded-[0.1875rem]', levelClass(level)]"
        />
        <span class="ml-1">{{ props.legendHigh }}</span>
      </div>

      <div class="mt-4 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p :id="`${uid}-compare`" class="text-sm/snug font-medium">
            {{ props.compareTitle }}
          </p>
          <p
            :id="`${uid}-compare-label`"
            class="text-xs/snug text-muted-foreground"
          >
            {{ compareText }}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="compare"
          :aria-labelledby="`${uid}-compare`"
          :aria-describedby="`${uid}-compare-label`"
          :class="[
            'relative h-6 w-10 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none',
            compare ? 'bg-blue-500' : 'bg-foreground/15',
          ]"
          @click="toggleCompare"
        >
          <span
            aria-hidden="true"
            :class="[
              'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none',
              compare ? 'translate-x-4' : 'translate-x-0',
            ]"
          />
        </button>
      </div>
    </div>
  </section>
</template>
