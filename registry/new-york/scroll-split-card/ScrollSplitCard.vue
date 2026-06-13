<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useRafFn } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import type { ScrollSplitCardProps } from './types';

  const props = withDefaults(defineProps<ScrollSplitCardProps>(), {
    startHint: 'Scroll down',
    endHint: 'So cool, right?',
    class: '',
  });

  const containerRef = ref<HTMLDivElement>();
  const progress = ref(0);
  const smoothProgress = ref(0);

  // Spring parameters
  const stiffness = 400;
  const dampingVal = 50;
  const mass = 1.2;
  let velocity = 0;

  function interpolate(
    t: number,
    inputRange: number[],
    outputRange: string[],
  ): string {
    if (t <= inputRange[0]!) return outputRange[0]!;
    if (t >= inputRange[inputRange.length - 1]!)
      return outputRange[outputRange.length - 1]!;

    for (let i = 0; i < inputRange.length - 1; i++) {
      const start = inputRange[i]!;
      const end = inputRange[i + 1]!;
      if (t >= start && t <= end) {
        const localT = (t - start) / (end - start);
        const startVal = Number.parseFloat(outputRange[i]!);
        const endVal = Number.parseFloat(outputRange[i + 1]!);
        const unit = outputRange[i]!.replace(/[-\d.]/g, '');
        return `${startVal + (endVal - startVal) * localT}${unit}`;
      }
    }
    return outputRange[outputRange.length - 1]!;
  }

  function interpolateNum(
    t: number,
    inputRange: number[],
    outputRange: number[],
  ): number {
    if (t <= inputRange[0]!) return outputRange[0]!;
    if (t >= inputRange[inputRange.length - 1]!)
      return outputRange[outputRange.length - 1]!;

    for (let i = 0; i < inputRange.length - 1; i++) {
      const start = inputRange[i]!;
      const end = inputRange[i + 1]!;
      if (t >= start && t <= end) {
        const localT = (t - start) / (end - start);
        return (
          outputRange[i]! + (outputRange[i + 1]! - outputRange[i]!) * localT
        );
      }
    }
    return outputRange[outputRange.length - 1]!;
  }

  // Container scale (stage 1: 0-0.4)
  const containerScale = computed(() =>
    interpolateNum(progress.value, [0, 0.4], [1, 0.9]),
  );

  // Cards Y movement (stage 3: 0.8-1)
  const cardsY = computed(() =>
    interpolate(progress.value, [0.8, 1], ['0px', '-200px']),
  );

  // Left card X (stage 1: separate, stage 2: come back slightly)
  const leftX = computed(() =>
    interpolate(progress.value, [0, 0.4, 0.8], ['0px', '-48px', '-24px']),
  );

  // Right card X
  const rightX = computed(() =>
    interpolate(progress.value, [0, 0.4, 0.8], ['0px', '48px', '24px']),
  );

  // RotateY flip (stage 2: 0.4-0.8)
  const rotateY = computed(() =>
    interpolate(progress.value, [0.4, 0.8], ['0deg', '180deg']),
  );

  // Left card rotateZ tilt
  const leftRotateZ = computed(() =>
    interpolate(progress.value, [0.4, 0.8], ['0deg', '6deg']),
  );

  // Right card rotateZ tilt
  const rightRotateZ = computed(() =>
    interpolate(progress.value, [0.4, 0.8], ['0deg', '-6deg']),
  );

  // Border radius progression (stage 1: 0-0.2)
  const borderRadiusLeft = computed(() =>
    interpolate(
      progress.value,
      [0, 0.2],
      ['16px 0px 0px 16px', '16px 16px 16px 16px'],
    ),
  );

  const borderRadiusMiddle = computed(() =>
    interpolate(
      progress.value,
      [0, 0.2],
      ['0px 0px 0px 0px', '16px 16px 16px 16px'],
    ),
  );

  const borderRadiusRight = computed(() =>
    interpolate(
      progress.value,
      [0, 0.2],
      ['0px 16px 16px 0px', '16px 16px 16px 16px'],
    ),
  );

  // Box shadow intensity (stage 1: 0-0.2)
  const shadowOpacity = computed(() =>
    interpolateNum(progress.value, [0, 0.2], [0, 0.4]),
  );

  // Start text (visible 0-0.1, then fades)
  const startTextOpacity = computed(() =>
    interpolateNum(progress.value, [0, 0.1], [1, 0]),
  );

  const startTextY = computed(() =>
    interpolate(progress.value, [0, 0.1], ['0px', '20px']),
  );

  // End text (appears 0.8-1)
  const endTextOpacity = computed(() =>
    interpolateNum(progress.value, [0.8, 1], [0, 1]),
  );

  const endTextY = computed(() =>
    interpolate(progress.value, [0.8, 1], ['40px', '0px']),
  );

  // Back face text visibility tied to flip
  const backTextOpacity = computed(() =>
    interpolateNum(progress.value, [0.6, 0.85], [0, 1]),
  );

  function findScrollParent(el: HTMLElement | null): HTMLElement | Window {
    let node: HTMLElement | null = el?.parentElement ?? null;
    while (node) {
      const overflowY = getComputedStyle(node).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') return node;
      node = node.parentElement;
    }
    return window;
  }

  let scrollParent: HTMLElement | Window | null = null;

  onMounted(() => {
    scrollParent = findScrollParent(containerRef.value);
  });

  function updateScroll() {
    const container = containerRef.value;
    if (!container) return;

    const rect = container.getBoundingClientRect();

    let viewportH: number;
    let containerTop: number;
    if (scrollParent instanceof HTMLElement) {
      const parentRect = scrollParent.getBoundingClientRect();
      viewportH = scrollParent.clientHeight;
      containerTop = rect.top - parentRect.top;
    } else {
      viewportH = window.innerHeight;
      containerTop = rect.top;
    }

    const scrollableHeight = rect.height - viewportH;
    if (scrollableHeight <= 0) {
      progress.value = 0;
      return;
    }

    const scrolled = -containerTop;
    progress.value = Math.max(0, Math.min(1, scrolled / scrollableHeight));
  }

  useRafFn(() => {
    updateScroll();

    // Spring physics for smooth progress
    const dt = 1 / 60;
    const displacement = progress.value - smoothProgress.value;
    const springForce = stiffness * displacement;
    const dampingForce = -dampingVal * velocity;
    const acceleration = (springForce + dampingForce) / mass;

    velocity += acceleration * dt;
    smoothProgress.value += velocity * dt;
  });
