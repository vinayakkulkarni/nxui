<script setup lang="ts">
  import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { createScale, dodge, median } from './beeswarm-layout';
  import type {
    BeeswarmChartDot,
    BeeswarmChartPart,
    BeeswarmChartProps,
    BeeswarmChartTick,
  } from './types';

  const props = withDefaults(defineProps<BeeswarmChartProps>(), {
    title: 'Cycle Time',
    subtitle: '',
    domain: undefined,
    breakAt: undefined,
    ticks: undefined,
    unit: 's',
    class: '',
  });

  const machine = defineModel<string>('machine', { default: '' });

  // SVG user space. The chart scales with the card; text scales with it.
  const W = 292;
  const H = 170;
  const AXIS_Y = 140;
  const CENTER_Y = 83;
  const R = 2.6;
  const DIAMETER = 5.8;
  const GREEN = '#34d07f';
  const ORANGE = '#f2742b';
  const NO_PARTS: BeeswarmChartPart[] = [];

  const uid = useId();
  const hatchId = `${uid}-hatch`;
  const root = useTemplateRef<HTMLElement>('root');
  const motion = usePreferredReducedMotion();

  const activeKey = computed(
    () => machine.value || props.series[0]?.value || '',
  );
  const current = computed(() =>
    props.series.find((item) => item.value === activeKey.value),
  );
  const parts = computed(() => current.value?.parts ?? NO_PARTS);

  const domain = computed<[number, number]>(() => {
    if (props.domain) return props.domain;
    const all = props.series.flatMap((item) =>
      item.parts.map((part) => part.value),
    );
    if (all.length === 0) return [0, 1];
    return [Math.floor(Math.min(...all)), Math.ceil(Math.max(...all))];
  });

  const scale = computed(() => createScale(domain.value, W, props.breakAt));

  const dots = computed<BeeswarmChartDot[]>(() => {
    const xs = parts.value.map((part) => scale.value.x(part.value));
    const offsets = dodge(xs, DIAMETER);
    return parts.value.map((part, slot) => ({
      slot,
      part,
      x: xs[slot] ?? 0,
      y: CENTER_Y + (offsets[slot] ?? 0),
      over: part.value > props.takt,
    }));
  });

  // Slots ordered by value, for arrow-key travel along the axis.
  const order = computed(() =>
    [...dots.value]
      .sort((a, b) => a.part.value - b.part.value || a.slot - b.slot)
      .map((dot) => dot.slot),
  );
  const slowest = computed(() => order.value.at(-1) ?? 0);

  const medianValue = computed(() =>
    median(parts.value.map((part) => part.value)),
  );
  const delta = computed(() => medianValue.value - props.takt);
  const overMedian = computed(() => delta.value > 0);
  const onTakt = computed(() => dots.value.filter((dot) => !dot.over).length);

  const subtitleText = computed(
    () =>
      props.subtitle ||
      `last ${parts.value.length} parts · takt ${props.takt} ${props.unit}`,
  );

  const deltaText = computed(() => {
    const amount = Math.abs(delta.value).toFixed(1);
    return overMedian.value
      ? `+${amount} ${props.unit} over takt`
      : `−${amount} ${props.unit} under takt`;
  });

  // Hover (dot or footer bar) wins, then keyboard focus, then the slowest part.
  const hoverSlot = ref<number | null>(null);
  const focusSlot = ref<number | null>(null);
  const tabSlot = ref<number | null>(null);
  const activeSlot = computed(
    () => hoverSlot.value ?? focusSlot.value ?? slowest.value,
  );
  const rovingSlot = computed(() => tabSlot.value ?? slowest.value);
  const activeDot = computed(() => dots.value[activeSlot.value]);

  watch(activeKey, () => {
    hoverSlot.value = null;
    tabSlot.value = null;
  });

  const taktX = computed(() => scale.value.x(props.takt));
  const medianX = computed(() => scale.value.x(medianValue.value));
  const hatchEnd = computed(() =>
    scale.value.hasBreak ? scale.value.breakX - 6 : W,
  );

  const ticks = computed<BeeswarmChartTick[]>(() => {
    const [min, max] = domain.value;
    const values =
      props.ticks ??
      (props.breakAt === undefined ? [min, max] : [min, props.breakAt, max]);
    return values.map((value, index) => ({
      value,
      x: scale.value.x(value),
      label: index === 0 ? `${value} ${props.unit}` : String(value),
      anchor: index === 0 ? 'start' : 'middle',
    }));
  });

  const minorTicks = computed(() => {
    const [min] = domain.value;
    const end = scale.value.mainMax;
    const step = end - min > 40 ? 5 : 1;
    const xs: number[] = [];
    for (let v = Math.ceil(min); v <= end; v += step) xs.push(scale.value.x(v));
    return xs;
  });

  const majorX = computed(() => ticks.value.map((tick) => tick.x));

  // Tooltip sits above the dot, on the side with more room.
  const tooltip = computed(() => {
    const dot = activeDot.value;
    if (!dot) return null;
    const left = dot.x > W / 2;
    const edge = left ? dot.x - 10 : dot.x + 10;
    const bottom = Math.max(Math.min(dot.y, CENTER_Y) - 22, 50);
    const leaderY = bottom - 7;
    return {
      dot,
      style: {
        left: `${(edge / W) * 100}%`,
        top: `${(bottom / H) * 100}%`,
        transform: left ? 'translate(-100%, -100%)' : 'translate(0, -100%)',
      },
      leader:
        dot.y - 6 > leaderY
          ? `M ${edge} ${leaderY} H ${dot.x} V ${dot.y - 6}`
          : '',
    };
  });

  function fmt(value: number): string {
    return value.toFixed(1);
  }

  function partTitle(part: BeeswarmChartPart): string {
    return part.time ? `part #${part.id} · ${part.time}` : `part #${part.id}`;
  }

  function partDetail(dot: BeeswarmChartDot): string {
    const note = dot.part.note ?? (dot.over ? 'over takt' : 'on takt');
    return `${fmt(dot.part.value)} ${props.unit} · ${note}`;
  }

  function dotLabel(dot: BeeswarmChartDot): string {
    return `${partTitle(dot.part)}, ${partDetail(dot)}`;
  }

  function dotStyle(dot: BeeswarmChartDot): Record<string, string> {
    return {
      transform: `translate(${dot.x}px, ${dot.y}px)`,
      transition:
        motion.value === 'reduce'
          ? 'none'
          : `transform 650ms cubic-bezier(0.22, 1, 0.36, 1) ${dot.slot * 5}ms`,
    };
  }

  const fillTransition = computed(() =>
    motion.value === 'reduce' ? 'none' : 'fill 300ms ease',
  );

  function select(value: string): void {
    machine.value = value;
  }

  function onTabKeydown(event: KeyboardEvent): void {
    const count = props.series.length;
    if (count === 0) return;
    const index = props.series.findIndex(
      (item) => item.value === activeKey.value,
    );
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % count;
    else if (event.key === 'ArrowLeft') next = (index - 1 + count) % count;
    else return;
    event.preventDefault();
    const target = props.series[next];
    if (!target) return;
    select(target.value);
    void nextTick(() => {
      root.value
        ?.querySelector<HTMLElement>(`[data-tab="${target.value}"]`)
        ?.focus();
    });
  }

  function onDotEnter(slot: number): void {
    hoverSlot.value = slot;
  }

  function onLeave(): void {
    hoverSlot.value = null;
  }

  function onDotFocus(slot: number): void {
    focusSlot.value = slot;
    tabSlot.value = slot;
  }

  function onDotBlur(): void {
    focusSlot.value = null;
  }

  function onDotKeydown(event: KeyboardEvent): void {
    const list = order.value;
    const at = list.indexOf(focusSlot.value ?? rovingSlot.value);
    let next = at;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = at + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown')
      next = at - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = list.length - 1;
    else return;
    event.preventDefault();
    const slot = list[Math.min(Math.max(next, 0), list.length - 1)];
    if (slot === undefined) return;
    tabSlot.value = slot;
    void nextTick(() => {
      root.value?.querySelector<SVGGElement>(`[data-slot="${slot}"]`)?.focus();
    });
  }

  const barColumns = computed(() => ({
    gridTemplateColumns: `repeat(${Math.max(Math.ceil(parts.value.length / 2), 1)}, minmax(0, 1fr))`,
  }));
