<script setup lang="ts">
  import {
    computed,
    nextTick,
    onMounted,
    ref,
    useTemplateRef,
    watch,
  } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import type {
    UsageMeterCategory,
    UsageMeterDay,
    UsageMeterProps,
    UsageMeterStat,
  } from './types';
  import UsageMeterBars from './UsageMeterBars.vue';
  import UsageMeterNumber from './UsageMeterNumber.vue';
  import UsageMeterStats from './UsageMeterStats.vue';
  import { formatCount, percentOf } from './usage-meter';

  const props = withDefaults(defineProps<UsageMeterProps>(), {
    workspace: 'nxui',
    plan: 'Pro plan',
    resets: '',
    limit: 10000,
    unit: 'credits',
    accent: '',
    upgradeLabel: 'Upgrade',
    addCreditsLabel: 'Add credits',
    limitLabel: 'Limit reached',
    class: '',
  });

  const emit = defineEmits<{
    upgrade: [];
    'add-credits': [];
    'range-change': [value: string];
  }>();

  const range = defineModel<string>('range', { default: '' });

  const NO_STATS: UsageMeterStat[] = [];
  const NO_DAYS: UsageMeterDay[] = [];

  const current = computed(
    () =>
      props.ranges.find((item) => item.value === range.value) ??
      props.ranges[0],
  );
  const activeValue = computed(() => current.value?.value ?? '');

  function usageOf(category: UsageMeterCategory): number {
    return current.value?.usage[category.key] ?? 0;
  }

  const total = computed(() =>
    props.categories.reduce((sum, category) => sum + usageOf(category), 0),
  );
  const percent = computed(() => percentOf(total.value, props.limit));
  const atLimit = computed(() => total.value >= props.limit);
  const left = computed(() => Math.max(0, props.limit - total.value));

  const segments = computed(() => {
    const scale = Math.max(props.limit, total.value);
    let offset = 0;
    return props.categories.map((category) => {
      const value = usageOf(category);
      const width = scale > 0 ? (value / scale) * 100 : 0;
      const center = offset + width / 2;
      offset += width;
      return {
        category,
        value,
        width,
        center,
        share: percentOf(value, total.value),
        style: {
          '--um-c': category.color,
          '--um-cd': category.darkColor ?? category.color,
        },
      };
    });
  });

  const hovered = ref('');
  const hoveredSegment = computed(() =>
    segments.value.find((segment) => segment.category.key === hovered.value),
  );
  const tooltipLeft = computed(() => {
    const center = hoveredSegment.value?.center ?? 50;
    return `${Math.min(80, Math.max(20, center))}%`;
  });

  const days = computed<UsageMeterDay[]>(() => {
    const item = current.value;
    if (!item) return NO_DAYS;
    const count = Math.max(item.days ?? item.daily.length, item.daily.length);
    return Array.from({ length: count }, (_, index) => ({
      label: item.dayLabels?.[index] ?? `Day ${index + 1}`,
      value: item.daily[index] ?? 0,
      future: index >= item.daily.length,
    }));
  });
  const stats = computed(() => current.value?.stats ?? NO_STATS);
  const firstCategory = computed(() => props.categories[0]);
  const barAccent = computed(
    () => props.accent || firstCategory.value?.color || 'currentColor',
  );
  const barAccentDark = computed(
    () =>
      props.accent ||
      firstCategory.value?.darkColor ||
      firstCategory.value?.color ||
      'currentColor',
  );

  watch(activeValue, () => {
    hovered.value = '';
  });

  // Segmented control
  const tablist = useTemplateRef<HTMLElement>('tablist');
  const tabs = useTemplateRef<HTMLButtonElement[]>('tabs');
  const indicator = ref({ left: 0, width: 0 });
  const measured = ref(false);

  function measure(): void {
    const index = props.ranges.findIndex(
      (item) => item.value === activeValue.value,
    );
    const tab = tabs.value?.[index];
    if (!tab) return;
    indicator.value = { left: tab.offsetLeft, width: tab.offsetWidth };
    measured.value = true;
  }

  onMounted(measure);
  useResizeObserver(tablist, measure);
  watch(activeValue, () => {
    nextTick(measure);
  });

  function select(value: string): void {
    if (value === activeValue.value) return;
    range.value = value;
    emit('range-change', value);
  }

  function onTabKeydown(event: KeyboardEvent): void {
    const count = props.ranges.length;
    if (count === 0) return;
    const index = props.ranges.findIndex(
      (item) => item.value === activeValue.value,
    );
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % count;
    else if (event.key === 'ArrowLeft') next = (index - 1 + count) % count;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    if (next < 0) return;
    event.preventDefault();
    const item = props.ranges[next];
    if (!item) return;
    select(item.value);
    tabs.value?.[next]?.focus();
  }

  function onEnter(key: string): void {
    hovered.value = key;
  }

  function onLeave(): void {
    hovered.value = '';
  }

  function onUpgrade(): void {
    emit('upgrade');
  }

  function onAddCredits(): void {
    emit('add-credits');
  }
