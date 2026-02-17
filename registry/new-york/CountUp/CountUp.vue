<script setup lang="ts">
  import { useIntersectionObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      to: number;
      from?: number;
      duration?: number;
      separator?: string;
      decimals?: number;
      class?: string;
    }>(),
    {
      from: 0,
      duration: 2,
      separator: ',',
      decimals: 0,
      class: '',
    },
  );

  const el = ref<HTMLElement>();
  const currentValue = ref(props.from);
  const hasTriggered = ref(false);

  function formatNumber(num: number): string {
    const fixed = num.toFixed(props.decimals);
    if (!props.separator) return fixed;
    const [integer, decimal] = fixed.split('.');
    const formatted = (integer ?? '').replace(
      /\B(?=(\d{3})+(?!\d))/g,
      props.separator,
    );
    return decimal !== undefined ? `${formatted}.${decimal}` : formatted;
  }

  function easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function startCount() {
    if (hasTriggered.value) return;
    hasTriggered.value = true;

    const startTime = performance.now();
    const durationMs = props.duration * 1000;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeOutExpo(progress);

      currentValue.value = props.from + (props.to - props.from) * eased;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        currentValue.value = props.to;
      }
    }

    requestAnimationFrame(animate);
  }

  const displayValue = computed(() => formatNumber(currentValue.value));

  useIntersectionObserver(el, ([entry]) => {
    if (entry?.isIntersecting) {
      startCount();
    }
  });
</script>

<template>
  <span ref="el" :class="cn('tabular-nums', props.class)">
    {{ displayValue }}
  </span>
</template>
