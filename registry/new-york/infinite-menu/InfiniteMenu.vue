<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createInfiniteMenuEngine } from './infinite-menu-engine';
  import {
    INFINITE_MENU_DIRECTIONS,
    clamp,
    luminance,
  } from './infinite-menu-math';
  import type {
    InfiniteMenuEmits,
    InfiniteMenuEngine,
    InfiniteMenuLayout,
    InfiniteMenuProps,
    InfiniteMenuSettings,
    InfiniteMenuSlots,
  } from './types';

  const props = withDefaults(defineProps<InfiniteMenuProps>(), {
    items: () => [],
    count: 160,
    tileSize: 0.63,
    roundness: 0.2,
    zoom: 1.65,
    pullBack: 1,
    stretch: 0.6,
    inertia: 0.6,
    autoplay: 3,
    grayscale: true,
    dim: 0.5,
    intro: true,
    showInfo: true,
    theme: 'dark',
    accentColor: undefined,
    backgroundColor: undefined,
    onItemClick: undefined,
    class: '',
  });

  const emit = defineEmits<InfiniteMenuEmits>();
  const slots = defineSlots<InfiniteMenuSlots>();

  const rootRef = ref<HTMLDivElement>();
  const canvasRef = ref<HTMLCanvasElement>();
  const active = ref(0);
  const moving = ref(true);
  const layout = ref<InfiniteMenuLayout>('side');
  const reducedMotion = usePreferredReducedMotion();
  let engine: InfiniteMenuEngine | null = null;
  let shown = -1;

  const settings = computed<InfiniteMenuSettings>(() => ({
    count: clamp(Math.round(props.count), 6, 400),
    tileSize: clamp(props.tileSize, 0.2, 1.2),
    roundness: clamp(props.roundness, 0, 1),
    zoom: clamp(props.zoom, 0.2, 4),
    pullBack: clamp(props.pullBack, 0, 3),
    stretch: clamp(props.stretch, 0, 3),
    inertia: clamp(props.inertia, 0, 1),
    autoplay: Math.max(0, props.autoplay),
    grayscale: props.grayscale,
    dim: clamp(props.dim, 0, 1),
    intro: props.intro,
    theme: props.theme === 'light' ? 'light' : 'dark',
    reduce: reducedMotion.value === 'reduce',
  }));

  const activeIndex = computed(() =>
    props.items.length ? active.value % props.items.length : 0,
  );
  const current = computed(() => props.items[activeIndex.value] ?? null);
  const isExternal = computed(
    () => current.value?.link?.startsWith('http') ?? false,
  );
  const hasAction = computed(
    () => Boolean(current.value?.link) || Boolean(props.onItemClick),
  );
  const actionLabel = computed(() =>
    current.value?.title ? `Open ${current.value.title}` : 'Open',
  );

  const rootStyle = computed(() => {
    const light = settings.value.theme === 'light';
    const ink = light ? '#120f17' : '#ffffff';
    const accent = props.accentColor || ink;
    return {
      backgroundColor: props.backgroundColor,
      '--infinite-menu-text': ink,
      '--infinite-menu-accent': accent,
      '--infinite-menu-on-accent':
        luminance(accent) > 0.5 ? '#120f17' : '#ffffff',
      '--infinite-menu-shadow': light
        ? '0 2px 18px rgba(255, 255, 255, 0.7)'
        : '0 2px 18px rgba(0, 0, 0, 0.45)',
    };
  });

  function openItem(itemIndex: number) {
    const item = props.items[itemIndex];
    if (!item) return;
    if (props.onItemClick) props.onItemClick(item, itemIndex);
    else if (item.link) {
      window.open(
        item.link,
        item.link.startsWith('http') ? '_blank' : '_self',
        'noopener',
      );
    }
  }

  function onAction(event: MouseEvent) {
    const item = current.value;
    if (!item || !props.onItemClick) return;
    props.onItemClick(item, activeIndex.value);
    if (!item.link) event.preventDefault();
  }

  function onActive(index: number) {
    if (index === shown) return;
    shown = index;
    active.value = index;
    const item = props.items[index];
    if (item) emit('active-change', item, index);
  }

  function onPointerDown(event: PointerEvent) {
    engine?.pointerDown(event);
  }
  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event);
  }
  function onPointerUp(event: PointerEvent) {
    engine?.pointerUp(event);
  }
  function onEnter() {
    engine?.setHovered(true);
  }
  function onLeave() {
    engine?.setHovered(false);
  }
  function onFocusIn() {
    engine?.setFocused(true);
  }
  function onFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;
    if (next instanceof Node && rootRef.value?.contains(next)) return;
    engine?.setFocused(false);
  }
  function onKeyDown(event: KeyboardEvent) {
    const direction = INFINITE_MENU_DIRECTIONS[event.key];
    if (direction) {
      event.preventDefault();
      engine?.step(direction);
    } else if (event.key === 'Enter' && event.target === rootRef.value) {
      event.preventDefault();
      if (engine) openItem(engine.itemForTile(engine.frontTile()));
    }
  }

  onMounted(() => {
    const root = rootRef.value;
    const canvas = canvasRef.value;
    if (!root || !canvas) return;
    engine = createInfiniteMenuEngine(
      root,
      canvas,
      () => settings.value,
      () => props.items,
      {
        onActive,
        onMoving: (value) => {
          moving.value = value;
        },
        onLayout: (value) => {
          layout.value = value;
        },
        onActivate: (tile) => {
          if (engine) openItem(engine.itemForTile(tile));
        },
      },
    );
    engine?.resize();
    engine?.loadItems(props.items);
  });

  useResizeObserver(rootRef, () => engine?.resize());
  useIntersectionObserver(rootRef, (entries) => {
    engine?.setVisible(entries.some((entry) => entry.isIntersecting));
  });

  watch(
    () => props.items,
    (items) => engine?.loadItems(items),
  );
  watch(settings, () => engine?.wake());

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('infinite-menu', props.class)"
    tabindex="0"
    role="group"
    aria-roledescription="carousel"
    :aria-label="current?.title || 'Infinite menu'"
    :style="rootStyle"
    @keydown="onKeyDown"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <canvas
      ref="canvasRef"
      class="infinite-menu__canvas"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    />
    <template v-if="showInfo && current">
      <div v-if="slots.info" class="infinite-menu__custom">
        <slot
          name="info"
          :item="current"
          :index="activeIndex"
          :moving="moving"
        />
      </div>
      <div
        v-else
        class="infinite-menu__info"
        :data-moving="moving"
        :data-layout="layout"
        aria-live="polite"
      >
        <h2 v-if="current.title" class="infinite-menu__title">
          {{ current.title }}
        </h2>
        <p v-if="current.description" class="infinite-menu__description">
          {{ current.description }}
        </p>
        <template v-if="hasAction">
          <a
            v-if="current.link"
            class="infinite-menu__action"
            :href="current.link"
            :target="isExternal ? '_blank' : undefined"
            :rel="isExternal ? 'noreferrer' : undefined"
            :aria-label="actionLabel"
            @click="onAction"
          >
            <Icon name="lucide:arrow-up-right" class="size-5" />
          </a>
          <button
            v-else
            type="button"
            class="infinite-menu__action"
            :aria-label="actionLabel"
            @click="onAction"
          >
            <Icon name="lucide:arrow-up-right" class="size-5" />
          </button>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
  .infinite-menu {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    outline: none;
    container-type: inline-size;
    color: var(--infinite-menu-text);
    -webkit-tap-highlight-color: transparent;
  }

  .infinite-menu:focus-visible {
    box-shadow: inset 0 0 0 2px var(--infinite-menu-text);
  }

  .infinite-menu__canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
    touch-action: none;
  }

  .infinite-menu__canvas:active {
    cursor: grabbing;
  }

  .infinite-menu__info,
  .infinite-menu__custom {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .infinite-menu__title,
  .infinite-menu__description,
  .infinite-menu__action {
    transition:
      opacity 0.45s ease,
      transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .infinite-menu__title {
    position: absolute;
    top: 50%;
    right: calc(50% + var(--infinite-menu-tile, 160px) + 28px);
    max-width: calc(50% - var(--infinite-menu-tile, 160px) - 48px);
    margin: 0;
    font-size: clamp(
      1.2rem,
      calc((50cqw - var(--infinite-menu-tile, 160px)) * 0.2),
      3.4rem
    );
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: -0.03em;
    text-align: right;
    text-shadow: var(--infinite-menu-shadow);
    transform: translateY(-50%);
    text-wrap: balance;
  }

  .infinite-menu__description {
    position: absolute;
    top: 50%;
    left: calc(50% + var(--infinite-menu-tile, 160px) + 28px);
    max-width: min(22ch, calc(50% - var(--infinite-menu-tile, 160px) - 48px));
    margin: 0;
    font-size: clamp(0.85rem, 1.5cqw, 1.05rem);
    line-height: 1.55;
    text-shadow: var(--infinite-menu-shadow);
    opacity: 0.72;
    transform: translateY(-50%);
  }

  .infinite-menu__action {
    position: absolute;
    bottom: 7%;
    left: 50%;
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: var(--infinite-menu-accent);
    color: var(--infinite-menu-on-accent);
    cursor: pointer;
    pointer-events: auto;
    transform: translateX(-50%);
  }

  .infinite-menu__action:hover {
    transform: translateX(-50%) scale(1.06);
  }

  .infinite-menu__action:focus-visible {
    outline: 2px solid var(--infinite-menu-accent);
    outline-offset: 3px;
  }

  .infinite-menu__info[data-moving='true'] .infinite-menu__title {
    opacity: 0;
    transform: translate(16px, -50%);
    transition-duration: 0.18s;
  }

  .infinite-menu__info[data-moving='true'] .infinite-menu__description {
    opacity: 0;
    transform: translate(-16px, -50%);
    transition-duration: 0.18s;
  }

  .infinite-menu__info[data-moving='true'] .infinite-menu__action {
    opacity: 0;
    pointer-events: none;
    transform: translate(-50%, 16px) scale(0.6);
    transition-duration: 0.18s;
  }

  .infinite-menu__info[data-layout='stacked'] .infinite-menu__title {
    top: auto;
    right: 88px;
    bottom: 52px;
    left: 20px;
    max-width: none;
    font-size: clamp(1.3rem, 6cqw, 1.8rem);
    text-align: left;
    transform: none;
  }

  .infinite-menu__info[data-layout='stacked'] .infinite-menu__description {
    top: auto;
    right: 88px;
    bottom: 22px;
    left: 20px;
    max-width: 36ch;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transform: none;
  }

  .infinite-menu__info[data-layout='stacked'] .infinite-menu__action {
    right: 20px;
    bottom: 22px;
    left: auto;
    transform: none;
  }

  .infinite-menu__info[data-layout='stacked'] .infinite-menu__action:hover {
    transform: scale(1.06);
  }

  .infinite-menu__info[data-layout='stacked'][data-moving='true']
    .infinite-menu__title,
  .infinite-menu__info[data-layout='stacked'][data-moving='true']
    .infinite-menu__description {
    transform: translateY(12px);
  }

  .infinite-menu__info[data-layout='stacked'][data-moving='true']
    .infinite-menu__action {
    transform: translateY(12px) scale(0.6);
  }

  @media (prefers-reduced-motion: reduce) {
    .infinite-menu__title,
    .infinite-menu__description,
    .infinite-menu__action {
      transition-duration: 0.01s;
    }
  }
</style>
