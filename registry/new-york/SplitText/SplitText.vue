<script setup lang="ts">
  import { useIntersectionObserver } from '@vueuse/core';
  import { motion } from 'motion-v';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      by?: 'chars' | 'words';
      delay?: number;
      duration?: number;
      from?: Record<string, unknown>;
      to?: Record<string, unknown>;
      threshold?: number;
      class?: string;
    }>(),
    {
      by: 'chars',
      delay: 50,
      duration: 0.6,
      from: () => ({ opacity: 0, y: 40 }),
      to: () => ({ opacity: 1, y: 0 }),
      threshold: 0.1,
      class: '',
    },
  );

  const el = ref<HTMLElement>();
  const isInView = ref(false);

  useIntersectionObserver(
    el,
    ([entry]) => {
      if (entry?.isIntersecting) {
        isInView.value = true;
      }
    },
    { threshold: props.threshold },
  );

  const words = computed(() => {
    if (props.by === 'words') {
      return props.text.split(' ').map((word, i, arr) => ({
        characters: [word],
        needsSpace: i < arr.length - 1,
      }));
    }
    return props.text.split(' ').map((word, i, arr) => ({
      characters: word.split(''),
      needsSpace: i < arr.length - 1,
    }));
  });

  function getDelay(globalIndex: number): number {
    return (globalIndex * props.delay) / 1000;
  }
</script>

<template>
  <p ref="el" :class="cn('flex flex-wrap whitespace-pre-wrap', props.class)">
    <span v-for="(word, wi) in words" :key="wi" class="inline-flex">
      <component
        :is="motion.span"
        v-for="(char, ci) in word.characters"
        :key="`${wi}-${ci}`"
        class="inline-block"
        :initial="from"
        :animate="isInView ? to : from"
        :transition="{
          duration,
          delay: getDelay(
            words
              .slice(0, wi)
              .reduce((sum, w) => sum + w.characters.length, 0) + ci,
          ),
          type: 'spring',
          damping: 25,
          stiffness: 300,
        }"
        style="will-change: transform, opacity"
      >
        {{ char }}
      </component>
      <span v-if="word.needsSpace" class="whitespace-pre">&nbsp;</span>
    </span>
  </p>
</template>
