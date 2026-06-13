<script setup lang="ts">
  import { ref, provide, onMounted, onBeforeUnmount } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import type { EyeTrackingProps } from './types';
  import EyeTrackingEye from './EyeTrackingEye.vue';
  import { cn } from '~/lib/utils';

  withDefaults(defineProps<EyeTrackingProps>(), {
    eyeSize: 120,
    gap: 40,
    irisColor: '#4A6741',
    irisColorSecondary: '#6B8F62',
    pupilColor: '#0a0a0a',
    scleraColor: '#F5F0EB',
    pupilRange: 0.7,
    showReflection: true,
    showIrisDetail: true,
    idleAnimation: true,
    blinkInterval: 4000,
    eyeCount: 2,
    variant: 'realistic',
    reactivePupil: true,
    showEyelids: true,
    class: '',
  });

  const mouseX = ref(0);
  const mouseY = ref(0);
  const hasMouseMoved = ref(false);

  let idleTimeout: ReturnType<typeof setTimeout> | undefined;

  provide('eye-tracking-mouse-x', mouseX);
  provide('eye-tracking-mouse-y', mouseY);
  provide('eye-tracking-has-mouse-moved', hasMouseMoved);

  function handlePointerMove(event: MouseEvent | TouchEvent): void {
    const point = 'touches' in event ? event.touches[0] : (event as MouseEvent);
    if (!point) return;

    mouseX.value = point.clientX;
    mouseY.value = point.clientY;
    hasMouseMoved.value = true;

    // Reset idle timer
    if (idleTimeout) clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
      hasMouseMoved.value = false;
    }, 3000);
  }

  useEventListener(
    typeof window !== 'undefined' ? window : null,
    'mousemove',
    handlePointerMove,
  );
  useEventListener(
    typeof window !== 'undefined' ? window : null,
    'touchmove',
    handlePointerMove,
  );

  onMounted(() => {
    // Initial idle state
    hasMouseMoved.value = false;
  });

  onBeforeUnmount(() => {
    if (idleTimeout) clearTimeout(idleTimeout);
  });
</script>

<template>
  <div
    :class="
      cn('inline-flex items-center justify-center select-none', $props.class)
    "
    :style="{ gap: `${gap}px` }"
  >
    <EyeTrackingEye
      v-for="i in eyeCount"
      :key="i"
      :eye-size="eyeSize"
      :iris-color="irisColor"
      :iris-color-secondary="irisColorSecondary"
      :pupil-color="pupilColor"
      :sclera-color="scleraColor"
      :pupil-range="pupilRange"
      :show-reflection="showReflection"
      :show-iris-detail="showIrisDetail"
      :idle-animation="idleAnimation"
      :blink-interval="blinkInterval"
      :variant="variant"
      :reactive-pupil="reactivePupil"
      :show-eyelids="showEyelids"
      :index="i - 1"
    />
  </div>
</template>
