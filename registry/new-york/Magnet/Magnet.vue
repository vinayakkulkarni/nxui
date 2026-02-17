<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      padding?: number;
      disabled?: boolean;
      magnetStrength?: number;
      activeTransition?: string;
      inactiveTransition?: string;
      innerClass?: string;
      class?: string;
    }>(),
    {
      padding: 100,
      disabled: false,
      magnetStrength: 2,
      activeTransition: 'transform 0.3s ease-out',
      inactiveTransition: 'transform 0.5s ease-in-out',
      innerClass: '',
      class: '',
    },
  );

  const magnetRef = ref<HTMLDivElement>();
  const isActive = ref(false);
  const position = ref({ x: 0, y: 0 });

  useEventListener('mousemove', (e: MouseEvent) => {
    if (props.disabled || !magnetRef.value) {
      position.value = { x: 0, y: 0 };
      return;
    }

    const { left, top, width, height } = magnetRef.value.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distX = Math.abs(centerX - e.clientX);
    const distY = Math.abs(centerY - e.clientY);

    if (distX < width / 2 + props.padding && distY < height / 2 + props.padding) {
      isActive.value = true;
      position.value = {
        x: (e.clientX - centerX) / props.magnetStrength,
        y: (e.clientY - centerY) / props.magnetStrength,
      };
    } else {
      isActive.value = false;
      position.value = { x: 0, y: 0 };
    }
  });

  const transitionStyle = computed(() =>
    isActive.value ? props.activeTransition : props.inactiveTransition,
  );
</script>

<template>
  <div ref="magnetRef" :class="cn('relative inline-block', $props.class)">
    <div
      :class="cn(innerClass)"
      :style="{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: transitionStyle,
        willChange: 'transform',
      }"
    >
      <slot />
    </div>
  </div>
</template>
