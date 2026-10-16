<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import {
    clamp,
    createLogoLoopEngine,
    fadeMask,
    toCssLength,
  } from './logo-loop-engine';
  import type {
    LogoItem,
    LogoLoopConfig,
    LogoLoopCopies,
    LogoLoopEngine,
    LogoLoopItemSlotProps,
    LogoLoopProps,
  } from './types';

  const props = withDefaults(defineProps<LogoLoopProps>(), {
    speed: 120,
    direction: 'left',
    width: '100%',
    logoHeight: 28,
    gap: 32,
    pauseOnHover: undefined,
    hoverSpeed: undefined,
    fadeOut: true,
    fadeOutWidth: 0.12,
    scaleOnHover: false,
    layout: 'line',
    bend: 0.5,
    focus: 0,
    magnify: 0,
    tiltX: 0,
    tiltY: 0,
    step: false,
    muted: 0,
    labels: 'none',
    draggable: true,
    scrollBoost: 0,
    intro: true,
    ariaLabel: 'Partner logos',
    class: '',
  });

  defineSlots<{
    item?: (props: LogoLoopItemSlotProps) => unknown;
  }>();

  const rootRef = ref<HTMLElement | null>(null);
  const trackRef = ref<HTMLElement | null>(null);
  const firstListRef = shallowRef<HTMLElement | null>(null);
  const copies = ref<LogoLoopCopies>({ copies: 3, primary: 1 });
  // Intro state is fixed at mount, like upstream; the engine drops the
  // attribute itself once the loop first comes into view.
  const introPending = props.intro;

  const vertical = computed(
    () => props.direction === 'up' || props.direction === 'down',
  );

  function getConfig(): LogoLoopConfig {
    const isVertical = vertical.value;
    return {
      speed: props.speed,
      dirSign: (
        isVertical ? props.direction === 'up' : props.direction !== 'right'
      )
        ? 1
        : -1,
      hoverValue:
        props.hoverSpeed !== undefined
          ? props.hoverSpeed
          : props.pauseOnHover === false
            ? undefined
            : 0,
      vertical: isVertical,
      layout: props.layout,
      bend: props.bend,
      focus: props.focus,
      magnify: props.magnify,
      tiltX: props.tiltX,
      tiltY: props.tiltY,
      step: props.step,
      draggable: props.draggable,
      scrollBoost: props.scrollBoost,
      intro: props.intro,
      scaleOnHover: props.scaleOnHover,
      labels: props.labels,
      links: props.logos.some((item) => !!item.href),
    };
  }

  function isIcon(item: LogoItem): boolean {
    return 'icon' in item;
  }

  function iconName(item: LogoItem): string {
    return 'icon' in item ? item.icon : '';
  }

  function itemName(item: LogoItem): string | undefined {
    return 'icon' in item
      ? (item.ariaLabel ?? item.title)
      : (item.alt ?? item.title);
  }

  function inlineText(item: LogoItem): string | null {
    return (props.labels === 'inline' || props.labels === 'below') && item.title
      ? item.title
      : null;
  }

  function imageOf(item: LogoItem) {
    return 'src' in item ? item : null;
  }

  function itemStyle(item: LogoItem) {
    return item.hoverColor
      ? { '--logoloop-item-color': item.hoverColor }
      : undefined;
  }

  const amount = computed(() => clamp(props.muted, 0, 1));

  const containerStyle = computed(() => {
    const width = toCssLength(props.width);
    const mask = props.fadeOut
      ? fadeMask(props.fadeOutWidth, vertical.value)
      : undefined;
    return {
      width: vertical.value
        ? width === '100%'
          ? undefined
          : width
        : (width ?? '100%'),
      '--logoloop-gap': `${props.gap}px`,
      '--logoloop-logoHeight': `${props.logoHeight}px`,
      ...(amount.value > 0 && {
        '--logoloop-gray': Math.min(1, amount.value * 2).toFixed(3),
        '--logoloop-dim': (1 - amount.value * 0.6).toFixed(3),
      }),
      ...(mask && { WebkitMaskImage: mask, maskImage: mask }),
    };
  });

  const rootClass = computed(() => [
    'logoloop',
    vertical.value ? 'logoloop--vertical' : 'logoloop--horizontal',
    props.scaleOnHover && 'logoloop--scale-hover',
    props.class,
  ]);

  let engine: LogoLoopEngine | null = null;
  let visible = false;

  function setLayout(next: LogoLoopCopies): void {
    copies.value = { ...next };
  }

  function syncFirstList(): void {
    const first = trackRef.value?.children[0];
    firstListRef.value = first instanceof HTMLElement ? first : null;
  }

  const reducedMotion = usePreferredReducedMotion();
  const documentVisibility = useDocumentVisibility();

  const { isSupported: ioSupported } = useIntersectionObserver(
    rootRef,
    (entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      visible = entry.isIntersecting;
      engine?.setVisible(visible);
    },
    { threshold: 0.1 },
  );

  onMounted(() => {
    const root = rootRef.value;
    const track = trackRef.value;
    if (!root || !track) return;
    if (!ioSupported.value) visible = true;
    engine = createLogoLoopEngine(root, track, getConfig, setLayout, {
      reduced: reducedMotion.value === 'reduce',
      visible,
      copies: copies.value,
    });
    syncFirstList();
    engine.refresh();
  });

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });

  useResizeObserver(rootRef, handleResize);
  useResizeObserver(firstListRef, handleResize);

  function handleResize(): void {
    engine?.resize();
  }

  useEventListener('scroll', handleWindowScroll, { passive: true });

  function handleWindowScroll(): void {
    engine?.onWindowScroll();
  }

  watch(reducedMotion, (value) => engine?.setReduced(value === 'reduce'));

  watch(documentVisibility, (value) => {
    if (value === 'visible') engine?.wake();
  });

  watch(
    [
      () => copies.value.copies,
      () => copies.value.primary,
      () => props.logos,
      vertical,
      () => props.logoHeight,
      () => props.gap,
      () => props.labels,
      () => props.layout,
      () => props.bend,
      () => props.focus,
      () => props.magnify,
      () => props.tiltX,
      () => props.tiltY,
      () => props.scaleOnHover,
    ],
    () => {
      syncFirstList();
      engine?.refresh();
    },
    { flush: 'post' },
  );

  watch(
    [
      () => props.speed,
      () => props.direction,
      () => props.hoverSpeed,
      () => props.pauseOnHover,
      () => props.step,
      () => props.draggable,
      () => props.scrollBoost,
      () => props.muted,
    ],
    () => engine?.wake(),
    { flush: 'post' },
  );

  onUpdated(() => engine?.wake());

  function onEnter(e: PointerEvent): void {
    engine?.onEnter(e);
  }
  function onLeave(): void {
    engine?.onLeave();
  }
  function onDown(e: PointerEvent): void {
    engine?.onDown(e);
  }
  function onMove(e: PointerEvent): void {
    engine?.onMove(e);
  }
  function onUp(e: PointerEvent): void {
    engine?.onUp(e);
  }
  function onCancel(e: PointerEvent): void {
    engine?.onCancel(e);
  }
  function onClick(e: MouseEvent): void {
    engine?.onClick(e);
  }
  function onDragStart(e: DragEvent): void {
    engine?.onDragStart(e);
  }
  function onFocusIn(e: FocusEvent): void {
    engine?.onFocusIn(e);
  }
  function onFocusOut(e: FocusEvent): void {
    engine?.onFocusOut(e);
  }
  function onRootScroll(): void {
    engine?.onRootScroll();
  }
