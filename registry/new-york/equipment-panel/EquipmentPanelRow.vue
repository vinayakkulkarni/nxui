<script setup lang="ts">
  import { computed, useId } from 'vue';
  import EquipmentPanelBar from './EquipmentPanelBar.vue';
  import EquipmentPanelChart from './EquipmentPanelChart.vue';
  import type { EquipmentRowProps } from './types';

  const props = defineProps<EquipmentRowProps>();
  const emit = defineEmits<{ toggle: []; action: [] }>();

  const detailId = `equipment-detail-${useId()}`;

  const dot = computed(() => {
    if (props.device.status === 'warn') return props.accent;
    if (props.device.status === 'ok') return props.okColor;
    return '';
  });
  const powerText = computed(() => {
    const sign = props.device.signed && props.power > 0 ? '+' : '';
    return `${sign}${props.power.toFixed(2)} kW`;
  });
  const chart = computed(() =>
    props.device.chart
      ? { ...props.device.chart, points: props.points }
      : undefined,
  );
</script>

<template>
  <li
    class="relative rounded-2xl border transition-[border-color,background-color,box-shadow] duration-300 after:absolute after:inset-x-3 after:-bottom-px after:h-px after:bg-border last:after:hidden dark:after:bg-white/5"
    :class="
      props.open
        ? 'bg-neutral-50 after:hidden dark:bg-white/3'
        : 'border-transparent'
    "
    :style="
      props.open
        ? {
            borderColor: `${dot || props.accent}80`,
            boxShadow: `0 0 0 1px ${dot || props.accent}14`,
          }
        : undefined
    "
  >
    <button
      type="button"
      class="grid w-full grid-cols-[1.25rem_minmax(0,1fr)_4.5rem_2.75rem_1rem] items-center gap-x-2 rounded-2xl px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 @md:grid-cols-[1.25rem_minmax(0,1fr)_6.75rem_5rem_3.5rem_1rem] @md:gap-x-3"
      :aria-expanded="props.open"
      :aria-controls="detailId"
      @click="emit('toggle')"
    >
      <span
        class="size-1.5 justify-self-center rounded-full"
        :class="dot ? '' : 'bg-neutral-300 dark:bg-neutral-600'"
        :style="
          dot
            ? { backgroundColor: dot, boxShadow: `0 0 6px ${dot}` }
            : undefined
        "
      />
      <span class="min-w-0 leading-tight">
        <span class="block truncate text-sm font-medium">{{
          props.device.name
        }}</span>
        <span class="block truncate text-[13px] text-muted-foreground">{{
          props.device.detail
        }}</span>
      </span>
      <EquipmentPanelBar
        :level="props.device.level"
        :cells="10"
        :color="props.device.levelColor ?? props.accent"
        cell-class="h-3 w-2"
        track-class="bg-neutral-200 dark:bg-white/6"
        class="hidden @md:flex"
      />
      <span
        class="text-right text-[13px] tabular-nums"
        :class="
          props.device.status === 'idle'
            ? 'text-muted-foreground'
            : 'font-medium'
        "
      >
        {{ powerText }}
      </span>
      <span
        class="text-right text-[13px] tabular-nums"
        :class="
          props.device.status === 'warn'
            ? 'font-medium'
            : 'text-muted-foreground'
        "
        :style="
          props.device.status === 'warn' ? { color: props.accent } : undefined
        "
      >
        {{ props.temp === null ? '—' : `${Math.round(props.temp)} °C` }}
      </span>
      <Icon
        name="lucide:chevron-down"
        class="size-4 text-muted-foreground transition-transform duration-300"
        :class="props.open ? 'rotate-180 text-foreground' : ''"
      />
    </button>
    <div
      :id="detailId"
      class="grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none"
      :class="
        props.open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      "
      :inert="!props.open"
    >
      <div class="overflow-hidden">
        <div class="flex items-center gap-3 px-3 pb-3 @md:pl-10">
          <EquipmentPanelChart
            v-if="chart"
            :chart="chart"
            :color="props.accent"
          />
          <div
            v-else
            class="flex min-h-17 flex-1 items-center gap-6 rounded-xl border border-black bg-neutral-950 px-3 text-[11px] tracking-[0.12em] uppercase shadow-[inset_0_2px_10px_rgba(0,0,0,0.85)] dark:border-white/6"
            :style="{ color: props.device.levelColor ?? props.accent }"
          >
            <span
              ><span class="block opacity-60">Level</span
              ><span class="text-base"
                >{{ Math.round(props.device.level * 100) }} %</span
              ></span
            >
            <span
              ><span class="block opacity-60">Power</span
              ><span class="text-base">{{ powerText }}</span></span
            >
          </div>
          <button
            v-if="props.device.action"
            type="button"
            class="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-border bg-muted px-4 text-sm font-medium transition-colors outline-none hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-orange-400/60 disabled:opacity-70 dark:border-white/8 dark:bg-neutral-700/50 dark:hover:bg-neutral-700"
            :disabled="props.busy"
            @click="emit('action')"
          >
            <Icon
              v-if="props.busy"
              name="lucide:loader-circle"
              class="size-4 animate-spin"
            />
            {{ props.busy ? 'Checking…' : props.device.action }}
          </button>
        </div>
      </div>
    </div>
  </li>
</template>
