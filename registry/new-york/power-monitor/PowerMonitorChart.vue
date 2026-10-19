<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { cellPath } from './power-monitor';
  import type { PowerMonitorChartProps } from './types';

  const props = defineProps<PowerMonitorChartProps>();
  const cursor = defineModel<number | null>('cursor', { default: null });

  // Pixel pitch, cell size and the gap that holds the dashed baseline.
  const PITCH = 4.4;
  const CELL = 3.5;
  const GAP = 2.6;

  const plot = ref<HTMLElement | null>(null);
  const dragging = ref(false);

  const cols = computed(() => props.solar.length);
  const width = computed(() => cols.value * PITCH - (PITCH - CELL));
  const baseY = computed(() => props.rowsUp * PITCH);
  const height = computed(() => baseY.value + GAP + props.rowsDown * PITCH);
  const scale = computed(() => {
    const max = Math.max(...props.solar, 0.001);
    return max / props.rowsUp;
  });

  function solarRows(v: number): number {
    if (v <= 0) return 0;
    const rows = Math.round(v / scale.value);
    return Math.min(
      props.rowsUp,
      Math.max(v > scale.value * 0.2 ? 1 : 0, rows),
    );
  }

  function homeRows(v: number): number {
    if (v <= 0) return 0;
    return Math.min(props.rowsDown, Math.max(1, Math.round(v / scale.value)));
  }

  const paths = computed(() => {
    const off: [number, number][] = [];
    const past: [number, number][] = [];
    const future: [number, number][] = [];
    const home: [number, number][] = [];
    for (let i = 0; i < cols.value; i++) {
      const x = i * PITCH;
      const up = solarRows(props.solar[i] ?? 0);
      const down = i <= props.now ? homeRows(props.home[i] ?? 0) : 0;
      for (let r = 0; r < props.rowsUp; r++) {
        const cell: [number, number] = [x, baseY.value - (r + 1) * PITCH + 0.9];
        if (r >= up) off.push(cell);
        else if (i <= props.now) past.push(cell);
        else future.push(cell);
      }
      for (let r = 0; r < props.rowsDown; r++) {
        const cell: [number, number] = [x, baseY.value + GAP + r * PITCH];
        if (r < down) home.push(cell);
        else off.push(cell);
      }
    }
    return {
      off: cellPath(off, CELL),
      past: cellPath(past, CELL),
      future: cellPath(future, CELL),
      home: cellPath(home, CELL),
    };
  });

  const active = computed(() => cursor.value ?? props.now);
  const label = computed(() => props.columnLabels[active.value] ?? '');
  const percent = computed(() => {
    const center = active.value * PITCH + CELL / 2;
    return Math.min(92, Math.max(8, (center / width.value) * 100));
  });

  function indexAt(clientX: number): number {
    const box = plot.value?.getBoundingClientRect();
    if (!box || box.width === 0) return props.now;
    const ratio = (clientX - box.left) / box.width;
    return Math.min(
      cols.value - 1,
      Math.max(0, Math.floor(ratio * cols.value)),
    );
  }

  function onPointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' && !dragging.value) return;
    cursor.value = indexAt(event.clientX);
  }

  function onPointerDown(event: PointerEvent): void {
    dragging.value = true;
    plot.value?.setPointerCapture(event.pointerId);
    cursor.value = indexAt(event.clientX);
  }

  function onPointerUp(event: PointerEvent): void {
    dragging.value = false;
    if (plot.value?.hasPointerCapture(event.pointerId)) {
      plot.value.releasePointerCapture(event.pointerId);
    }
    if (event.pointerType !== 'mouse') cursor.value = null;
  }

  function onPointerLeave(): void {
    if (!dragging.value) cursor.value = null;
  }

  function onKeydown(event: KeyboardEvent): void {
    const step = Math.max(1, Math.round(cols.value / 12));
    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowDown: -1,
      ArrowRight: 1,
      ArrowUp: 1,
      PageDown: -step,
      PageUp: step,
    };
    let next: number | null = null;
    if (event.key in moves) next = active.value + (moves[event.key] ?? 0);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = cols.value - 1;
    else if (event.key === 'Escape') {
      cursor.value = null;
      return;
    }
    if (next === null) return;
    event.preventDefault();
    cursor.value = Math.min(cols.value - 1, Math.max(0, next));
  }

  function onBlur(): void {
    cursor.value = null;
  }
