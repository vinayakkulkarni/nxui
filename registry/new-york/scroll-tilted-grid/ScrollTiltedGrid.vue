<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    applyTileVariables,
    clamp,
    useSmoothWheel,
  } from './scroll-tilted-grid';
  import type {
    ScrollTiltedGridProps,
    ScrollTiltedGridTile,
    ScrollTiltedGridViewport,
  } from './types';

  const props = withDefaults(defineProps<ScrollTiltedGridProps>(), {
    loop: false,
    initialCycles: 2,
    maxCycles: 4,
    smoothScroll: true,
    aspectRatio: '4 / 5',
    perspective: 1000,
    maxTilt: 62,
    maxBlur: 7,
    rounded: '0.25rem',
    sectionPadding: '18vh',
    scrollContainer: undefined,
    class: undefined,
  });

  const preferredMotion = usePreferredReducedMotion();
  const reduceMotion = computed(() => preferredMotion.value === 'reduce');

  const cycleLimit = computed(() => Math.max(1, props.maxCycles));
  const cycleCount = ref(
    clamp(props.initialCycles, 1, Math.max(1, props.maxCycles)),
  );

  const tiles = computed<ScrollTiltedGridTile[]>(() => {
    const cycles = props.loop ? cycleCount.value : 1;
    const result: ScrollTiltedGridTile[] = [];
    for (let cycle = 0; cycle < cycles; cycle++) {
      props.images.forEach((image, index) => {
        result.push({
          key: `${cycle}-${index}-${image.src}`,
          image,
          index,
          side: index % 2 === 0 ? -1 : 1,
        });
      });
    }
    return result;
  });

  const showSentinel = computed(
    () => props.loop && cycleCount.value < cycleLimit.value,
  );

  const sectionRef = useTemplateRef<HTMLElement>('section');
  const tileRefs = useTemplateRef<HTMLElement[]>('tiles');
  const sentinelRef = useTemplateRef<HTMLElement>('sentinel');

  const scrollTarget = ref<HTMLElement | Window | null>(null);
  const observerRoot = computed(() => props.scrollContainer ?? undefined);

  let frame = 0;

  function readViewport(): ScrollTiltedGridViewport {
    const container = props.scrollContainer;
    if (container) {
      const rect = container.getBoundingClientRect();
      return { top: rect.top, height: rect.height };
    }
    return { top: 0, height: window.innerHeight };
  }

  function update() {
    frame = 0;
    if (reduceMotion.value) return;
    const viewport = readViewport();
    for (const tile of tileRefs.value ?? []) {
      const rect = tile.getBoundingClientRect();
      const travel = viewport.height + rect.height;
      const position = clamp(
        (viewport.top + viewport.height - rect.top) / travel,
      );
      const side = tile.dataset.side === '1' ? 1 : -1;
      applyTileVariables(tile, position, side, props.maxTilt, props.maxBlur);
    }
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  useEventListener(scrollTarget, 'scroll', schedule, { passive: true });
  useEventListener('resize', schedule, { passive: true });
  useResizeObserver(sectionRef, schedule);

  useSmoothWheel(
    scrollTarget,
    () => props.smoothScroll && !reduceMotion.value,
    { lerp: 0.075, wheelMultiplier: 0.85 },
  );

  useIntersectionObserver(
    sentinelRef,
    (entries) => {
      if (props.loop && entries.some((entry) => entry.isIntersecting)) {
        cycleCount.value = Math.min(cycleLimit.value, cycleCount.value + 1);
      }
    },
    { root: observerRoot, rootMargin: '1200px 0px' },
  );

  watch(
    () => props.scrollContainer,
    (container) => {
      scrollTarget.value = container ?? window;
      schedule();
    },
  );

  watch([tiles, reduceMotion, () => props.maxTilt, () => props.maxBlur], () =>
    nextTick(schedule),
  );

  onMounted(() => {
    scrollTarget.value = props.scrollContainer ?? window;
    update();
  });

  onBeforeUnmount(() => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  });
</script>

<template>
  <section
    ref="section"
    :class="cn('relative w-full overflow-hidden', props.class)"
    aria-label="Scroll-reactive image gallery"
  >
    <div
      class="mx-auto grid w-full max-w-5xl grid-cols-2 items-start gap-x-4 gap-y-16 px-4 sm:gap-x-10 sm:gap-y-28 sm:px-10 lg:gap-x-16"
      :style="{ paddingBlock: sectionPadding }"
    >
      <figure
        v-for="tile in tiles"
        :key="tile.key"
        ref="tiles"
        :data-side="tile.side"
        :class="cn('m-0', tile.side > 0 && 'pt-12 sm:pt-24')"
        :style="{
          aspectRatio,
          borderRadius: rounded,
          perspective: `${perspective}px`,
        }"
      >
        <div
          :class="
            cn(
              'relative w-full overflow-hidden border border-black/10 bg-neutral-200 shadow-[0_24px_80px_rgba(20,18,14,0.16)] dark:border-white/10 dark:bg-neutral-900 dark:shadow-[0_24px_90px_rgba(0,0,0,0.45)]',
              !reduceMotion &&
                'blur-(--tile-blur) brightness-(--tile-brightness) saturate-(--tile-saturation) transform-(--tile-transform) transform-3d',
            )
          "
          :style="{ aspectRatio, borderRadius: rounded }"
        >
          <img
            :src="tile.image.src"
            :alt="tile.image.alt"
            :class="
              cn(
                'size-full object-cover',
                !reduceMotion && 'scale-(--tile-image-scale)',
              )
            "
            :loading="tile.index < 4 ? 'eager' : 'lazy'"
            draggable="false"
          />
          <span
            class="pointer-events-none absolute inset-0 bg-linear-to-b from-white/5 via-transparent to-black/10"
          ></span>
        </div>
      </figure>
    </div>
    <div
      v-if="showSentinel"
      ref="sentinel"
      class="h-px"
      aria-hidden="true"
    ></div>
  </section>
</template>
