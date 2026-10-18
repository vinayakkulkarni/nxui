<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    clamp,
    defaultNewsletterBooks,
    deriveLayout,
    nearestBook,
    safeHref,
    shelfBounds,
  } from './bookshelf-layout';
  import {
    BOOK_EXIT_DURATION,
    createBookshelfEngine,
  } from './bookshelf-engine';
  import type {
    BookshelfEngine,
    NewsletterBookshelfEmits,
    NewsletterBookshelfProps,
    ShelfGesture,
    ShelfRig,
  } from './types';

  const props = withDefaults(defineProps<NewsletterBookshelfProps>(), {
    items: () => defaultNewsletterBooks,
    height: 620,
    brand: 'The Brief',
    class: undefined,
  });

  const emit = defineEmits<NewsletterBookshelfEmits>();

  const stageRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const tooltipRef = ref<HTMLDivElement | null>(null);

  const hoveredIndex = ref<number | null>(null);
  const selectedIndex = ref<number | null>(null);
  const currentIndex = ref(0);
  const stageWidth = ref(1000);
  const stageHeight = ref(620);

  const motionPreference = usePreferredReducedMotion();
  const reducedMotion = computed(() => motionPreference.value === 'reduce');

  const books = computed(() =>
    deriveLayout(props.items.length ? props.items : defaultNewsletterBooks),
  );
  const bounds = computed(() =>
    shelfBounds(books.value, stageWidth.value, stageHeight.value),
  );

  const rootStyle = computed(() => ({
    height:
      typeof props.height === 'number' ? `${props.height}px` : props.height,
  }));

  const selectedBook = computed(() =>
    selectedIndex.value === null ? null : books.value[selectedIndex.value],
  );
  const hoveredBook = computed(() =>
    hoveredIndex.value === null
      ? null
      : (books.value[hoveredIndex.value] ?? null),
  );
  const tooltipVisible = computed(
    () => hoveredBook.value !== null && selectedIndex.value === null,
  );
  const stageLabel = computed(() =>
    selectedBook.value
      ? `${selectedBook.value.title} focused. Drag to rotate or activate again to open.`
      : `Interactive archive with ${books.value.length} editions`,
  );

  const rig: ShelfRig = { cameraX: 0, yaw: 0, pitch: 0 };
  let engine: BookshelfEngine | null = null;
  let gesture: ShelfGesture | null = null;
  let switchTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingSelection: number | null = null;
  let suppressClick = false;

  function moveCamera(next: number) {
    rig.cameraX = clamp(next, bounds.value.min, bounds.value.max);
    currentIndex.value = nearestBook(books.value, rig.cameraX);
  }

  function resetOrbit() {
    rig.yaw = 0;
    rig.pitch = 0;
  }

  function presentBook(index: number) {
    const book = books.value[index];
    if (!book) return;
    moveCamera(book.x);
    resetOrbit();
    hoveredIndex.value = null;
    selectedIndex.value = index;
    emit('select', book, index);
  }

  function openBook(index: number) {
    const href = safeHref(books.value[index]?.href, window.location.href);
    if (href) window.location.assign(href);
  }

  function clearSwitchTimer() {
    if (switchTimer !== null) clearTimeout(switchTimer);
    switchTimer = null;
  }

  function selectBook(index: number) {
    if (suppressClick) return;
    if (selectedIndex.value === index) {
      openBook(index);
      return;
    }
    if (selectedIndex.value !== null) {
      const book = books.value[index];
      if (!book) return;
      pendingSelection = index;
      moveCamera(book.x);
      hoveredIndex.value = null;
      selectedIndex.value = null;
      resetOrbit();
      clearSwitchTimer();
      switchTimer = setTimeout(
        () => {
          const next = pendingSelection;
          pendingSelection = null;
          switchTimer = null;
          if (next !== null) presentBook(next);
        },
        reducedMotion.value ? 0 : BOOK_EXIT_DURATION,
      );
      return;
    }
    if (switchTimer !== null) {
      pendingSelection = index;
      return;
    }
    presentBook(index);
  }

  function close() {
    selectedIndex.value = null;
    resetOrbit();
    stageRef.value?.focus({ preventScroll: true });
  }

  function switchFocused(direction: number) {
    if (selectedIndex.value === null) return;
    const next = clamp(
      selectedIndex.value + direction,
      0,
      books.value.length - 1,
    );
    if (next !== selectedIndex.value) selectBook(next);
  }

  function onPointerDown(event: PointerEvent) {
    gesture = {
      mode: 'pending',
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      downIndex: engine?.pick(event.clientX, event.clientY) ?? null,
    };
  }

  function placeTooltip(event: PointerEvent) {
    const rect = stageRef.value?.getBoundingClientRect();
    if (!tooltipRef.value || !rect) return;
    tooltipRef.value.style.left = `${event.clientX - rect.left}px`;
    tooltipRef.value.style.top = `${event.clientY - rect.top}px`;
  }

  function onPointerMove(event: PointerEvent) {
    placeTooltip(event);
    const active = gesture;
    if (!active || active.mode === 'pending') {
      hoveredIndex.value = engine?.pick(event.clientX, event.clientY) ?? null;
    }
    if (!active) return;
    const dx = event.clientX - active.x;
    const dy = event.clientY - active.y;
    if (
      active.mode === 'pending' &&
      Math.hypot(event.clientX - active.startX, dy) > 7
    ) {
      active.mode = selectedIndex.value === null ? 'drag' : 'orbit';
      suppressClick = true;
      stageRef.value?.setPointerCapture(event.pointerId);
      hoveredIndex.value = null;
    }
    if (active.mode === 'drag') {
      moveCamera(rig.cameraX - dx * 0.0085);
    } else if (active.mode === 'orbit') {
      rig.yaw = clamp(rig.yaw + dx * 0.006, -0.62, 0.62);
      rig.pitch = clamp(rig.pitch + dy * 0.004, -0.28, 0.28);
    }
    active.x = event.clientX;
    active.y = event.clientY;
  }

  function onPointerUp(event: PointerEvent) {
    if (stageRef.value?.hasPointerCapture(event.pointerId)) {
      stageRef.value.releasePointerCapture(event.pointerId);
    }
    if (gesture && gesture.mode === 'pending' && !suppressClick) {
      handleTap(event, gesture);
    }
    gesture = null;
    requestAnimationFrame(() => {
      suppressClick = false;
    });
  }

  function handleTap(event: PointerEvent, active: ShelfGesture) {
    const moved = Math.hypot(
      event.clientX - active.startX,
      event.clientY - active.startY,
    );
    const hit = engine?.pick(event.clientX, event.clientY) ?? null;
    if (hit !== null) {
      if (hit === active.downIndex) selectBook(hit);
    } else if (moved <= 2 && selectedIndex.value !== null) {
      close();
    }
  }

  function onPointerLeave() {
    gesture = null;
    hoveredIndex.value = null;
  }

  function onWheel(event: WheelEvent) {
    if (selectedIndex.value !== null) return;
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    if (horizontal || event.shiftKey) {
      event.preventDefault();
      moveCamera(
        rig.cameraX + (horizontal ? event.deltaX : event.deltaY) * 0.012,
      );
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && selectedIndex.value !== null) {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (selectedIndex.value !== null) switchFocused(1);
      else moveCamera(rig.cameraX + bounds.value.visibleSpan * 0.23);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (selectedIndex.value !== null) switchFocused(-1);
      else moveCamera(rig.cameraX - bounds.value.visibleSpan * 0.23);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (selectedIndex.value === null) selectBook(currentIndex.value);
      else openBook(selectedIndex.value);
    }
  }

  useEventListener(stageRef, 'wheel', onWheel, { passive: false });

  useResizeObserver(stageRef, (entries) => {
    const rect = entries[0]?.contentRect;
    if (!rect) return;
    stageWidth.value = rect.width;
    stageHeight.value = rect.height;
    engine?.resize(rect.width, rect.height);
  });

  function syncView() {
    engine?.setView({
      hoveredIndex: hoveredIndex.value,
      selectedIndex: selectedIndex.value,
      reducedMotion: reducedMotion.value,
    });
  }

  watch([hoveredIndex, selectedIndex, reducedMotion], syncView);

  watch([books, () => props.brand], () => {
    engine?.setBooks(books.value, props.brand);
    selectedIndex.value = null;
    hoveredIndex.value = null;
    syncView();
  });

  watch(
    [books, bounds],
    () => {
      rig.cameraX = bounds.value.min;
      currentIndex.value = nearestBook(books.value, bounds.value.min);
    },
    { immediate: true },
  );

  const { pause, resume } = useRafFn(
    ({ delta }) => {
      engine?.frame(Math.min(delta, 100) / 1000);
    },
    { immediate: false },
  );

  useIntersectionObserver(stageRef, (entries) => {
    if (entries[0]?.isIntersecting) resume();
    else pause();
  });

  onMounted(() => {
    const canvas = canvasRef.value;
    const stage = stageRef.value;
    if (!canvas || !stage) return;
    try {
      engine = createBookshelfEngine(canvas, rig);
    } catch {
      engine = null;
      return;
    }
    const rect = stage.getBoundingClientRect();
    stageWidth.value = rect.width;
    stageHeight.value = rect.height;
    engine.resize(rect.width, rect.height);
    engine.setBooks(books.value, props.brand);
    syncView();
    resume();
  });

  onBeforeUnmount(() => {
    pause();
    clearSwitchTimer();
    engine?.dispose();
    engine = null;
  });
