<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useEventListener, useIntervalFn } from '@vueuse/core';
  import { motion, AnimatePresence } from 'motion-v';
  import type { TimezoneCity, TimezoneOption } from './types';
  import {
    cityOffsetMinutes,
    homeCityFromEnvironment,
    offsetMinutesFor,
    zoneAbbreviation,
  } from './timezone-utils';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      cities: TimezoneCity[];
      /** Zones offered by the add-city picker. */
      options?: TimezoneOption[];
      /** Use the viewer's own zone as the first row. */
      detectHome?: boolean;
    }>(),
    {
      options: () => [
        { name: 'Tokyo', timeZone: 'Asia/Tokyo' },
        { name: 'Singapore', timeZone: 'Asia/Singapore' },
        { name: 'Dubai', timeZone: 'Asia/Dubai' },
        { name: 'Berlin', timeZone: 'Europe/Berlin' },
        { name: 'London', timeZone: 'Europe/London' },
        { name: 'São Paulo', timeZone: 'America/Sao_Paulo' },
        { name: 'Los Angeles', timeZone: 'America/Los_Angeles' },
        { name: 'Sydney', timeZone: 'Australia/Sydney' },
      ],
      detectHome: true,
    },
  );

  const PALETTE = ['#f97316', '#3b82f6', '#8b5cf6', '#ec4899', '#22c55e'];

  const rows = ref<TimezoneCity[]>([...props.cities]);
  const scrubMinutes = ref(0);
  const now = ref(new Date());
  const rulerRef = ref<HTMLElement | null>(null);
  const dragging = ref(false);
  const showSettings = ref(false);
  const showPicker = ref(false);
  const use24h = ref(true);
  const showSeconds = ref(false);
  let dragStartX = 0;
  let dragStartMinutes = 0;

  onMounted(() => {
    if (!props.detectHome) return;
    const home = homeCityFromEnvironment(PALETTE[0]);
    const rest = rows.value.filter(
      (c) => c.timeZone !== home.timeZone && c.name !== home.name,
    );
    rows.value = [home, ...rest];
  });

  useIntervalFn(() => {
    now.value = new Date();
  }, 1000);

  const home = computed(() => rows.value[0]!);

  /** Minutes-of-day for a city at the scrubbed instant. */
  function cityMinutes(city: TimezoneCity): number {
    const base = now.value;
    const utcMinutes =
      base.getUTCHours() * 60 +
      base.getUTCMinutes() +
      base.getUTCSeconds() / 60 +
      scrubMinutes.value;
    return (
      (((utcMinutes + cityOffsetMinutes(city, base)) % 1440) + 1440) % 1440
    );
  }

  function timeLabel(city: TimezoneCity): string {
    const m = cityMinutes(city);
    const h24 = Math.floor(m / 60);
    const mm = String(Math.floor(m % 60)).padStart(2, '0');
    const ss = String(Math.floor((m * 60) % 60)).padStart(2, '0');
    const hh = use24h.value ? h24 : h24 % 12 || 12;
    const core = `${String(hh).padStart(2, '0')}:${mm}${showSeconds.value ? `:${ss}` : ''}`;
    return use24h.value ? core : `${core} ${h24 < 12 ? 'AM' : 'PM'}`;
  }

  function phase(city: TimezoneCity): { label: string; icon: string } {
    const h = cityMinutes(city) / 60;
    if (h >= 5 && h < city.workStart)
      return { label: 'BEFORE WORK', icon: 'lucide:sunrise' };
    if (h >= city.workStart && h < city.workEnd)
      return { label: 'WORKING', icon: 'lucide:sun' };
    if (h >= city.workEnd && h < 21)
      return { label: 'WRAPPING UP', icon: 'lucide:sunset' };
    return { label: 'NIGHT', icon: 'lucide:moon' };
  }

  function dayRelation(city: TimezoneCity): string {
    const base = now.value;
    const utc =
      base.getUTCHours() * 60 + base.getUTCMinutes() + scrubMinutes.value;
    const dayDiff =
      Math.floor((utc + cityOffsetMinutes(city, base)) / 1440) -
      Math.floor((utc + cityOffsetMinutes(home.value, base)) / 1440);
    if (dayDiff < 0) return 'YESTERDAY';
    if (dayDiff > 0) return 'TOMORROW';
    return '';
  }

  function offsetLabel(city: TimezoneCity): string {
    const diff =
      cityOffsetMinutes(city, now.value) -
      cityOffsetMinutes(home.value, now.value);
    if (diff === 0) return 'SAME TIME';
    const sign = diff > 0 ? '+' : '-';
    const abs = Math.abs(diff);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return m ? `${sign}${h}H ${m}M` : `${sign}${h}H`;
  }

  const homeDateLabel = computed(() => {
    const d = new Date(
      now.value.getTime() +
        (scrubMinutes.value + cityOffsetMinutes(home.value, now.value)) *
          60_000,
    );
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
  });

  const utcHeader = computed(() => {
    const m = cityOffsetMinutes(home.value, now.value);
    const sign = m >= 0 ? '+' : '-';
    const abs = Math.abs(m);
    return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
  });

  const scrubLabel = computed(() => {
    if (Math.round(scrubMinutes.value) === 0) return 'NOW';
    const sign = scrubMinutes.value > 0 ? '+' : '-';
    const abs = Math.abs(scrubMinutes.value);
    const h = Math.floor(abs / 60);
    const m = Math.round(abs % 60);
    return `${sign}${h ? `${h}H ` : ''}${m}M`.trim();
  });

  const scrubbed = computed(() => Math.round(scrubMinutes.value) !== 0);

  function onPointerDown(e: PointerEvent) {
    dragging.value = true;
    dragStartX = e.clientX;
    dragStartMinutes = scrubMinutes.value;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging.value || !rulerRef.value) return;
    const rect = rulerRef.value.getBoundingClientRect();
    if (rect.width === 0) return;
    const perPx = (24 * 60) / rect.width;
    scrubMinutes.value = dragStartMinutes + (e.clientX - dragStartX) * perPx;
  }
  function onPointerUp() {
    dragging.value = false;
  }
  function resetScrub() {
    scrubMinutes.value = 0;
    showPicker.value = false;
    showSettings.value = false;
  }

  function addCity(option: TimezoneOption) {
    if (rows.value.some((c) => c.timeZone === option.timeZone)) return;
    rows.value = [
      ...rows.value,
      {
        name: option.name,
        timeZone: option.timeZone,
        zone: zoneAbbreviation(option.timeZone),
        offsetMinutes: offsetMinutesFor(option.timeZone),
        workStart: 9,
        workEnd: 17,
        color: PALETTE[rows.value.length % PALETTE.length]!,
      },
    ];
    showPicker.value = false;
  }

  function removeCity(index: number) {
    if (index === 0) return;
    rows.value = rows.value.filter((_, i) => i !== index);
  }

  const availableOptions = computed(() =>
    props.options.filter(
      (o) => !rows.value.some((c) => c.timeZone === o.timeZone),
    ),
  );

  useEventListener('pointerup', onPointerUp);

  const TICKS = 96;
  /** Ruler ticks slide with the scrub so the motion reads as time travel. */
  const tickShift = computed(() => (scrubMinutes.value / (24 * 60)) * 100);
