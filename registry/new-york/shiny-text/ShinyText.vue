<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { useRafFn, useElementHover } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text: string;
      disabled?: boolean;
      speed?: number;
      color?: string;
      shineColor?: string;
      spread?: number;
      yoyo?: boolean;
      pauseOnHover?: boolean;
      direction?: 'left' | 'right';
      delay?: number;
      class?: string;
    }>(),
    {
      disabled: false,
      speed: 2,
      color: '#b5b5b5',
      shineColor: '#ffffff',
      spread: 120,
      yoyo: false,
      pauseOnHover: false,
      direction: 'left',
      delay: 0,
      class: '',
    },
  );

  const spanRef = ref<HTMLSpanElement>();
  const isHovered = useElementHover(spanRef);
  const backgroundPosition = ref('150% center');

  let elapsed = 0;
  let lastTime: number | null = null;
  let directionRef = props.direction === 'left' ? 1 : -1;

  watch(
    () => props.direction,
    (dir) => {
      directionRef = dir === 'left' ? 1 : -1;
      elapsed = 0;
    },
  );

  const animationDuration = () => props.speed * 1000;
  const delayDuration = () => props.delay * 1000;

  useRafFn(({ timestamp }) => {
    if (props.disabled || (props.pauseOnHover && isHovered.value)) {
      lastTime = null;
      return;
    }

    if (lastTime === null) {
      lastTime = timestamp;
      return;
    }

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    elapsed += deltaTime;

    let progress: number;
    const aDuration = animationDuration();
    const dDuration = delayDuration();

    if (props.yoyo) {
      const cycleDuration = aDuration + dDuration;
      const fullCycle = cycleDuration * 2;
      const cycleTime = elapsed % fullCycle;

      if (cycleTime < aDuration) {
        const p = (cycleTime / aDuration) * 100;
        progress = directionRef === 1 ? p : 100 - p;
      } else if (cycleTime < cycleDuration) {
        progress = directionRef === 1 ? 100 : 0;
      } else if (cycleTime < cycleDuration + aDuration) {
        const reverseTime = cycleTime - cycleDuration;
        const p = 100 - (reverseTime / aDuration) * 100;
        progress = directionRef === 1 ? p : 100 - p;
      } else {
        progress = directionRef === 1 ? 0 : 100;
      }
    } else {
      const cycleDuration = aDuration + dDuration;
      const cycleTime = elapsed % cycleDuration;

      if (cycleTime < aDuration) {
        const p = (cycleTime / aDuration) * 100;
        progress = directionRef === 1 ? p : 100 - p;
      } else {
        progress = directionRef === 1 ? 100 : 0;
      }
    }

    backgroundPosition.value = `${150 - progress * 2}% center`;
  });
</script>

<template>
  <span
    ref="spanRef"
    :class="cn('inline-block', props.class)"
    :style="{
      backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
      backgroundSize: '200% auto',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundPosition,
    }"
  >
    {{ text }}
  </span>
</template>
