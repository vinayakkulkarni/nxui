<script setup lang="ts">
  import { TOGGLES } from './magic-bento-data';
</script>

<template>
  <div class="magic-bento__shield">
    <div
      v-for="(toggle, index) in TOGGLES"
      :key="toggle.label"
      class="magic-bento__setting magic-bento__tile"
    >
      <Icon :name="toggle.icon" class="size-3.5" />
      <span class="magic-bento__setting-label">{{ toggle.label }}</span>
      <span class="magic-bento__switch" :style="{ '--i': String(index) }" />
    </div>
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

  .magic-bento__shield {
    display: flex;
    width: 100%;
    max-width: 320px;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
  }

  .magic-bento__setting {
    display: flex;
    height: 32px;
    flex: none;
    align-items: center;
    gap: 8px;
    padding: 0 8px 0 10px;
    color: var(--mb-ink);
    font-size: 12.5px;
    font-weight: 500;
    line-height: 16px;
  }

  .magic-bento__setting-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @container (max-height: 78px) {
    .magic-bento__setting ~ .magic-bento__setting {
      display: none;
    }
  }

  @container (max-height: 38px) {
    .magic-bento__shield {
      visibility: hidden;
    }
  }

  .magic-bento__switch {
    position: relative;
    width: 26px;
    height: 16px;
    flex: none;
    margin-left: auto;
    border-radius: 8px;
    background: rgb(var(--mb-accent-rgb));
    transition: background-color 220ms ease;
  }

  .magic-bento__switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--mb-accent-ink);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    transform: translateX(10px);
    transition: transform 320ms var(--mb-spring);
  }

  .magic-bento[data-motion] .magic-bento__switch {
    animation: magic-bento-switch-track 420ms ease
      calc(var(--mb-delay) + 520ms + var(--i) * 200ms) both paused;
  }

  .magic-bento[data-motion] .magic-bento__switch::after {
    animation: magic-bento-switch-knob 520ms var(--mb-spring)
      calc(var(--mb-delay) + 520ms + var(--i) * 200ms) both paused;
  }

  .magic-bento[data-motion]
    .magic-bento__cell[data-state='in']
    .magic-bento__switch,
  .magic-bento[data-motion]
    .magic-bento__cell[data-state='in']
    .magic-bento__switch::after {
    animation-play-state: running;
  }

  @keyframes magic-bento-switch-track {
    from {
      background-color: var(--mb-line);
    }
    to {
      background-color: rgb(var(--mb-accent-rgb));
    }
  }

  @keyframes magic-bento-switch-knob {
    from {
      background: var(--mb-ink);
      transform: none;
    }
    to {
      background: var(--mb-accent-ink);
      transform: translateX(10px);
    }
  }
</style>
