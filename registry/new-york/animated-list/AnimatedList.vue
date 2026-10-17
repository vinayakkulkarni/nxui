<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    useId,
    watch,
  } from 'vue';
  import type { ComponentPublicInstance } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import type {
    AnimatedListEngine,
    AnimatedListItem,
    AnimatedListProps,
  } from './types';
  import {
    ANIMATED_LIST_DEFAULT_ITEMS,
    ANIMATED_LIST_FADE_MASK,
    ANIMATED_LIST_THEMES,
    toCssSize,
    toEntry,
  } from './animated-list-utils';
  import { createAnimatedListEngine } from './animated-list-engine';

  const props = withDefaults(defineProps<AnimatedListProps>(), {
    items: () => ANIMATED_LIST_DEFAULT_ITEMS,
    initialSelectedIndex: -1,
    selectOnHover: true,
    enableArrowNavigation: true,
    loop: false,
    animation: 'pop',
    animateOnce: false,
    stagger: 0.05,
    showGradients: true,
    fadeSize: 56,
    displayScrollbar: true,
    frame: true,
    theme: 'dark',
    accentColor: undefined,
    radius: 14,
    gap: 8,
    width: 420,
    maxHeight: 440,
    class: '',
    itemClass: '',
  });

  const emit = defineEmits<{
    itemSelect: [item: AnimatedListItem, index: number];
  }>();

  defineSlots<{
    item?: (props: {
      item: AnimatedListItem;
      index: number;
      selected: boolean;
    }) => unknown;
  }>();

  const rootRef = ref<HTMLDivElement | null>(null);
  const viewportRef = ref<HTMLDivElement | null>(null);
  const trackRef = ref<HTMLDivElement | null>(null);
  const indicatorRef = ref<HTMLSpanElement | null>(null);
  const ringRef = ref<HTMLSpanElement | null>(null);
  const itemEls: (HTMLElement | null)[] = [];
  const selected = ref(props.initialSelectedIndex);
  const baseId = useId();
  const reducedMotion = usePreferredReducedMotion();
  let engine: AnimatedListEngine | null = null;
  let keyboard = false;
  let navigating = false;
  let engaged = false;
  let gateOpen = false;
  let pointer: [number, number] = [0, 0];

  const entries = computed(() => props.items.map(toEntry));

  const rootStyle = computed(() => ({
    ...(ANIMATED_LIST_THEMES[props.theme] ?? ANIMATED_LIST_THEMES.dark),
    '--al-radius': `${Math.max(0, props.radius)}px`,
    '--al-gap': `${Math.max(0, props.gap)}px`,
    '--al-width': toCssSize(props.width),
    '--al-accent': props.accentColor || 'var(--al-ink)',
    ...(props.accentColor
      ? {
          '--al-ring': props.accentColor,
          '--al-ring-fill': `color-mix(in srgb, ${props.accentColor} 8%, transparent)`,
        }
      : {}),
  }));

  const viewportStyle = computed(() => ({
    maxHeight: toCssSize(props.maxHeight),
    maskImage: props.showGradients ? ANIMATED_LIST_FADE_MASK : undefined,
    WebkitMaskImage: props.showGradients ? ANIMATED_LIST_FADE_MASK : undefined,
  }));

  const activeDescendant = computed(() =>
    selected.value >= 0 && selected.value < props.items.length
      ? `${baseId}-${selected.value}`
      : undefined,
  );

  function setItemRef(
    el: Element | ComponentPublicInstance | null,
    index: number,
  ) {
    itemEls[index] = el instanceof HTMLElement ? el : null;
  }

  function currentItems() {
    itemEls.length = props.items.length;
    return itemEls;
  }

  function engineSettings() {
    return {
      selected: selected.value,
      animation: props.animation,
      animateOnce: props.animateOnce,
      stagger: props.stagger,
      showGradients: props.showGradients,
      fadeSize: props.fadeSize,
    };
  }

  onMounted(() => {
    const root = rootRef.value;
    const viewport = viewportRef.value;
    const track = trackRef.value;
    const indicator = indicatorRef.value;
    const ring = ringRef.value;
    if (!root || !viewport || !track || !indicator || !ring) return;
    engine = createAnimatedListEngine({
      root,
      viewport,
      track,
      indicator,
      ring,
      reduced: reducedMotion.value === 'reduce',
      items: currentItems,
      settings: engineSettings,
    });
    if (gateOpen || typeof IntersectionObserver === 'undefined') {
      engine.enter();
    }
    engine.updateFades();
    engine.place(true);
    engine.syncRing();
  });

  onBeforeUnmount(() => {
    engine?.dispose();
    engine = null;
  });

  const { stop: stopGate } = useIntersectionObserver(
    rootRef,
    (observed) => {
      if (!observed.some((entry) => entry.isIntersecting)) return;
      stopGate();
      gateOpen = true;
      engine?.enter();
    },
    { rootMargin: '0px 0px -10% 0px' },
  );

  useResizeObserver([viewportRef, trackRef], () => engine?.resize());

  watch([() => props.items, () => props.animation], () => engine?.sync(), {
    flush: 'post',
  });

  watch(
    [selected, () => props.fadeSize, () => props.showGradients],
    () => {
      if (!engine) return;
      engine.place(false);
      engine.syncRing();
      if (!keyboard) return;
      keyboard = false;
      const viewport = viewportRef.value;
      const track = trackRef.value;
      const item = itemEls[selected.value];
      if (!viewport || !track || !item) return;
      const top = track.offsetTop + item.offsetTop;
      const bottom = top + item.offsetHeight;
      const room = Math.max(0, (viewport.clientHeight - item.offsetHeight) / 2);
      const margin = Math.min(
        props.showGradients ? Math.max(12, props.fadeSize) : 12,
        room,
      );
      if (top < viewport.scrollTop + margin) {
        viewport.scrollTo({
          top: Math.max(0, top - margin),
          behavior: 'smooth',
        });
      } else if (bottom > viewport.scrollTop + viewport.clientHeight - margin) {
        viewport.scrollTo({
          top: bottom - viewport.clientHeight + margin,
          behavior: 'smooth',
        });
      }
    },
    { flush: 'post' },
  );

  watch(
    [
      () => props.showGradients,
      () => props.fadeSize,
      () => props.maxHeight,
      () => props.gap,
    ],
    async () => {
      await nextTick();
      engine?.updateFades();
    },
    { flush: 'post' },
  );

  function onScroll() {
    engine?.scroll();
  }

  function onKey(event: KeyboardEvent) {
    if (!props.enableArrowNavigation || event.defaultPrevented) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const viewport = viewportRef.value;
    const active = document.activeElement;
    const focused = active !== null && active === viewport;
    const idle =
      !active ||
      active === document.body ||
      active === document.documentElement;
    if (!focused && !(engaged && idle)) return;
    const count = props.items.length;
    if (!count) return;
    const index = selected.value;
    let next: number | null = null;
    if (event.key === 'ArrowDown') next = index < 0 ? 0 : index + 1;
    else if (event.key === 'ArrowUp') next = index < 0 ? count - 1 : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    else if (
      (event.key === 'Enter' || (focused && event.key === ' ')) &&
      index >= 0 &&
      index < count
    ) {
      event.preventDefault();
      const item = props.items[index];
      if (item !== undefined) emit('itemSelect', item, index);
      return;
    }
    if (next === null) return;
    event.preventDefault();
    next = props.loop
      ? (next + count) % count
      : Math.min(count - 1, Math.max(0, next));
    keyboard = true;
    navigating = true;
    selected.value = next;
  }

  function onPointerMove(event: PointerEvent) {
    const moved = event.clientX !== pointer[0] || event.clientY !== pointer[1];
    pointer = [event.clientX, event.clientY];
    if (!navigating || !moved) return;
    navigating = false;
    const item =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-index]')
        : null;
    if (item && rootRef.value?.contains(item) && props.selectOnHover) {
      selected.value = Number(item.dataset.index);
    }
  }

  function onEnter() {
    engaged = true;
  }

  function onLeave() {
    engaged = false;
  }

  useEventListener('keydown', onKey);
  useEventListener(rootRef, 'pointerenter', onEnter);
  useEventListener(rootRef, 'pointerleave', onLeave);
  useEventListener(rootRef, 'pointermove', onPointerMove);

  function onItemEnter(index: number) {
    if (props.selectOnHover && !navigating) selected.value = index;
  }

  function choose(index: number) {
    selected.value = index;
    const item = props.items[index];
    if (item !== undefined) emit('itemSelect', item, index);
  }
