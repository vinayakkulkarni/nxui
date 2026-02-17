<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  interface CarouselItem {
    title: string;
    description: string;
    id: number | string;
  }

  const props = withDefaults(
    defineProps<{
      items?: CarouselItem[];
      baseWidth?: number;
      autoplay?: boolean;
      autoplayDelay?: number;
      pauseOnHover?: boolean;
      loop?: boolean;
      round?: boolean;
      class?: string;
    }>(),
    {
      items: () => [
        { title: 'Text Animations', description: 'Cool text animations for your projects.', id: 1 },
        { title: 'Animations', description: 'Smooth animations for your projects.', id: 2 },
        { title: 'Components', description: 'Reusable components for your projects.', id: 3 },
        { title: 'Backgrounds', description: 'Beautiful backgrounds for your projects.', id: 4 },
        { title: 'Common UI', description: 'Common UI components are coming soon!', id: 5 },
      ],
      baseWidth: 300,
      autoplay: false,
      autoplayDelay: 3000,
      pauseOnHover: false,
      loop: false,
      round: false,
      class: '',
    },
  );

  const GAP = 16;
  const CONTAINER_PADDING = 16;
  const VELOCITY_THRESHOLD = 500;

  const itemWidth = computed(() => props.baseWidth - CONTAINER_PADDING * 2);
  const trackItemOffset = computed(() => itemWidth.value + GAP);

  const itemsForRender = computed(() => {
    if (!props.loop || props.items.length === 0) return props.items;
    return [props.items[props.items.length - 1], ...props.items, props.items[0]];
  });

  const position = ref(props.loop ? 1 : 0);
  const translateX = ref(0);
  const isHovered = ref(false);
  const isDragging = ref(false);
  const isAnimating = ref(false);
  let dragStartX = 0;
  let dragStartTranslate = 0;

  const activeIndex = computed(() => {
    if (props.items.length === 0) return 0;
    if (props.loop) return (position.value - 1 + props.items.length) % props.items.length;
    return Math.min(position.value, props.items.length - 1);
  });

  function updatePosition(pos: number, animate = true) {
    position.value = pos;
    if (animate) {
      isAnimating.value = true;
    }
    translateX.value = -pos * trackItemOffset.value;
  }

  onMounted(() => {
    updatePosition(props.loop ? 1 : 0, false);
  });

  // Autoplay
  let autoplayTimer: ReturnType<typeof setInterval> | null = null;

  function startAutoplay() {
    stopAutoplay();
    if (!props.autoplay || itemsForRender.value.length <= 1) return;
    autoplayTimer = setInterval(() => {
      if (props.pauseOnHover && isHovered.value) return;
      updatePosition(Math.min(position.value + 1, itemsForRender.value.length - 1));
    }, props.autoplayDelay);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  onMounted(() => startAutoplay());
  onBeforeUnmount(() => stopAutoplay());

  function handleTransitionEnd() {
    isAnimating.value = false;
    if (!props.loop) return;
    const last = itemsForRender.value.length - 1;
    if (position.value === last) {
      updatePosition(1, false);
    } else if (position.value === 0) {
      updatePosition(props.items.length, false);
    }
  }

  // Drag
  function onPointerDown(e: PointerEvent) {
    isDragging.value = true;
    isAnimating.value = false;
    dragStartX = e.clientX;
    dragStartTranslate = translateX.value;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging.value) return;
    const dx = e.clientX - dragStartX;
    translateX.value = dragStartTranslate + dx;
  }

  function onPointerUp(e: PointerEvent) {
    if (!isDragging.value) return;
    isDragging.value = false;
    const dx = e.clientX - dragStartX;
    const dir = dx < -30 ? 1 : dx > 30 ? -1 : 0;
    if (dir === 0) {
      updatePosition(position.value);
      return;
    }
    const next = position.value + dir;
    const max = itemsForRender.value.length - 1;
    updatePosition(Math.max(0, Math.min(next, max)));
  }

  const trackStyle = computed(() => ({
    transform: `translateX(${translateX.value}px)`,
    transition: isAnimating.value ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : isDragging.value ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    gap: `${GAP}px`,
    perspective: '1000px',
    perspectiveOrigin: `${position.value * trackItemOffset.value + itemWidth.value / 2}px 50%`,
  }));
</script>

<template>
  <div
    :class="cn('relative overflow-hidden rounded-3xl border border-border p-4', round ? 'rounded-full' : '', $props.class)"
    :style="{ width: `${baseWidth}px`, ...(round ? { height: `${baseWidth}px` } : {}) }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div
      class="flex cursor-grab active:cursor-grabbing"
      :style="{ ...trackStyle, width: `${itemWidth}px` }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @transitionend="handleTransitionEnd"
    >
      <div
        v-for="(item, idx) in itemsForRender"
        :key="`${item.id}-${idx}`"
        class="relative flex shrink-0 flex-col items-start justify-between overflow-hidden rounded-xl border border-border bg-background"
        :class="round ? 'items-center justify-center text-center rounded-full' : ''"
        :style="{ width: `${itemWidth}px`, height: round ? `${itemWidth}px` : '100%' }"
      >
        <div class="mb-4 p-5 pt-5">
          <span class="flex size-7 items-center justify-center rounded-full bg-foreground">
            <slot :name="`icon-${idx}`">
              <svg class="size-4 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </slot>
          </span>
        </div>
        <div class="p-5 pb-5">
          <div class="mb-1 text-lg font-black text-foreground">{{ item.title }}</div>
          <p class="text-sm text-muted-foreground">{{ item.description }}</p>
        </div>
      </div>
    </div>

    <div class="flex w-full justify-center" :class="round ? 'absolute bottom-12 left-1/2 z-10 -translate-x-1/2' : ''">
      <div class="mt-4 flex justify-between px-8" style="width: 150px">
        <div
          v-for="(_, idx) in items"
          :key="idx"
          class="size-2 cursor-pointer rounded-full transition-colors duration-150"
          :class="activeIndex === idx ? 'bg-foreground scale-125' : 'bg-muted-foreground'"
          @click="updatePosition(loop ? idx + 1 : idx)"
        />
      </div>
    </div>
  </div>
</template>
