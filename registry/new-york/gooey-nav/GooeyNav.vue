<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    GOOEY_DEFAULT_ITEMS,
    GOOEY_PILLS,
    GOOEY_THEMES,
    contrastInk,
    createGooeyEngine,
    parseColor,
  } from './gooey-engine';
  import type { GooeyEngine, GooeyNavItem, GooeyNavProps } from './types';

  const props = withDefaults(defineProps<GooeyNavProps>(), {
    items: () => GOOEY_DEFAULT_ITEMS,
    initialActiveIndex: 0,
    activeIndex: undefined,
    theme: 'dark',
    color: undefined,
    activeTextColor: undefined,
    colors: () => [],
    size: 'md',
    frame: true,
    animationTime: 600,
    particleCount: 15,
    timeVariance: 300,
    spread: 56,
    gooeyness: 0.5,
    wobble: 0.5,
    hoverEffect: true,
    class: '',
  });

  const emit = defineEmits<{
    change: [index: number, item: GooeyNavItem];
    'update:activeIndex': [index: number];
  }>();

  const innerIndex = ref(props.initialActiveIndex);
  const current = computed(() =>
    Math.min(
      Math.max(0, props.activeIndex ?? innerIndex.value),
      Math.max(0, props.items.length - 1),
    ),
  );

  const stageRef = ref<HTMLElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const listRef = ref<HTMLElement | null>(null);
  const overlayRef = ref<HTMLElement | null>(null);
  const fallbackRef = ref<HTMLElement | null>(null);
  const engine = shallowRef<GooeyEngine | null>(null);
  const motion = usePreferredReducedMotion();

  const palette = computed(() => (props.theme === 'light' ? 'light' : 'dark'));
  const pillColor = computed(
    () => props.color || GOOEY_PILLS[palette.value].color,
  );
  const pillRgb = computed(() => parseColor(pillColor.value));
  const tints = computed(() => props.colors.map(parseColor));
  const hoverRgb = computed(() => parseColor(GOOEY_PILLS[palette.value].hover));
  const textColor = computed(
    () => props.activeTextColor || contrastInk(pillRgb.value),
  );

  const navStyle = computed(() => ({
    ...GOOEY_THEMES[palette.value],
    '--gn-pill': pillColor.value,
    '--gn-active-ink': textColor.value,
  }));

  function settings() {
    return {
      animationTime: props.animationTime,
      particleCount: props.particleCount,
      timeVariance: props.timeVariance,
      spread: props.spread,
      gooeyness: props.gooeyness,
      wobble: props.wobble,
      hoverEffect: props.hoverEffect,
      pillRgb: pillRgb.value,
      tints: tints.value,
      hoverRgb: hoverRgb.value,
      shadow: GOOEY_PILLS[palette.value].shadow,
    };
  }

  function mount() {
    const stage = stageRef.value;
    const canvas = canvasRef.value;
    const list = listRef.value;
    const overlay = overlayRef.value;
    const fallback = fallbackRef.value;
    if (!stage || !canvas || !list || !overlay || !fallback) return;
    engine.value = createGooeyEngine({
      stage,
      canvas,
      list,
      overlay,
      fallback,
      reduced: motion.value === 'reduce',
      settings,
    });
    engine.value.settle(current.value);
  }

  function unmount() {
    engine.value?.dispose();
    engine.value = null;
  }

  onMounted(() => {
    mount();
    document.fonts?.ready.then(() => engine.value?.resize());
  });
  onBeforeUnmount(unmount);

  watch(
    () => props.items.length,
    async () => {
      unmount();
      await nextTick();
      mount();
    },
  );

  watch(current, (index) => engine.value?.go(index));

  watch(
    [
      pillColor,
      palette,
      () => props.gooeyness,
      () => props.size,
      () => props.frame,
    ],
    async () => {
      await nextTick();
      engine.value?.resize();
      engine.value?.refresh();
    },
  );

  useResizeObserver([stageRef, listRef], () => engine.value?.resize());

  function onOver(event: PointerEvent) {
    const list = listRef.value;
    if (!(event.target instanceof Element) || !list) return;
    const item = event.target.closest<HTMLElement>('[data-gooey-index]');
    if (!item || !list.contains(item)) return;
    engine.value?.hover(Number(item.dataset.gooeyIndex));
  }

  function onLeave() {
    engine.value?.leave();
  }

  useEventListener(listRef, 'pointerover', onOver);
  useEventListener(listRef, 'pointerleave', onLeave);

  function select(index: number, event: MouseEvent) {
    const item = props.items[index];
    if (!item) return;
    if (!item.href || item.href === '#') event.preventDefault();
    if (index === current.value) return;
    if (props.activeIndex === undefined) innerIndex.value = index;
    emit('update:activeIndex', index);
    emit('change', index, item);
  }
