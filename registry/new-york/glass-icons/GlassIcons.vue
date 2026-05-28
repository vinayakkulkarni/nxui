<script setup lang="ts">
  import { cn } from '~/lib/utils';
  import type { GlassIconItem } from './types';

  withDefaults(
    defineProps<{
      items: GlassIconItem[];
      class?: string;
    }>(),
    {},
  );

  const gradientMapping: Record<string, string> = {
    blue: 'linear-gradient(hsl(223, 90%, 50%), hsl(208, 90%, 50%))',
    purple: 'linear-gradient(hsl(283, 90%, 50%), hsl(268, 90%, 50%))',
    red: 'linear-gradient(hsl(3, 90%, 50%), hsl(348, 90%, 50%))',
    indigo: 'linear-gradient(hsl(253, 90%, 50%), hsl(238, 90%, 50%))',
    orange: 'linear-gradient(hsl(43, 90%, 50%), hsl(28, 90%, 50%))',
    green: 'linear-gradient(hsl(123, 90%, 40%), hsl(108, 90%, 40%))',
  };

  function getBackgroundStyle(color?: string) {
    if (!color) return {};
    if (gradientMapping[color]) return { background: gradientMapping[color] };
    return { background: color };
  }
</script>

<template>
  <div :class="cn('glass-icons-grid', $props.class)">
    <button
      v-for="(item, index) in items"
      :key="index"
      class="glass-icon-btn"
      :class="item.customClass"
      :aria-label="item.label"
      type="button"
    >
      <span
        class="glass-icon-btn__back"
        :style="getBackgroundStyle(item.color)"
      ></span>
      <span class="glass-icon-btn__front">
        <span class="glass-icon-btn__icon" aria-hidden="true">
          <Icon :name="item.icon" class="size-6" />
        </span>
      </span>
      <span class="glass-icon-btn__label">{{ item.label }}</span>
    </button>
  </div>
</template>

<style scoped>
  .glass-icons-grid {
    display: grid;
    grid-gap: 5em;
    grid-template-columns: repeat(2, 1fr);
    margin: auto;
    padding: 3em 0;
    overflow: visible;
  }

  @media (min-width: 768px) {
    .glass-icons-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .glass-icon-btn {
    background-color: transparent;
    outline: none;
    position: relative;
    width: 4.5em;
    height: 4.5em;
    perspective: 24em;
    transform-style: preserve-3d;
    -webkit-tap-highlight-color: transparent;
    border: none;
    cursor: pointer;
  }

  .glass-icon-btn__back,
  .glass-icon-btn__front,
  .glass-icon-btn__label {
    transition:
      opacity 0.3s cubic-bezier(0.83, 0, 0.17, 1),
      transform 0.3s cubic-bezier(0.83, 0, 0.17, 1);
  }

  .glass-icon-btn__back,
  .glass-icon-btn__front {
    border-radius: 1.25em;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .glass-icon-btn__back {
    box-shadow: 0.5em -0.5em 0.75em oklch(0.15 0 0 / 0.15);
    display: block;
    transform: rotate(15deg);
    transform-origin: 100% 100%;
    will-change: transform;
  }

  .glass-icon-btn__front {
    background-color: color-mix(in oklch, var(--foreground), transparent 85%);
    box-shadow: 0 0 0 0.1em
      color-mix(in oklch, var(--foreground), transparent 70%) inset;
    backdrop-filter: blur(0.75em);
    -webkit-backdrop-filter: blur(0.75em);
    display: flex;
    transform-origin: 80% 50%;
    will-change: transform;
  }

  :is(.dark *) .glass-icon-btn__front {
    background-color: oklch(1 0 0 / 0.15);
    box-shadow: 0 0 0 0.1em oklch(1 0 0 / 0.3) inset;
  }

  .glass-icon-btn__icon {
    margin: auto;
    width: 1.5em;
    height: 1.5em;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--foreground);
  }

  :is(.dark *) .glass-icon-btn__icon {
    color: white;
  }

  .glass-icon-btn__label {
    font-size: 1em;
    white-space: nowrap;
    text-align: center;
    line-height: 2;
    opacity: 0;
    position: absolute;
    top: 100%;
    right: 0;
    left: 0;
    transform: translateY(0);
    color: var(--foreground);
  }

  .glass-icon-btn:focus-visible .glass-icon-btn__back,
  .glass-icon-btn:hover .glass-icon-btn__back {
    transform: rotate(25deg) translate3d(-0.5em, -0.5em, 0.5em);
  }

  .glass-icon-btn:focus-visible .glass-icon-btn__front,
  .glass-icon-btn:hover .glass-icon-btn__front {
    transform: translate3d(0, 0, 2em);
  }

  .glass-icon-btn:focus-visible .glass-icon-btn__label,
  .glass-icon-btn:hover .glass-icon-btn__label {
    opacity: 1;
    transform: translateY(20%);
  }
</style>
