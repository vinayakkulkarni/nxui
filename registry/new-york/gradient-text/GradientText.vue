<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useRafFn, useElementHover } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      text?: string;
      colors?: string[];
      animationSpeed?: number;
      showBorder?: boolean;
      direction?: 'horizontal' | 'vertical' | 'diagonal';
      pauseOnHover?: boolean;
      yoyo?: boolean;
      class?: string;
    }>(),
    {
      text: '',
      colors: () => ['#5227FF', '#FF9FFC', '#B19EEF'],
      animationSpeed: 8,
      showBorder: false,
      direction: 'horizontal',
      pauseOnHover: false,
      yoyo: true,
      class: '',
    },
  );

  const containerRef = ref<HTMLElement>();
  const isHovered = useElementHover(containerRef);
  const backgroundPosition = ref('300% 50%');

  let elapsed = 0;
  let lastTime: number | null = null;

  const seamlessColors = computed(() => [...props.colors, props.colors[0]!]);

  const gradientImage = computed(() => {
    const dir =
      props.direction === 'vertical'
        ? 'to bottom'
        : props.direction === 'diagonal'
          ? '135deg'
          : 'to right';
    return `linear-gradient(${dir}, ${seamlessColors.value.join(', ')})`;
  });

  const backgroundSize = computed(() => {
    switch (props.direction) {
      case 'vertical':
        return '100% 300%';
      case 'diagonal':
        return '300% 300%';
      default:
        return '300% 100%';
    }
  });

  const animationDuration = computed(() => props.animationSpeed * 1000);

  useRafFn(({ timestamp }) => {
    if (props.pauseOnHover && isHovered.value) {
      lastTime = null;
      return;
    }

    if (lastTime === null) {
      lastTime = timestamp;
      return;
    }

    const delta = timestamp - lastTime;
    lastTime = timestamp;
    elapsed += delta;

    const duration = animationDuration.value;
    let progress: number;

    if (props.yoyo) {
      const fullCycle = duration * 2;
      const cycleTime = elapsed % fullCycle;
      if (cycleTime < duration) {
        progress = (cycleTime / duration) * 100;
      } else {
        progress = 100 - ((cycleTime - duration) / duration) * 100;
      }
    } else {
      progress = ((elapsed % duration) / duration) * 100;
    }

    const pos = 300 - progress * 3;
    switch (props.direction) {
      case 'vertical':
        backgroundPosition.value = `50% ${pos}%`;
        break;
      case 'diagonal':
        backgroundPosition.value = `${pos}% 50%`;
        break;
      default:
        backgroundPosition.value = `${pos}% 50%`;
    }
  });
</script>

<template>
  <span
    ref="containerRef"
    :class="
      cn(
        'animated-gradient-text relative inline-flex max-w-fit items-center justify-center',
        showBorder && 'rounded-2xl backdrop-blur-sm',
        props.class,
      )
    "
  >
    <div
      v-if="showBorder"
      class="gradient-overlay absolute inset-0 rounded-[inherit] pointer-events-none z-0"
      :style="{
        backgroundImage: gradientImage,
        backgroundSize,
        backgroundPosition,
      }"
    ></div>
    <span
      class="text-content relative z-[2] inline-block bg-clip-text text-transparent"
      :style="{
        backgroundImage: gradientImage,
        backgroundSize,
        backgroundPosition,
      }"
    >
      <slot>{{ text }}</slot>
    </span>
  </span>
</template>

<style scoped>
  .gradient-overlay::before {
    content: '';
    position: absolute;
    border-radius: inherit;
    width: calc(100% - 2px);
    height: calc(100% - 2px);
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--background, #060010);
    z-index: -1;
  }
</style>
