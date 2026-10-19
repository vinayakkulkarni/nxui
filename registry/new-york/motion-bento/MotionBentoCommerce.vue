<script setup lang="ts">
  import { computed } from 'vue';
  import { motion } from 'motion-v';
  import { useBentoClock } from './use-bento-clock';
  import type {
    MotionBentoArtProps,
    MotionBentoPose,
    MotionBentoProduct,
  } from './types';

  const props = withDefaults(defineProps<MotionBentoArtProps>(), {
    playing: false,
    still: false,
  });

  const PRODUCTS: MotionBentoProduct[] = [
    {
      name: 'Pulse Watch',
      price: '$128',
      icon: 'lucide:watch',
      tint: 'linear-gradient(140deg, #c9eeff, #7fc9f3)',
      ink: '#1d3a5c',
    },
    {
      name: 'Trail Backpack',
      price: '$200',
      icon: 'lucide:backpack',
      tint: 'linear-gradient(140deg, #b3c1f7, #8199ec)',
      ink: '#161d36',
    },
    {
      name: 'Smart Headphone',
      price: '$149',
      icon: 'lucide:headphones',
      tint: 'linear-gradient(140deg, #f7b79c, #b4bdf0)',
      ink: '#2b334d',
    },
  ];

  const CENTER: MotionBentoPose = { x: 0, y: 0, rotate: 0, scale: 1, z: 3 };
  const POSES: MotionBentoPose[] = [
    CENTER,
    { x: 236, y: 78, rotate: 36, scale: 0.97, z: 2 },
    { x: -236, y: 78, rotate: -36, scale: 0.97, z: 1 },
  ];
  const SPRING = { type: 'spring', stiffness: 210, damping: 24, mass: 0.9 };
  const DOTS = ['bg-foreground/70', 'bg-foreground/25', 'bg-foreground/15'];

  const tick = useBentoClock(() => props.playing, 2200);
  const step = computed(() => (props.still ? 0 : tick.value));

  function poseOf(index: number): MotionBentoPose {
    return POSES[(((index - step.value) % 3) + 3) % 3] ?? CENTER;
  }

  function animateOf(index: number) {
    const pose = poseOf(index);
    return { x: pose.x, y: pose.y, rotate: pose.rotate, scale: pose.scale };
  }
</script>

<template>
  <div class="absolute inset-0">
    <div
      class="absolute bottom-0 left-1/2 flex h-10 -translate-x-1/2 gap-8 opacity-70"
    >
      <span class="w-px bg-(--mb-line)" />
      <span class="w-px bg-(--mb-line)" />
      <span class="w-px bg-(--mb-line)" />
    </div>

    <motion.div
      v-for="(product, index) in PRODUCTS"
      :key="product.name"
      class="absolute top-7 left-1/2 -ml-20 w-40 rounded-[1.4rem] bg-(--mb-glass) p-1.5 shadow-(--mb-tile-shadow)"
      :style="{ zIndex: poseOf(index).z }"
      :initial="animateOf(index)"
      :animate="animateOf(index)"
      :transition="SPRING"
    >
      <div class="rounded-2xl bg-(--mb-tile) p-1.5">
        <div
          class="grid h-24 place-items-center rounded-xl"
          :style="{ backgroundImage: product.tint, color: product.ink }"
        >
          <Icon
            :name="product.icon"
            class="text-[3.25rem] drop-shadow-[0_6px_6px_rgb(0_0_0/0.25)]"
          />
        </div>
        <div class="px-1.5 pt-2 pb-1">
          <p class="text-xs font-semibold text-foreground">
            {{ product.name }}
          </p>
          <p class="text-[0.5625rem] text-muted-foreground">
            Lightweight. All day comfort
          </p>
          <p class="mt-1.5 text-xs font-semibold text-foreground">
            {{ product.price }}
          </p>
          <div class="mt-1.5 flex gap-1">
            <span
              v-for="dot in DOTS"
              :key="dot"
              :class="['size-1.5 rounded-full', dot]"
            />
          </div>
        </div>
      </div>
    </motion.div>

    <div
      class="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-(--mb-tile) py-1 pr-2.5 pl-1 text-[0.625rem] font-medium text-foreground shadow-(--mb-tile-shadow) ring-4 ring-(--mb-glass)"
    >
      <span
        class="rounded-full bg-(--mb-tile-soft) px-1.5 py-0.5 font-semibold tabular-nums"
      >
        {{ 136 + step }}
      </span>
      Orders Today
    </div>
  </div>
</template>