</script>

<template>
  <div
    ref="rootRef"
    :class="['animated-list', { 'animated-list--framed': frame }, props.class]"
    :data-animated="animation !== 'none' ? '' : undefined"
    :style="rootStyle"
  >
    <div
      ref="viewportRef"
      :class="[
        'animated-list__viewport',
        { 'animated-list__viewport--bare': !displayScrollbar },
      ]"
      role="listbox"
      tabindex="0"
      :aria-activedescendant="activeDescendant"
      :style="viewportStyle"
      @scroll.passive="onScroll"
    >
      <div ref="trackRef" class="animated-list__track">
        <div
          v-for="(entry, index) in entries"
          :id="`${baseId}-${index}`"
          :key="entry.id ?? index"
          :ref="(el) => setItemRef(el, index)"
          :class="['animated-list__item', itemClass]"
          role="option"
          :aria-selected="index === selected"
          :data-index="index"
          :data-selected="index === selected ? '' : undefined"
          @pointerenter="onItemEnter(index)"
          @click="choose(index)"
        >
          <slot
            name="item"
            :item="items[index] ?? entry"
            :index="index"
            :selected="index === selected"
          >
            <span v-if="entry.image || entry.icon" class="animated-list__lead">
              <img
                v-if="entry.image"
                :src="entry.image"
                alt=""
                draggable="false"
              />
              <Icon
                v-else-if="entry.icon"
                :name="entry.icon"
                class="size-4.5"
              />
            </span>
            <span class="animated-list__text">
              <span class="animated-list__title">{{ entry.title }}</span>
              <span v-if="entry.description" class="animated-list__description">
                {{ entry.description }}
              </span>
            </span>
            <span v-if="entry.meta" class="animated-list__meta">
              {{ entry.meta }}
            </span>
          </slot>
          <span class="animated-list__rim" aria-hidden="true"></span>
        </div>
        <span
          ref="indicatorRef"
          class="animated-list__indicator"
          aria-hidden="true"
        >
          <span ref="ringRef" class="animated-list__ring"></span>
        </span>
      </div>
    </div>
    <span
      v-if="frame"
      class="animated-list__frame-rim"
      aria-hidden="true"
    ></span>
  </div>
