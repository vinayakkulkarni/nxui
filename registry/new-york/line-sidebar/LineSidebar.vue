<script setup lang="ts">
  import { ref, computed, onBeforeUnmount } from 'vue';
  import { cn } from '~/lib/utils';
  import type { LineSidebarProps, LineSidebarFalloff } from './types';

  const FALLOFF_CURVES: Record<LineSidebarFalloff, (p: number) => number> = {
    linear: (p) => p,
    smooth: (p) => p * p * (3 - 2 * p),
    sharp: (p) => p * p * p,
  };

  const props = withDefaults(defineProps<LineSidebarProps>(), {
    items: () => [
      'Overview',
      'Components',
      'Animations',
      'Backgrounds',
      'Showcase',
      'Playground',
      'Templates',
      'Changelog',
      'Community',
      'Resources',
      'Documentation',
      'Support',
    ],
    accentColor: '#A855F7',
    textColor: '#c4c4c4',
    markerColor: '#6c6c6c',
    showIndex: true,
    showMarker: true,
    proximityRadius: 100,
    maxShift: 30,
    falloff: 'smooth',
    markerLength: 60,
    markerGap: 0,
    tickScale: 0.5,
    scaleTick: true,
    itemGap: 20,
    fontSize: 1.1,
    smoothing: 100,
    class: '',
  });

  const emit = defineEmits<{
    itemClick: [index: number, label: string];
  }>();

  /** Currently active (clicked) item index; null = none. */
  const activeIndex = defineModel<number | null>({ default: null });

  const listRef = ref<HTMLUListElement | null>(null);
  const itemRefs = ref<HTMLLIElement[]>([]);
  const targets: number[] = [];
  const current: number[] = [];
  let rafId: number | null = null;
  let last = 0;

  function setItemRef(el: unknown, index: number): void {
    if (el instanceof HTMLLIElement) itemRefs.value[index] = el;
  }

  // Single rAF loop that eases every item's --effect toward its target using
  // frame-rate independent exponential smoothing, so color, shift and scale
  // all move together without staggering CSS transitions.
  function runFrame(now: number): void {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const tau = Math.max(props.smoothing, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    let moving = false;
    const els = itemRefs.value;
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (!el) continue;
      const target = Math.max(targets[i] || 0, activeIndex.value === i ? 1 : 0);
      const cur = current[i] || 0;
      const next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.0015;
      const value = settled ? target : next;
      current[i] = value;
      el.style.setProperty('--effect', value.toFixed(4));
      if (!settled) moving = true;
    }

    rafId = moving ? requestAnimationFrame(runFrame) : null;
  }

  function startLoop(): void {
    if (rafId != null) return;
    last = performance.now();
    rafId = requestAnimationFrame(runFrame);
  }

  function handlePointerMove(e: PointerEvent): void {
    const list = listRef.value;
    if (!list) return;
    const rect = list.getBoundingClientRect();
    const pointerY = e.clientY - rect.top;
    const ease = FALLOFF_CURVES[props.falloff] ?? FALLOFF_CURVES.linear;
    const els = itemRefs.value;
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (!el) continue;
      const center = el.offsetTop + el.offsetHeight / 2;
      const distance = Math.abs(pointerY - center);
      targets[i] = ease(Math.max(0, 1 - distance / props.proximityRadius));
    }
    startLoop();
  }

  function handlePointerLeave(): void {
    for (let i = 0; i < targets.length; i++) targets[i] = 0;
    startLoop();
  }

  function handleClick(index: number, label: string): void {
    activeIndex.value = index;
    emit('itemClick', index, label);
    startLoop();
  }

  onBeforeUnmount(() => {
    if (rafId != null) cancelAnimationFrame(rafId);
  });

  const rootStyle = computed(() => ({
    '--accent-color': props.accentColor,
    '--text-color': props.textColor,
    '--marker-color': props.markerColor,
    '--marker-length': `${props.markerLength}px`,
    '--marker-gap': `${props.markerGap}px`,
    '--tick-scale': `${props.tickScale}`,
    '--max-shift': `${props.maxShift}px`,
    '--item-gap': `${props.itemGap}px`,
    '--font-size': `${props.fontSize}rem`,
  }));
