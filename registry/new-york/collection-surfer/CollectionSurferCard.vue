<script setup lang="ts">
  import { useTransform, useSpring } from 'motion-v';
  import type { MotionValue } from 'framer-motion/dom';
  import type {
    CollectionSurferItem,
    CollectionSurferVariant,
  } from '~/types/components';

  const props = defineProps<{
    item: CollectionSurferItem;
    index: number;
    totalItems: number;
    mouseX: MotionValue<number>;
    mouseY: MotionValue<number>;
    variant: CollectionSurferVariant;
    stepX: number;
    stepY: number;
    stepZ: number;
  }>();

  const cardRef = ref<HTMLElement>();
  const scaleRef = ref(1);
  const upliftRef = ref(0);
  const isHovered = ref(false);

  // Compute euclidean distance from mouse to card center
  const distance = useTransform(props.mouseX, (mx: number) => {
    const my = props.mouseY.get();
    const el = cardRef.value;
    if (!el) return 10000;
    const rect = el.getBoundingClientRect();
    return Math.hypot(
      mx - (rect.left + rect.width / 2),
      my - (rect.top + rect.height / 2),
    );
  });

  const magneticScale = useTransform(distance, [0, 400], [1.5, 1]);
  const smoothScale = useSpring(magneticScale, {
    mass: 0.5,
    stiffness: 300,
    damping: 20,
  });

  const upliftOffset = useTransform(distance, [0, 400], [-100, 0]);
  const smoothUplift = useSpring(upliftOffset, {
    mass: 0.5,
    stiffness: 300,
    damping: 20,
  });

  // Bridge MotionValues → Vue refs for reactive style binding
  onMounted(() => {
    smoothScale.on('change', (v: number) => {
      scaleRef.value = v;
    });
    smoothUplift.on('change', (v: number) => {
      upliftRef.value = v;
    });
  });

  const paddedIndex = computed(() =>
    String((props.index % props.totalItems) + 1).padStart(2, '0'),
  );

  const cardTransform = computed(() => {
    const tx = props.index * props.stepX;
    const ty =
      props.index * props.stepY +
      (props.variant === 'uplift' ? upliftRef.value : 0);
    const tz = props.index * props.stepZ;
    const s = props.variant === 'magnetic' ? scaleRef.value : 1;
    return `translate3d(${tx}px, ${ty}px, ${tz}px) rotateY(-50deg) scale(${s})`;
  });
</script>

<template>
  <div
    ref="cardRef"
    class="absolute left-0 top-0 h-100 w-75 cursor-pointer overflow-hidden rounded-xl bg-neutral-900 shadow-2xl"
    :style="{ transform: cardTransform }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <span
      class="absolute left-4 top-4 z-10 font-mono text-sm tracking-wider text-white/60"
    >
      {{ paddedIndex }}
    </span>
    <img
      :src="item.image"
      :alt="item.title"
      loading="lazy"
      draggable="false"
      class="absolute inset-0 size-full object-cover transition-[filter] duration-500"
      :class="isHovered ? 'brightness-100' : 'brightness-75'"
    />
    <div
      class="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"
    ></div>
    <div class="absolute bottom-4 left-4 right-4 z-10">
      <p class="text-sm font-medium tracking-wide text-white">
        {{ item.title }}
      </p>
    </div>
  </div>
</template>