</script>

<template>
  <section
    ref="root"
    :class="[
      'w-full max-w-84 rounded-3xl border bg-card p-1.5 text-card-foreground shadow-sm dark:border-white/6',
      props.class,
    ]"
    :aria-label="props.title"
  >
    <header class="px-4.5 pt-4 pb-3.5">
      <h3 class="text-[0.9375rem] font-medium">{{ props.title }}</h3>
      <p class="mt-0.5 text-[0.8125rem] text-muted-foreground">
        {{ subtitleText }}
      </p>
    </header>

    <div
      class="rounded-[1.25rem] border border-border/70 bg-muted/40 p-4 dark:border-white/5 dark:bg-white/4"
    >
      <div
        role="tablist"
        :aria-label="`${props.title} machine`"
        class="grid grid-flow-col gap-1 rounded-2xl bg-foreground/5 p-1 dark:bg-black/25"
        @keydown="onTabKeydown"
      >
        <button
          v-for="item in props.series"
          :key="item.value"
          type="button"
          role="tab"
          :data-tab="item.value"
          :tabindex="item.value === activeKey ? 0 : -1"
          :aria-selected="item.value === activeKey"
          :class="[
            'rounded-xl py-1.5 font-mono text-[0.8125rem] tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-ring',
            item.value === activeKey
              ? 'bg-background text-foreground shadow-xs dark:bg-white/16'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="select(item.value)"
        >
          {{ item.label }}
        </button>
      </div>

      <div
        class="mt-4 flex flex-wrap items-center justify-between gap-2"
        aria-live="polite"
      >
        <p class="flex items-baseline gap-2.5">
          <span
            class="font-mono text-2xl font-medium tracking-wide tabular-nums"
          >
            {{ fmt(medianValue) }}&nbsp;{{ props.unit }}
          </span>
          <span class="text-sm text-muted-foreground">median</span>
        </p>
        <span
          :class="[
            'rounded-lg px-2 py-0.5 text-[0.8125rem] tabular-nums transition-colors',
            overMedian
              ? 'bg-orange-500/12 text-orange-700 dark:bg-orange-400/15 dark:text-orange-400'
              : 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400',
          ]"
        >
          {{ deltaText }}
        </span>
      </div>

      <div class="relative mt-3" @pointerleave="onLeave">
        <svg
          :viewBox="`0 0 ${W} ${H}`"
          class="block h-auto w-full overflow-visible"
          role="group"
          :aria-label="`${parts.length} parts by cycle time. Use arrow keys to move between parts.`"
        >
          <defs>
            <pattern
              :id="hatchId"
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="5"
                :stroke="ORANGE"
                stroke-width="1"
                class="opacity-40 dark:opacity-35"
              />
            </pattern>
          </defs>

          <!-- over-takt zone -->
          <g aria-hidden="true">
            <rect
              :x="taktX"
              :y="CENTER_Y - 22"
              :width="Math.max(hatchEnd - taktX, 0)"
              :height="AXIS_Y - CENTER_Y + 22"
              :fill="ORANGE"
              class="opacity-6"
            />
            <rect
              :x="taktX"
              :y="CENTER_Y - 22"
              :width="Math.max(hatchEnd - taktX, 0)"
              :height="AXIS_Y - CENTER_Y + 22"
              :fill="`url(#${hatchId})`"
            />
            <line
              :x1="taktX"
              :x2="taktX"
              y1="1"
              :y2="AXIS_Y"
              stroke-dasharray="3 3"
              class="stroke-muted-foreground/70"
            />
            <text
              :x="taktX + 5"
              :y="AXIS_Y - 7"
              class="fill-muted-foreground font-mono text-[10.5px] tracking-wide"
            >
              takt {{ props.takt }} {{ props.unit }}
            </text>
          </g>

          <!-- median -->
          <g aria-hidden="true">
            <line
              :x1="medianX"
              :x2="medianX"
              y1="21"
              :y2="AXIS_Y"
              stroke-width="1.25"
              class="stroke-foreground/80"
              :style="{
                transition: motion === 'reduce' ? 'none' : 'all 650ms ease-out',
              }"
            />
            <text
              :x="medianX - 6"
              y="18"
              text-anchor="end"
              class="fill-emerald-600 font-mono text-[11px] tracking-wide dark:fill-emerald-400"
            >
              median
            </text>
          </g>

          <!-- axis -->
          <g aria-hidden="true" class="stroke-muted-foreground/60">
            <line
              x1="0"
              :x2="scale.hasBreak ? scale.breakX - 4 : W"
              :y1="AXIS_Y"
              :y2="AXIS_Y"
            />
            <template v-if="scale.hasBreak">
              <line :x1="scale.breakX + 6" :x2="W" :y1="AXIS_Y" :y2="AXIS_Y" />
              <line
                :x1="scale.breakX - 4"
                :y1="AXIS_Y + 5"
                :x2="scale.breakX"
                :y2="AXIS_Y - 5"
                stroke-width="1.25"
              />
              <line
                :x1="scale.breakX + 2"
                :y1="AXIS_Y + 5"
                :x2="scale.breakX + 6"
                :y2="AXIS_Y - 5"
                stroke-width="1.25"
              />
            </template>
            <line
              v-for="x in minorTicks"
              :key="`minor-${x}`"
              :x1="x"
              :x2="x"
              :y1="AXIS_Y"
              :y2="AXIS_Y + 4"
            />
            <line
              v-for="x in majorX"
              :key="`major-${x}`"
              :x1="x"
              :x2="x"
              :y1="AXIS_Y"
              :y2="AXIS_Y + 6"
            />
          </g>
          <g aria-hidden="true">
            <text
              v-for="tick in ticks"
              :key="`label-${tick.value}`"
              :x="tick.anchor === 'start' ? 0 : tick.x"
              :y="AXIS_Y + 23"
              :text-anchor="tick.anchor"
              class="fill-muted-foreground font-mono text-[11.5px] tracking-wide"
            >
              {{ tick.label }}
            </text>
          </g>

          <!-- leader from tooltip to the active dot -->
          <path
            v-if="tooltip?.leader"
            :d="tooltip.leader"
            fill="none"
            stroke-dasharray="1 2"
            class="stroke-muted-foreground"
            aria-hidden="true"
          />

          <!-- dots -->
          <g
            v-for="dot in dots"
            :key="dot.slot"
            :data-slot="dot.slot"
            role="img"
            :aria-label="dotLabel(dot)"
            :tabindex="dot.slot === rovingSlot ? 0 : -1"
            :style="dotStyle(dot)"
            class="cursor-pointer outline-none"
            @pointerenter="onDotEnter(dot.slot)"
            @focus="onDotFocus(dot.slot)"
            @blur="onDotBlur"
            @keydown="onDotKeydown"
          >
            <circle r="4.5" fill="transparent" />
            <circle
              v-if="dot.slot === activeSlot"
              r="6"
              fill="none"
              stroke-width="1.5"
              class="stroke-foreground"
            />
            <circle
              v-if="dot.slot === focusSlot"
              r="8.5"
              fill="none"
              stroke-width="1.5"
              class="stroke-ring"
            />
            <circle
              :r="R"
              :fill="dot.over ? ORANGE : GREEN"
              :style="{ transition: fillTransition }"
            />
          </g>
        </svg>

        <div
          v-if="tooltip"
          class="pointer-events-none absolute z-10 rounded-xl bg-neutral-900 px-3 py-2 text-[0.8125rem]/snug whitespace-nowrap text-white shadow-lg ring-1 ring-white/5 dark:bg-neutral-950"
          :style="tooltip.style"
          aria-hidden="true"
        >
          <p class="font-medium">{{ partTitle(tooltip.dot.part) }}</p>
          <p class="text-white/70">{{ partDetail(tooltip.dot) }}</p>
        </div>
      </div>

      <div
        class="mt-4 flex items-center gap-4 rounded-2xl bg-foreground/5 px-4 py-3 dark:bg-black/25"
      >
        <p class="shrink-0 text-[0.8125rem] text-muted-foreground">
          On takt
          <span class="ml-1.5 font-mono text-foreground tabular-nums">
            {{ onTakt }} / {{ parts.length }}
          </span>
        </p>
        <div
          class="grid min-w-0 flex-1 gap-x-px gap-y-0.75"
          :style="barColumns"
          aria-hidden="true"
          @pointerleave="onLeave"
        >
          <span
            v-for="dot in dots"
            :key="`bar-${dot.slot}`"
            :class="[
              'h-2 rounded-full transition-[transform,opacity,background-color] duration-200 motion-reduce:transition-none',
              dot.slot === activeSlot && hoverSlot !== null
                ? 'scale-y-150'
                : '',
              hoverSlot !== null && dot.slot !== activeSlot ? 'opacity-50' : '',
            ]"
            :style="{ backgroundColor: dot.over ? ORANGE : GREEN }"
            @pointerenter="onDotEnter(dot.slot)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