</script>

<template>
  <section
    :class="
      cn(
        'relative isolate w-full overflow-hidden bg-[#fbfbfa] text-[#171717] [--shelf-accent:#4040ff] dark:bg-[#111112] dark:text-[#f5f5f3]',
        props.class,
      )
    "
    :style="rootStyle"
  >
    <div
      ref="stageRef"
      tabindex="0"
      role="region"
      :aria-label="stageLabel"
      :class="
        cn(
          'relative size-full touch-pan-y overflow-hidden outline-none select-none focus-visible:ring-2 focus-visible:ring-(--shelf-accent) focus-visible:ring-inset',
          tooltipVisible && 'cursor-pointer',
        )
      "
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerLeave"
      @keydown="onKeyDown"
    >
      <canvas ref="canvasRef" aria-hidden="true" class="block size-full" />

      <div
        ref="tooltipRef"
        aria-hidden="true"
        :class="
          cn(
            'pointer-events-none absolute z-20 max-w-75 -translate-x-1/2 -translate-y-[calc(100%+16px)] rounded-md bg-[#171717] px-3 py-2 font-mono text-[11px]/4 whitespace-nowrap text-white shadow-xl transition-opacity duration-150 dark:bg-white dark:text-[#171717]',
            tooltipVisible ? 'opacity-100' : 'opacity-0',
          )
        "
      >
        {{ hoveredBook?.title }}
        <span class="block text-white/50 dark:text-black/50">
          {{ hoveredBook?.date }}
        </span>
      </div>
    </div>
  </section>
</template>
