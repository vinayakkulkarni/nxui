<script setup lang="ts">
  import { computed, onMounted, ref, shallowRef } from 'vue';
  import { motion, useMotionValueEvent, useScroll, useSpring } from 'motion-v';
  import { usePreferredReducedMotion, useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import CaseStudyFlipStackCard from './CaseStudyFlipStackCard.vue';
  import {
    CASE_STUDY_FLIP_DEFAULT_ITEMS,
    CASE_STUDY_FLIP_SPRING,
  } from './case-study-flip-stack';
  import type { Transition } from 'motion-v';
  import type { CaseStudyFlipStackProps } from './types';

  const props = withDefaults(defineProps<CaseStudyFlipStackProps>(), {
    items: undefined,
    hint: 'Scroll Down',
    heading: 'Design That Delivers.',
    endLabel: 'The End',
    class: '',
  });

  const safeItems = computed(() =>
    props.items && props.items.length > 0
      ? props.items
      : CASE_STUDY_FLIP_DEFAULT_ITEMS,
  );
  // Rendered back-to-front so the first card paints on top (upstream order).
  const reversedCards = computed(() =>
    safeItems.value.map((item, index) => ({ item, index })).reverse(),
  );

  const preferredMotion = usePreferredReducedMotion();
  const reduceMotion = computed(() => preferredMotion.value === 'reduce');

  const rootRef = ref<HTMLElement | null>(null);
  const stackRef = ref<HTMLDivElement | null>(null);
  // Nearest scrollable ancestor; null = the window scrolls.
  const scrollParent = ref<HTMLElement | null>(null);
  // 1% of the scroll viewport height in px (null = use real `vh`).
  const viewportUnit = ref<number | null>(null);

  function findScrollParent(el: HTMLElement | null): HTMLElement | null {
    let node: HTMLElement | null = el?.parentElement ?? null;
    while (node) {
      const overflowY = getComputedStyle(node).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') return node;
      node = node.parentElement;
    }
    return null;
  }

  onMounted(() => {
    scrollParent.value = findScrollParent(rootRef.value);
  });

  useResizeObserver(scrollParent, (entries) => {
    const entry = entries[0];
    if (entry) viewportUnit.value = entry.contentRect.height / 100;
  });

  const rootStyle = computed(() =>
    viewportUnit.value === null
      ? undefined
      : { '--csfs-vh': `${viewportUnit.value}px` },
  );

  const stackStyle = computed(() => ({
    height: `calc(var(--csfs-vh, 1vh) * ${(Math.max(safeItems.value.length, 1) + 1) * 100})`,
  }));

  const { scrollYProgress } = useScroll(() => ({
    container: scrollParent.value ?? undefined,
    target: stackRef.value ?? undefined,
    offset: ['start start', 'end end'],
  }));
  const smoothProgress = useSpring(scrollYProgress, CASE_STUDY_FLIP_SPRING);

  const rawValue = shallowRef(0);
  const smoothValue = shallowRef(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    rawValue.value = v;
  });
  useMotionValueEvent(smoothProgress, 'change', (v) => {
    smoothValue.value = v;
  });
  const progress = computed(() =>
    reduceMotion.value ? rawValue.value : smoothValue.value,
  );

  const bob = { y: [0, 10, 0] };
  const bobTransition: Transition = {
    duration: 1.4,
    repeat: Infinity,
    ease: 'easeInOut',
  };
  const bobTransitionDelayed: Transition = { ...bobTransition, delay: 0.18 };
</script>

<template>
  <div
    ref="rootRef"
    :class="
      cn(
        '@container relative bg-[#eeeae2] font-sans text-[#29251f] dark:bg-[#151310] dark:text-[#eeeae2]',
        props.class,
      )
    "
    :style="rootStyle"
  >
    <section
      class="relative h-[calc(var(--csfs-vh,1vh)*82)] min-h-160 overflow-hidden px-5 @2xl:px-10"
    >
      <div
        class="absolute inset-x-0 top-[clamp(110px,calc(var(--csfs-vh,1vh)*16),165px)] flex items-center justify-center gap-[clamp(14px,2.5cqw,32px)] text-[clamp(26px,3.5cqw,52px)] font-medium tracking-[-0.055em]"
      >
        <motion.span
          aria-hidden="true"
          :animate="reduceMotion ? undefined : bob"
          :transition="bobTransition"
        >
          ↓
        </motion.span>
        <span>{{ hint }}</span>
        <motion.span
          aria-hidden="true"
          :animate="reduceMotion ? undefined : bob"
          :transition="bobTransitionDelayed"
        >
          ↓
        </motion.span>
      </div>

      <div
        class="absolute inset-x-5 top-[clamp(330px,calc(var(--csfs-vh,1vh)*43),440px)] flex justify-center @2xl:inset-x-10"
      >
        <h2
          class="max-w-[18ch] text-center text-[clamp(42px,5.5cqw,82px)] leading-[0.92] font-semibold tracking-[-0.06em] text-[#a94808] dark:text-[#f0864a]"
        >
          {{ heading }}
        </h2>
      </div>
    </section>

    <div ref="stackRef" class="relative" :style="stackStyle">
      <div
        class="sticky top-0 flex h-[calc(var(--csfs-vh,1vh)*100)] flex-col justify-center overflow-hidden px-[clamp(14px,4cqw,64px)] py-8"
      >
        <div
          class="relative mx-auto aspect-3/4 w-full max-w-215 perspective-midrange @2xl:aspect-[1.76/1]"
        >
          <CaseStudyFlipStackCard
            v-for="card in reversedCards"
            :key="`${card.item.title}-${card.index}`"
            :item="card.item"
            :index="card.index"
            :total="safeItems.length"
            :progress="progress"
            :reduce-motion="reduceMotion"
          />
        </div>
      </div>
    </div>

    <section
      class="flex min-h-[calc(var(--csfs-vh,1vh)*120)] items-center justify-center px-5 @2xl:px-10"
    >
      <p
        class="text-center text-[clamp(54px,9cqw,144px)] leading-none font-semibold tracking-[-0.07em] text-[#29251f] dark:text-[#eeeae2]"
      >
        {{ endLabel }}
      </p>
    </section>
  </div>
</template>
