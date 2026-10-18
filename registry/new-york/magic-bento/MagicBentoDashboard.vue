<script setup lang="ts">
  import { BARS } from './magic-bento-data';

  const PEAK = Math.max(...BARS);
</script>

<template>
  <div class="magic-bento__bars">
    <div class="magic-bento__figure">
      <span class="magic-bento__figure-value">$48.2k</span>
      <span class="magic-bento__figure-note">Weekly</span>
    </div>
    <div class="magic-bento__bars-plot">
      <span
        v-for="(bar, index) in BARS"
        :key="index"
        class="magic-bento__bar"
        :data-peak="bar === PEAK ? '' : undefined"
        :style="{ '--h': String(bar / 100), '--i': String(index) }"
      />
    </div>
  </div>
</template>

<style scoped>
  .magic-bento__bars {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
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

  .magic-bento__bars-plot {
    display: flex;
    min-height: 0;
    flex: 1;
    align-items: flex-end;
    gap: 5px;
    margin-top: 8px;
  }

  .magic-bento__bar {
    position: relative;
    height: calc(var(--h) * 100%);
    min-height: 3px;
    flex: 1;
    border-radius: 3px 3px 2px 2px;
    background: rgba(var(--mb-accent-rgb), 0.18);
    transform-origin: 50% 100%;
    transition:
      background-color 200ms ease,
      filter 200ms ease;
  }

  .magic-bento__bar[data-peak] {
    background: rgb(var(--mb-accent-rgb));
  }

  @media (hover: hover) {
    .magic-bento__bar:hover {
      background: rgba(var(--mb-accent-rgb), 0.42);
    }

    .magic-bento__bar[data-peak]:hover {
      background: rgb(var(--mb-accent-rgb));
      filter: brightness(1.1);
    }
  }

  @container (max-height: 38px) {
    .magic-bento__bars {
      visibility: hidden;
    }
  }

  .magic-bento[data-motion] .magic-bento__bar {
    animation: magic-bento-grow 760ms var(--mb-spring)
      calc(var(--mb-delay) + 200ms + var(--i) * 55ms) both paused;
  }

  .magic-bento[data-motion]
    .magic-bento__cell[data-state='in']
    .magic-bento__bar {
    animation-play-state: running;
  }

  @keyframes magic-bento-grow {
    from {
      transform: scaleY(0);
    }
    to {
      transform: scaleY(1);
    }
  }
</style>
