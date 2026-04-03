<script setup lang="ts">
  import { useIntervalFn } from '@vueuse/core';
  import { motion, AnimatePresence } from 'motion-v';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      texts: string[];
      rotationInterval?: number;
      staggerDuration?: number;
      staggerFrom?: 'first' | 'last' | 'center';
      loop?: boolean;
      auto?: boolean;
      splitBy?: 'characters' | 'words';
      class?: string;
    }>(),
    {
      rotationInterval: 2000,
      staggerDuration: 0.03,
      staggerFrom: 'first',
      loop: true,
      auto: true,
      splitBy: 'characters',
      class: '',
    },
  );

  const currentIndex = ref(0);

  function next() {
    if (currentIndex.value === props.texts.length - 1) {
      if (props.loop) currentIndex.value = 0;
    } else {
      currentIndex.value++;
    }
  }

  if (props.auto) {
    useIntervalFn(next, () => props.rotationInterval);
  }

  const elements = computed(() => {
    const text = props.texts[currentIndex.value] ?? '';
    if (props.splitBy === 'words') {
      return text.split(' ').map((word, i, arr) => ({
        characters: [word],
        needsSpace: i < arr.length - 1,
      }));
    }
    return text.split(' ').map((word, i, arr) => ({
      characters: word.split(''),
      needsSpace: i < arr.length - 1,
    }));
  });

  function getStaggerDelay(index: number, total: number): number {
    if (props.staggerFrom === 'last') {
      return (total - 1 - index) * props.staggerDuration;
    }
    if (props.staggerFrom === 'center') {
      const center = Math.floor(total / 2);
      return Math.abs(center - index) * props.staggerDuration;
    }
    return index * props.staggerDuration;
  }
</script>

<template>
  <span
    :class="
      cn(
        'flex flex-wrap whitespace-pre-wrap relative overflow-hidden',
        props.class,
      )
    "
  >
    <span class="sr-only">{{ texts[currentIndex] }}</span>
    <AnimatePresence mode="wait">
      <component
        :is="motion.span"
        :key="currentIndex"
        class="flex flex-wrap whitespace-pre-wrap relative"
        aria-hidden="true"
      >
        <span v-for="(word, wi) in elements" :key="wi" class="inline-flex">
          <component
            :is="motion.span"
            v-for="(char, ci) in word.characters"
            :key="ci"
            class="inline-block"
            :initial="{ y: '100%', opacity: 0 }"
            :animate="{ y: 0, opacity: 1 }"
            :exit="{ y: '-120%', opacity: 0 }"
            :transition="{
              type: 'spring',
              damping: 25,
              stiffness: 300,
              delay: getStaggerDelay(
                elements
                  .slice(0, wi)
                  .reduce((s, w) => s + w.characters.length, 0) + ci,
                elements.reduce((s, w) => s + w.characters.length, 0),
              ),
            }"
          >
            {{ char }}
          </component>
          <span v-if="word.needsSpace" class="whitespace-pre">&nbsp;</span>
        </span>
      </component>
    </AnimatePresence>
  </span>
</template>
