<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { CHART, clamp, curve, sampleAt } from './magic-bento-data';

  const LAST = `${(CHART[CHART.length - 1] ?? 0).toFixed(1)}k`;

  const plotRef = ref<HTMLElement | null>(null);
  const width = ref(0);
  const height = ref(0);
  const scrubbing = ref(false);
  const scrubX = ref(0);
  const scrubY = ref(0);
  const value = ref(LAST);
  const note = ref('+18%');

  useResizeObserver(plotRef, () => {
    const plot = plotRef.value;
    if (!plot) return;
    if (plot.clientWidth !== width.value) width.value = plot.clientWidth;
    if (plot.clientHeight !== height.value) height.value = plot.clientHeight;
  });

  const shape = computed(() =>
    width.value > 4 && height.value > 4
      ? curve(CHART, width.value, height.value)
      : null,
  );
  const viewBox = computed(() => `0 0 ${width.value} ${height.value}`);

  function scrub(event: PointerEvent) {
    const plot = plotRef.value;
    if (!shape.value || !plot) return;
    const rect = plot.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const position = (x / Math.max(1, rect.width)) * (CHART.length - 1);
    const index = Math.floor(position);
    const next = Math.min(CHART.length - 1, index + 1);
    const from = CHART[index] ?? 0;
    const to = CHART[next] ?? 0;
    scrubbing.value = true;
    scrubX.value = x;
    scrubY.value = sampleAt(shape.value.samples, x);
    value.value = `${(from + (to - from) * (position - index)).toFixed(1)}k`;
    note.value = `Oct ${Math.round(position) + 1}`;
  }

  function rest() {
    scrubbing.value = false;
    value.value = LAST;
    note.value = '+18%';
  }
</script>

<template>
  <div
    class="magic-bento__chart"
    :data-scrub="scrubbing ? '' : undefined"
    @pointermove="scrub"
    @pointerdown="scrub"
    @pointerleave="rest"
  >
    <div class="magic-bento__figure">
      <span class="magic-bento__figure-value">{{ value }}</span>
      <span class="magic-bento__figure-note">{{ note }}</span>
    </div>
    <div ref="plotRef" class="magic-bento__plot">
      <svg v-if="shape" :viewBox="viewBox" aria-hidden="true">
        <path class="magic-bento__chart-area" :d="shape.area" />
        <path class="magic-bento__chart-line" :d="shape.line" pathLength="1" />
      </svg>
      <span
        class="magic-bento__scrub"
        :style="{ transform: `translateX(${scrubX.toFixed(1)}px)` }"
      >
        <span
          class="magic-bento__scrub-dot"
          :style="{ transform: `translateY(${scrubY.toFixed(1)}px)` }"
        />
      </span>
    </div>
  </div>
</template>

<style scoped>
  .magic-bento__chart {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    touch-action: pan-y;
  }

  .magic-bento__figure {
    display: flex;
    min-width: 0;
    align-items: baseline;
    gap: 6px;
    white-space: nowrap;
  }

  .magic-bento__figure-value {
    color: var(--mb-ink);
    font-size: 15px;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 18px;
  }

  .magic-bento__figure-note {
    min-width: 0;
    overflow: hidden;
    color: var(--mb-muted);
    text-overflow: ellipsis;
    font-size: 11.5px;
    font-variant-numeric: tabular-nums;
    line-height: 14px;
  }

  .magic-bento__plot {
    position: relative;
    min-height: 0;
    flex: 1;
    margin-top: 6px;
  }

  .magic-bento__plot svg {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .magic-bento__chart-area {
    fill: rgba(var(--mb-accent-rgb), 0.14);
  }

  .magic-bento__chart-line {
    fill: none;
    stroke: rgb(var(--mb-accent-rgb));
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.6;
  }

  .magic-bento__scrub {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 1px;
    background: linear-gradient(
      to bottom,
      rgba(var(--mb-accent-rgb), 0),
      rgba(var(--mb-accent-rgb), 0.35)
    );
    opacity: 0;
    pointer-events: none;
    transition: opacity 180ms ease;
  }

  .magic-bento__scrub-dot {
    position: absolute;
    top: 0;
    left: 0;
    width: 7px;
    height: 7px;
    margin: -3.5px 0 0 -3px;
    border-radius: 50%;
    background: rgb(var(--mb-accent-rgb));
    box-shadow: 0 0 0 3px var(--mb-ring);
  }

  .magic-bento__chart[data-scrub] .magic-bento__scrub {
    opacity: 1;
  }

  @container (max-height: 38px) {
    .magic-bento__chart {
      visibility: hidden;
    }
  }

  .magic-bento[data-motion] .magic-bento__chart-line {
    stroke-dasharray: 1;
    animation: magic-bento-draw 1100ms cubic-bezier(0.65, 0, 0.35, 1)
      calc(var(--mb-delay) + 220ms) both paused;
  }

  .magic-bento[data-motion] .magic-bento__chart-area {
    animation: magic-bento-fade 700ms ease calc(var(--mb-delay) + 700ms) both
      paused;
  }

  .magic-bento[data-motion]
    .magic-bento__cell[data-state='in']
    .magic-bento__chart-line,
  .magic-bento[data-motion]
    .magic-bento__cell[data-state='in']
    .magic-bento__chart-area {
    animation-play-state: running;
  }

  @keyframes magic-bento-draw {
    from {
      stroke-dashoffset: 1;
    }
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes magic-bento-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