</script>

<template>
  <div
    :class="
      cn(
        'w-full max-w-md rounded-[1.75rem] border border-border bg-muted/80 p-1 text-foreground dark:bg-background',
        props.class,
      )
    "
  >
    <div
      class="rounded-3xl border border-border bg-card p-5 shadow-sm dark:bg-muted/45"
    >
      <!-- Header -->
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-36 flex-1">
          <p class="truncate text-sm font-semibold">{{ workspace }}</p>
          <p class="mt-0.5 flex min-w-0 gap-1.5 text-xs text-muted-foreground">
            <span class="truncate">{{ plan }}</span>
            <template v-if="resets">
              <span aria-hidden="true">·</span>
              <span class="truncate">{{ resets }}</span>
            </template>
          </p>
        </div>
        <div
          ref="tablist"
          role="tablist"
          aria-label="Usage range"
          class="relative flex shrink-0 rounded-xl border border-border bg-muted p-0.5 dark:bg-background"
          @keydown="onTabKeydown"
        >
          <span
            v-if="measured"
            aria-hidden="true"
            class="absolute inset-y-0.5 left-0 rounded-[0.55rem] bg-card shadow-sm ring-1 ring-border transition-[translate,width] duration-300 ease-out motion-reduce:transition-none dark:bg-muted"
            :style="{
              width: `${indicator.width}px`,
              translate: `${indicator.left}px 0`,
            }"
          />
          <button
            v-for="item in ranges"
            ref="tabs"
            :key="item.value"
            type="button"
            role="tab"
            :aria-selected="item.value === activeValue"
            :tabindex="item.value === activeValue ? 0 : -1"
            :class="[
              'relative z-10 rounded-[0.55rem] px-2 py-1 text-xs whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60 sm:px-2.5',
              item.value === activeValue
                ? 'font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground',
              item.value === activeValue &&
                !measured &&
                'bg-card shadow-sm dark:bg-muted',
            ]"
            @click="select(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <!-- Total -->
      <div class="mt-6 flex items-end justify-between gap-3">
        <p class="flex min-w-0 items-baseline gap-2">
          <UsageMeterNumber
            :value="total"
            class="text-4xl font-semibold tracking-tight tabular-nums"
          />
          <span class="truncate text-sm text-muted-foreground">
            of {{ formatCount(limit) }} {{ unit }}
          </span>
        </p>
        <p
          class="flex shrink-0 items-center gap-1.5 pb-1 text-sm font-medium tabular-nums"
        >
          <span v-if="atLimit" aria-hidden="true" class="relative flex size-2">
            <span
              class="absolute inset-0 animate-ping rounded-full bg-amber-500/60 motion-reduce:animate-none"
            />
            <span class="relative size-2 rounded-full bg-amber-500" />
          </span>
          <span><UsageMeterNumber :value="percent" />%</span>
        </p>
      </div>

      <!-- Meter -->
      <div class="relative mt-3">
        <div
          role="meter"
          :aria-valuenow="total"
          aria-valuemin="0"
          :aria-valuemax="limit"
          :aria-valuetext="`${formatCount(total)} of ${formatCount(limit)} ${unit}`"
          aria-label="Usage"
          class="flex h-2.5 overflow-hidden rounded-full bg-foreground/8"
          @mouseleave="onLeave"
        >
          <div
            v-for="segment in segments"
            :key="segment.category.key"
            class="h-full shrink-0 transition-[width] duration-700 ease-out motion-reduce:transition-none"
            :style="{ ...segment.style, width: `${segment.width}%` }"
            @mouseenter="onEnter(segment.category.key)"
          >
            <div
              :class="[
                'mr-0.5 h-full rounded-[2px] bg-(--um-c) transition-opacity duration-200 dark:bg-(--um-cd)',
                hovered && hovered !== segment.category.key && 'opacity-35',
              ]"
            />
          </div>
        </div>
        <div
          :class="[
            'pointer-events-none absolute bottom-full mb-2.5 -translate-x-1/2 rounded-xl border border-border bg-popover px-3 py-2 text-popover-foreground shadow-lg transition-[opacity,left,translate] duration-200 ease-out motion-reduce:transition-none',
            hoveredSegment
              ? 'translate-y-0 opacity-100'
              : 'translate-y-1 opacity-0',
          ]"
          :style="{ left: tooltipLeft }"
          aria-hidden="true"
        >
          <template v-if="hoveredSegment">
            <p
              class="flex items-center gap-1.5 text-xs text-muted-foreground"
              :style="hoveredSegment.style"
            >
              <span
                class="size-2 rounded-[2px] bg-(--um-c) dark:bg-(--um-cd)"
              />
              {{ hoveredSegment.category.label }}
            </p>
            <p
              class="mt-0.5 text-sm font-semibold whitespace-nowrap tabular-nums"
            >
              {{ formatCount(hoveredSegment.value) }} {{ unit }}
              <span class="font-normal text-muted-foreground"
                >· {{ hoveredSegment.share }}%</span
              >
            </p>
          </template>
        </div>
      </div>

      <!-- Categories -->
      <ul class="mt-3.5 -mx-2" aria-label="Usage by category">
        <li
          v-for="segment in segments"
          :key="segment.category.key"
          :class="[
            'grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none',
            segment.value > 0
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0',
          ]"
          :aria-hidden="segment.value > 0 ? undefined : 'true'"
        >
          <div class="min-h-0 overflow-hidden">
            <div
              :tabindex="segment.value > 0 ? 0 : -1"
              :class="[
                'flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-[background-color,opacity] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                hovered === segment.category.key && 'bg-foreground/5',
                hovered && hovered !== segment.category.key && 'opacity-45',
              ]"
              :style="segment.style"
              @mouseenter="onEnter(segment.category.key)"
              @mouseleave="onLeave"
              @focus="onEnter(segment.category.key)"
              @blur="onLeave"
            >
              <span
                class="size-2 shrink-0 rounded-[2px] bg-(--um-c) dark:bg-(--um-cd)"
                aria-hidden="true"
              />
              <span class="min-w-0 flex-1 truncate">{{
                segment.category.label
              }}</span>
              <UsageMeterNumber
                :value="segment.value"
                class="font-medium tabular-nums"
              />
              <span class="w-9 text-right text-muted-foreground tabular-nums">
                <UsageMeterNumber :value="segment.share" />%
              </span>
            </div>
          </div>
        </li>
      </ul>

      <!-- Per day -->
      <UsageMeterBars
        class="mt-4"
        :days="days"
        :range-key="activeValue"
        :unit="unit"
        :accent="barAccent"
        :accent-dark="barAccentDark"
      />

      <template v-if="stats.length">
        <div class="my-4 h-px bg-border" />
        <UsageMeterStats :stats="stats" />
      </template>
    </div>

    <!-- Footer -->
    <div class="flex h-14 items-center justify-between gap-3 pr-1 pl-5">
      <Transition
        mode="out-in"
        enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
        leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
        enter-from-class="translate-y-1 opacity-0 blur-[2px]"
        leave-to-class="-translate-y-1 opacity-0 blur-[2px]"
      >
        <p
          v-if="atLimit"
          key="limit"
          class="flex items-center gap-2 text-sm font-medium"
          role="status"
        >
          <span
            class="size-2 rounded-full bg-amber-500 ring-3 ring-amber-500/25"
            aria-hidden="true"
          />
          {{ limitLabel }}
        </p>
        <p v-else key="left" class="text-sm text-muted-foreground tabular-nums">
          <UsageMeterNumber :value="left" /> {{ unit }} left
        </p>
      </Transition>
      <Transition
        mode="out-in"
        enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
        leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
        enter-from-class="scale-95 opacity-0"
        leave-to-class="scale-95 opacity-0"
      >
        <button
          v-if="atLimit"
          key="add"
          type="button"
          class="h-10 rounded-full bg-foreground px-5 text-sm font-medium text-background shadow-md transition-[opacity,scale] outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted active:scale-97"
          @click="onAddCredits"
        >
          {{ addCreditsLabel }}
        </button>
        <button
          v-else
          key="upgrade"
          type="button"
          class="h-10 rounded-full border border-border bg-card px-5 text-sm font-medium shadow-sm transition-[background-color,scale] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted active:scale-97"
          @click="onUpgrade"
        >
          {{ upgradeLabel }}
        </button>
      </Transition>
    </div>
  </div>
</template>
