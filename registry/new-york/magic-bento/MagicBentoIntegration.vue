<script setup lang="ts">
  import { APPS } from './magic-bento-data';
</script>

<template>
  <div class="magic-bento__hub">
    <svg
      class="magic-bento__hub-links"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        v-for="app in APPS"
        :key="app.icon"
        :x1="app.x"
        :y1="app.y"
        x2="50"
        y2="51"
        pathLength="1"
      />
    </svg>
    <span
      v-for="(app, index) in APPS"
      :key="`packet-${app.icon}`"
      class="magic-bento__packet"
      :style="{ '--x': `${app.x}%`, '--y': `${app.y}%`, '--i': String(index) }"
    />
    <span
      v-for="(app, index) in APPS"
      :key="app.icon"
      class="magic-bento__hub-node magic-bento__tile"
      :style="{
        '--x': `${app.x}%`,
        '--y': `${app.y}%`,
        '--s': '26px',
        '--i': String(index + 1),
      }"
    >
      <Icon :name="app.icon" class="size-3.5" />
    </span>
    <span
      class="magic-bento__hub-node magic-bento__tile"
      :style="{ '--x': '50%', '--y': '51%', '--s': '34px', '--i': '0' }"
    >
      <Icon name="lucide:sparkles" class="size-4.25" />
    </span>
  </div>
</template>

<style scoped>
  /* Shared artwork surfaces (declared first so later rules win ties). */
  .magic-bento__tile {
    position: relative;
    box-sizing: border-box;
    border-radius: var(--mb-inner-radius);
    background: var(--mb-tile);
    box-shadow: var(--mb-tile-shadow);
  }

  .magic-bento__tile::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px var(--mb-tile-edge),
      inset 0 1px 0 var(--mb-tile-highlight);
    pointer-events: none;
  }

  .magic-bento__hub {
    position: relative;
    width: 100%;
    max-width: 240px;
    min-height: 0;
    flex: 1;
    margin: 0 auto;
  }

  .magic-bento__hub-links {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .magic-bento__hub-links line {
    stroke: var(--mb-line);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .magic-bento__hub-node {
    --size: min(var(--s), 30cqh);
    position: absolute;
    top: var(--y);
    left: var(--x);
    display: grid;
    width: var(--size);
    height: var(--size);
    place-items: center;
    margin: calc(var(--size) * -0.5) 0 0 calc(var(--size) * -0.5);
    color: var(--mb-ink);
  }

  .magic-bento__hub-node.magic-bento__tile {
    border-radius: calc(var(--size) * 0.3);
  }

  .magic-bento__packet {
    position: absolute;
    top: var(--y);
    left: var(--x);
    width: 4px;
    height: 4px;
    margin: -2px 0 0 -2px;
    border-radius: 50%;
    background: rgb(var(--mb-accent-rgb));
    opacity: 0;
  }

  @container (max-height: 60px) {
    .magic-bento__hub {
      display: none;
    }
  }

  .magic-bento[data-motion] .magic-bento__hub-node {
    animation: magic-bento-pop 520ms var(--mb-spring)
      calc(var(--mb-delay) + 200ms + var(--i) * 70ms) both paused;
  }

  .magic-bento[data-motion] .magic-bento__hub-links line {
    stroke-dasharray: 1;
    animation: magic-bento-draw 700ms cubic-bezier(0.65, 0, 0.35, 1)
      calc(var(--mb-delay) + 360ms) both paused;
  }

  .magic-bento[data-motion]
    .magic-bento__card[data-active]
    .magic-bento__packet {
    animation: magic-bento-packet 1.8s cubic-bezier(0.45, 0, 0.55, 1)
      calc(var(--i) * 0.45s) infinite;
  }

  .magic-bento[data-motion]
    .magic-bento__cell[data-state='in']
    .magic-bento__hub-node,
  .magic-bento[data-motion]
    .magic-bento__cell[data-state='in']
    .magic-bento__hub-links
    line {
    animation-play-state: running;
  }

  @keyframes magic-bento-pop {
    from {
      opacity: 0;
      scale: 0.6;
    }
    to {
      opacity: 1;
      scale: 1;
    }
  }

  @keyframes magic-bento-draw {
    from {
      stroke-dashoffset: 1;
    }
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes magic-bento-packet {
    0% {
      top: var(--y);
      left: var(--x);
      opacity: 0;
    }
    15% {
      opacity: 1;
    }
    80% {
      opacity: 1;
    }
    100% {
      top: 50%;
      left: 50%;
      opacity: 0;
    }
  }
</style>
