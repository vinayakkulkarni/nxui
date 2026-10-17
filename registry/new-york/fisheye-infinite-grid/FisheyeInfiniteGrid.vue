<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    useMutationObserver,
    usePreferredDark,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { FISHEYE_GRID_ITEMS, FISHEYE_KEY_STEPS } from './fisheye-grid-items';
  import {
    clamp,
    createGlResources,
    disposeGlResources,
    drawGrid,
    getAtlasLayout,
    paintAtlas,
    uploadAtlas,
  } from './fisheye-gl';
  import type {
    FisheyeAtlasLayout,
    FisheyeDragState,
    FisheyeGlResources,
    FisheyeInfiniteGridProps,
    FisheyeNudge,
    FisheyeNudgeState,
    FisheyeResolvedTheme,
  } from './types';

  const props = withDefaults(defineProps<FisheyeInfiniteGridProps>(), {
    items: () => FISHEYE_GRID_ITEMS,
    tileWidth: 238,
    tileHeight: 272,
    gap: 0,
    lensStrength: 0.24,
    theme: 'system',
    hoverNudge: 16,
    inertia: 0.94,
    wheelSensitivity: 0.42,
    ariaLabel: 'Infinite draggable image grid',
    class: undefined,
  });

  const rootRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const htmlRef = ref<HTMLElement | null>(null);
  const htmlClass = ref('');
  const dragging = ref(false);
  const isVisible = ref(true);

  const prefersDark = usePreferredDark();
  const motionPreference = usePreferredReducedMotion();
  const reducedMotion = computed(() => motionPreference.value === 'reduce');

  const resolvedTheme = computed<FisheyeResolvedTheme>(() => {
    if (props.theme !== 'system') return props.theme;
    const classes = htmlClass.value.split(/\s+/);
    if (classes.includes('dark')) return 'dark';
    if (classes.includes('light')) return 'light';
    return prefersDark.value ? 'dark' : 'light';
  });

  const resolvedItems = computed(() =>
    props.items.length > 0 ? props.items : FISHEYE_GRID_ITEMS,
  );

  const layout = computed<FisheyeAtlasLayout>(() =>
    getAtlasLayout(
      resolvedItems.value.length,
      props.tileWidth,
      props.tileHeight,
      props.gap,
    ),
  );

  const position = { x: 0, y: 0 };
  const velocity = { x: 0, y: 0 };
  const view = { width: 1, height: 1 };
  const drag: FisheyeDragState = {
    active: false,
    pointerId: -1,
    x: 0,
    y: 0,
    time: 0,
  };
  let nudge: FisheyeNudge | null = null;
  let resources: FisheyeGlResources | null = null;
  let atlas: HTMLCanvasElement | null = null;
  let atlasContext: CanvasRenderingContext2D | null = null;
  let loadedImages: Array<HTMLImageElement | null> = [];
  let pendingImages: HTMLImageElement[] = [];

  function currentNudge(time: number): FisheyeNudgeState {
    if (!nudge) return { x: 0, y: 0, active: false };
    const elapsed = Math.max(0, time - nudge.startedAt);
    const progress = clamp(elapsed / 520, 0, 1);
    const settled = 1 - Math.pow(1 - progress, 3);
    const breathing = 1 + Math.sin(elapsed * 0.0042) * 0.07;
    const amount = settled * breathing;
    return { x: nudge.x * amount, y: nudge.y * amount, active: true };
  }

  function renderGrid(time: number): boolean {
    const state = currentNudge(time);
    if (resources && atlas) {
      drawGrid(
        resources,
        view,
        atlas,
        position.x + state.x,
        position.y + state.y,
        props.lensStrength,
      );
    }
    return state.active;
  }

  const { pause, resume, isActive } = useRafFn(
    ({ delta, timestamp }) => {
      const step = Math.min(32, delta);
      if (!drag.active && !reducedMotion.value) {
        position.x += velocity.x * step;
        position.y += velocity.y * step;
        const decay = Math.pow(clamp(props.inertia, 0, 0.98), step / 16.667);
        velocity.x *= decay;
        velocity.y *= decay;
      } else if (!drag.active) {
        velocity.x = 0;
        velocity.y = 0;
      }

      const nudgeActive = renderGrid(timestamp);
      const moving = Math.hypot(velocity.x, velocity.y) > 0.006;
      if (!drag.active && !moving && !nudgeActive) {
        velocity.x = 0;
        velocity.y = 0;
        pause();
      }
    },
    { immediate: false },
  );

  function requestRender() {
    if (!isVisible.value) {
      renderGrid(performance.now());
      return;
    }
    if (!isActive.value) resume();
  }

  function redrawAtlas() {
    if (!resources || !atlas || !atlasContext) return;
    const next = layout.value;
    if (atlas.width !== next.width) atlas.width = next.width;
    if (atlas.height !== next.height) atlas.height = next.height;
    paintAtlas(
      atlasContext,
      next,
      resolvedItems.value,
      loadedImages,
      resolvedTheme.value,
    );
    uploadAtlas(resources, atlas);
    requestRender();
  }

  function releaseImages() {
    for (const image of pendingImages) {
      image.onload = null;
      image.onerror = null;
    }
    pendingImages = [];
  }

  function loadImages() {
    releaseImages();
    const items = resolvedItems.value;
    const images: Array<HTMLImageElement | null> = items.map(() => null);
    loadedImages = images;
    items.forEach((item, index) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = () => {
        if (loadedImages !== images) return;
        images[index] = image;
        redrawAtlas();
      };
      image.onerror = () => {
        if (loadedImages === images) redrawAtlas();
      };
      image.src = item.image;
      pendingImages.push(image);
    });
    redrawAtlas();
  }

  function resize() {
    const root = rootRef.value;
    const canvas = canvasRef.value;
    if (!root || !canvas || !resources) return;
    const rect = root.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    view.width = Math.max(1, rect.width);
    view.height = Math.max(1, rect.height);
    canvas.width = Math.max(1, Math.round(view.width * dpr));
    canvas.height = Math.max(1, Math.round(view.height * dpr));
    resources.gl.viewport(0, 0, canvas.width, canvas.height);
    requestRender();
  }

  function commitNudge(time: number) {
    if (!nudge) return;
    const state = currentNudge(time);
    position.x += state.x;
    position.y += state.y;
    nudge = null;
  }

  function stopDrag(pointerId: number) {
    drag.active = false;
    dragging.value = false;
    const root = rootRef.value;
    if (root?.hasPointerCapture(pointerId))
      root.releasePointerCapture(pointerId);
    requestRender();
  }

  function onPointerEnter(event: PointerEvent) {
    const root = rootRef.value;
    if (
      !root ||
      event.pointerType !== 'mouse' ||
      event.buttons !== 0 ||
      reducedMotion.value ||
      drag.active ||
      props.hoverNudge <= 0
    ) {
      return;
    }
    const rect = root.getBoundingClientRect();
    const fromLeft = event.clientX < rect.left + rect.width / 2;
    const fromTop = event.clientY < rect.top + rect.height / 2;
    nudge = {
      startedAt: performance.now(),
      x: (fromLeft ? 1 : -1) * props.hoverNudge,
      y: (fromTop ? 1 : -1) * props.hoverNudge * 0.42,
    };
    requestRender();
  }

  function onPointerLeave() {
    if (drag.active) return;
    commitNudge(performance.now());
  }

  function onPointerDown(event: PointerEvent) {
    const root = rootRef.value;
    if (!root || event.button !== 0 || !event.isPrimary) return;
    commitNudge(performance.now());
    drag.active = true;
    drag.pointerId = event.pointerId;
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.time = performance.now();
    velocity.x = 0;
    velocity.y = 0;
    dragging.value = true;
    root.setPointerCapture(event.pointerId);
    requestRender();
  }

  function onPointerMove(event: PointerEvent) {
    const root = rootRef.value;
    if (!root || !drag.active || drag.pointerId !== event.pointerId) return;
    const bounds = root.getBoundingClientRect();
    const outside =
      event.clientX <= bounds.left ||
      event.clientY <= bounds.top ||
      event.clientX >= bounds.right ||
      event.clientY >= bounds.bottom;
    if (outside) {
      stopDrag(event.pointerId);
      return;
    }
    const time = performance.now();
    const deltaTime = Math.max(8, time - drag.time);
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    position.x += deltaX;
    position.y += deltaY;
    velocity.x = clamp(deltaX / deltaTime, -2.4, 2.4);
    velocity.y = clamp(deltaY / deltaTime, -2.4, 2.4);
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.time = time;
    requestRender();
  }

  function onPointerEnd(event: PointerEvent) {
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    stopDrag(event.pointerId);
  }

  function onWindowBlur() {
    if (drag.active) stopDrag(drag.pointerId);
  }

  function onKeyDown(event: KeyboardEvent) {
    const step = FISHEYE_KEY_STEPS[event.key];
    if (!step) return;
    event.preventDefault();
    commitNudge(performance.now());
    position.x += step[0];
    position.y += step[1];
    velocity.x = 0;
    velocity.y = 0;
    requestRender();
  }

  function onWheel(event: WheelEvent) {
    if (drag.active) return;
    event.preventDefault();
    commitNudge(performance.now());
    const modeMultiplier =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? Math.max(view.height, 1)
          : 1;
    const impulse = Math.max(0, props.wheelSensitivity) * 0.003;
    velocity.x = clamp(
      velocity.x - event.deltaX * modeMultiplier * impulse,
      -1.25,
      1.25,
    );
    velocity.y = clamp(
      velocity.y - event.deltaY * modeMultiplier * impulse,
      -1.25,
      1.25,
    );
    requestRender();
  }

  useEventListener(rootRef, 'pointerenter', onPointerEnter);
  useEventListener(rootRef, 'pointerleave', onPointerLeave);
  useEventListener(rootRef, 'pointerdown', onPointerDown);
  useEventListener(rootRef, 'pointermove', onPointerMove);
  useEventListener(rootRef, 'pointerup', onPointerEnd);
  useEventListener(rootRef, 'pointercancel', onPointerEnd);
  useEventListener(rootRef, 'keydown', onKeyDown);
  useEventListener(rootRef, 'wheel', onWheel, { passive: false });
  useEventListener('blur', onWindowBlur);

  useResizeObserver(rootRef, resize);

  useIntersectionObserver(rootRef, ([entry]) => {
    isVisible.value = entry?.isIntersecting ?? true;
    if (!isVisible.value) pause();
    else requestRender();
  });

  useMutationObserver(
    htmlRef,
    () => {
      htmlClass.value = htmlRef.value?.className ?? '';
    },
    { attributes: true, attributeFilter: ['class'] },
  );

  watch(resolvedItems, loadImages);
  watch([layout, resolvedTheme], redrawAtlas);
  watch(
    () => props.lensStrength,
    () => requestRender(),
  );

  onMounted(() => {
    htmlRef.value = document.documentElement;
    htmlClass.value = document.documentElement.className;
    const canvas = canvasRef.value;
    if (!canvas) return;
    resources = createGlResources(canvas);
    if (!resources) return;
    atlas = document.createElement('canvas');
    atlasContext = atlas.getContext('2d');
    resize();
    loadImages();
  });

  onBeforeUnmount(() => {
    pause();
    releaseImages();
    loadedImages = [];
    if (resources) disposeGlResources(resources);
    resources = null;
    atlas = null;
    atlasContext = null;
  });