</template>

<style scoped>
  .animated-list {
    position: relative;
    width: min(100%, var(--al-width));
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    border-radius: calc(var(--al-radius) + 12px);
    color: var(--al-ink);
    -webkit-tap-highlight-color: transparent;
  }

  .animated-list--framed {
    padding: 6px;
    background: var(--al-frame);
    box-shadow: var(--al-frame-shadow);
    -webkit-backdrop-filter: blur(20px) saturate(1.6);
    backdrop-filter: blur(20px) saturate(1.6);
  }

  .animated-list:has(> .animated-list__viewport:focus-visible) {
    outline: 2px solid var(--al-accent);
    outline-offset: 3px;
  }

  .animated-list__frame-rim {
    position: absolute;
    inset: 0;
    z-index: 3;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px var(--al-frame-edge),
      inset 0 1px 0 var(--al-frame-highlight);
    pointer-events: none;
  }

  .animated-list__viewport {
    --al-fade-top: 0px;
    --al-fade-bottom: 0px;
    position: relative;
    box-sizing: border-box;
    padding: 6px;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    border-radius: calc(var(--al-radius) + 6px);
    outline: none;
    scrollbar-width: thin;
    scrollbar-color: var(--al-thumb) transparent;
  }

  .animated-list__viewport::-webkit-scrollbar {
    width: 6px;
  }

  .animated-list__viewport::-webkit-scrollbar-track {
    background: transparent;
  }

  .animated-list__viewport::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background: var(--al-thumb);
  }

  .animated-list__viewport--bare {
    scrollbar-width: none;
  }

  .animated-list__viewport--bare::-webkit-scrollbar {
    display: none;
  }

  .animated-list__track {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--al-gap);
  }

  .animated-list__item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: 10px 14px 10px 10px;
    box-sizing: border-box;
    border-radius: var(--al-radius);
    background: var(--al-tile);
    box-shadow: var(--al-tile-shadow);
    color: var(--al-ink);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }

  .animated-list[data-animated] .animated-list__item:not([data-state]) {
    opacity: 0;
  }

  @media (hover: hover) {
    .animated-list__item:hover {
      filter: var(--al-hover);
    }
  }

  .animated-list__item[data-selected]:not(:active) {
    filter: var(--al-active);
  }

  .animated-list__item:active {
    filter: var(--al-press);
  }

  .animated-list__lead {
    display: grid;
    place-items: center;
    flex: none;
    width: 36px;
    height: 36px;
    overflow: hidden;
    border-radius: max(8px, calc(var(--al-radius) - 4px));
    background: var(--al-well);
    color: var(--al-ink);
  }

  .animated-list__lead img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .animated-list__text {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .animated-list__title {
    overflow: hidden;
    font-size: 14.5px;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.01em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .animated-list__description {
    overflow: hidden;
    font-size: 13px;
    line-height: 1.35;
    color: var(--al-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .animated-list__meta {
    flex: none;
    font-size: 12.5px;
    font-variant-numeric: tabular-nums;
    color: var(--al-muted);
  }

  .animated-list__rim {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px var(--al-tile-edge),
      inset 0 1px 0 var(--al-tile-highlight);
    pointer-events: none;
  }

  .animated-list__indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2;
    height: 0;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  .animated-list__ring {
    position: absolute;
    inset: 0;
    border-radius: var(--al-radius);
    background: var(--al-ring-fill);
    box-shadow: inset 0 0 0 1px var(--al-ring);
  }
</style>