</script>

<template>
  <nav
    :class="
      cn(
        'gooey-nav',
        `gooey-nav--${size}`,
        frame && 'gooey-nav--framed',
        props.class,
      )
    "
    :style="navStyle"
  >
    <span v-if="frame" class="gooey-nav__rim" />
    <div ref="stageRef" class="gooey-nav__stage">
      <canvas ref="canvasRef" class="gooey-nav__canvas" aria-hidden="true" />
      <span ref="fallbackRef" class="gooey-nav__fallback" aria-hidden="true" />
      <ul ref="listRef" class="gooey-nav__list">
        <li
          v-for="(item, index) in items"
          :key="index"
          class="gooey-nav__item"
          :data-gooey-index="index"
          :data-active="index === current ? '' : undefined"
        >
          <component
            :is="item.href ? 'a' : 'button'"
            :href="item.href"
            :type="item.href ? undefined : 'button'"
            class="gooey-nav__link"
            :aria-current="index === current ? 'page' : undefined"
            @click="select(index, $event)"
          >
            <span v-if="item.icon" class="gooey-nav__icon">
              <Icon :name="item.icon" class="gooey-nav__glyph" />
            </span>
            <span v-if="item.label" class="gooey-nav__label">
              {{ item.label }}
            </span>
          </component>
        </li>
      </ul>
      <ul
        ref="overlayRef"
        class="gooey-nav__list gooey-nav__list--active"
        aria-hidden="true"
      >
        <li v-for="(item, index) in items" :key="index" class="gooey-nav__item">
          <span class="gooey-nav__link">
            <span v-if="item.icon" class="gooey-nav__icon">
              <Icon :name="item.icon" class="gooey-nav__glyph" />
            </span>
            <span v-if="item.label" class="gooey-nav__label">
              {{ item.label }}
            </span>
          </span>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
  .gooey-nav {
    --gn-pad: 6px;
    --gn-gap: 4px;
    --gn-font: 14px;
    --gn-x: 16px;
    --gn-y: 9px;
    position: relative;
    display: inline-flex;
    max-width: 100%;
    font-size: var(--gn-font);
    line-height: 1.2;
  }

  .gooey-nav--sm {
    --gn-pad: 5px;
    --gn-gap: 2px;
    --gn-font: 13px;
    --gn-x: 13px;
    --gn-y: 7px;
  }

  .gooey-nav--lg {
    --gn-pad: 7px;
    --gn-gap: 6px;
    --gn-font: 16px;
    --gn-x: 20px;
    --gn-y: 11px;
  }

  .gooey-nav--framed {
    padding: var(--gn-pad);
    border-radius: 999px;
    background: var(--gn-frame);
    box-shadow: var(--gn-frame-shadow);
    -webkit-backdrop-filter: blur(20px) saturate(1.6);
    backdrop-filter: blur(20px) saturate(1.6);
  }

  .gooey-nav__stage {
    position: relative;
    max-width: 100%;
  }

  .gooey-nav__canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }

  .gooey-nav__fallback {
    position: absolute;
    top: 0;
    left: 0;
    display: none;
    border-radius: 999px;
    background: var(--gn-pill);
    pointer-events: none;
  }

  .gooey-nav__list {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap: var(--gn-gap);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .gooey-nav__list--active {
    position: absolute;
    inset: 0;
    color: var(--gn-active-ink);
    visibility: hidden;
    clip-path: inset(100%);
    pointer-events: none;
  }

  .gooey-nav__item {
    display: flex;
  }

  .gooey-nav__link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: var(--gn-y) var(--gn-x);
    border: none;
    border-radius: 999px;
    background: none;
    color: var(--gn-muted);
    font: inherit;
    font-weight: 500;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    transition: color 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .gooey-nav__list--active .gooey-nav__link {
    color: inherit;
  }

  .gooey-nav__item[data-active] .gooey-nav__link {
    color: var(--gn-ink);
  }

  .gooey-nav__link:focus-visible {
    outline: 2px solid var(--gn-ink);
    outline-offset: 2px;
  }

  .gooey-nav__icon {
    display: inline-flex;
    flex: none;
  }

  .gooey-nav__glyph {
    width: 1.15em;
    height: 1.15em;
  }

  .gooey-nav__rim {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px var(--gn-frame-edge),
      inset 0 1px 0 var(--gn-frame-highlight);
    pointer-events: none;
  }

  @media (hover: hover) {
    .gooey-nav__link:hover {
      color: var(--gn-ink);
    }
  }
</style>