</script>

<template>
  <div class="flex flex-col gap-1.5" :style="{ '--pm-accent': props.color }">
    <div
      class="relative flex h-6 items-center justify-between text-xs tracking-wider text-(--pm-accent)/65 uppercase"
    >
      <span
        class="flex items-center gap-1 transition-opacity duration-200"
        :class="percent < 22 ? 'opacity-0' : ''"
      >
        Solar
        <span
          class="size-2.5 bg-current [clip-path:polygon(50%_0,100%_100%,0_100%)]"
        />
      </span>
      <span
        class="flex items-center gap-1 transition-opacity duration-200"
        :class="percent > 78 ? 'opacity-0' : ''"
      >
        Home
        <span
          class="size-2.5 bg-current [clip-path:polygon(0_0,100%_0,50%_100%)]"
        />
      </span>
      <span
        class="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md bg-(--pm-accent) px-1.5 py-0.5 text-sm/tight font-medium tracking-normal whitespace-nowrap text-black tabular-nums shadow-[0_0_12px_-2px_var(--pm-accent)] normal-case transition-[left] duration-100 ease-out motion-reduce:transition-none"
        :style="{ left: `${percent}%` }"
        aria-hidden="true"
      >
        {{ label }}
      </span>
    </div>

    <div
      ref="plot"
      role="slider"
      tabindex="0"
      aria-label="Chart cursor"
      :aria-valuemin="0"
      :aria-valuemax="cols - 1"
      :aria-valuenow="active"
      :aria-valuetext="label"
      class="relative cursor-crosshair touch-none rounded-sm outline-none select-none focus-visible:ring-2 focus-visible:ring-(--pm-accent)/70 focus-visible:ring-offset-4 focus-visible:ring-offset-black"
      @pointermove="onPointerMove"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerLeave"
      @keydown="onKeydown"
      @blur="onBlur"
    >
      <svg
        :viewBox="`0 0 ${width} ${height}`"
        class="block h-auto w-full overflow-visible"
        aria-hidden="true"
      >
        <path :d="paths.off" fill="#ffffff" opacity="0.055" />
        <line
          x1="0"
          :x2="width"
          :y1="baseY + GAP / 2 - 0.3"
          :y2="baseY + GAP / 2 - 0.3"
          stroke="#ffffff"
          stroke-opacity="0.35"
          stroke-width="0.45"
          stroke-dasharray="1.2 0.9"
        />
        <g :key="props.revealKey" class="power-monitor-reveal">
          <path :d="paths.future" :fill="props.color" opacity="0.32" />
          <path :d="paths.home" :fill="props.homeColor" opacity="0.82" />
          <path :d="paths.past" :fill="props.color" />
        </g>
        <rect
          :x="-0.6"
          y="-0.6"
          :width="CELL + 1.2"
          :height="height + 1.2"
          rx="0.8"
          :fill="props.color"
          fill-opacity="0.12"
          :stroke="props.color"
          stroke-width="0.55"
          class="transition-transform duration-100 ease-out motion-reduce:transition-none"
          :style="{ transform: `translateX(${active * PITCH}px)` }"
        />
      </svg>
    </div>

    <div
      class="relative mt-1 h-5 text-sm tracking-wider text-(--pm-accent)/55 tabular-nums"
      aria-hidden="true"
    >
      <span
        v-for="(tick, i) in props.ticks"
        :key="`${tick.label}-${i}`"
        class="absolute top-0"
        :class="
          tick.at <= 0.01
            ? 'left-0'
            : tick.at >= 0.99
              ? 'right-0'
              : '-translate-x-1/2'
        "
        :style="
          tick.at > 0.01 && tick.at < 0.99
            ? { left: `${tick.at * 100}%` }
            : undefined
        "
      >
        {{ tick.label }}
      </span>
    </div>
  </div>
</template>

<style scoped>
  .power-monitor-reveal {
    animation: power-monitor-reveal 520ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  @keyframes power-monitor-reveal {
    from {
      clip-path: inset(0 100% 0 0);
    }
    to {
      clip-path: inset(0 0 0 0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .power-monitor-reveal {
      animation: none;
    }
  }
</style>
