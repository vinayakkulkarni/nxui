<script setup lang="ts">
  import { computed, ref, useId, useTemplateRef } from 'vue';
  import PatternDonutPattern from './PatternDonutPattern.vue';
  import { CENTER, sectorPath } from './pattern-donut-geometry';
  import type {
    PatternDonutHover,
    PatternDonutInsight,
    PatternDonutKeyItem,
    PatternDonutPatternKind,
    PatternDonutProps,
    PatternDonutSegment,
    PatternDonutSlice,
  } from './types';

  const props = withDefaults(defineProps<PatternDonutProps>(), {
    title: '',
    description: '',
    unit: '',
    delta: undefined,
    deltaLabel: '',
    lowerIsBetter: true,
    patternLabels: () => ['top cause', '2nd', '3rd'],
    patterns: () => [
      'lines',
      'dots',
      'checker',
      'crosshatch',
      'grid',
      'stripes',
    ],
    insightThreshold: 0.75,
    insightSuffix: 'of lost minutes',
    hideInsight: false,
    locale: 'en-US',
    class: '',
  });

  /** Label of the pinned category, or `null` when nothing is pinned. */
  const selected = defineModel<string | null>('selected', { default: null });

  const uid = useId();

  // Ring radii in view-box units (240 × 240).
  const INNER_START = 43;
  const INNER_END = 71;
  const BAND = 75.5;
  const BAND_WIDTH = 9;
  const OUTER_START = 80;
  const OUTER_END = 112;
  const INNER_GAP = 2.4;
  const CORNER = 2.5;
  const OUTER_GAP = 2.2;
  const OUTLINE = 0.9;
  const TAU = Math.PI * 2;

  const total = computed(() =>
    props.data.reduce((sum, item) => sum + Math.max(0, item.value), 0),
  );

  function kindFor(rank: number): PatternDonutPatternKind {
    return props.patterns[rank % props.patterns.length] ?? 'lines';
  }

  const geometry = computed(() => {
    const slices: PatternDonutSlice[] = [];
    const segments: PatternDonutSegment[] = [];
    const sum = total.value;
    if (sum <= 0) return { slices, segments };
    let angle = 0;
    props.data.forEach((item, index) => {
      const value = Math.max(0, item.value);
      const span = (value / sum) * TAU;
      const start = angle;
      const end = angle + span;
      angle = end;
      slices.push({
        index,
        label: item.label,
        value,
        color: item.color,
        share: value / sum,
        path: sectorPath(
          INNER_START + CORNER,
          INNER_END - CORNER,
          start,
          end,
          INNER_GAP / 2 + CORNER,
        ),
      });

      const causes = (item.causes ?? [])
        .filter((cause) => cause.value > 0)
        .sort((a, b) => b.value - a.value);
      const parts = causes.length
        ? causes
        : [{ label: item.label, value: value || 1 }];
      const causeSum = parts.reduce((acc, cause) => acc + cause.value, 0);
      let cursor = start;
      parts.forEach((cause, rank) => {
        const width = (cause.value / causeSum) * span;
        const kind = kindFor(rank);
        segments.push({
          key: `${index}-${rank}`,
          index,
          cause: cause.label,
          value: cause.value,
          color: item.color,
          rank,
          kind,
          patternId: `${uid}-p-${index}-${rank}`,
          path: sectorPath(
            OUTER_START + OUTLINE / 2,
            OUTER_END - OUTLINE / 2,
            cursor,
            cursor + width,
            OUTER_GAP / 2 + OUTLINE / 2,
          ),
        });
        cursor += width;
      });
    });
    return { slices, segments };
  });

  const slices = computed(() => geometry.value.slices);
  const segments = computed(() => geometry.value.segments);

  // Interaction state: hover/focus wins, then the pinned slice.
  const hovered = ref<PatternDonutHover | null>(null);
  const cursor = ref(0);

  const pinnedIndex = computed(() => {
    if (selected.value === null) return null;
    const index = props.data.findIndex((item) => item.label === selected.value);
    return index === -1 ? null : index;
  });

  const emphasis = computed(
    () => hovered.value?.index ?? pinnedIndex.value ?? null,
  );

  const largestIndex = computed(() => {
    let best = 0;
    props.data.forEach((item, index) => {
      if (item.value > (props.data[best]?.value ?? 0)) best = index;
    });
    return best;
  });

  const shown = computed(
    () => slices.value[emphasis.value ?? largestIndex.value] ?? null,
  );

  const shownCause = computed(() => {
    const hover = hovered.value;
    if (!hover?.cause) return null;
    return (
      segments.value.find(
        (segment) =>
          segment.index === hover.index && segment.cause === hover.cause,
      ) ?? null
    );
  });

  function dimmed(index: number): boolean {
    return emphasis.value !== null && emphasis.value !== index;
  }

  function causeDimmed(segment: PatternDonutSegment): boolean {
    const hover = hovered.value;
    if (hover?.cause) {
      return !(segment.index === hover.index && segment.cause === hover.cause);
    }
    return dimmed(segment.index);
  }

  const number = computed(() => new Intl.NumberFormat(props.locale));

  function format(value: number): string {
    return number.value.format(value);
  }

  function percent(share: number): string {
    return String(Math.round(share * 100));
  }

  const totalText = computed(() =>
    props.unit ? `${format(total.value)} ${props.unit}` : format(total.value),
  );

  const deltaGood = computed(() => {
    if (props.delta === undefined) return false;
    return props.lowerIsBetter ? props.delta <= 0 : props.delta >= 0;
  });

  const deltaText = computed(() => {
    if (props.delta === undefined) return '';
    const magnitude = format(Math.abs(props.delta));
    const sign = props.delta < 0 ? '−' : props.delta > 0 ? '+' : '';
    return `${sign}${magnitude} %`;
  });

  const insight = computed<PatternDonutInsight>(() => {
    const sum = total.value;
    if (sum <= 0) return { count: 0, share: 0 };
    const values = props.data
      .map((item) => Math.max(0, item.value))
      .sort((a, b) => b - a);
    let acc = 0;
    let count = 0;
    for (const value of values) {
      acc += value;
      count += 1;
      if (acc / sum >= props.insightThreshold) break;
    }
    return { count, share: acc / sum };
  });

  const keyItems = computed<PatternDonutKeyItem[]>(() => {
    const deepest = props.data.reduce(
      (max, item) => Math.max(max, item.causes?.length ?? 1),
      1,
    );
    return props.patternLabels.slice(0, deepest).map((label, rank) => ({
      label,
      kind: kindFor(rank),
      id: `${uid}-k-${rank}`,
    }));
  });

  // Keyboard: arrows move between slices (or legend items) with a roving
  // tab stop; Enter/Space pins, Escape clears the pin.
  const chart = useTemplateRef<SVGSVGElement>('chart');
  const legend = useTemplateRef<HTMLElement>('legend');

  function focusIn(container: Element | null, index: number): void {
    const target = container?.querySelector(`[data-index="${index}"]`);
    if (target instanceof HTMLElement || target instanceof SVGElement) {
      target.focus();
    }
  }

  function moveFrom(index: number, event: KeyboardEvent): number | null {
    const count = props.data.length;
    if (count === 0) return null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      return (index + 1) % count;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      return (index - 1 + count) % count;
    }
    if (event.key === 'Home') return 0;
    if (event.key === 'End') return count - 1;
    return null;
  }

  function toggle(index: number): void {
    const label = props.data[index]?.label ?? null;
    selected.value = selected.value === label ? null : label;
  }

  function onSliceKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle(cursor.value);
      return;
    }
    onKey(event, chart.value);
  }

  function onLegendKey(event: KeyboardEvent): void {
    onKey(event, legend.value);
  }

  function onKey(event: KeyboardEvent, container: Element | null): void {
    if (event.key === 'Escape') {
      selected.value = null;
      return;
    }
    const next = moveFrom(cursor.value, event);
    if (next === null) return;
    event.preventDefault();
    cursor.value = next;
    focusIn(container, next);
  }

  function hoverSlice(index: number): void {
    cursor.value = index;
    hovered.value = { index, cause: null };
  }

  function hoverCause(segment: PatternDonutSegment): void {
    hovered.value = { index: segment.index, cause: segment.cause };
  }

  function clearHover(): void {
    hovered.value = null;
  }

  function sliceLabel(slice: PatternDonutSlice): string {
    const unit = props.unit ? ` ${props.unit}` : '';
    return `${slice.label}: ${format(slice.value)}${unit}, ${percent(slice.share)}%`;
  }

  function causeLabel(segment: PatternDonutSegment): string {
    const unit = props.unit ? ` ${props.unit}` : '';
    const parent = props.data[segment.index]?.label ?? '';
    return `${parent} · ${segment.cause}: ${format(segment.value)}${unit}`;
  }

  const textColor = (color: string): Record<string, string> => ({
    '--pd-color': color,
  });
