<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { AnimatePresence, motion } from 'motion-v';
  import { cn } from '~/lib/utils';
  import OperatingModeDialKnob from './OperatingModeDialKnob.vue';
  import {
    DEFAULT_MODES,
    DEFAULT_PRICES,
    DEFAULT_SCHEDULES,
    peakWindow,
    resolveStops,
  } from './operating-mode-dial';
  import type { OperatingModeDialProps, RateTier } from './types';

  const props = withDefaults(defineProps<OperatingModeDialProps>(), {
    modelValue: undefined,
    modes: () => DEFAULT_MODES,
    title: 'Operating mode',
    subtitle: 'Battery and inverter',
    badge: 'Auto',
    icon: 'lucide:circle-gauge',
    schedules: () => DEFAULT_SCHEDULES,
    schedule: undefined,
    prices: () => DEFAULT_PRICES,
    accent: '#ff9a2e',
    peakColor: '#4ade80',
    cancelLabel: 'Cancel',
    applyLabel: 'Apply mode',
    class: '',
  });

  const emit = defineEmits<{
    'update:modelValue': [value: string];
    'update:schedule': [value: string];
    change: [value: string];
    apply: [value: string];
    cancel: [];
  }>();

  const stops = computed(() => resolveStops(props.modes));
  const fallbackMode = computed(
    () =>
      props.modes.find((m) => m.value === 'time-based')?.value ??
      stops.value[0]?.option.value ??
      '',
  );

  const mode = ref(props.modelValue ?? fallbackMode.value);
  const applied = ref(mode.value);
  watch(
    () => props.modelValue,
    (value) => {
      if (value !== undefined) mode.value = value;
    },
  );

  const index = computed(() =>
    Math.max(
      0,
      stops.value.findIndex((s) => s.option.value === mode.value),
    ),
  );
  const option = computed(() => stops.value[index.value]?.option);

  function setMode(value: string): void {
    if (value === mode.value) return;
    mode.value = value;
    emit('update:modelValue', value);
    emit('change', value);
  }

  function onSelect(i: number): void {
    const stop = stops.value[i];
    if (stop) setMode(stop.option.value);
  }

  function onApply(): void {
    applied.value = mode.value;
    emit('apply', mode.value);
  }

  function onCancel(): void {
    setMode(applied.value);
    emit('cancel');
  }

  const tab = ref(props.schedule ?? props.schedules[0]?.value ?? '');
  watch(
    () => props.schedule,
    (value) => {
      if (value !== undefined) tab.value = value;
    },
  );
  const tabIndex = computed(() =>
    Math.max(
      0,
      props.schedules.findIndex((s) => s.value === tab.value),
    ),
  );
  const EMPTY_HOURS: RateTier[] = [];
  const hours = computed(
    () => props.schedules[tabIndex.value]?.hours ?? EMPTY_HOURS,
  );
  const peak = computed(() => peakWindow(hours.value));

  function selectTab(value: string): void {
    tab.value = value;
    emit('update:schedule', value);
  }

  function onTabKeydown(event: KeyboardEvent): void {
    const count = props.schedules.length;
    if (!count) return;
    let next = tabIndex.value;
    if (event.key === 'ArrowRight') next = (next + 1) % count;
    else if (event.key === 'ArrowLeft') next = (next - 1 + count) % count;
    else return;
    event.preventDefault();
    const target = props.schedules[next];
    if (!target) return;
    selectTab(target.value);
    const list = event.currentTarget;
    if (list instanceof HTMLElement) {
      const buttons = list.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons[next]?.focus();
    }
  }

  const TIER_CLASS: Record<RateTier, string> = {
    off: 'bg-neutral-200 dark:bg-white/7',
    mid: 'bg-neutral-300 dark:bg-white/15',
    peak: 'bg-neutral-800 dark:bg-neutral-200 dark:shadow-[0_0_6px_rgba(255,255,255,0.25)]',
  };
</script>