</script>

<template>
  <div
    ref="rootRef"
    :class="rootClass"
    :style="containerStyle"
    role="region"
    :aria-label="ariaLabel"
    :data-intro="introPending ? '' : undefined"
    :data-draggable="draggable ? '' : undefined"
    :data-muted="amount > 0 ? '' : undefined"
    :data-labels="labels !== 'none' ? labels : undefined"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onCancel"
    @lostpointercapture="onCancel"
    @click.capture="onClick"
    @dragstart="onDragStart"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @scroll="onRootScroll"
  >
    <div ref="trackRef" class="logoloop__track">
      <ul
        v-for="copyNumber in copies.copies"
        :key="copyNumber"
        class="logoloop__list"
        role="list"
        :aria-hidden="copyNumber - 1 === copies.primary ? undefined : true"
      >
        <li
          v-for="(item, itemIndex) in logos"
          :key="`${copyNumber - 1}-${itemIndex}`"
          class="logoloop__item"
          role="listitem"
          :data-color="item.hoverColor ? '' : undefined"
          :style="itemStyle(item)"
        >
          <component
            :is="item.href ? 'a' : 'div'"
            class="logoloop__content"
            :href="item.href"
            :aria-label="item.href ? itemName(item) || 'logo link' : undefined"
            :target="item.href ? '_blank' : undefined"
            :rel="item.href ? 'noreferrer noopener' : undefined"
            :draggable="item.href ? false : undefined"
            :tabindex="
              item.href && copyNumber - 1 !== copies.primary ? -1 : undefined
            "
          >
            <slot
              name="item"
              :item="item"
              :index="itemIndex"
              :copy="copyNumber - 1"
            >
              <span
                v-if="isIcon(item)"
                class="logoloop__node"
                :role="!item.href && itemName(item) ? 'img' : undefined"
                :aria-label="!item.href ? itemName(item) : undefined"
                :aria-hidden="
                  !!item.href && !('ariaLabel' in item && item.ariaLabel)
                    ? true
                    : undefined
                "
              >
                <Icon :name="iconName(item)" />
              </span>
              <img
                v-else-if="imageOf(item)"
                :src="imageOf(item)?.src"
                :srcset="imageOf(item)?.srcSet"
                :sizes="imageOf(item)?.sizes"
                :width="imageOf(item)?.width"
                :height="imageOf(item)?.height"
                :alt="imageOf(item)?.alt ?? ''"
                :title="item.title"
                loading="lazy"
                decoding="async"
                draggable="false"
              />
            </slot>
            <span
              v-if="inlineText(item)"
              class="logoloop__label"
              :aria-hidden="!isIcon(item) && !!imageOf(item)?.alt"
            >
              {{ inlineText(item) }}
            </span>
          </component>
          <span
            v-if="labels === 'hover' && item.title"
            class="logoloop__tip"
            aria-hidden="true"
          >
            {{ item.title }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
  .logoloop {
    --logoloop-gap: 32px;
    --logoloop-logoHeight: 28px;
    --logoloop-pad: 0px;
    position: relative;
    overflow: hidden;
    overflow: clip;
    padding-top: var(--logoloop-pad);
    padding-bottom: var(--logoloop-pad);
    -webkit-tap-highlight-color: transparent;
  }

  .logoloop--vertical {
    display: inline-block;
    height: 100%;
    padding: 0 var(--logoloop-pad);
  }

  .logoloop[data-draggable] {
    cursor: grab;
    touch-action: pan-y pinch-zoom;
  }

  .logoloop--vertical[data-draggable] {
    touch-action: pan-x pinch-zoom;
  }

  .logoloop[data-dragging],
  .logoloop[data-dragging] * {
    cursor: grabbing;
  }

  .logoloop__track {
    position: relative;
    z-index: 0;
    display: flex;
    width: max-content;
    will-change: transform;
    user-select: none;
    -webkit-user-select: none;
  }

  .logoloop--vertical .logoloop__track {
    flex-direction: column;
    width: 100%;
    height: max-content;
  }

  .logoloop__list {
    display: flex;
    align-items: center;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .logoloop--vertical .logoloop__list {
    flex-direction: column;
  }

  .logoloop__item {
    position: relative;
    flex: 0 0 auto;
    margin-right: var(--logoloop-gap);
    font-size: var(--logoloop-logoHeight);
    line-height: 1;
  }

  .logoloop--vertical .logoloop__item {
    margin-right: 0;
    margin-bottom: var(--logoloop-gap);
  }

  .logoloop[data-intro] .logoloop__item {
    opacity: 0;
  }

  .logoloop__content {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--logoloop-logoHeight) * 0.3);
    border-radius: 4px;
    color: inherit;
    text-decoration: none;
    transition:
      opacity 0.35s ease,
      filter 0.35s ease,
      color 0.35s ease;
  }

  .logoloop[data-labels='below'] .logoloop__content {
    flex-direction: column;
    gap: calc(var(--logoloop-logoHeight) * 0.22);
  }

  .logoloop__content:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  .logoloop__node {
    display: inline-flex;
    align-items: center;
  }

  .logoloop__item img {
    display: block;
    width: auto;
    height: var(--logoloop-logoHeight);
    object-fit: contain;
    image-rendering: -webkit-optimize-contrast;
    -webkit-user-drag: none;
    pointer-events: none;
  }

  .logoloop__node,
  .logoloop__item img {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .logoloop--scale-hover .logoloop__item:hover img,
  .logoloop--scale-hover .logoloop__item:hover .logoloop__node {
    transform: scale(1.2);
  }

  .logoloop__label {
    font-size: max(12px, calc(var(--logoloop-logoHeight) * 0.5));
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }

  .logoloop[data-labels='below'] .logoloop__label {
    font-size: max(11px, calc(var(--logoloop-logoHeight) * 0.26));
    font-weight: 500;
    letter-spacing: 0;
    opacity: 0.72;
  }

  .logoloop__tip {
    position: absolute;
    top: 100%;
    left: 50%;
    margin-top: calc(var(--logoloop-logoHeight) * 0.2);
    font-size: max(11px, calc(var(--logoloop-logoHeight) * 0.26));
    font-weight: 500;
    line-height: 1.2;
    white-space: nowrap;
    opacity: 0;
    translate: -50% 4px;
    pointer-events: none;
    transition:
      opacity 0.25s ease,
      translate 0.25s ease;
  }

  .logoloop--vertical .logoloop__tip {
    top: 50%;
    left: 100%;
    margin-top: 0;
    margin-left: calc(var(--logoloop-logoHeight) * 0.25);
    translate: 4px -50%;
  }

  .logoloop__item:hover .logoloop__tip,
  .logoloop__item:focus-within .logoloop__tip,
  .logoloop__item[data-active] .logoloop__tip {
    opacity: 0.8;
    translate: -50% 0;
  }

  .logoloop--vertical .logoloop__item:hover .logoloop__tip,
  .logoloop--vertical .logoloop__item:focus-within .logoloop__tip,
  .logoloop--vertical .logoloop__item[data-active] .logoloop__tip {
    translate: 0 -50%;
  }

  .logoloop[data-muted] .logoloop__content {
    filter: grayscale(var(--logoloop-gray, 1));
    opacity: var(--logoloop-dim, 0.5);
  }

  .logoloop[data-muted] .logoloop__item:hover .logoloop__content,
  .logoloop[data-muted] .logoloop__item:focus-within .logoloop__content,
  .logoloop[data-muted] .logoloop__item[data-active] .logoloop__content {
    filter: none;
    opacity: 1;
  }

  .logoloop__item[data-color]:hover .logoloop__content,
  .logoloop__item[data-color]:focus-within .logoloop__content,
  .logoloop__item[data-color][data-active] .logoloop__content {
    color: var(--logoloop-item-color);
  }

  .logoloop:not([data-muted])
    .logoloop__item:not([data-color])
    a.logoloop__content:hover {
    opacity: 0.8;
  }

  @media (prefers-reduced-motion: reduce) {
    .logoloop__content,
    .logoloop__node,
    .logoloop__item img,
    .logoloop__tip {
      transition: none;
    }
  }
</style>
