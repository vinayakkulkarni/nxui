<script setup lang="ts">
  import { computed, onMounted, onUpdated, ref } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    CHROMA_GRID_DEFAULT_ITEMS,
    CHROMA_GRID_THEMES,
    clampValue,
    falloffStops,
  } from './chroma-grid-theme';
  import type { ChromaGridItem, ChromaGridProps } from './types';

  const props = withDefaults(defineProps<ChromaGridProps>(), {
    items: undefined,
    columns: 3,
    minCardWidth: 180,
    gap: 12,
    radius: 260,
    softness: 0.6,
    damping: 0.45,
    fadeOut: 0.6,
    grayscale: 1,
    dim: 0.12,
    glow: 0.5,
    borderGlow: 1,
    reveal: 'spotlight',
    aspectRatio: '3 / 2',
    cardRadius: 22,
    showInfo: true,
    frame: false,
    theme: 'dark',
    class: '',
  });

  const rootRef = ref<HTMLElement | null>(null);
  const reducedMotion = usePreferredReducedMotion();

  const data = computed<ChromaGridItem[]>(() =>
    props.items?.length ? props.items : CHROMA_GRID_DEFAULT_ITEMS,
  );
  const spotlight = computed(() => props.reveal !== 'card');

  const state = {
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    power: 0,
    target: 0,
    primed: false,
  };

  function place() {
    const root = rootRef.value;
    if (!root) return;
    const box = root.getBoundingClientRect();
    root.querySelectorAll<HTMLElement>('[data-chroma-area]').forEach((node) => {
      const rect = node.getBoundingClientRect();
      node.style.setProperty('--chroma-ox', `${rect.left - box.left}px`);
      node.style.setProperty('--chroma-oy', `${rect.top - box.top}px`);
    });
  }

  function writeVars() {
    const root = rootRef.value;
    if (!root) return;
    root.style.setProperty('--chroma-x', `${state.x.toFixed(2)}px`);
    root.style.setProperty('--chroma-y', `${state.y.toFixed(2)}px`);
    root.style.setProperty('--chroma-power', state.power.toFixed(4));
  }

  const { pause, resume, isActive } = useRafFn(
    ({ delta }) => {
      const reduce = reducedMotion.value === 'reduce';
      const dt = delta > 0 ? Math.min(0.05, delta / 1000) : 1 / 60;
      const follow = reduce
        ? 1
        : 1 - Math.exp(-dt / Math.max(0.01, props.damping * 0.32));
      state.x += (state.tx - state.x) * follow;
      state.y += (state.ty - state.y) * follow;
      const span =
        state.target > state.power ? 0.1 : Math.max(0.02, props.fadeOut * 0.35);
      state.power +=
        (state.target - state.power) * (reduce ? 1 : 1 - Math.exp(-dt / span));
      const settled =
        Math.abs(state.tx - state.x) < 0.1 &&
        Math.abs(state.ty - state.y) < 0.1 &&
        Math.abs(state.target - state.power) < 0.002;
      if (settled) state.power = state.target;
      writeVars();
      if (settled) pause();
    },
    { immediate: false },
  );

  function wake() {
    if (!isActive.value) resume();
  }

  function onMove(event: PointerEvent) {
    const root = rootRef.value;
    if (!root || !spotlight.value) return;
    const box = root.getBoundingClientRect();
    state.tx = event.clientX - box.left;
    state.ty = event.clientY - box.top;
    if (!state.primed || state.power < 0.02) {
      state.x = state.tx;
      state.y = state.ty;
      state.primed = true;
    }
    state.target = 1;
    wake();
  }

  function onLeave() {
    state.target = 0;
    wake();
  }

  useEventListener(rootRef, 'pointermove', onMove);
  useEventListener(rootRef, 'pointerdown', onMove);
  useEventListener(rootRef, 'pointerleave', onLeave);
  useEventListener(rootRef, 'pointercancel', onLeave);
  useResizeObserver(rootRef, place);

  onMounted(place);
  onUpdated(place);

  const rootStyle = computed(() => ({
    ...(CHROMA_GRID_THEMES[props.theme] ?? CHROMA_GRID_THEMES.dark),
    '--chroma-cols': String(Math.max(1, Math.round(props.columns))),
    '--chroma-min': `${Math.max(80, props.minCardWidth)}px`,
    '--chroma-gap': `${Math.max(0, props.gap)}px`,
    '--chroma-r': `${Math.max(20, props.radius)}px`,
    '--chroma-stops': falloffStops(clampValue(props.softness, 0, 1)),
    '--chroma-gray': String(clampValue(props.grayscale, 0, 1)),
    '--chroma-dim': String(clampValue(props.dim, 0, 0.9)),
    '--chroma-glow': String(clampValue(props.glow, 0, 1)),
    '--chroma-border': String(clampValue(props.borderGlow, 0, 1)),
    '--chroma-fade': `${Math.max(0, props.fadeOut)}s`,
    '--chroma-ratio': props.aspectRatio,
    '--chroma-radius': `${Math.max(0, props.cardRadius)}px`,
  }));

  function cardKey(item: ChromaGridItem, index: number) {
    return `${item.title ?? ''}-${index}`;
  }

  function accentStyle(item: ChromaGridItem) {
    return { '--chroma-accent': item.accent ?? item.borderColor ?? '#ffffff' };
  }
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('chroma-grid', frame && 'has-frame', props.class)"
    :data-reveal="reveal === 'card' ? 'card' : 'spotlight'"
    :style="rootStyle"
  >
    <div class="chroma-grid-inner">
      <component
        :is="item.url ? 'a' : 'article'"
        v-for="(item, index) in data"
        :key="cardKey(item, index)"
        class="chroma-card"
        data-chroma-area=""
        :style="accentStyle(item)"
        :href="item.url || undefined"
        :target="item.url ? '_blank' : undefined"
        :rel="item.url ? 'noopener noreferrer' : undefined"
      >
        <span class="chroma-wash" aria-hidden="true" />
        <div class="chroma-media" data-chroma-area="">
          <img
            class="chroma-mono"
            :src="item.image"
            :alt="item.alt ?? item.title ?? ''"
            loading="lazy"
          />
          <img
            class="chroma-color"
            :src="item.image"
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
          <span class="chroma-media-rim" aria-hidden="true" />
        </div>
        <div
          v-if="showInfo && (item.title || item.subtitle)"
          class="chroma-info"
        >
          <span v-if="item.title" class="chroma-title">{{ item.title }}</span>
          <span v-if="item.subtitle" class="chroma-subtitle">
            {{ item.subtitle }}
          </span>
        </div>
        <span class="chroma-card-rim" aria-hidden="true" />
        <span class="chroma-card-glow" aria-hidden="true" />
      </component>
    </div>
    <span v-if="frame" class="chroma-frame-rim" aria-hidden="true" />
  </div>
