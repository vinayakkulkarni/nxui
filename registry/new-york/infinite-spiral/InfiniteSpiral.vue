<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import type { CSSProperties } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import {
    INFINITE_SPIRAL_NO_ITEMS,
    clamp,
    modulo,
    smoothstep,
  } from './spiral-math';
  import type {
    InfiniteSpiralNormalizedItem,
    InfiniteSpiralProps,
  } from './types';

  const props = withDefaults(defineProps<InfiniteSpiralProps>(), {
    items: () => INFINITE_SPIRAL_NO_ITEMS,
    speed: 0.55,
    direction: 'up',
    animationMode: 'auto',
    radius: 170,
    cardWidth: 100,
    cardHeight: 100,
    verticalSpacing: 60,
    perspective: 1000,
    cardsPerTurn: 7,
    rotation: 0,
    cardTilt: 0,
    cardRadius: 10,
    centerScale: 1.2,
    edgeFade: 0.3,
    edgeBlur: 6,
    pauseOnHover: true,
    imageFit: 'cover',
    grayscale: 0,
    class: '',
  });

  const rootRef = ref<HTMLDivElement | null>(null);
  const cardEls = ref<HTMLElement[]>([]);
  const dragging = ref(false);

  const motionPref = usePreferredReducedMotion();
  const reduced = computed(() => motionPref.value === 'reduce');

  let progress = 0;
  let targetProgress = 0;
  let autoSpeed = 0;
  let hovered = false;
  let visible = true;
  let lastPointerY = 0;
  let dragMoved = false;
  let lastScrollY = 0;
  const bounds = { width: 1, height: 1 };

  const normalizedItems = computed<InfiniteSpiralNormalizedItem[]>(() =>
    props.items.map((item, index) => {
      const alt = `Spiral image ${index + 1}`;
      if (typeof item === 'string') {
        return { src: item, alt, key: `${item}-${index}` };
      }
      return {
        ...item,
        alt: item.alt ?? alt,
        key: String(item.id ?? `${item.src}-${index}`),
      };
    }),
  );

  const dragEnabled = computed(
    () => props.animationMode === 'drag' || props.animationMode === 'all',
  );
  const scrollEnabled = computed(
    () => props.animationMode === 'scroll' || props.animationMode === 'all',
  );

  const rootStyle = computed<CSSProperties>(() => ({
    perspective: `${props.perspective}px`,
    '--infinite-spiral-card-width': `${props.cardWidth}px`,
    '--infinite-spiral-card-height': `${props.cardHeight}px`,
    '--infinite-spiral-card-radius': `${props.cardRadius}px`,
    cursor: dragEnabled.value
      ? dragging.value
        ? 'grabbing'
        : 'grab'
      : 'default',
    touchAction: dragEnabled.value ? 'pan-x' : 'auto',
    userSelect: dragEnabled.value ? 'none' : 'auto',
  }));

  const cardStyle = computed(() => ({
    width: `${props.cardWidth}px`,
    height: `${props.cardHeight}px`,
    borderRadius: `${props.cardRadius}px`,
  }));

  const imageStyle = computed<CSSProperties>(() => ({
    width: `${props.cardWidth}px`,
    height: `${props.cardHeight}px`,
    maxWidth: 'none',
    maxHeight: 'none',
    objectFit: props.imageFit,
    filter: `grayscale(${clamp(props.grayscale, 0, 1)})`,
  }));

  function measure() {
    const rect = rootRef.value?.getBoundingClientRect();
    if (!rect) return;
    bounds.width = rect.width;
    bounds.height = rect.height;
  }

  useResizeObserver(rootRef, measure);

  useIntersectionObserver(rootRef, (entries) => {
    visible = entries[0]?.isIntersecting ?? true;
  });

  onMounted(() => {
    lastScrollY = window.scrollY;
    measure();
  });

  useEventListener(
    'scroll',
    () => {
      const nextScrollY = window.scrollY;
      const scrollDelta = nextScrollY - lastScrollY;
      lastScrollY = nextScrollY;
      if (!scrollEnabled.value || !visible || scrollDelta === 0) return;
      const multiplier = Math.max(props.speed, 0) / 0.55;
      targetProgress += clamp(
        (scrollDelta * multiplier) / Math.max(props.verticalSpacing * 2, 1),
        -1.5,
        1.5,
      );
    },
    { passive: true },
  );

  useRafFn(({ delta: ms }) => {
    const count = normalizedItems.value.length;
    if (count === 0) return;
    const delta = Math.min(Math.max(ms, 0) / 1000, 0.05);
    const autoEnabled =
      props.animationMode === 'auto' || props.animationMode === 'all';
    const motionPaused = dragging.value || (props.pauseOnHover && hovered);
    const directionMultiplier = props.direction === 'down' ? -1 : 1;
    const desiredAutoSpeed =
      autoEnabled && visible && !reduced.value && !motionPaused
        ? props.speed * directionMultiplier
        : 0;
    const speedBlend = 1 - Math.exp(-delta * 7);
    autoSpeed += (desiredAutoSpeed - autoSpeed) * speedBlend;
    targetProgress += autoSpeed * delta;

    const followBlend = 1 - Math.exp(-delta * (dragging.value ? 22 : 11));
    progress += (targetProgress - progress) * followBlend;

    if (!visible) return;

    const half = count / 2;
    const width = Math.max(bounds.width, 1);
    const height = Math.max(bounds.height, 1);
    const fit = Math.min(
      1,
      width / (props.cardWidth * 2.8),
      height / (props.cardHeight * 2.35),
    );
    const responsiveRadius =
      Math.min(props.radius, Math.max(72, width * 0.36)) * fit;
    const fadeStart = clamp(1 - props.edgeFade, 0, 0.98);
    const turnSize = Math.max(props.cardsPerTurn, 1);

    for (const card of cardEls.value) {
      const index = Number(card.dataset.index);
      const offset = modulo(index - progress + half, count) - half;
      const edge = Math.min(Math.abs(offset) / Math.max(half, 1), 1);
      const opacity = 1 - smoothstep(fadeStart, 1, edge);
      const focus =
        1 - Math.min(Math.abs(offset) / Math.max(turnSize * 0.65, 1), 1);
      const scale = (1 + (props.centerScale - 1) * focus) * fit;
      const angle = offset * (360 / turnSize) + props.rotation;
      const angleRadians = (angle * Math.PI) / 180;
      const x = Math.sin(angleRadians) * responsiveRadius;
      const z = Math.cos(angleRadians) * responsiveRadius;
      const depthScale = clamp(
        props.perspective / Math.max(props.perspective - z, 1),
        0.72,
        1.45,
      );
      const visualScale = scale * depthScale;
      const depth = (z / Math.max(responsiveRadius, 1) + 1) / 2;
      const blur = props.edgeBlur * smoothstep(0.35, 1, edge);
      card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${offset * props.verticalSpacing * fit}px, 0) rotateZ(${props.cardTilt}deg) scale(${visualScale})`;
      card.style.opacity = opacity.toFixed(3);
      card.style.filter = blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : 'none';
      card.style.zIndex = String(Math.round(depth * 100000) + index);
      card.style.pointerEvents = opacity > 0.25 ? 'auto' : 'none';
    }
  });

  function onMouseEnter() {
    hovered = true;
  }

  function onMouseLeave() {
    hovered = false;
  }

  function onPointerDown(event: PointerEvent) {
    if (!dragEnabled.value || event.button !== 0) return;
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    dragging.value = true;
    dragMoved = false;
    lastPointerY = event.clientY;
    targetProgress = progress;
    target.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent) {
    if (!dragging.value) return;
    const pointerDelta = event.clientY - lastPointerY;
    lastPointerY = event.clientY;
    if (Math.abs(pointerDelta) > 0.5) dragMoved = true;
    targetProgress -= pointerDelta / Math.max(props.verticalSpacing, 1);
  }

  function stopDragging(event: PointerEvent) {
    if (!dragging.value) return;
    dragging.value = false;
    const target = event.currentTarget;
    if (
      target instanceof HTMLElement &&
      target.hasPointerCapture(event.pointerId)
    ) {
      target.releasePointerCapture(event.pointerId);
    }
  }

  function onClickCapture(event: MouseEvent) {
    if (!dragMoved) return;
    event.preventDefault();
    event.stopPropagation();
    dragMoved = false;
  }
</script>

<template>
  <div
    ref="rootRef"
    :class="['infinite-spiral', props.class]"
    :style="rootStyle"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="stopDragging"
    @pointercancel="stopDragging"
    @click.capture="onClickCapture"
  >
    <div
      class="infinite-spiral__stage"
      role="list"
      aria-label="Infinite spiral gallery"
    >
      <template v-for="(item, index) in normalizedItems" :key="item.key">
        <a
          v-if="item.href"
          ref="cardEls"
          class="infinite-spiral__item"
          :style="cardStyle"
          :data-index="index"
          :href="item.href"
          :target="item.target"
          :rel="item.target === '_blank' ? 'noreferrer' : undefined"
          role="listitem"
          :aria-label="item.label ?? item.alt"
        >
          <img
            class="infinite-spiral__image"
            :src="item.src"
            :alt="item.alt"
            :loading="index < 6 ? 'eager' : 'lazy'"
            draggable="false"
            :style="imageStyle"
          />
        </a>
        <div
          v-else
          ref="cardEls"
          class="infinite-spiral__item"
          :style="cardStyle"
          :data-index="index"
          role="listitem"
          :aria-label="item.label ?? item.alt"
        >
          <img
            class="infinite-spiral__image"
            :src="item.src"
            :alt="item.alt"
            :loading="index < 6 ? 'eager' : 'lazy'"
            draggable="false"
            :style="imageStyle"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
  .infinite-spiral {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 320px;
    overflow: hidden;
    isolation: isolate;
  }

  .infinite-spiral__stage {
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
  }

  .infinite-spiral__item {
    position: absolute;
    top: 50%;
    left: 50%;
    display: block;
    width: var(--infinite-spiral-card-width);
    height: var(--infinite-spiral-card-height);
    overflow: hidden;
    border: 1px solid var(--infinite-spiral-border, rgb(255 255 255 / 0.24));
    border-radius: var(--infinite-spiral-card-radius);
    background: var(--infinite-spiral-surface, rgb(255 255 255 / 0.08));
    box-shadow: 0 14px 38px rgb(8 6 18 / 0.2);
    transform: translate(-50%, -50%);
    transform-style: preserve-3d;
    backface-visibility: hidden;
    will-change: transform, opacity, filter;
    text-decoration: none;
  }

  .infinite-spiral__item:focus-visible {
    outline: 2px solid var(--ring, currentColor);
    outline-offset: 2px;
  }

  .infinite-spiral__image {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-position: center;
    user-select: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .infinite-spiral__item {
      transition: none;
    }
  }
</style>
