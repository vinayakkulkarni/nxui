<script setup lang="ts">
  // Curved drawer: the inner edge is an SVG path that bulges while the
  // panel slides and settles straight at rest — velocity drives the curve.
  // Inspired by the "Curved Drawer" interaction by @diip3sh.
  import { ref, computed, watch } from 'vue';
  import { useRafFn } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import type { CurvedDrawerProps } from './types';

  const props = withDefaults(defineProps<CurvedDrawerProps>(), {
    side: 'right',
    width: 380,
    maxBulge: 48,
    stiffness: 170,
    damping: 22,
    overlay: true,
    background: 'var(--background)',
    class: '',
  });

  const open = defineModel<boolean>({ default: false });

  // Spring-integrated slide: x = 0 fully open, 1 fully closed (offscreen).
  const x = ref(1);
  const velocity = ref(0);

  const { resume, pause } = useRafFn(
    ({ delta }) => {
      const dt = Math.min(delta / 1000, 1 / 30);
      const target = open.value ? 0 : 1;
      const accel =
        props.stiffness * (target - x.value) - props.damping * velocity.value;
      velocity.value += accel * dt;
      x.value += velocity.value * dt;
      if (
        Math.abs(x.value - target) < 0.0005 &&
        Math.abs(velocity.value) < 0.001
      ) {
        x.value = target;
        velocity.value = 0;
        pause();
      }
    },
    { immediate: false },
  );

  watch(open, () => resume());

  const totalWidth = computed(() => props.width + props.maxBulge);

  const translate = computed(() => {
    const offset = x.value * totalWidth.value;
    return props.side === 'right' ? offset : -offset;
  });

  // Bulge magnitude follows speed: the free edge bows outward while the
  // panel slides (leading on open, lagging on close), straight at rest.
  const bulge = computed(() => {
    const raw = Math.abs(velocity.value) * totalWidth.value * 0.06;
    return Math.min(raw, props.maxBulge);
  });

  // SVG strip sits on the drawer's inner edge; the quadratic control point
  // pushes the midpoint outward while moving, straight when settled.
  const edgePath = computed(() => {
    const b = props.maxBulge;
    if (props.side === 'right') {
      const cx = b - bulge.value * 2;
      return `M ${b} 0 Q ${cx} 50 ${b} 100 Z`;
    }
    const cx = bulge.value * 2;
    return `M 0 0 Q ${cx} 50 0 100 Z`;
  });

  const visible = computed(() => x.value < 0.999);
</script>

<template>
  <div
    v-if="overlay"
    class="absolute inset-0 z-20 bg-black/40 transition-opacity duration-300"
    :class="visible && open ? 'opacity-100' : 'pointer-events-none opacity-0'"
    aria-hidden="true"
    @click="open = false"
  />

  <div
    v-show="visible"
    :class="
      cn(
        'absolute inset-y-0 z-30 flex',
        side === 'right' ? 'right-0' : 'left-0 flex-row-reverse',
        props.class,
      )
    "
    :style="{
      width: `${totalWidth}px`,
      transform: `translateX(${translate}px)`,
    }"
  >
    <!-- Curved edge strip -->
    <svg
      class="h-full shrink-0"
      :style="{ width: `${maxBulge}px` }"
      viewBox="0 0 48 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path :d="edgePath" :fill="background" />
    </svg>

    <!-- Panel body -->
    <div
      class="h-full overflow-y-auto"
      :style="{ width: `${width}px`, background }"
    >
      <slot />
    </div>
  </div>
</template>