</script>

<template>
  <div
    class="w-full max-w-sm overflow-hidden rounded-[26px] bg-[#171719] text-zinc-100 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.6)]"
  >
    <div
      ref="rulerRef"
      class="relative h-32 cursor-ew-resize touch-none select-none overflow-hidden"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @dblclick="resetScrub"
    >
      <div
        class="absolute inset-y-0 left-1/2 right-0 bg-[#3d2417]/80 transition-opacity duration-200"
        :class="scrubbed ? 'opacity-100' : 'opacity-0'"
      ></div>
      <div
        class="absolute left-5 top-5 font-mono text-sm tracking-widest text-zinc-300"
      >
        {{ utcHeader }}
      </div>
      <div
        class="absolute right-5 top-5 font-mono text-sm tracking-widest transition-colors"
        :class="scrubbed ? 'text-orange-300' : 'text-zinc-500'"
      >
        {{ scrubLabel }}
      </div>
      <div
        class="absolute left-1/2 top-0 h-10 w-0.75 -translate-x-1/2 bg-orange-500"
      ></div>
      <div class="absolute inset-x-0 bottom-0 flex h-14 items-end">
        <div
          v-for="t in TICKS"
          :key="t"
          class="flex-1"
          :style="{ transform: `translateX(${tickShift}%)` }"
        >
          <div
            :class="
              cn(
                'mx-auto w-px',
                (t - 1) % 4 === 0 ? 'h-9' : 'h-5',
                t > TICKS / 2 && scrubbed ? 'bg-orange-500/85' : 'bg-zinc-600',
              )
            "
          ></div>
        </div>
      </div>
    </div>

    <div class="divide-y divide-white/6">
      <component
        :is="motion.div"
        v-for="(city, i) in rows"
        :key="city.timeZone ?? city.name"
        layout
        :initial="{ opacity: 0, height: 0 }"
        :animate="{ opacity: 1, height: 'auto' }"
        :exit="{ opacity: 0, height: 0 }"
        :transition="{ type: 'spring', stiffness: 380, damping: 34 }"
        class="group flex items-end justify-between px-5 py-4"
        :class="i === 0 ? 'bg-white/3' : ''"
      >
        <div>
          <p class="font-mono text-[10px] tracking-[0.18em] text-zinc-500">
            <template v-if="i === 0">YOUR TIME · {{ homeDateLabel }}</template>
            <template v-else>
              {{ offsetLabel(city) }} / {{ city.zone }}
              <span v-if="dayRelation(city)" class="text-zinc-600">
                · {{ dayRelation(city) }}</span
              >
            </template>
          </p>
          <p class="mt-1 text-2xl font-medium tracking-tight text-zinc-50">
            {{ city.name }}
          </p>
        </div>
        <div class="flex items-end gap-3">
          <div class="text-right">
            <p
              class="flex items-center justify-end gap-1.5 font-mono text-[10px] tracking-[0.18em] text-zinc-500"
            >
              {{ phase(city).label }}
              <Icon :name="phase(city).icon" class="size-3 text-zinc-400" />
            </p>
            <p class="mt-1 font-mono text-2xl tabular-nums text-zinc-100">
              {{ timeLabel(city) }}
            </p>
          </div>
          <button
            v-if="i > 0"
            type="button"
            class="mb-1 rounded-full p-1 text-zinc-600 opacity-0 transition-opacity hover:text-zinc-200 focus-visible:opacity-100 group-hover:opacity-100"
            :aria-label="`Remove ${city.name}`"
            @click="removeCity(i)"
          >
            <Icon name="lucide:x" class="size-3.5" />
          </button>
        </div>
      </component>
    </div>

    <AnimatePresence>
      <component
        :is="motion.div"
        v-if="showSettings"
        key="settings"
        :initial="{ opacity: 0, height: 0 }"
        :animate="{ opacity: 1, height: 'auto' }"
        :exit="{ opacity: 0, height: 0 }"
        :transition="{ type: 'spring', stiffness: 340, damping: 32 }"
        class="overflow-hidden border-t border-white/6 bg-black/25"
      >
        <div class="space-y-3 px-5 py-4">
          <label
            class="flex cursor-pointer items-center justify-between font-mono text-[10px] tracking-[0.18em] text-zinc-400"
          >
            24-HOUR CLOCK
            <input v-model="use24h" type="checkbox" class="accent-orange-500" />
          </label>
          <label
            class="flex cursor-pointer items-center justify-between font-mono text-[10px] tracking-[0.18em] text-zinc-400"
          >
            SHOW SECONDS
            <input
              v-model="showSeconds"
              type="checkbox"
              class="accent-orange-500"
            />
          </label>
        </div>
      </component>

      <component
        :is="motion.div"
        v-if="showPicker"
        key="picker"
        :initial="{ opacity: 0, height: 0 }"
        :animate="{ opacity: 1, height: 'auto' }"
        :exit="{ opacity: 0, height: 0 }"
        :transition="{ type: 'spring', stiffness: 340, damping: 32 }"
        class="overflow-hidden border-t border-white/6 bg-black/25"
      >
        <div class="flex flex-wrap gap-1.5 px-5 py-4">
          <button
            v-for="option in availableOptions"
            :key="option.timeZone"
            type="button"
            class="rounded-full border border-white/12 px-2.5 py-1 font-mono text-[10px] tracking-widest text-zinc-300 transition-colors hover:border-orange-500/60 hover:text-orange-300"
            @click="addCity(option)"
          >
            {{ option.name.toUpperCase() }}
          </button>
          <p
            v-if="availableOptions.length === 0"
            class="font-mono text-[10px] tracking-widest text-zinc-600"
          >
            ALL ZONES ADDED
          </p>
        </div>
      </component>
    </AnimatePresence>

    <div class="flex items-center justify-between px-5 pb-5 pt-2">
      <button
        type="button"
        :class="
          cn(
            'flex size-11 items-center justify-center rounded-full border transition-colors',
            showSettings
              ? 'border-orange-500/60 text-orange-300'
              : 'border-white/12 text-zinc-400 hover:text-zinc-100',
          )
        "
        aria-label="Clock settings"
        :aria-expanded="showSettings"
        @click="
          showSettings = !showSettings;
          showPicker = false;
        "
      >
        <Icon name="lucide:settings" class="size-4.5" />
      </button>
      <div class="flex items-center gap-2.5">
        <button
          type="button"
          :class="
            cn(
              'flex size-11 items-center justify-center rounded-full border transition-colors',
              scrubbed
                ? 'border-orange-500/60 text-orange-300'
                : 'border-white/12 text-zinc-400 hover:text-zinc-100',
            )
          "
          aria-label="Jump back to now"
          @click="resetScrub"
        >
          <Icon name="lucide:locate-fixed" class="size-4.5" />
        </button>
        <button
          type="button"
          :class="
            cn(
              'flex size-11 items-center justify-center rounded-full border transition-colors',
              showPicker
                ? 'border-orange-500/60 text-orange-300'
                : 'border-white/12 text-zinc-400 hover:text-zinc-100',
            )
          "
          aria-label="Add a city"
          :aria-expanded="showPicker"
          @click="
            showPicker = !showPicker;
            showSettings = false;
          "
        >
          <Icon name="lucide:plus" class="size-4.5" />
        </button>
      </div>
    </div>
  </div>
</template>