<template>
  <div
    :class="
      cn(
        'w-full max-w-88 rounded-[28px] border border-border bg-card p-3 text-card-foreground shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)] dark:border-white/8 dark:bg-neutral-800/70 dark:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.04)]',
        props.class,
      )
    "
  >
    <div class="flex items-center gap-3 px-1 pt-1 pb-3">
      <span
        class="grid size-8.5 shrink-0 place-items-center rounded-full border border-border bg-muted shadow-sm dark:border-white/8 dark:bg-neutral-700/60"
      >
        <Icon :name="props.icon" class="size-4" />
      </span>
      <div class="min-w-0 flex-1 leading-tight">
        <p class="truncate text-sm font-medium">{{ props.title }}</p>
        <p class="truncate text-[13px] text-muted-foreground">
          {{ props.subtitle }}
        </p>
      </div>
      <span
        v-if="props.badge"
        class="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground dark:border-white/6 dark:bg-black/25"
      >
        {{ props.badge }}
      </span>
    </div>

    <div
      class="rounded-2xl border border-border bg-neutral-100/80 dark:border-white/5 dark:bg-black/20"
    >
      <OperatingModeDialKnob
        :stops="stops"
        :index="index"
        :accent="props.accent"
        :label="props.title"
        @select="onSelect"
      />
    </div>

    <div
      class="relative mt-3 h-16 overflow-hidden rounded-2xl border border-black/80 bg-neutral-950 px-3.5 py-2.5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] dark:border-white/5"
      aria-live="polite"
    >
      <AnimatePresence mode="wait" :initial="false">
        <component
          :is="motion.div"
          :key="option?.value"
          :initial="{ opacity: 0, y: 6 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: -6 }"
          :transition="{ duration: 0.18 }"
        >
          <p
            class="text-[13px] font-medium tracking-[0.08em] uppercase"
            :style="{
              color: props.accent,
              textShadow: `0 0 12px ${props.accent}66`,
            }"
          >
            {{ option?.title }}
          </p>
          <p
            class="mt-1 truncate text-[13px] opacity-75"
            :style="{ color: props.accent }"
          >
            {{ option?.description }}
          </p>
        </component>
      </AnimatePresence>
    </div>

    <div
      class="relative mt-3 flex rounded-full border border-border bg-muted p-1 dark:border-white/5 dark:bg-black/20"
      role="tablist"
      aria-label="Schedule"
      @keydown="onTabKeydown"
    >
      <span
        class="absolute inset-y-1 left-1 rounded-full border border-border bg-background shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none dark:border-white/10 dark:bg-neutral-700/70"
        :style="{
          width: `calc((100% - 0.5rem) / ${Math.max(1, props.schedules.length)})`,
          transform: `translateX(${tabIndex * 100}%)`,
        }"
        aria-hidden="true"
      />
      <button
        v-for="(s, i) in props.schedules"
        :key="s.value"
        type="button"
        role="tab"
        :aria-selected="i === tabIndex"
        :tabindex="i === tabIndex ? 0 : -1"
        class="relative z-10 flex-1 rounded-full py-1.5 text-[13px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
        :class="
          i === tabIndex
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="selectTab(s.value)"
      >
        {{ s.label }}
      </button>
    </div>

    <div class="mt-3 px-1">
      <div class="flex items-baseline justify-between text-[13px]">
        <span class="text-muted-foreground">Today’s rates</span>
        <span class="font-medium tabular-nums">
          {{ peak ? `Peak ${peak[0]}–${peak[1]}` : 'No peak' }}
        </span>
      </div>
      <div class="relative mt-2.5 pb-3">
        <div class="grid grid-cols-24 gap-0.75">
          <span
            v-for="(tier, h) in hours"
            :key="h"
            class="h-4 rounded-[3px] transition-colors duration-300 motion-reduce:transition-none"
            :class="TIER_CLASS[tier]"
            :style="{ transitionDelay: `${h * 12}ms` }"
            :title="`${h}:00 · ${tier === 'off' ? 'Off-peak' : tier === 'mid' ? 'Mid' : 'Peak'}`"
          />
        </div>
        <span
          class="absolute bottom-0 h-1 rounded-full transition-[left,width,opacity] duration-300 ease-out motion-reduce:transition-none"
          :style="{
            left: `${((peak?.[0] ?? 0) / 24) * 100}%`,
            width: `calc(${(((peak?.[1] ?? 0) - (peak?.[0] ?? 0)) / 24) * 100}% - 3px)`,
            opacity: peak ? 1 : 0,
            backgroundColor: props.peakColor,
            boxShadow: `0 0 8px ${props.peakColor}80`,
          }"
          aria-hidden="true"
        />
      </div>
      <div
        class="relative mt-1.5 flex h-5 items-center justify-between text-[13px] text-muted-foreground"
      >
        <span>Charge</span>
        <span
          v-if="peak"
          class="absolute transition-[left] duration-300 ease-out"
          :style="{ left: `${(peak[0] / 24) * 100}%` }"
        >
          Power home
        </span>
        <span class="tabular-nums">24</span>
      </div>
      <div
        class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground"
      >
        <span class="inline-flex items-center gap-2">
          <span
            class="size-2.5 rounded-[3px]"
            :class="TIER_CLASS.off"
          />Off-peak {{ props.prices.off }}
        </span>
        <span class="inline-flex items-center gap-2">
          <span class="size-2.5 rounded-[3px]" :class="TIER_CLASS.mid" />Mid
          {{ props.prices.mid }}
        </span>
        <span class="inline-flex items-center gap-2">
          <span class="size-2.5 rounded-[3px]" :class="TIER_CLASS.peak" />Peak
          {{ props.prices.peak }}
        </span>
      </div>
    </div>

    <div class="mt-4 flex justify-end gap-2">
      <button
        type="button"
        class="h-9 rounded-full border border-border bg-muted px-4 text-sm font-medium transition-colors outline-none hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-orange-400/60 dark:border-white/8 dark:bg-neutral-700/50 dark:hover:bg-neutral-700"
        @click="onCancel"
      >
        {{ props.cancelLabel }}
      </button>
      <button
        type="button"
        class="h-9 rounded-full bg-neutral-900 px-4 text-sm font-medium text-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.5)] transition-[transform,filter] outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-orange-400/60 active:scale-[0.97] dark:bg-linear-to-b dark:from-white dark:to-neutral-300 dark:text-neutral-900 dark:shadow-[0_6px_16px_-6px_rgba(255,255,255,0.35),inset_0_1px_0_white]"
        @click="onApply"
      >
        {{ props.applyLabel }}
      </button>
    </div>
  </div>
</template>
