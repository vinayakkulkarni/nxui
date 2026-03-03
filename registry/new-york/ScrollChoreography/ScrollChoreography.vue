<script setup lang="ts">
  import { useRafFn } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      images: {
        topLeft: string;
        topRight: string;
        bottomLeft: string;
        bottomRight: string;
      };
      class?: string;
    }>(),
    {
      class: '',
    },
  );

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
        const startVal = parseFloat(outputRange[i]!);
        const endVal = parseFloat(outputRange[i + 1]!);
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
        return outputRange[i]! + (outputRange[i + 1]! - outputRange[i]!) * localT;
      }
    }
    return outputRange[outputRange.length - 1]!;
  }

  const xLeft = '-20vw';
  const xRight = '20vw';
  const yTop = '-14vh';
  const yBottom = '14vh';

  const tlStyle = computed(() => {
    const sp = smoothProgress.value;
    return {
      transform: `translate(-50%, -50%) translate(${interpolate(sp, [0, 0.3, 0.35, 0.65, 1], [xLeft, xLeft, xLeft, '0vw', '0vw'])}, ${interpolate(sp, [0, 0.3, 0.35, 0.65, 1], [yTop, yBottom, yBottom, '0vh', '0vh'])})`,
      opacity: interpolateNum(sp, [0.75, 0.85], [1, 0]),
    };
  });

  const brStyle = computed(() => {
    const sp = smoothProgress.value;
    return {
      transform: `translate(-50%, -50%) translate(${interpolate(sp, [0, 0.3, 0.35, 0.65, 1], [xRight, xRight, xRight, '0vw', '0vw'])}, ${interpolate(sp, [0, 0.3, 0.35, 0.65, 1], [yBottom, yTop, yTop, '0vh', '0vh'])})`,
      opacity: interpolateNum(sp, [0.75, 0.85], [1, 0]),
    };
  });

  const blStyle = computed(() => {
    const sp = smoothProgress.value;
    return {
      transform: `translate(-50%, -50%) translate(${interpolate(sp, [0, 0.3, 0.35, 0.65, 1], [xLeft, xLeft, xLeft, '0vw', '0vw'])}, ${interpolate(sp, [0, 0.3, 0.35, 0.65, 1], [yBottom, yBottom, yBottom, '0vh', '0vh'])})`,
      opacity: interpolateNum(sp, [0.75, 0.85], [1, 0]),
    };
  });

  const trStyle = computed(() => {
    const sp = smoothProgress.value;
    return {
      transform: `translate(-50%, -50%) translate(${interpolate(sp, [0, 0.3, 0.35, 0.65, 1], [xRight, xRight, xRight, '0vw', '0vw'])}, ${interpolate(sp, [0, 0.3, 0.35, 0.65, 1], [yTop, yTop, yTop, '0vh', '0vh'])})`,
      width: interpolate(sp, [0.65, 0.7, 0.9, 1], ['36vw', '36vw', '100vw', '100vw']),
      height: interpolate(sp, [0.65, 0.7, 0.9, 1], ['24vh', '24vh', '100vh', '100vh']),
    };
  });

  const baseImageClasses =
    'absolute left-1/2 top-1/2 w-[36vw] h-[24vh] overflow-hidden bg-muted shadow-2xl will-change-transform';

  function updateScroll() {
    const container = containerRef.value;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const scrollableHeight = rect.height - viewportH;

    if (scrollableHeight <= 0) {
      progress.value = 0;
      return;
    }

    const scrolled = -rect.top;
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
  <div
    ref="containerRef"
    :class="cn('relative h-[300vh] w-full', props.class)"
  >
    <div class="sticky top-0 h-screen w-full overflow-hidden">
      <div class="absolute inset-0 flex items-center justify-center">
        <!-- Top Left Image -->
        <div
          :class="cn(baseImageClasses, 'z-10')"
          :style="tlStyle"
        >
          <img
            :src="images.topLeft"
            alt="Top Left"
            class="size-full object-cover"
          />
        </div>

        <!-- Bottom Right Image -->
        <div
          :class="cn(baseImageClasses, 'z-20')"
          :style="brStyle"
        >
          <img
            :src="images.bottomRight"
            alt="Bottom Right"
            class="size-full object-cover"
          />
        </div>

        <!-- Bottom Left Image -->
        <div
          :class="cn(baseImageClasses, 'z-30')"
          :style="blStyle"
        >
          <img
            :src="images.bottomLeft"
            alt="Bottom Left"
            class="size-full object-cover"
          />
        </div>

        <!-- Top Right Image (Hero - expands at the end) -->
        <div
          :class="cn(baseImageClasses, 'z-40 origin-center bg-black/5')"
          :style="trStyle"
        >
          <img
            :src="images.topRight"
            alt="Top Right Hero"
            class="size-full object-cover"
          />
        </div>
      </div>
    </div>
  </div>
</template>
