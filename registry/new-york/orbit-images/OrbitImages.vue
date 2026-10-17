<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    useId,
    useSlots,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { buildOrbitPath, estimateAspect } from './orbit-paths';
  import { clamp, createOrbitEngine } from './orbit-engine';
  import type {
    OrbitEngine,
    OrbitEngineConfig,
    OrbitImagesProps,
    OrbitItem,
  } from './types';

  const props = withDefaults(defineProps<OrbitImagesProps>(), {
    images: () => [],
    altPrefix: 'Orbiting image',
    shape: 'ellipse',
    customPath: undefined,
    baseWidth: 1400,
    radiusX: 700,
    radiusY: 170,
    radius: 300,
    starPoints: 5,
    starInnerRatio: 0.5,
    rotation: -8,
    duration: 40,
    itemSize: 64,
    direction: 'normal',
    fill: true,
    width: '100%',
    height: 'auto',
    showPath: false,
    pathColor: 'rgba(128,128,128,0.35)',
    pathWidth: 2,
    pathDash: 0,
    easing: 'linear',
    paused: false,
    depth: 0.5,
    itemRadius: 12,
    shadow: 0.3,
    hoverScale: 1.08,
    hoverSpeed: 0.3,
    draggable: true,
    clickToFront: true,
    alignToPath: false,
    intro: true,
    onItemClick: undefined,
    class: '',
  });

  const slots = useSlots();
  const rootRef = useTemplateRef<HTMLDivElement>('root');
  const clipId = `orbit-clip-${useId().replace(/[^\w-]/g, '')}`;
  const introPending = ref(props.intro);
  const dragging = ref(false);
  const measuredAspect = ref<number | null>(null);
  const reducedMotion = usePreferredReducedMotion();
  let engine: OrbitEngine | null = null;

  const center = computed(() => props.baseWidth / 2);

  const path = computed(() =>
    buildOrbitPath({
      shape: props.shape,
      customPath: props.customPath,
      center: center.value,
      radiusX: props.radiusX,
      radiusY: props.radiusY,
      radius: props.radius,
      starPoints: props.starPoints,
      starInnerRatio: props.starInnerRatio,
    }),
  );

  const items = computed<OrbitItem[]>(() =>
    props.images.map((image, index) =>
      typeof image === 'string'
        ? { src: image, alt: `${props.altPrefix} ${index + 1}` }
        : {
            src: image.src,
            alt: image.alt ?? `${props.altPrefix} ${index + 1}`,
          },
    ),
  );

  const interactive = computed(() => !!props.onItemClick);
  const pathTransform = computed(
    () => `rotate(${props.rotation} ${center.value} ${center.value})`,
  );

  const config = computed<OrbitEngineConfig>(() => ({
    baseWidth: props.baseWidth,
    rotation: props.rotation,
    duration: props.duration,
    itemSize: props.itemSize,
    direction: props.direction,
    fill: props.fill,
    pathWidth: props.pathWidth,
    pathDash: props.pathDash,
    easing: props.easing,
    paused: props.paused,
    depth: props.depth,
    hoverScale: props.hoverScale,
    hoverSpeed: props.hoverSpeed,
    draggable: props.draggable,
    clickToFront: props.clickToFront,
    alignToPath: props.alignToPath,
    intro: props.intro,
    onItemClick: props.onItemClick,
    sources: items.value.map((item) => item.src),
  }));

  function toCssLength(value: number | string): string {
    return typeof value === 'number' ? `${value}px` : value;
  }

  const autoHeight = computed(() => props.height === 'auto');
  const layered = computed(() => props.depth > 0 && !!slots.default);

  const rootStyle = computed(() => {
    const aspect =
      measuredAspect.value ??
      estimateAspect(
        props.shape,
        props.radiusX,
        props.radiusY,
        props.radius,
        props.itemSize,
      );
    return {
      width: toCssLength(props.width),
      height: autoHeight.value ? undefined : toCssLength(props.height),
      aspectRatio: autoHeight.value ? String(aspect) : undefined,
      '--orbit-radius':
        typeof props.itemRadius === 'number'
          ? `${(props.itemRadius / Math.max(1, props.itemSize)) * 100}%`
          : props.itemRadius,
      '--orbit-shadow': String(clamp(props.shadow, 0, 1)),
      '--orbit-hover-scale': String(props.hoverScale),
    };
  });

  function setAspect(aspect: number) {
    measuredAspect.value = aspect;
  }

  function setIntroPending(pending: boolean) {
    introPending.value = pending;
  }

  function setDragging(value: boolean) {
    dragging.value = value;
  }

  onMounted(() => {
    const root = rootRef.value;
    if (!root) return;
    engine = createOrbitEngine(
      root,
      {
        getConfig: () => config.value,
        setAspect,
        setIntroPending,
        setDragging,
      },
      reducedMotion.value === 'reduce',
    );
    engine.refresh();
  });

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });

  watch(
    [
      path,
      () => props.rotation,
      () => props.baseWidth,
      () => props.itemSize,
      () => props.depth,
      () => props.hoverScale,
      () => items.value.length,
      () => props.showPath,
      () => props.pathWidth,
      () => props.pathDash,
      measuredAspect,
      () => props.height,
      layered,
    ],
    () => engine?.refresh(),
    { flush: 'post' },
  );

  watch(config, () => engine?.wake(), { flush: 'post' });

  watch(reducedMotion, (value) => engine?.setReduced(value === 'reduce'));

  useResizeObserver(rootRef, () => engine?.resize());

  const { isSupported: ioSupported } = useIntersectionObserver(
    rootRef,
    (entries) => {
      const entry = entries[entries.length - 1];
      engine?.setVisible(!!entry?.isIntersecting);
    },
    { threshold: 0.05 },
  );

  onMounted(() => {
    if (!ioSupported.value) engine?.setVisible(true);
  });

  useEventListener('resize', () => engine?.wake());
  useEventListener(
    () => (rootRef.value ? rootRef.value.ownerDocument : null),
    'visibilitychange',
    onVisibility,
  );

  function onVisibility(event: Event) {
    const doc = event.currentTarget;
    if (doc instanceof Document && !doc.hidden) engine?.wake();
  }

  function onPointerEnter() {
    engine?.onEnter();
  }
  function onPointerLeave() {
    engine?.onLeave();
  }
  function onPointerOver(event: PointerEvent) {
    engine?.onOver(event);
  }
  function onPointerDown(event: PointerEvent) {
    engine?.onDown(event);
  }
  function onPointerMove(event: PointerEvent) {
    engine?.onMove(event);
  }
  function onPointerUp(event: PointerEvent) {
    engine?.onUp(event);
  }
  function onPointerCancel(event: PointerEvent) {
    engine?.onCancel(event);
  }
  function onClick(event: MouseEvent) {
    engine?.onClick(event);
  }
  function onKeydown(event: KeyboardEvent) {
    engine?.onKey(event);
  }
  function onFocusin(event: FocusEvent) {
    engine?.onFocus(event);
  }
