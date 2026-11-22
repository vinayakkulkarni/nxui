<script setup lang="ts">
  import { computed, nextTick, ref } from 'vue';
  import {
    usePreferredReducedMotion,
    useTimeoutFn,
    useTransition,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import SegmentDisplay from '../segment-display/SegmentDisplay.vue';
  import BackupReserveDisplay from './BackupReserveDisplay.vue';
  import BackupReserveSlider from './BackupReserveSlider.vue';
  import type { BackupReserveProps, BackupReserveSettings } from './types';

  const props = withDefaults(defineProps<BackupReserveProps>(), {
    title: 'Backup reserve',
    subtitle: 'Held back for outages',
    status: 'Grid up',
    battery: 64,
    capacity: 13.5,
    essentialLoad: 0.45,
    presets: () => [10, 20, 30, 50, 80, 100],
    cells: 25,
    charging: true,
    gridRateMin: 0,
    gridRateMax: 11.5,
    gridRateStep: 0.2,
    stormTitle: 'Storm watch',
    stormDescription: 'Fills to 100 % before alerts',
    gridTitle: 'Grid charging',
    gridDescription: 'Max rate from the grid',
    cancelLabel: 'Cancel',
    saveLabel: 'Save',
    color: '#ff9a2e',
    usableColor: '#4ade80',
    class: '',
  });

  const reserve = defineModel<number>('reserve', { default: 30 });
  const stormWatch = defineModel<boolean>('stormWatch', { default: true });
  const gridRate = defineModel<number>('gridRate', { default: 3.8 });

  const emit = defineEmits<{
    save: [settings: BackupReserveSettings];
    cancel: [];
  }>();

  const reduced = usePreferredReducedMotion();
  const shown = useTransition(reserve, {
    duration: computed(() => (reduced.value === 'reduce' ? 0 : 260)),
    transition: [0.22, 1, 0.36, 1],
  });

  const hours = computed(() => {
    if (props.essentialLoad <= 0) return 0;
    return Math.round(
      ((reserve.value / 100) * props.capacity) / props.essentialLoad,
    );
  });

  // Presets: a radio group, with arrow keys moving the selection.
  const presetButtons = ref<HTMLButtonElement[]>([]);
  const presetIndex = computed(() => props.presets.indexOf(reserve.value));

  function pickPreset(value: number): void {
    reserve.value = value;
  }

  function onPresetKeydown(event: KeyboardEvent): void {
    const count = props.presets.length;
    if (count === 0) return;
    let from = presetIndex.value;
    if (from < 0) {
      from = props.presets.findIndex((p) => p >= reserve.value);
      if (from < 0) from = count - 1;
    }
    let next = from;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = presetIndex.value < 0 ? from : (from + 1) % count;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = presetIndex.value < 0 ? from : (from - 1 + count) % count;
    } else return;
    event.preventDefault();
    const value = props.presets[next];
    if (value === undefined) return;
    reserve.value = value;
    nextTick(() => presetButtons.value[next]?.focus());
  }

  function presetTabIndex(i: number): number {
    if (presetIndex.value >= 0) return i === presetIndex.value ? 0 : -1;
    return i === 0 ? 0 : -1;
  }

  function toggleStorm(): void {
    stormWatch.value = !stormWatch.value;
  }

  function setRate(value: number): void {
    const stepped = Math.round(value / props.gridRateStep) * props.gridRateStep;
    gridRate.value = Number(
      Math.min(props.gridRateMax, Math.max(props.gridRateMin, stepped)).toFixed(
        2,
      ),
    );
  }
  function decreaseRate(): void {
    setRate(gridRate.value - props.gridRateStep);
  }
  function increaseRate(): void {
    setRate(gridRate.value + props.gridRateStep);
  }
  function onRateKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') increaseRate();
    else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft')
      decreaseRate();
    else if (event.key === 'Home') setRate(props.gridRateMin);
    else if (event.key === 'End') setRate(props.gridRateMax);
    else return;
    event.preventDefault();
  }

  // Cancel restores the last saved values.
  const saved = ref<BackupReserveSettings>({
    reserve: reserve.value,
    stormWatch: stormWatch.value,
    gridRate: gridRate.value,
  });
  const dirty = computed(
    () =>
      saved.value.reserve !== reserve.value ||
      saved.value.stormWatch !== stormWatch.value ||
      saved.value.gridRate !== gridRate.value,
  );
  const justSaved = ref(false);
  const savedFlash = useTimeoutFn(
    () => {
      justSaved.value = false;
    },
    1600,
    { immediate: false },
  );

  function cancel(): void {
    reserve.value = saved.value.reserve;
    stormWatch.value = saved.value.stormWatch;
    gridRate.value = saved.value.gridRate;
    emit('cancel');
  }

  function save(): void {
    const settings: BackupReserveSettings = {
      reserve: reserve.value,
      stormWatch: stormWatch.value,
      gridRate: gridRate.value,
    };
    saved.value = settings;
    emit('save', { ...settings });
    justSaved.value = true;
    savedFlash.start();
  }

  const raised =
    'border border-border bg-linear-to-b from-white to-zinc-100 shadow-[0_1px_2px_rgb(0_0_0/0.08),inset_0_1px_0_rgb(255_255_255/0.9)] dark:border-white/8 dark:from-[#333336] dark:to-[#242426] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_3px_8px_rgb(0_0_0/0.55)]';
  const pressed =
    'border border-black/10 bg-zinc-200/70 text-foreground shadow-[inset_0_2px_4px_rgb(0_0_0/0.12)] dark:border-white/5 dark:bg-[#141415] dark:text-white dark:shadow-[inset_0_2px_6px_rgb(0_0_0/0.8),0_1px_0_rgb(255_255_255/0.05)]';
  const focusRing =
    'outline-none focus-visible:ring-2 focus-visible:ring-(--br-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-card';