</script>

<template>
  <div
    ref="rootRef"
    role="region"
    tabindex="0"
    :aria-label="props.ariaLabel"
    :data-dragging="dragging ? 'true' : 'false'"
    :class="
      cn(
        'group/fisheye-grid relative isolate size-full cursor-grab touch-none overflow-hidden antialiased outline-hidden select-none focus-visible:ring-2 focus-visible:ring-inset data-[dragging=true]:cursor-grabbing',
        resolvedTheme === 'light'
          ? 'bg-[#f1efe9] text-[#171717] focus-visible:ring-black/50'
          : 'bg-[#070707] text-white focus-visible:ring-white/60',
        props.class,
      )
    "
  >
    <span class="sr-only">
      Drag in any direction or use the arrow keys to explore the infinite grid.
    </span>

    <canvas
      ref="canvasRef"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 block size-full"
    />

    <div
      :class="
        cn(
          'pointer-events-none absolute inset-0 z-50',
          resolvedTheme === 'light'
            ? 'bg-[radial-gradient(circle_at_center,transparent_48%,rgba(42,35,24,0.13)_100%)]'
            : 'bg-[radial-gradient(circle_at_center,transparent_48%,rgba(0,0,0,0.28)_100%)]',
        )
      "
    />
    <div
      :class="
        cn(
          'pointer-events-none absolute inset-x-0 top-0 z-50 h-20 bg-linear-to-b to-transparent',
          resolvedTheme === 'light' ? 'from-[#f1efe9]/50' : 'from-black/45',
        )
      "
    />
  </div>
</template>
