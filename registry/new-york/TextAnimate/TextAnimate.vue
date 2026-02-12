<script setup lang="ts">
  import { useIntersectionObserver } from '@vueuse/core';
  import { motion, AnimatePresence } from 'motion-v';
  import type { AnimationType, SplitBy } from '~/types/components';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      animation?: AnimationType;
      by?: SplitBy;
      startOnView?: boolean;
      once?: boolean;
      duration?: number;
      delay?: number;
      class?: string;
      segmentClass?: string;
    }>(),
    {
      animation: 'fadeIn',
      by: 'word',
      startOnView: true,
      once: true,
      duration: 0.3,
      delay: 0,
      class: '',
      segmentClass: '',
    },
  );

  const el = ref<HTMLElement>();
  const isInView = ref(!props.startOnView);

  if (props.startOnView) {
    useIntersectionObserver(
      el,
      ([entry]) => {
        if (entry?.isIntersecting) {
          isInView.value = true;
        }
      },
      { threshold: 0.1 },
    );
  }

  const segments = computed(() => {
    if (props.by === 'character') return props.text.split('');
    if (props.by === 'word') return props.text.split(' ');
    return [props.text];
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: props.delay,
      },
    },
  };

  const itemVariantsMap: Record<AnimationType, Record<string, unknown>> = {
    fadeIn: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: props.duration } } },
    blurIn: { hidden: { opacity: 0, filter: 'blur(10px)' }, show: { opacity: 1, filter: 'blur(0px)', transition: { duration: props.duration } } },
    blurInUp: { hidden: { opacity: 0, filter: 'blur(10px)', y: 20 }, show: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { duration: props.duration } } },
    blurInDown: { hidden: { opacity: 0, filter: 'blur(10px)', y: -20 }, show: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { duration: props.duration } } },
    slideUp: { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: props.duration } } },
    slideDown: { hidden: { y: -20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: props.duration } } },
    slideLeft: { hidden: { x: 20, opacity: 0 }, show: { x: 0, opacity: 1, transition: { duration: props.duration } } },
    slideRight: { hidden: { x: -20, opacity: 0 }, show: { x: 0, opacity: 1, transition: { duration: props.duration } } },
    scaleUp: { hidden: { scale: 0.5, opacity: 0 }, show: { scale: 1, opacity: 1, transition: { duration: props.duration } } },
    scaleDown: { hidden: { scale: 1.5, opacity: 0 }, show: { scale: 1, opacity: 1, transition: { duration: props.duration } } },
  };

  const itemVariants = computed(() => itemVariantsMap[props.animation]);
</script>

<template>
  <AnimatePresence>
    <component
      :is="motion.p"
      ref="el"
      :class="cn('whitespace-pre-wrap', props.class)"
      :initial="'hidden'"
      :animate="isInView ? 'show' : 'hidden'"
      :variants="containerVariants"
    >
      <component
        :is="motion.span"
        v-for="(segment, i) in segments"
        :key="`${by}-${i}-${segment}`"
        :class="cn('inline-block', segmentClass)"
        :variants="itemVariants"
      >
        {{ segment }}<span v-if="by === 'word' && i < segments.length - 1" class="inline-block">&nbsp;</span>
      </component>
    </component>
  </AnimatePresence>
</template>