</template>

<style scoped>
  .chroma-grid {
    --chroma-x: -9999px;
    --chroma-y: -9999px;
    --chroma-power: 0;
    position: relative;
    width: 100%;
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  .chroma-grid.has-frame {
    padding: 10px;
    border-radius: calc(var(--chroma-radius) + 10px);
    background: var(--chroma-frame);
    box-shadow: var(--chroma-frame-shadow);
    -webkit-backdrop-filter: blur(20px) saturate(1.6);
    backdrop-filter: blur(20px) saturate(1.6);
  }

  .chroma-frame-rim {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px var(--chroma-frame-edge),
      inset 0 1px 0 var(--chroma-frame-highlight);
    pointer-events: none;
  }

  .chroma-grid-inner {
    display: grid;
    gap: var(--chroma-gap);
    grid-template-columns: repeat(
      auto-fill,
      minmax(
        min(
          100%,
          max(
            var(--chroma-min),
            calc(
              (100% - (var(--chroma-cols) - 1) * var(--chroma-gap)) /
                var(--chroma-cols)
            )
          )
        ),
        1fr
      )
    );
  }

  .chroma-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
    padding: 8px;
    box-sizing: border-box;
    border-radius: var(--chroma-radius);
    background: var(--chroma-tile);
    box-shadow: var(--chroma-tile-shadow);
    color: var(--chroma-ink);
    text-decoration: none;
    overflow: hidden;
    isolation: isolate;
    transition: filter 0.25s ease;
  }

  .chroma-card:hover {
    filter: var(--chroma-hover);
  }

  a.chroma-card:active {
    filter: var(--chroma-press);
  }

  a.chroma-card:focus-visible {
    outline: 2px solid var(--chroma-ink);
    outline-offset: 2px;
  }

  .chroma-wash,
  .chroma-color,
  .chroma-card-glow {
    -webkit-mask-image: radial-gradient(
      circle var(--chroma-r) at calc(var(--chroma-x) - var(--chroma-ox, 0px))
        calc(var(--chroma-y) - var(--chroma-oy, 0px)),
      var(--chroma-stops)
    );
    mask-image: radial-gradient(
      circle var(--chroma-r) at calc(var(--chroma-x) - var(--chroma-ox, 0px))
        calc(var(--chroma-y) - var(--chroma-oy, 0px)),
      var(--chroma-stops)
    );
  }

  .chroma-wash {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: radial-gradient(
      130% 70% at 50% 100%,
      var(--chroma-accent),
      transparent 72%
    );
    opacity: calc(var(--chroma-glow) * var(--chroma-power) * 0.45);
  }

  .chroma-media {
    position: relative;
    z-index: 1;
    aspect-ratio: var(--chroma-ratio);
    border-radius: max(0px, calc(var(--chroma-radius) - 8px));
    overflow: hidden;
    background: var(--chroma-well);
  }

  .chroma-media img {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    user-select: none;
    -webkit-user-drag: none;
  }

  .chroma-mono {
    filter: grayscale(var(--chroma-gray))
      brightness(calc(1 - var(--chroma-dim)));
  }

  .chroma-color {
    opacity: var(--chroma-power);
  }

  .chroma-media-rim {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 1px var(--chroma-media-edge);
    pointer-events: none;
  }

  .chroma-info {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: 2px 6px 4px;
  }

  .chroma-title {
    overflow: hidden;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.01em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chroma-subtitle {
    overflow: hidden;
    font-size: 13px;
    line-height: 1.35;
    color: var(--chroma-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chroma-card-rim,
  .chroma-card-glow {
    position: absolute;
    inset: 0;
    z-index: 2;
    border-radius: inherit;
    pointer-events: none;
  }

  .chroma-card-rim {
    box-shadow:
      inset 0 0 0 1px var(--chroma-tile-edge),
      inset 0 1px 0 var(--chroma-tile-highlight);
  }

  .chroma-card-glow {
    box-shadow:
      inset 0 0 0 1px var(--chroma-accent),
      inset 0 0 16px -8px var(--chroma-accent);
    opacity: calc(var(--chroma-border) * var(--chroma-power));
  }

  .chroma-grid[data-reveal='card'] .chroma-wash,
  .chroma-grid[data-reveal='card'] .chroma-color,
  .chroma-grid[data-reveal='card'] .chroma-card-glow {
    -webkit-mask-image: none;
    mask-image: none;
    opacity: 0;
    transition: opacity var(--chroma-fade) ease;
  }

  .chroma-grid[data-reveal='card'] .chroma-card:hover .chroma-wash {
    opacity: calc(var(--chroma-glow) * 0.45);
    transition-duration: 0.3s;
  }

  .chroma-grid[data-reveal='card'] .chroma-card:hover .chroma-color {
    opacity: 1;
    transition-duration: 0.3s;
  }

  .chroma-grid[data-reveal='card'] .chroma-card:hover .chroma-card-glow {
    opacity: var(--chroma-border);
    transition-duration: 0.3s;
  }
</style>
