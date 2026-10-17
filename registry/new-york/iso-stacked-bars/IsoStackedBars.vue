<script setup lang="ts">
  import { computed, onMounted, ref, useId, useTemplateRef } from 'vue';
  import {
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
  } from '@vueuse/core';
  import {
    ISO_MAX_HEIGHT,
    barSpan,
    boxFaces,
    easeOut,
    faceFills,
    floor,
    project,
    rowDepth,
    viewBoxFor,
  } from './iso-projection';
  import type {
    IsoActive,
    IsoBar,
    IsoBarRef,
    IsoSegment,
    IsoStackedBarsProps,
    IsoStackedBarsRow,
    IsoStackedBarsSeries,
  } from './types';

  const props = withDefaults(defineProps<IsoStackedBarsProps>(), {
    title: '',
    subtitle: '',
    total: undefined,
    unit: 'units',
    note: '',
    frontScale: 0.5,
    animate: true,
    ariaLabel: '',
    class: '',
  });

  const ROWS: IsoStackedBarsRow[] = ['back', 'front'];
  const GROW_MS = 700;
  const STAGGER_MS = 55;
  const ROW_DELAY_MS = 160;

  const uid = useId();
  const patternId = (name: string): string => `${uid}-iso-${name}`;

  const fmt = new Intl.NumberFormat('en-US');

  const root = useTemplateRef<HTMLElement>('root');
  const plot = useTemplateRef<SVGSVGElement>('plot');
  const motion = usePreferredReducedMotion();

  // Elapsed animation time. Starts at 0 on the server and the client so both
  // render flat bars; onMounted either animates or jumps to the end.
  const elapsed = ref(0);
  const DONE = Number.POSITIVE_INFINITY;
  const finished = ref(false);
  let startedAt = 0;

  const { pause: pauseRaf, resume: resumeRaf } = useRafFn(
    ({ timestamp }) => {
      if (startedAt === 0) startedAt = timestamp;
      elapsed.value = timestamp - startedAt;
      const last =
        ROW_DELAY_MS + Math.max(0, props.data.length - 1) * STAGGER_MS;
      if (elapsed.value > last + GROW_MS) {
        elapsed.value = DONE;
        finished.value = true;
        pauseRaf();
      }
    },
    { immediate: false },
  );

  // The bars grow once, the first time the chart scrolls into view.
  const { stop: stopObserver, resume: watchVisibility } =
    useIntersectionObserver(
      root,
      ([entry]) => {
        if (!entry?.isIntersecting || finished.value) return;
        stopObserver();
        resumeRaf();
      },
      { threshold: 0.25, immediate: false },
    );

  onMounted(() => {
    if (!props.animate || motion.value === 'reduce') {
      elapsed.value = DONE;
      finished.value = true;
      return;
    }
    watchVisibility();
  });

  function grow(row: IsoStackedBarsRow, index: number): number {
    if (elapsed.value === DONE) return 1;
    const delay = index * STAGGER_MS + (row === 'front' ? ROW_DELAY_MS : 0);
    return easeOut((elapsed.value - delay) / GROW_MS);
  }

  const seriesByRow = computed(() => {
    const back: IsoStackedBarsSeries[] = [];
    const front: IsoStackedBarsSeries[] = [];
    for (const s of props.series) (s.row === 'back' ? back : front).push(s);
    return { back, front };
  });

  function valueOf(values: Record<string, number>, key: string): number {
    return Math.max(0, values[key] ?? 0);
  }

  function rowTotal(row: IsoStackedBarsRow, index: number): number {
    const values = props.data[index]?.values;
    if (!values) return 0;
    return seriesByRow.value[row].reduce(
      (sum, s) => sum + valueOf(values, s.key),
      0,
    );
  }

  // World height per value unit, per row.
  const unitHeight = computed(() => {
    const result = { back: 0, front: 0 };
    for (const row of ROWS) {
      let max = 0;
      for (let i = 0; i < props.data.length; i++) {
        max = Math.max(max, rowTotal(row, i));
      }
      const height =
        row === 'back' ? ISO_MAX_HEIGHT : ISO_MAX_HEIGHT * props.frontScale;
      result[row] = max > 0 ? height / max : 0;
    }
    return result;
  });

  const bars = computed<IsoBar[]>(() => {
    const out: IsoBar[] = [];
    for (const row of ROWS) {
      const [y0, y1] = rowDepth(row);
      const series = seriesByRow.value[row];
      if (series.length === 0) continue;
      props.data.forEach((datum, index) => {
        const [x0, x1] = barSpan(index);
        const g = grow(row, index);
        let z = 0;
        const segments: IsoSegment[] = [];
        for (const s of series) {
          const value = valueOf(datum.values, s.key);
          const h = value * unitHeight.value[row] * g;
          segments.push({
            key: s.key,
            label: s.label,
            value,
            faces: boxFaces({ x0, x1, y0, y1, z0: z, z1: z + h }),
            fills: faceFills(s.color),
            texture: s.texture ?? 'stripes',
          });
          z += h;
        }
        const parts = segments
          .map((s) => `${s.label} ${fmt.format(s.value)}`)
          .join(', ');
        out.push({
          id: `${row}-${index}`,
          row,
          index,
          label: datum.label,
          total: rowTotal(row, index),
          segments,
          anchor: project((x0 + x1) / 2, (y0 + y1) / 2, z),
          ariaLabel: `${datum.label}: ${parts}`,
        });
      });
    }
    return out;
  });

  const plate = computed(() => floor(props.data.length));
  const box = computed(() => viewBoxFor(props.data.length));
  const viewBox = computed(
    () =>
      `${box.value.x} ${box.value.y} ${box.value.width} ${box.value.height}`,
  );

  const headline = computed(() => {
    if (props.total !== undefined) return props.total;
    let sum = 0;
    for (let i = 0; i < props.data.length; i++) sum += rowTotal('back', i);
    return sum;
  });

  // Interaction state.
  const hovered = ref<IsoActive | null>(null);
  const focused = ref<IsoBarRef | null>(null);
  const cursor = ref<IsoBarRef>({ row: 'back', index: 0 });
  const legendHover = ref<string | null>(null);
  const legendPinned = ref<string | null>(null);

  const active = computed<IsoActive | null>(() => {
    if (hovered.value) return hovered.value;
    if (focused.value) return { ...focused.value, series: null };
    return null;
  });

  const highlight = computed(() => legendHover.value ?? legendPinned.value);

  const highlightRow = computed<IsoStackedBarsRow | null>(() => {
    const key = highlight.value;
    if (!key) return null;
    return props.series.find((s) => s.key === key)?.row ?? null;
  });

  function isActive(bar: IsoBar): boolean {
    return active.value?.row === bar.row && active.value.index === bar.index;
  }

  // Dimmed boxes fade with filters, not opacity, so the boxes behind never
  // show through the faces in front of them.
  const DIM_BAR =
    'saturate-40 contrast-60 brightness-125 dark:brightness-50 dark:contrast-100';
  const DIM_SEGMENT =
    'grayscale contrast-50 brightness-125 dark:brightness-40 dark:contrast-100';

  // Hovering a bar only lifts it, as in the reference; the legend is what dims.
  function barDimmed(bar: IsoBar): boolean {
    if (active.value) return false;
    return highlightRow.value !== null && highlightRow.value !== bar.row;
  }

  function segmentClass(segment: IsoSegment): string {
    return highlight.value && highlight.value !== segment.key
      ? DIM_SEGMENT
      : '';
  }

  function barClass(bar: IsoBar): string {
    if (isActive(bar)) return '-translate-y-1.5 brightness-110 saturate-110';
    return barDimmed(bar) ? DIM_BAR : '';
  }

  const activeBar = computed(() => {
    const a = active.value;
    if (!a) return null;
    return bars.value.find((b) => b.row === a.row && b.index === a.index);
  });

  const rowLabel = computed(() => ({
    back: props.unit,
    front: seriesByRow.value.front
      .map((s) => s.label.toLowerCase())
      .join(' + '),
  }));

  const tooltip = computed(() => {
    const bar = activeBar.value;
    const a = active.value;
    if (!bar || !a) return null;
    const segment = a.series
      ? bar.segments.find((s) => s.key === a.series)
      : undefined;
    const value = segment
      ? `${fmt.format(segment.value)} · ${segment.label.toLowerCase()}`
      : `${fmt.format(bar.total)} · ${rowLabel.value[bar.row]}`;
    return {
      title: bar.label,
      value,
      style: {
        left: `${((bar.anchor.x - box.value.x) / box.value.width) * 100}%`,
        top: `${((bar.anchor.y - 6 - box.value.y) / box.value.height) * 100}%`,
      },
    };
  });

  function onSegmentEnter(bar: IsoBar, segment: IsoSegment): void {
    hovered.value = { row: bar.row, index: bar.index, series: segment.key };
  }

  function onBarsLeave(): void {
    hovered.value = null;
  }

  function onBarFocus(bar: IsoBar): void {
    cursor.value = { row: bar.row, index: bar.index };
    focused.value = { row: bar.row, index: bar.index };
  }

  function onBarBlur(): void {
    focused.value = null;
  }

  function tabIndexFor(bar: IsoBar): number {
    return cursor.value.row === bar.row && cursor.value.index === bar.index
      ? 0
      : -1;
  }

  const activeRows = computed(() =>
    ROWS.filter((row) => seriesByRow.value[row].length > 0),
  );

  function moveTo(row: IsoStackedBarsRow, index: number): void {
    const count = props.data.length;
    if (count === 0) return;
    const next = Math.min(count - 1, Math.max(0, index));
    cursor.value = { row, index: next };
    const el = plot.value?.querySelector<SVGGElement>(
      `[data-bar="${row}-${next}"]`,
    );
    el?.focus();
  }

  function onKeydown(event: KeyboardEvent): void {
    const { row, index } = cursor.value;
    const rows = activeRows.value;
    const r = rows.indexOf(row);
    let handled = true;
    if (event.key === 'ArrowRight') moveTo(row, index + 1);
    else if (event.key === 'ArrowLeft') moveTo(row, index - 1);
    else if (event.key === 'ArrowDown')
      moveTo(rows[Math.min(rows.length - 1, r + 1)] ?? row, index);
    else if (event.key === 'ArrowUp')
      moveTo(rows[Math.max(0, r - 1)] ?? row, index);
    else if (event.key === 'Home') moveTo(row, 0);
    else if (event.key === 'End') moveTo(row, props.data.length - 1);
    else if (event.key === 'Escape') {
      if (event.target instanceof SVGElement) event.target.blur();
    } else handled = false;
    if (handled) event.preventDefault();
  }

  function onLegendEnter(key: string): void {
    legendHover.value = key;
  }

  function onLegendLeave(): void {
    legendHover.value = null;
  }

  function onLegendClick(key: string): void {
    legendPinned.value = legendPinned.value === key ? null : key;
  }

  const FACES = ['left', 'right', 'top'] as const;
