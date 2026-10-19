<script setup lang="ts">
  import { computed, ref, useTemplateRef, watch } from 'vue';
  import {
    useElementVisibility,
    useIntervalFn,
    usePreferredReducedMotion,
    useTimeoutFn,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import SegmentDisplay from '../segment-display/SegmentDisplay.vue';
  import EquipmentPanelBar from './EquipmentPanelBar.vue';
  import EquipmentPanelRow from './EquipmentPanelRow.vue';
  import {
    DEFAULT_DEVICES,
    DEFAULT_TILES,
    GREEN,
    ORANGE,
    wobble,
  } from './equipment-panel';
  import type {
    EquipmentDevice,
    EquipmentFilter,
    EquipmentLive,
    EquipmentPanelProps,
  } from './types';

  const props = withDefaults(defineProps<EquipmentPanelProps>(), {
    title: 'Equipment',
    subtitle: undefined,
    icon: 'lucide:text',
    tiles: () => DEFAULT_TILES,
    devices: () => DEFAULT_DEVICES,
    expanded: undefined,
    filter: undefined,
    live: true,
    firmware: 'Firmware 26.4.1 · up to date',
    addLabel: 'Add device',
    accent: ORANGE,
    okColor: GREEN,
    class: '',
  });

  const emit = defineEmits<{
    'update:expanded': [id: string | null];
    'update:filter': [value: EquipmentFilter];
    action: [device: EquipmentDevice];
    add: [];
  }>();

  // Open row and filter work with or without v-model.
  const openId = ref<string | null>(props.expanded ?? 'inverter');
  watch(
    () => props.expanded,
    (v) => {
      if (v !== undefined) openId.value = v;
    },
  );
  const mode = ref<EquipmentFilter>(props.filter ?? 'all');
  watch(
    () => props.filter,
    (v) => {
      if (v !== undefined) mode.value = v;
    },
  );

  function toggle(id: string): void {
    openId.value = openId.value === id ? null : id;
    emit('update:expanded', openId.value);
  }

  function setFilter(value: EquipmentFilter): void {
    mode.value = value;
    emit('update:filter', value);
  }

  const alerts = computed(() =>
    props.devices.filter((d) => d.status === 'warn'),
  );
  const rows = computed(() =>
    mode.value === 'alerts' ? alerts.value : props.devices,
  );
  const subtitleText = computed(
    () =>
      props.subtitle ??
      `${props.devices.length} devices · ${alerts.value.length ? 'all reporting' : 'all healthy'}`,
  );

  const FILTERS: EquipmentFilter[] = ['all', 'alerts'];
  function onFilterKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = mode.value === 'all' ? 'alerts' : 'all';
    setFilter(next);
    const list = event.currentTarget;
    if (list instanceof HTMLElement) {
      const tabs = list.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      tabs[FILTERS.indexOf(next)]?.focus();
    }
  }

  // Live values: a tick counter drives a small deterministic wobble.
  const root = useTemplateRef<HTMLElement>('root');
  const visible = useElementVisibility(root);
  const reduced = usePreferredReducedMotion();
  const tick = ref(0);
  const { pause, resume } = useIntervalFn(() => (tick.value += 1), 1800, {
    immediate: false,
  });
  watch(
    [visible, reduced, () => props.live],
    ([isVisible, motionPref, live]) => {
      if (isVisible && live && motionPref !== 'reduce') resume();
      else pause();
    },
    { immediate: true },
  );

  const tiles = computed(() =>
    props.tiles.map((tile, i) => {
      const f = wobble(
        tick.value,
        i + 1,
        tile.key === 'battery' ? 0.008 : 0.03,
      );
      const value = tile.value * f;
      return {
        tile,
        text: value.toFixed(tile.decimals ?? 0),
        level: Math.min(1, tile.level * f),
      };
    }),
  );

  function series(base: number[], start: number): number[] {
    const n = base.length;
    const last = base[n - 1] ?? 0;
    return Array.from({ length: n }, (_, i) => {
      const k = start + i;
      if (k < n) return base[k] ?? last;
      return last + 0.55 * Math.sin(k * 0.62) + 0.3 * Math.sin(k * 1.7) - 0.2;
    });
  }

  const live = computed(() =>
    props.devices.map((d, i) => ({
      power:
        d.status === 'idle'
          ? d.power
          : d.power * wobble(tick.value, i + 4, 0.025),
      temp: d.temp === null ? null : d.temp * wobble(tick.value, i + 9, 0.012),
      points: d.chart ? series(d.chart.points, tick.value) : [],
    })),
  );
  const EMPTY: number[] = [];
  function liveOf(device: EquipmentDevice): EquipmentLive {
    const i = props.devices.indexOf(device);
    return (
      live.value[i] ?? { power: device.power, temp: device.temp, points: EMPTY }
    );
  }

  const busyId = ref<string | null>(null);
  const { start: finishCheck } = useTimeoutFn(
    () => (busyId.value = null),
    1400,
    { immediate: false },
  );
  function onAction(device: EquipmentDevice): void {
    busyId.value = device.id;
    finishCheck();
    emit('action', device);
  }
