<script setup lang="ts">
  import { STEPS } from './magic-bento-data';
</script>

<template>
  <div class="magic-bento__flow" :style="{ '--n': String(STEPS.length) }">
    <div class="magic-bento__flow-trigger magic-bento__tile">
      <span class="magic-bento__flow-glyph">
        <Icon name="lucide:git-branch" class="size-3.75" />
      </span>
      <span class="magic-bento__flow-copy">
        <span class="magic-bento__flow-name">Push to main</span>
        <span class="magic-bento__flow-meta magic-bento__flow-hash"
          >a1c9f3e</span
        >
      </span>
    </div>
    <ol class="magic-bento__steps magic-bento__well">
      <li class="magic-bento__rail" aria-hidden="true">
        <span class="magic-bento__rail-fill" />
      </li>
      <li
        v-for="(step, index) in STEPS"
        :key="step.label"
        class="magic-bento__step"
        :style="{ '--i': String(index) }"
      >
        <span class="magic-bento__status">
          <span class="magic-bento__pending" />
          <span class="magic-bento__spinner" />
          <span class="magic-bento__done">
            <Icon name="lucide:check" class="size-2.75" />
          </span>
        </span>
        {{ step.label }}
        <span class="magic-bento__step-time">{{ step.time }}</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
  /* Shared artwork surfaces (declared first so later rules win ties). */
  .magic-bento__well {
    position: relative;
    box-sizing: border-box;
    border-radius: var(--mb-inner-radius);
    background: var(--mb-well);
    box-shadow: inset 0 0 0 1px var(--mb-well-edge);
  }

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

  .magic-bento__flow {
    position: relative;
    display: flex;
    min-height: 0;
    flex-direction: column;
    gap: 8px;
  }

  .magic-bento__flow-trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px 8px 8px;
  }

  .magic-bento__flow-glyph {
    display: grid;
    width: 28px;
    height: 28px;
    flex: none;
    place-items: center;
    border-radius: calc(var(--mb-inner-radius) - 2px);
    background: var(--mb-well);
    color: var(--mb-ink);
  }

  .magic-bento__flow-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
  }

  .magic-bento__flow-name {
    overflow: hidden;
    color: var(--mb-ink);
    font-size: 13px;
    font-weight: 600;
    line-height: 17px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .magic-bento__flow-meta {
    overflow: hidden;
    color: var(--mb-muted);
    font-size: 11.5px;
    line-height: 15px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .magic-bento__flow-hash {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
  }

  .magic-bento__steps {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 2px 0 0;
    list-style: none;
  }

  .magic-bento__rail {
    position: absolute;
    top: 16px;
    bottom: 16px;
    left: 21px;
    width: 1px;
    background: var(--mb-line);
  }

  .magic-bento__rail-fill {
    position: absolute;
    inset: 0;
    background: rgba(var(--mb-accent-rgb), 0.55);
    transform-origin: 50% 0;
  }

  .magic-bento__step {
    position: relative;
    display: flex;
    height: 33px;
    align-items: center;
    gap: 10px;
    padding: 0 12px 0 14px;
    color: var(--mb-ink);
    font-size: 13px;
    line-height: 16px;
  }

  .magic-bento__status {
    position: relative;
    display: grid;
    width: 16px;
    height: 16px;
    flex: none;
    place-items: center;
  }

  .magic-bento__status > * {
    grid-area: 1 / 1;
  }

  .magic-bento__pending {
    width: 12px;
    height: 12px;
    box-sizing: border-box;
    border: 1.5px dashed var(--mb-faint);
    border-radius: 50%;
    opacity: 0;
  }

  .magic-bento__spinner {
    width: 14px;
    height: 14px;
    box-sizing: border-box;
    border: 1.5px solid rgba(var(--mb-accent-rgb), 0.22);
    border-top-color: rgb(var(--mb-accent-rgb));
    border-radius: 50%;
    opacity: 0;
  }

  .magic-bento__done {
    display: grid;
    width: 16px;
    height: 16px;
    place-items: center;
    border-radius: 50%;
    background: rgb(var(--mb-accent-rgb));
    color: var(--mb-accent-ink);
  }

  .magic-bento__step-time {
    margin-left: auto;
    color: var(--mb-muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .magic-bento[data-motion] .magic-bento__pending {
    animation: magic-bento-wait 1ms linear
      calc(var(--mb-delay) + 360ms + var(--i) * 520ms) both paused;
  }

  .magic-bento[data-motion] .magic-bento__spinner {
    animation:
      magic-bento-run 520ms linear
        calc(var(--mb-delay) + 360ms + var(--i) * 520ms) both paused,
      magic-bento-spin 700ms linear infinite paused;
  }

  .magic-bento[data-motion] .magic-bento__done {
    animation: magic-bento-check 420ms var(--mb-spring)
      calc(var(--mb-delay) + 880ms + var(--i) * 520ms) both paused;
  }

  .magic-bento[data-motion] .magic-bento__step-time {
    animation: magic-bento-fade 300ms ease
      calc(var(--mb-delay) + 880ms + var(--i) * 520ms) both paused;
  }

  .magic-bento[data-motion] .magic-bento__rail-fill {
    animation: magic-bento-rail calc(var(--n) * 520ms) linear
      calc(var(--mb-delay) + 360ms) both paused;
  }

  .magic-bento[data-motion]
    .magic-bento__cell[data-state='in']
    .magic-bento__pending,
  .magic-bento[data-motion]
    .magic-bento__cell[data-state='in']
    .magic-bento__done,
  .magic-bento[data-motion]
    .magic-bento__cell[data-state='in']
    .magic-bento__step-time,
  .magic-bento[data-motion]
    .magic-bento__cell[data-state='in']
    .magic-bento__rail-fill {
    animation-play-state: running;
  }

  .magic-bento[data-motion]
    .magic-bento__cell[data-state='in']
    .magic-bento__spinner {
    animation-play-state: running, running;
  }

  @keyframes magic-bento-wait {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  @keyframes magic-bento-run {
    0% {
      opacity: 0;
    }
    1%,
    92% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  @keyframes magic-bento-spin {
    to {
      rotate: 360deg;
    }
  }

  @keyframes magic-bento-check {
    from {
      opacity: 0;
      scale: 0.4;
    }
    to {
      opacity: 1;
      scale: 1;
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

  @keyframes magic-bento-rail {
    from {
      transform: scaleY(0);
    }
    to {
      transform: scaleY(1);
    }
  }
</style>
