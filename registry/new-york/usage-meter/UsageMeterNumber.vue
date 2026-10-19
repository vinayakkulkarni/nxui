<script setup lang="ts">
  import { computed, toRef } from 'vue';
  import {
    TransitionPresets,
    usePreferredReducedMotion,
    useTransition,
  } from '@vueuse/core';
  import type { UsageMeterNumberProps } from './types';
  import { formatCount } from './usage-meter';

  const props = withDefaults(defineProps<UsageMeterNumberProps>(), {
    duration: 700,
    class: '',
  });

  const motion = usePreferredReducedMotion();
  const reduce = computed(() => motion.value === 'reduce');
  const shown = useTransition(toRef(props, 'value'), {
    duration: props.duration,
    transition: TransitionPresets.easeOutCubic,
    disabled: reduce,
  });
  const text = computed(() => formatCount(shown.value));
</script>

<template>
  <span :class="props.class">{{ text }}</span>
</template>
