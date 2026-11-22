<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useElementSize } from '@vueuse/core';
  import { motion } from 'motion-v';
  import type { ProductivityRollProps } from './types';

  const props = withDefaults(defineProps<ProductivityRollProps>(), {
    instant: false,
  });

  const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const root = ref<HTMLElement | null>(null);
  const { height } = useElementSize(root);

  const columns = computed(() => {
    const text = String(Math.max(0, Math.round(props.value)));
    return text.split('').map((char, index) => ({
      key: text.length - index,
      digit: Number(char),
    }));
  });

  const transition = computed(() =>
    props.instant
      ? { duration: 0 }
      : { type: 'spring' as const, stiffness: 120, damping: 20, mass: 0.9 },
  );
</script>

<template>
  <span ref="root" class="pd-roll relative inline-flex h-[1em] leading-none">
    <span class="sr-only">{{ Math.round(value) }}</span>
    <span
      v-for="column in columns"
      :key="column.key"
      aria-hidden="true"
      class="relative inline-block h-[1em] overflow-hidden"
    >
      <span class="invisible block">{{ column.digit }}</span>
      <motion.span
        class="absolute inset-x-0 top-0 flex flex-col items-center"
        :initial="false"
        :animate="{ y: -column.digit * height }"
        :transition="transition"
      >
        <span v-for="d in DIGITS" :key="d" class="block h-[1em]">{{ d }}</span>
      </motion.span>
    </span>
  </span>
</template>

<style scoped>
  .pd-roll {
    mask-image: linear-gradient(
      to bottom,
      transparent,
      black 14%,
      black 86%,
      transparent
    );
  }
</style>