</script>

<template>
  <div
    ref="root"
    :class="
      cn(
        '@container w-full max-w-154 rounded-[28px] border border-border bg-card p-3 text-card-foreground shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)] dark:border-white/8 dark:bg-neutral-800/70 dark:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.04)]',
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
          {{ subtitleText }}
        </p>
      </div>
      <div
        class="flex rounded-full border border-border bg-muted p-1 text-[13px] dark:border-white/6 dark:bg-black/25"
        role="tablist"
        aria-label="Filter devices"
        @keydown="onFilterKeydown"
      >
        <button
          v-for="f in FILTERS"
          :key="f"
          type="button"
          role="tab"
          :aria-selected="mode === f"
          :tabindex="mode === f ? 0 : -1"
          class="rounded-full px-3 py-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
          :class="
            mode === f
              ? 'bg-background text-foreground shadow-sm dark:bg-neutral-700/80'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="setFilter(f)"
        >
          {{ f === 'all' ? 'All' : `Alerts ${alerts.length}` }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-2">
      <div
        v-for="t in tiles"
        :key="t.tile.key"
        class="min-w-0 rounded-2xl border border-black bg-neutral-950 px-2.5 pt-2.5 pb-3 shadow-[inset_0_2px_12px_rgba(0,0,0,0.85)] @lg:px-3.5 dark:border-white/6"
      >
        <div
          class="flex items-baseline justify-between gap-2 text-[10px] tracking-widest uppercase @lg:text-xs"
          :style="{ color: props.accent }"
        >
          <span class="font-medium opacity-60">{{ t.tile.label }}</span>
          <span
            class="hidden truncate tracking-normal normal-case opacity-45 @md:inline"
            >{{ t.tile.note }}</span
          >
        </div>
        <div class="mt-1.5 flex items-baseline gap-1.5 @lg:mt-2">
          <SegmentDisplay
            :value="t.text"
            :color="t.tile.color"
            :ghost="0.1"
            class="text-[22px] @md:text-[28px] @lg:text-[34px]"
            :label="`${t.tile.label} ${t.text} ${t.tile.unit ?? ''}`"
          />
          <span
            class="text-[11px] @lg:text-[13px]"
            :style="{ color: props.accent }"
            >{{ t.tile.unit }}</span
          >
        </div>
        <EquipmentPanelBar
          :level="t.level"
          :cells="14"
          :color="t.tile.color"
          cell-class="h-2 flex-1 @lg:h-2.5"
          class="mt-2 w-full @lg:w-11/12"
        />
      </div>
    </div>

    <div
      class="mt-3 rounded-[22px] border border-border bg-neutral-50/60 p-1 dark:border-white/6 dark:bg-black/15"
    >
      <div
        class="grid grid-cols-[1.25rem_minmax(0,1fr)_4.5rem_2.75rem_1rem] gap-x-2 px-3 pt-2.5 pb-1.5 text-[13px] text-muted-foreground @md:grid-cols-[1.25rem_minmax(0,1fr)_6.75rem_5rem_3.5rem_1rem] @md:gap-x-3"
        aria-hidden="true"
      >
        <span />
        <span>Device</span>
        <span class="hidden @md:inline">Level</span>
        <span class="text-right">Power</span>
        <span class="text-right">Temp</span>
        <span />
      </div>
      <TransitionGroup
        tag="ul"
        class="relative"
        enter-from-class="opacity-0 -translate-y-1"
        leave-to-class="opacity-0"
        enter-active-class="transition duration-300"
        leave-active-class="absolute inset-x-0 transition duration-200"
        move-class="transition-transform duration-300"
      >
        <EquipmentPanelRow
          v-for="device in rows"
          :key="device.id"
          :device="device"
          :open="openId === device.id"
          :accent="props.accent"
          :ok-color="props.okColor"
          :power="liveOf(device).power"
          :temp="liveOf(device).temp"
          :points="liveOf(device).points"
          :busy="busyId === device.id"
          @toggle="toggle(device.id)"
          @action="onAction(device)"
        />
      </TransitionGroup>
    </div>

    <div class="flex items-center justify-between gap-3 px-1 pt-3">
      <span
        class="inline-flex min-w-0 items-center gap-2 text-[13px] text-muted-foreground"
      >
        <span
          class="size-1.5 shrink-0 rounded-full"
          :style="{
            backgroundColor: props.okColor,
            boxShadow: `0 0 6px ${props.okColor}`,
          }"
        />
        <span class="truncate">{{ props.firmware }}</span>
      </span>
      <button
        type="button"
        class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted px-4 text-sm font-medium transition-colors outline-none hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-orange-400/60 dark:border-white/8 dark:bg-neutral-700/50 dark:hover:bg-neutral-700"
        @click="emit('add')"
      >
        <Icon name="lucide:plus" class="size-4" />
        {{ props.addLabel }}
      </button>
    </div>
  </div>
</template>