</script>

<template>
  <section
    ref="root"
    :class="[
      'flex w-full max-w-md flex-col gap-4 rounded-3xl border bg-card p-2 text-card-foreground shadow-sm dark:border-white/5',
      props.class,
    ]"
    :aria-label="props.ariaLabel || props.title || 'Stacked bar chart'"
  >
    <header v-if="props.title || props.subtitle" class="px-4 pt-4">
      <h3 v-if="props.title" class="text-base/snug font-medium">
        {{ props.title }}
      </h3>
      <p v-if="props.subtitle" class="text-sm text-muted-foreground">
        {{ props.subtitle }}
      </p>
    </header>

    <div class="rounded-3xl bg-muted/60 p-5 dark:bg-white/4">
      <div class="flex items-baseline justify-between gap-3">
        <p class="flex items-baseline gap-2">
          <span
            class="font-mono text-4xl font-medium tracking-tight tabular-nums"
          >
            {{ fmt.format(headline) }}
          </span>
          <span class="text-sm text-muted-foreground">{{ props.unit }}</span>
        </p>
        <p
          v-if="props.note"
          class="text-sm font-medium text-orange-600 dark:text-[#f2742b]"
        >
          {{ props.note }}
        </p>
      </div>

      <div class="relative mt-4">
        <svg
          ref="plot"
          :viewBox="viewBox"
          class="block h-auto w-full overflow-visible"
          role="group"
          :aria-label="`${props.title || 'Chart'}: ${props.data.length} categories. Use the arrow keys to move between bars.`"
          @keydown="onKeydown"
        >
          <defs>
            <pattern
              :id="patternId('stripes')"
              width="4"
              height="4"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="1.4" height="4" fill="black" opacity="0.16" />
            </pattern>
            <pattern
              :id="patternId('dots')"
              width="4.5"
              height="4.5"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(30)"
            >
              <circle cx="2.25" cy="2.25" r="0.85" fill="black" opacity="0.2" />
            </pattern>
            <pattern
              :id="patternId('grid')"
              width="4"
              height="4"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <path
                d="M0 0H4M0 0V4"
                stroke="black"
                stroke-width="1"
                opacity="0.16"
                fill="none"
              />
            </pattern>
          </defs>

          <polygon
            :points="plate.plate"
            class="fill-black/6 stroke-black/12 dark:fill-black/40 dark:stroke-white/10"
            stroke-width="1"
          />
          <line
            v-for="(l, i) in plate.lines"
            :key="`line-${i}`"
            :x1="l.x1"
            :y1="l.y1"
            :x2="l.x2"
            :y2="l.y2"
            class="stroke-black/6 dark:stroke-white/5"
            stroke-width="1"
          />

          <g @pointerleave="onBarsLeave">
            <g
              v-for="bar in bars"
              :key="bar.id"
              :data-bar="bar.id"
              :tabindex="tabIndexFor(bar)"
              role="img"
              :aria-label="bar.ariaLabel"
              :class="[
                'cursor-pointer outline-none transition-[translate,filter] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-ring',
                barClass(bar),
              ]"
              @focus="onBarFocus(bar)"
              @blur="onBarBlur"
            >
              <g
                v-for="segment in bar.segments"
                :key="segment.key"
                :class="[
                  'transition-[filter] duration-200',
                  segmentClass(segment),
                ]"
                @pointerenter="onSegmentEnter(bar, segment)"
              >
                <polygon
                  :points="segment.faces.left"
                  :style="{
                    fill: segment.fills.left,
                    stroke: segment.fills.left,
                  }"
                  stroke-width="0.6"
                  stroke-linejoin="round"
                />
                <polygon
                  :points="segment.faces.right"
                  :style="{
                    fill: segment.fills.right,
                    stroke: segment.fills.right,
                  }"
                  stroke-width="0.6"
                  stroke-linejoin="round"
                />
                <polygon
                  :points="segment.faces.top"
                  :style="{
                    fill: segment.fills.top,
                    stroke: segment.fills.top,
                  }"
                  stroke-width="0.6"
                  stroke-linejoin="round"
                />
                <template v-if="segment.texture !== 'none'">
                  <polygon
                    v-for="face in FACES"
                    :key="face"
                    :points="segment.faces[face]"
                    :fill="`url(#${patternId(segment.texture)})`"
                    class="pointer-events-none"
                  />
                </template>
              </g>
            </g>
          </g>
        </svg>

        <div
          v-if="tooltip"
          class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-2xl border border-black/5 bg-popover/95 px-4 py-2.5 text-popover-foreground shadow-xl backdrop-blur-md dark:border-white/8 dark:bg-neutral-700/85"
          :style="tooltip.style"
          role="status"
          aria-live="polite"
        >
          <p class="font-sans text-sm whitespace-nowrap text-muted-foreground">
            {{ tooltip.title }}
          </p>
          <p class="text-base/snug font-medium whitespace-nowrap tabular-nums">
            {{ tooltip.value }}
          </p>
        </div>
      </div>

      <ul class="mt-5 flex flex-wrap gap-x-5 gap-y-2" aria-label="Legend">
        <li v-for="s in props.series" :key="s.key">
          <button
            type="button"
            :aria-pressed="legendPinned === s.key"
            :class="[
              'flex items-center gap-2 rounded-md text-sm transition-opacity focus-visible:outline-2 focus-visible:outline-ring',
              highlight && highlight !== s.key
                ? 'text-muted-foreground opacity-50'
                : 'text-muted-foreground',
            ]"
            @pointerenter="onLegendEnter(s.key)"
            @pointerleave="onLegendLeave"
            @focus="onLegendEnter(s.key)"
            @blur="onLegendLeave"
            @click="onLegendClick(s.key)"
          >
            <span class="size-3 rounded-xs" :style="{ background: s.color }" />
            {{ s.label }}
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>