</script>

<template>
  <article
    :class="
      cn(
        'flex w-full max-w-88 flex-col gap-4 rounded-[1.75rem] border border-border bg-card p-3 text-card-foreground shadow-[0_24px_48px_-20px_rgb(0_0_0/0.25)] dark:border-white/8 dark:bg-[#1c1c1e] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_24px_48px_-16px_rgb(0_0_0/0.7)]',
        props.class,
      )
    "
    :style="{ '--br-accent': props.color }"
  >
    <header class="flex items-center gap-3 px-1.5 pt-1.5">
      <span
        class="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.6)] dark:border-white/8 dark:bg-linear-to-b dark:from-[#2e2e30] dark:to-[#1f1f21] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_2px_6px_rgb(0_0_0/0.5)]"
      >
        <Icon name="lucide:battery-medium" class="size-4.5" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-[15px]/tight font-medium">{{ props.title }}</p>
        <p class="truncate text-sm/tight text-muted-foreground">
          {{ props.subtitle }}
        </p>
      </div>
      <span
        v-if="props.status"
        class="flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-sm/none text-muted-foreground dark:border-white/6 dark:bg-black/30"
      >
        <span
          class="size-1.5 rounded-full bg-(--br-accent) shadow-[0_0_6px_var(--br-accent)]"
        />
        {{ props.status }}
      </span>
    </header>

    <BackupReserveDisplay
      :reserve="shown"
      :battery="props.battery"
      :hours="hours"
      :cells="props.cells"
      :charging="props.charging"
      :color="props.color"
      :usable-color="props.usableColor"
    />

    <BackupReserveSlider
      v-model="reserve"
      :min="0"
      :max="100"
      :step="1"
      :color="props.color"
      label="Backup reserve"
      class="px-1.5"
    />

    <div
      role="radiogroup"
      aria-label="Reserve presets"
      class="flex justify-between px-2"
    >
      <div
        v-for="(preset, i) in props.presets"
        :key="preset"
        class="flex flex-col items-center gap-2"
      >
        <span
          class="size-1.5 rounded-full transition-[background-color,box-shadow] duration-200"
          :class="
            preset === reserve
              ? 'bg-(--br-accent) shadow-[0_0_6px_var(--br-accent)]'
              : 'bg-foreground/15'
          "
          aria-hidden="true"
        />
        <button
          ref="presetButtons"
          type="button"
          role="radio"
          :aria-checked="preset === reserve"
          :aria-label="`${preset} %`"
          :tabindex="presetTabIndex(i)"
          :class="[
            'flex size-11 items-center justify-center rounded-full text-sm tabular-nums transition-[background-color,box-shadow,color,scale] duration-200 active:scale-95',
            focusRing,
            preset === reserve
              ? pressed
              : `${raised} text-muted-foreground hover:text-foreground`,
          ]"
          @click="pickPreset(preset)"
          @keydown="onPresetKeydown"
        >
          {{ preset }}
        </button>
      </div>
    </div>

    <div
      class="flex flex-col rounded-[1.25rem] border border-border bg-muted/50 px-3 dark:border-white/5 dark:bg-[#161617] dark:shadow-[inset_0_1px_3px_rgb(0_0_0/0.5)]"
    >
      <div class="flex items-center gap-3 py-3.5">
        <div class="min-w-0 flex-1">
          <p class="text-[15px]/tight font-medium">{{ props.stormTitle }}</p>
          <p class="mt-0.5 text-[13px]/snug text-muted-foreground">
            {{ props.stormDescription }}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="stormWatch"
          :aria-label="props.stormTitle"
          :class="[
            'relative h-6 w-10.5 shrink-0 rounded-full transition-[background-color,box-shadow] duration-300',
            focusRing,
            stormWatch
              ? 'bg-(--br-accent) shadow-[0_0_10px_-2px_var(--br-accent),inset_0_1px_2px_rgb(0_0_0/0.2)]'
              : 'bg-black/15 shadow-[inset_0_1px_2px_rgb(0_0_0/0.2)] dark:bg-black/60 dark:shadow-[inset_0_1px_3px_rgb(0_0_0/0.8)]',
          ]"
          @click="toggleStorm"
        >
          <span
            class="absolute top-0.5 left-0.5 size-5 rounded-full bg-linear-to-b from-white to-zinc-200 shadow-[0_1px_3px_rgb(0_0_0/0.4)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-reduce:transition-none"
            :class="stormWatch ? 'translate-x-4.5' : 'translate-x-0'"
          />
        </button>
      </div>
      <div
        class="flex items-center gap-3 border-t border-border py-3.5 dark:border-white/6"
      >
        <div class="min-w-0 flex-1">
          <p class="text-[15px]/tight font-medium">{{ props.gridTitle }}</p>
          <p class="mt-0.5 text-[13px]/snug text-muted-foreground">
            {{ props.gridDescription }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <button
            type="button"
            :aria-label="`Decrease ${props.gridTitle.toLowerCase()} rate`"
            :disabled="gridRate <= props.gridRateMin"
            :class="[
              'flex size-8 shrink-0 items-center justify-center rounded-full text-foreground transition-[scale,opacity] active:scale-90 disabled:opacity-40',
              focusRing,
              raised,
            ]"
            @click="decreaseRate"
          >
            <Icon name="lucide:minus" class="size-4" />
          </button>
          <div
            role="spinbutton"
            tabindex="0"
            :aria-label="props.gridTitle"
            :aria-valuenow="gridRate"
            :aria-valuemin="props.gridRateMin"
            :aria-valuemax="props.gridRateMax"
            :aria-valuetext="`${gridRate.toFixed(1)} kW`"
            :class="[
              'flex h-8 w-17 items-center justify-center gap-1.5 rounded-xl border border-black/40 bg-[#0d0d0d] shadow-[inset_0_1px_4px_rgb(0_0_0/0.8)] dark:border-white/6',
              focusRing,
            ]"
            @keydown="onRateKeydown"
          >
            <SegmentDisplay
              :value="gridRate.toFixed(1)"
              :digits="2"
              :color="props.color"
              class="text-base"
            />
            <span class="text-xs text-(--br-accent)/70">kW</span>
          </div>
          <button
            type="button"
            :aria-label="`Increase ${props.gridTitle.toLowerCase()} rate`"
            :disabled="gridRate >= props.gridRateMax"
            :class="[
              'flex size-8 shrink-0 items-center justify-center rounded-full text-foreground transition-[scale,opacity] active:scale-90 disabled:opacity-40',
              focusRing,
              raised,
            ]"
            @click="increaseRate"
          >
            <Icon name="lucide:plus" class="size-4" />
          </button>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-end gap-2 px-1 pb-1">
      <span
        class="mr-auto truncate pl-1 text-sm text-muted-foreground transition-opacity duration-300"
        :class="dirty ? 'opacity-100' : 'opacity-0'"
        aria-live="polite"
      >
        {{ dirty ? 'Unsaved changes' : '' }}
      </span>
      <button
        type="button"
        :class="[
          'h-9.5 rounded-full px-4.5 text-[15px] text-foreground transition-[scale] active:scale-95',
          focusRing,
          raised,
        ]"
        @click="cancel"
      >
        {{ props.cancelLabel }}
      </button>
      <button
        type="button"
        :class="[
          'flex h-9.5 min-w-19 items-center justify-center gap-1.5 rounded-full px-4.5 text-[15px] font-medium transition-[scale] active:scale-95',
          'bg-foreground text-background shadow-[0_2px_6px_rgb(0_0_0/0.25)]',
          'dark:border dark:border-white/60 dark:bg-linear-to-b dark:from-white dark:to-zinc-300 dark:text-zinc-900 dark:shadow-[inset_0_1px_0_rgb(255_255_255),0_3px_10px_rgb(0_0_0/0.5)]',
          focusRing,
        ]"
        @click="save"
      >
        <Icon v-if="justSaved" name="lucide:check" class="size-4" />
        {{ justSaved ? 'Saved' : props.saveLabel }}
      </button>
    </div>
  </article>
</template>