</script>

<template>
  <div ref="containerRef" :class="cn('relative h-[500vh] w-full', props.class)">
    <div
      class="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden"
      style="perspective: 1200px"
    >
      <!-- Starting Text indicator -->
      <div
        class="absolute inset-x-0 top-[20%] text-center"
        :style="{
          opacity: startTextOpacity,
          transform: `translateY(${startTextY})`,
        }"
      >
        <p
          class="text-sm font-medium tracking-widest uppercase text-foreground/50"
        >
          {{ props.startHint }}
        </p>
      </div>

      <!-- Cards Container -->
      <div
        class="relative flex h-100 w-full max-w-4xl px-4"
        :style="{
          scale: containerScale,
          transform: `translateY(${cardsY})`,
          transformStyle: 'preserve-3d',
        }"
      >
        <div
          v-for="(card, i) in props.cards.slice(0, 3)"
          :key="i"
          class="relative h-full flex-1"
          :style="{
            transform: `
              translateX(${i === 0 ? leftX : i === 2 ? rightX : '0px'})
              rotateY(${rotateY})
              rotateZ(${i === 0 ? leftRotateZ : i === 2 ? rightRotateZ : '0deg'})
            `,
            transformStyle: 'preserve-3d',
            zIndex: i,
          }"
        >
          <!-- Front Side: Image Slice -->
          <div
            class="absolute inset-0 overflow-hidden"
            :style="{
              backfaceVisibility: 'hidden',
              zIndex: 2,
              borderRadius:
                i === 0
                  ? borderRadiusLeft
                  : i === 2
                    ? borderRadiusRight
                    : borderRadiusMiddle,
              boxShadow: `inset 0 1px 1px rgba(255, 255, 255, ${shadowOpacity}), inset 0 -24px 48px rgba(0, 0, 0, ${shadowOpacity}), 0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity})`,
            }"
          >
            <div
              class="absolute inset-0 h-full w-[300%]"
              :style="{
                left: `${-100 * i}%`,
                backgroundImage: `url(${props.imageSrc})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
              }"
            />
          </div>

          <!-- Back Side: Content Card -->
          <div
            class="absolute inset-0 flex flex-col justify-end overflow-hidden p-8"
            :style="{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              zIndex: 1,
              backgroundColor: card.bgColor,
              color: card.textColor,
              borderRadius:
                i === 0
                  ? borderRadiusLeft
                  : i === 2
                    ? borderRadiusRight
                    : borderRadiusMiddle,
              boxShadow: `inset 0 1px 1px rgba(255, 255, 255, 0.1), inset 0 -24px 48px rgba(0, 0, 0, 0.2), 0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity})`,
            }"
          >
            <!-- Grain Noise Overlay -->
            <div
              class="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
              style="
                background-image: url('https://framerusercontent.com/images/6mcf62RlDfRfU61Yg5vb2pefpi4.png?width=256&height=256');
                background-repeat: repeat;
              "
            />

            <!-- Icon Slot -->
            <div class="relative z-10 mb-auto">
              <slot :name="`icon-${i}`" :index="i" />
            </div>

            <!-- Title -->
            <h3
              class="relative z-10 mb-4 text-2xl/tight font-medium"
              :style="{ opacity: backTextOpacity }"
            >
              {{ card.title }}
            </h3>

            <!-- Description -->
            <p
              class="relative z-10 text-sm opacity-80"
              :style="{ opacity: backTextOpacity }"
            >
              {{ card.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- Ending Text -->
      <div
        class="absolute bottom-[20%] inset-x-0 text-center"
        :style="{
          opacity: endTextOpacity,
          transform: `translateY(${endTextY})`,
        }"
      >
        <p
          class="font-serif text-3xl font-medium italic tracking-tight text-foreground/80"
        >
          {{ props.endHint }}
        </p>
      </div>
    </div>
  </div>
</template>
