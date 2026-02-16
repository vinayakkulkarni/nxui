<script setup lang="ts">
  import {
    useScroll,
    useTransform,
    useSpring,
    useMotionValue,
  } from 'motion-v';
  import { useElementSize } from '@vueuse/core';
  import type {
    CollectionSurferItem,
    CollectionSurferVariant,
  } from '~/types/components';
  import { cn } from '~/lib/utils';
  import CollectionSurferCard from './CollectionSurferCard.vue';

  const props = withDefaults(
    defineProps<{
      items?: CollectionSurferItem[];
      variant?: CollectionSurferVariant;
      class?: string;
    }>(),
    {
      items: () => [],
      variant: 'magnetic',
      class: '',
    },
  );

  const scrollContainerRef = ref<HTMLElement>();
  const { height: containerHeight } = useElementSize(scrollContainerRef);

  const duplicatedItems = computed(() => [...props.items, ...props.items]);

  const scrollPerItem = 600;
  const loopDistance = computed(() => props.items.length * scrollPerItem);
  const spacerHeight = computed(() => 50000);

  // Step vector for 3D positioning (matches original exactly)
  const stepX = 240;
  const stepY = -84;
  const stepZ = -288;

  // Container-scoped scroll tracking
  const scrollVal = ref(0);

  function handleScroll() {
    const el = scrollContainerRef.value;
    if (el) scrollVal.value = el.scrollTop;
  }

  // Smooth the raw scroll with spring physics
  const smoothScrollRef = ref(0);
  let animFrame = 0;

  watch(scrollVal, (target) => {
    cancelAnimationFrame(animFrame);
    const animate = () => {
      const current = smoothScrollRef.value;
      const delta = target - current;
      if (Math.abs(delta) < 0.5) {
        smoothScrollRef.value = target;
        return;
      }
      smoothScrollRef.value = current + delta * 0.15;
      animFrame = requestAnimationFrame(animate);
    };
    animate();
  });

  // Looped progress via modulo
  const loopedProgress = computed(() => {
    const ld = loopDistance.value;
    if (ld <= 0) return 0;
    return ((smoothScrollRef.value % ld) + ld) % ld;
  });

  // Offset to position cards center-right of the container
  // Positive X = rightward, negative Y = upward
  const offsetX = 60;
  const offsetY = -50;

  // Group 3D transform derived from scroll progress
  const groupTransform = computed(() => {
    const p = loopedProgress.value;
    const tx = (-p * stepX) / scrollPerItem + offsetX;
    const ty = (-p * stepY) / scrollPerItem + offsetY;
    const tz = (-p * stepZ) / scrollPerItem;
    return `translate3d(${tx}px, ${ty}px, ${tz}px)`;
  });

  // Mouse tracking for hover effects
  const mouseX = useMotionValue(-10000);
  const mouseY = useMotionValue(-10000);

  function handleMouseMove(e: MouseEvent) {
    if (props.variant === 'simple') return;
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  }

  function handleMouseLeave() {
    if (props.variant === 'simple') return;
    mouseX.set(-10000);
    mouseY.set(-10000);
  }

  const viewportHeight = computed(() =>
    Math.max(containerHeight.value, 400),
  );

  onBeforeUnmount(() => {
    cancelAnimationFrame(animFrame);
  });
</script>

<template>
  <div
    ref="scrollContainerRef"
    :class="
      cn(
        'relative overflow-y-auto overflow-x-hidden bg-neutral-100 dark:bg-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        props.class,
      )
    "
    @scroll.passive="handleScroll"
  >
    <!-- Tall spacer to create scrollable area -->
    <div :style="{ height: `${spacerHeight}px` }" class="relative w-full">
      <!-- Sticky viewport stays in place while user scrolls -->
      <div
        class="sticky top-0 flex w-full items-center justify-center overflow-hidden"
        :style="{ height: `${viewportHeight}px` }"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <!-- 3D scene container -->
        <div
          class="absolute inset-0 flex items-center justify-center"
          :style="{
            perspective: '2000px',
            perspectiveOrigin: '10% 10%',
          }"
        >
          <!-- Animated track (w-0 h-0 so cards position from center) -->
          <div
            class="relative h-0 w-0"
            :style="{
              transform: groupTransform,
              transformStyle: 'preserve-3d',
            }"
          >
            <CollectionSurferCard
              v-for="(item, index) in duplicatedItems"
              :key="`${item.id}-${index}`"
              :item="item"
              :index="index"
              :total-items="props.items.length"
              :mouse-x="mouseX"
              :mouse-y="mouseY"
              :variant="props.variant"
              :step-x="stepX"
              :step-y="stepY"
              :step-z="stepZ"
            />
          </div>
        </div>

        <!-- UI Overlays -->
        <div class="pointer-events-none absolute left-[3vw] top-[3vw] z-50 mix-blend-difference">
          <h1 class="ml-[4vw] text-[clamp(2rem,6vw,5rem)] font-bold leading-[0.9] tracking-tighter text-white">
            HERITAGE FW25/26
          </h1>
          <h1 class="text-[clamp(2rem,6vw,5rem)] font-bold leading-[0.9] tracking-tighter text-white">
            COLLECTION
            <span class="relative top-[0.6em] ml-2 align-top font-mono text-[0.4em] tabular-nums">
              ({{ props.items.length }})
            </span>
          </h1>
        </div>

        <div class="pointer-events-none absolute bottom-[3vw] right-[3vw] z-50 font-mono text-xs uppercase tracking-wider text-neutral-500 dark:text-white/70">
          scroll to surf
        </div>
      </div>
    </div>
  </div>
</template>