</script>

<template>
  <section
    :class="[
      'w-full max-w-sm rounded-3xl border bg-card p-2 text-card-foreground shadow-sm dark:border-white/5',
      props.class,
    ]"
    :aria-label="props.title || undefined"
  >
    <header v-if="props.title || props.description" class="px-4 pt-3 pb-4">
      <h3 v-if="props.title" class="text-base/tight font-medium">
        {{ props.title }}
      </h3>
      <p v-if="props.description" class="mt-1 text-sm text-muted-foreground">
        {{ props.description }}
      </p>
    </header>

    <div
      class="rounded-[1.25rem] border border-border/60 bg-muted/40 px-4 pt-5 pb-4 dark:border-white/4 dark:bg-white/3"
    >
      <p class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span
          class="font-mono text-[1.75rem]/none font-medium tracking-tight tabular-nums"
        >
          {{ totalText }}
        </span>
        <span
          v-if="props.delta !== undefined"
          :class="[
            'text-sm font-medium tabular-nums',
            deltaGood
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400',
          ]"
        >
          {{ deltaText }}
          <template v-if="props.deltaLabel">{{ props.deltaLabel }}</template>
        </span>
      </p>

      <div class="relative mx-auto mt-5 aspect-square w-full max-w-72">
        <svg
          ref="chart"
          viewBox="0 0 240 240"
          class="size-full overflow-visible"
          role="group"
          :aria-label="`${props.title || 'Breakdown'} chart`"
        >
          <defs>
            <PatternDonutPattern
              v-for="segment in segments"
              :id="segment.patternId"
              :key="segment.patternId"
              :kind="segment.kind"
              :color="segment.color"
            />
            <radialGradient
              :id="`${uid}-shade`"
              gradientUnits="userSpaceOnUse"
              :cx="CENTER"
              :cy="CENTER"
              :r="INNER_END"
            >
              <stop offset="0.62" stop-color="#000" stop-opacity="0.16" />
              <stop offset="0.78" stop-color="#000" stop-opacity="0" />
              <stop offset="0.93" stop-color="#fff" stop-opacity="0" />
              <stop offset="1" stop-color="#fff" stop-opacity="0.22" />
            </radialGradient>
            <mask :id="`${uid}-inner`" maskUnits="userSpaceOnUse">
              <circle
                class="pd-sweep"
                :cx="CENTER"
                :cy="CENTER"
                r="60"
                fill="none"
                stroke="#fff"
                stroke-width="120"
                pathLength="100"
                stroke-dasharray="100 100"
                :transform="`rotate(-90 ${CENTER} ${CENTER})`"
              />
            </mask>
            <mask :id="`${uid}-outer`" maskUnits="userSpaceOnUse">
              <circle
                class="pd-sweep pd-sweep-late"
                :cx="CENTER"
                :cy="CENTER"
                r="60"
                fill="none"
                stroke="#fff"
                stroke-width="120"
                pathLength="100"
                stroke-dasharray="100 100"
                :transform="`rotate(-90 ${CENTER} ${CENTER})`"
              />
            </mask>
          </defs>

          <circle
            :cx="CENTER"
            :cy="CENTER"
            :r="BAND"
            fill="none"
            :stroke-width="BAND_WIDTH"
            class="stroke-foreground/8 dark:stroke-black/40"
          />

          <g :mask="`url(#${uid}-outer)`">
            <path
              v-for="segment in segments"
              :key="segment.key"
              :d="segment.path"
              :fill="`url(#${segment.patternId})`"
              :stroke="segment.color"
              :stroke-width="OUTLINE"
              stroke-linejoin="round"
              :class="[
                'pd-fade cursor-pointer',
                causeDimmed(segment) ? 'opacity-30' : 'opacity-100',
              ]"
              @mouseenter="hoverCause(segment)"
              @mouseleave="clearHover"
              @click="toggle(segment.index)"
            >
              <title>{{ causeLabel(segment) }}</title>
            </path>
          </g>

          <g :mask="`url(#${uid}-inner)`">
            <g
              v-for="slice in slices"
              :key="slice.index"
              role="button"
              :data-index="slice.index"
              :tabindex="slice.index === cursor ? 0 : -1"
              :aria-label="sliceLabel(slice)"
              :aria-pressed="pinnedIndex === slice.index"
              :class="[
                'pd-fade cursor-pointer outline-none',
                dimmed(slice.index) ? 'opacity-30' : 'opacity-100',
              ]"
              @mouseenter="hoverSlice(slice.index)"
              @focus="hoverSlice(slice.index)"
              @blur="clearHover"
              @mouseleave="clearHover"
              @click="toggle(slice.index)"
              @keydown="onSliceKey"
            >
              <path
                :d="slice.path"
                fill="none"
                :stroke-width="CORNER * 2 + 3.5"
                stroke-linejoin="round"
                class="pd-ring pointer-events-none stroke-ring opacity-0"
              />
              <path
                :d="slice.path"
                :fill="slice.color"
                :stroke="slice.color"
                :stroke-width="CORNER * 2"
                stroke-linejoin="round"
              />
              <path
                :d="slice.path"
                :fill="`url(#${uid}-shade)`"
                :stroke="`url(#${uid}-shade)`"
                :stroke-width="CORNER * 2"
                stroke-linejoin="round"
                class="pointer-events-none"
              />
            </g>
          </g>
        </svg>

        <div
          class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
          aria-live="polite"
        >
          <template v-if="shown">
            <span
              class="max-w-24 truncate text-base/tight font-medium text-[color-mix(in_oklab,var(--pd-color)_68%,black)] dark:text-(--pd-color)"
              :style="textColor(shown.color)"
            >
              {{ shown.label }}
            </span>
            <span class="mt-1 text-4xl/none font-semibold tabular-nums">
              {{ percent(shown.share)
              }}<span class="text-xl font-medium">%</span>
            </span>
            <span
              v-if="shownCause"
              class="mt-1 max-w-24 truncate text-[0.6875rem]/tight text-muted-foreground"
            >
              {{ shownCause.cause }} · {{ format(shownCause.value) }}
            </span>
          </template>
        </div>
      </div>

      <ul
        ref="legend"
        class="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1"
        :aria-label="`${props.title || 'Breakdown'} legend`"
      >
        <li v-for="slice in slices" :key="slice.index">
          <button
            type="button"
            :data-index="slice.index"
            :tabindex="slice.index === cursor ? 0 : -1"
            :aria-pressed="pinnedIndex === slice.index"
            :aria-label="sliceLabel(slice)"
            :class="[
              'pd-fade inline-flex items-center gap-2 rounded-md py-0.5 pr-1.5 text-sm transition-opacity focus-visible:outline-2 focus-visible:outline-ring',
              dimmed(slice.index) ? 'opacity-40' : 'opacity-100',
            ]"
            @mouseenter="hoverSlice(slice.index)"
            @mouseleave="clearHover"
            @focus="hoverSlice(slice.index)"
            @blur="clearHover"
            @click="toggle(slice.index)"
            @keydown="onLegendKey"
          >
            <span
              class="size-2.5 shrink-0 rounded-[3px]"
              :style="{ backgroundColor: slice.color }"
              aria-hidden="true"
            />
            <span class="text-muted-foreground">{{ slice.label }}</span>
            <span class="font-mono font-medium text-foreground tabular-nums">
              {{ format(slice.value) }}
            </span>
          </button>
        </li>
      </ul>

      <ul
        v-if="keyItems.length"
        class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground"
        aria-label="Pattern key"
      >
        <li
          v-for="item in keyItems"
          :key="item.id"
          class="inline-flex items-center gap-2"
        >
          <svg
            viewBox="0 0 12 12"
            class="size-3.5 rounded-[3px] text-foreground/85"
            aria-hidden="true"
          >
            <defs>
              <PatternDonutPattern
                :id="item.id"
                :kind="item.kind"
                color="currentColor"
                :size="3.4"
                :tint="0"
              />
            </defs>
            <rect width="12" height="12" :fill="`url(#${item.id})`" />
          </svg>
          {{ item.label }}
        </li>
      </ul>

      <p
        v-if="!props.hideInsight && insight.count > 0"
        class="mt-4 flex items-center gap-3 rounded-full bg-blue-50 px-4 py-2.5 text-sm text-blue-950 ring-1 ring-blue-200/70 dark:bg-[#17305a] dark:text-white dark:ring-0"
      >
        <Icon
          name="lucide:sparkle"
          class="size-4 shrink-0 text-blue-500 dark:text-blue-300"
        />
        <slot name="insight" :count="insight.count" :share="insight.share">
          <span>
            {{ insight.count }}
            {{ insight.count === 1 ? 'reason causes' : 'reasons cause' }}
            {{ percent(insight.share) }} % {{ props.insightSuffix }}
          </span>
        </slot>
      </p>
    </div>
  </section>
</template>

<style scoped>
  .pd-sweep {
    animation: pd-sweep 1000ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .pd-sweep-late {
    animation-duration: 1150ms;
    animation-delay: 120ms;
  }

  .pd-fade {
    transition: opacity 200ms ease;
  }

  g:focus-visible > .pd-ring {
    opacity: 1;
  }

  @keyframes pd-sweep {
    from {
      stroke-dashoffset: 100;
    }
    to {
      stroke-dashoffset: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pd-sweep {
      animation: none;
    }

    .pd-fade {
      transition: none;
    }
  }
</style>