</script>

<template>
  <div
    ref="root"
    :class="['orbit-container', props.class]"
    :style="rootStyle"
    :aria-hidden="interactive ? undefined : 'true'"
    :data-intro="introPending ? '' : undefined"
    :data-draggable="draggable ? '' : undefined"
    :data-dragging="dragging ? '' : undefined"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @pointerover="onPointerOver"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @lostpointercapture="onPointerCancel"
    @click="onClick"
    @keydown="onKeydown"
    @focusin="onFocusin"
  >
    <svg
      class="orbit-path-svg"
      data-orbit-svg=""
      preserveAspectRatio="none"
      :style="{ zIndex: 0, visibility: showPath ? undefined : 'hidden' }"
      aria-hidden="true"
    >
      <path
        data-orbit-path=""
        data-orbit-stroke=""
        :d="path"
        fill="none"
        :stroke="pathColor"
        stroke-linecap="round"
        :transform="pathTransform"
      />
    </svg>
    <svg
      v-if="showPath && layered"
      class="orbit-path-svg"
      data-orbit-svg=""
      preserveAspectRatio="none"
      :style="{ zIndex: 105 }"
      aria-hidden="true"
    >
      <defs>
        <clipPath :id="clipId" clipPathUnits="userSpaceOnUse">
          <rect data-orbit-clip="" />
        </clipPath>
      </defs>
      <g :clip-path="`url(#${clipId})`">
        <path
          data-orbit-stroke=""
          :d="path"
          fill="none"
          :stroke="pathColor"
          stroke-linecap="round"
          :transform="pathTransform"
        />
      </g>
    </svg>
    <div
      v-for="(item, index) in items"
      :key="index"
      class="orbit-item"
      :data-orbit-item="index"
      :data-clickable="clickToFront || interactive ? '' : undefined"
      :role="interactive ? 'button' : undefined"
      :tabindex="interactive ? 0 : undefined"
      :aria-label="interactive ? item.alt : undefined"
    >
      <div class="orbit-item-inner">
        <img
          :src="item.src"
          :alt="item.alt"
          draggable="false"
          decoding="async"
          class="orbit-image"
        />
      </div>
    </div>
    <div
      v-if="$slots.default"
      class="orbit-center-content"
      data-orbit-center=""
    >
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
  .orbit-container {
    position: relative;
    margin-left: auto;
    margin-right: auto;
    isolation: isolate;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .orbit-container[data-draggable] {
    cursor: grab;
    touch-action: pan-y pinch-zoom;
  }

  .orbit-container[data-dragging],
  .orbit-container[data-dragging] * {
    cursor: grabbing;
  }

  .orbit-path-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .orbit-item {
    position: absolute;
    top: 0;
    left: 0;
    will-change: transform, opacity;
  }

  .orbit-container[data-intro] .orbit-item {
    opacity: 0;
  }

  .orbit-item[data-clickable] {
    cursor: pointer;
  }

  .orbit-item-inner {
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: var(--orbit-radius, 0px);
    box-shadow: 0 calc(var(--orbit-shadow, 0) * 16px)
      calc(var(--orbit-shadow, 0) * 36px)
      rgba(0, 0, 0, calc(var(--orbit-shadow, 0) * 0.45));
    transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .orbit-item:hover .orbit-item-inner,
  .orbit-item:focus-visible .orbit-item-inner {
    transform: scale(var(--orbit-hover-scale, 1));
  }

  .orbit-item:focus-visible {
    outline: none;
  }

  .orbit-item:focus-visible .orbit-item-inner {
    outline: 2px solid currentColor;
    outline-offset: 3px;
  }

  .orbit-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    -webkit-user-drag: none;
  }

  .orbit-center-content {
    position: absolute;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .orbit-center-content > :deep(*) {
    pointer-events: auto;
  }

  @media (prefers-reduced-motion: reduce) {
    .orbit-item-inner {
      transition: none;
    }
  }
</style>
