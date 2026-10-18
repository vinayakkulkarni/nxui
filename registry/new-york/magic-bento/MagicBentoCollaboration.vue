<script setup lang="ts">
  const LINES = ['92%', '78%', '86%', '44%'];
  const ARROW =
    'M2.2 1.6 13.4 9.9c.5.4.3 1.2-.4 1.3l-4.6.6-2.2 4.2c-.3.6-1.2.5-1.4-.1L1.2 2.4c-.2-.6.5-1.1 1-.8Z';
</script>

<template>
  <div class="magic-bento__collab magic-bento__well">
    <span class="magic-bento__doc-title">Launch plan</span>
    <div class="magic-bento__lines">
      <span
        v-for="width in LINES"
        :key="width"
        class="magic-bento__line"
        :style="{ '--w': width }"
      />
      <span
        class="magic-bento__line magic-bento__line--gap"
        :style="{ '--w': '88%' }"
      />
      <span class="magic-bento__line" :style="{ '--w': '70%' }">
        <span
          class="magic-bento__selection"
          :style="{ '--from': '18%', '--span': '58%' }"
        >
          <span class="magic-bento__caret" />
        </span>
      </span>
      <span class="magic-bento__line" :style="{ '--w': '82%' }" />
    </div>
    <!-- Structural SVG: the shared-cursor arrow is part of the artwork. -->
    <span
      class="magic-bento__cursor magic-bento__cursor--primary"
      :style="{ '--x': '58%', '--y': '52%', '--i': '0' }"
    >
      <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true">
        <path :d="ARROW" stroke-width="1.2" stroke-linejoin="round" />
      </svg>
      <span class="magic-bento__cursor-name">Maya</span>
    </span>
    <span
      class="magic-bento__cursor magic-bento__cursor--secondary"
      :style="{ '--x': '30%', '--y': '24%', '--i': '1' }"
    >
      <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true">
        <path :d="ARROW" stroke-width="1.2" stroke-linejoin="round" />
      </svg>
      <span class="magic-bento__cursor-name">Leo</span>
    </span>
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

  .magic-bento__collab {
    position: relative;
    display: flex;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
    padding: 16px 16px 22px;
  }

  .magic-bento__doc-title {
    color: var(--mb-ink);
    font-size: 13px;
    font-weight: 600;
    line-height: 18px;
  }

  .magic-bento__lines {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 18px;
  }

  .magic-bento__line {
    position: relative;
    width: var(--w);
    height: 6px;
    border-radius: 3px;
    background: var(--mb-line);
  }

  .magic-bento__line--gap {
    margin-top: 8px;
  }

  .magic-bento__selection {
    position: absolute;
    top: -4px;
    bottom: -4px;
    left: var(--from);
    width: var(--span);
    border-radius: 3px;
    background: rgba(var(--mb-accent-rgb), 0.16);
  }

  .magic-bento__caret {
    position: absolute;
    top: -5px;
    right: -1px;
    bottom: -5px;
    width: 1.5px;
    border-radius: 1px;
    background: rgb(var(--mb-accent-rgb));
  }

  .magic-bento__cursor {
    position: absolute;
    top: var(--y);
    left: var(--x);
    z-index: 2;
    display: flex;
    align-items: flex-start;
    pointer-events: none;
  }

  .magic-bento__cursor svg {
    display: block;
    flex: none;
    filter: drop-shadow(0 1px 1.5px rgba(0, 0, 0, 0.35));
  }

  .magic-bento__cursor-name {
    margin: 13px 0 0 -2px;
    padding: 2px 7px;
    border-radius: 7px;
    font-size: 10.5px;
    font-weight: 600;
    line-height: 14px;
    white-space: nowrap;
  }

  .magic-bento__cursor--primary svg path {
    fill: rgb(var(--mb-accent-rgb));
    stroke: var(--mb-cursor-stroke);
  }

  .magic-bento__cursor--primary .magic-bento__cursor-name {
    background: rgb(var(--mb-accent-rgb));
    color: var(--mb-accent-ink);
  }

  .magic-bento__cursor--secondary svg path {
    fill: var(--mb-secondary);
    stroke: var(--mb-cursor-stroke);
  }

  .magic-bento__cursor--secondary .magic-bento__cursor-name {
    background: var(--mb-secondary);
    color: var(--mb-secondary-ink);
  }

  .magic-bento[data-motion] .magic-bento__cursor--primary {
    animation:
      magic-bento-pop 420ms var(--mb-spring)
        calc(var(--mb-delay) + 600ms + var(--i) * 160ms) both paused,
      magic-bento-path-a 9s ease-in-out calc(var(--i) * -3s) infinite paused;
  }

  .magic-bento[data-motion] .magic-bento__cursor--secondary {
    animation:
      magic-bento-pop 420ms var(--mb-spring)
        calc(var(--mb-delay) + 600ms + var(--i) * 160ms) both paused,
      magic-bento-path-b 9s ease-in-out calc(var(--i) * -3s) infinite paused;
  }

  .magic-bento[data-motion] .magic-bento__selection {
    animation: magic-bento-select 900ms cubic-bezier(0.65, 0, 0.35, 1)
      calc(var(--mb-delay) + 760ms) both paused;
  }

  .magic-bento[data-motion] .magic-bento__caret {
    animation: magic-bento-blink 1.1s steps(1) infinite paused;
  }

  .magic-bento[data-motion]
    .magic-bento__cell[data-state='in']
    .magic-bento__selection {
    animation-play-state: running;
  }

  .magic-bento[data-motion]
    .magic-bento__cell[data-state='in']
    .magic-bento__cursor {
    animation-play-state: running, paused;
  }

  .magic-bento[data-motion]
    .magic-bento__cell[data-state='in']
    .magic-bento__card[data-active]
    .magic-bento__cursor {
    animation-play-state: running, running;
  }

  .magic-bento[data-motion]
    .magic-bento__card[data-active]
    .magic-bento__caret {
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

  @keyframes magic-bento-select {
    from {
      clip-path: inset(0 100% 0 0);
    }
    to {
      clip-path: inset(0 0 0 0);
    }
  }

  @keyframes magic-bento-blink {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }

  @keyframes magic-bento-path-a {
    0%,
    100% {
      translate: 0 0;
    }
    30% {
      translate: 46px -18px;
    }
    62% {
      translate: 12px 26px;
    }
  }

  @keyframes magic-bento-path-b {
    0%,
    100% {
      translate: 0 0;
    }
    35% {
      translate: -40px 14px;
    }
    70% {
      translate: -8px -22px;
    }
  }
</style>
