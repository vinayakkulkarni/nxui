<script setup lang="ts">
  import { useIntersectionObserver } from '@vueuse/core';
  import { motion } from 'motion-v';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      delay?: number;
      by?: 'words' | 'letters';
      direction?: 'top' | 'bottom';
      threshold?: number;
      duration?: number;
      class?: string;
    }>(),
    {
      delay: 200,
      by: 'words',
      direction: 'top',
      threshold: 0.1,
      duration: 0.35,
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

  const segments = computed(() =>
    props.by === 'words' ? props.text.split(' ') : props.text.split(''),
  );

  const initialState = computed(() =>
    props.direction === 'top'
      ? { filter: 'blur(10px)', opacity: 0, y: -50 }
      : { filter: 'blur(10px)', opacity: 0, y: 50 },
  );

  const animatedState = computed(() => ({
    filter: 'blur(0px)',
    opacity: 1,
    y: 0,
  }));
</script>

<template>
  <p ref="el" :class="cn('flex flex-wrap', props.class)">
    <component
      :is="motion.span"
      v-for="(segment, i) in segments"
      :key="i"
      class="inline-block will-change-[transform,filter,opacity]"
      :initial="initialState"
      :animate="isInView ? animatedState : initialState"
      :transition="{
        duration,
        delay: (i * delay) / 1000,
      }"
    >
      {{ segment === ' ' ? '\u00A0' : segment
      }}<span v-if="by === 'words' && i < segments.length - 1">&nbsp;</span>
    </component>
  </p>
</template>
