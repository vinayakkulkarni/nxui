<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { STEPPER_SETTLE } from './stepper-theme';

  const root = ref<HTMLSpanElement | null>(null);

  // Draws the tick in from its top-right end, like a stroke being drawn.
  onMounted(() => {
    const el = root.value;
    if (!el || typeof el.animate !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.animate(
      [{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0)' }],
      { duration: 360, easing: STEPPER_SETTLE },
    );
  });
</script>

<template>
  <span ref="root" class="grid place-items-center">
    <Icon name="lucide:check" class="size-4" />
  </span>
</template>