</script>

<template>
  <nav
    :class="
      cn(
        'line-sidebar',
        showMarker && 'line-sidebar--markers',
        scaleTick && 'line-sidebar--scale-tick',
        props.class,
      )
    "
    :style="rootStyle"
  >
    <ul
      ref="listRef"
      class="line-sidebar__list"
      @pointermove="handlePointerMove"
      @pointerleave="handlePointerLeave"
    >
      <li
        v-for="(label, index) in items"
        :key="`${label}-${index}`"
        :ref="(el) => setItemRef(el, index)"
        class="line-sidebar__item"
        :aria-current="activeIndex === index ? 'true' : undefined"
        @click="handleClick(index, label)"
      >
        <span
          v-if="showMarker"
          class="line-sidebar__marker"
          aria-hidden="true"
        />
        <span class="line-sidebar__label">
          <span v-if="showIndex" class="line-sidebar__index">
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <span class="line-sidebar__text">{{ label }}</span>
        </span>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
  .line-sidebar {
    position: relative;
    display: flex;
    justify-content: flex-start;
  }

  .line-sidebar--markers {
    padding-left: calc(var(--marker-length) + var(--marker-gap));
  }

  .line-sidebar__list {
    list-style: none;
    margin: 0;
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: var(--item-gap);
  }

  /* --effect (0..1) is driven per item by a rAF lerp in JS, so every derived
     property below reads the same continuously-animating value and stays in
     step, with no CSS transitions to stagger. */
  .line-sidebar__item {
    position: relative;
    cursor: pointer;
  }

  /* Widen the pointer target so items react a touch before the cursor arrives */
  .line-sidebar__item::before {
    content: '';
    position: absolute;
    inset: -6px -48px;
  }

  .line-sidebar__label {
    position: relative;
    display: inline-flex;
    align-items: baseline;
    font-size: var(--font-size);
    line-height: 1.2;
    color: color-mix(
      in srgb,
      var(--accent-color) calc(var(--effect, 0) * 100%),
      var(--text-color)
    );
    transform: translateX(calc(var(--effect, 0) * var(--max-shift)));
  }

  .line-sidebar__index {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    margin-right: 0.6rem;
    font-size: 0.85em;
    opacity: calc(0.55 + var(--effect, 0) * 0.45);
  }

  .line-sidebar__marker {
    position: absolute;
    top: 50%;
    left: calc(-1 * var(--marker-length) - var(--marker-gap));
    height: 1px;
    width: var(--marker-length);
    background-color: color-mix(
      in srgb,
      var(--accent-color) calc(var(--effect, 0) * 100%),
      var(--marker-color)
    );
    transform-origin: left center;
    transform: translateY(-50%) scaleX(calc(0.7 + var(--effect, 0) * 0.5));
  }

  /* Short static tick centered in the gap between two menu items */
  .line-sidebar--markers .line-sidebar__item:not(:last-child)::after {
    content: '';
    position: absolute;
    top: calc(100% + var(--item-gap) / 2);
    left: calc(-1 * var(--marker-length) - var(--marker-gap));
    height: 1px;
    width: calc(var(--marker-length) * var(--tick-scale));
    background-color: var(--marker-color);
    opacity: 0.5;
    transform: translateY(-50%);
  }

  /* When enabled, the in-between ticks grow with cursor proximity too */
  .line-sidebar--scale-tick .line-sidebar__item:not(:last-child)::after {
    transform-origin: left center;
    transform: translateY(-50%) scaleX(calc(0.7 + var(--effect, 0) * 0.6));
  }
</style>
