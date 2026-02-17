<script setup lang="ts">
  import { ref, onMounted, watch, nextTick } from 'vue';
  import { cn } from '~/lib/utils';

  const props = withDefaults(
    defineProps<{
      gridSize?: number;
      pixelColor?: string;
      animationStepDuration?: number;
      once?: boolean;
      aspectRatio?: string;
      class?: string;
    }>(),
    {
      gridSize: 7,
      pixelColor: 'currentColor',
      animationStepDuration: 0.3,
      once: false,
      aspectRatio: '100%',
      class: '',
    },
  );

  const pixelGridRef = ref<HTMLDivElement>();
  const isActive = ref(false);
  const showSecond = ref(false);
  let animating = false;

  function buildPixels() {
    const grid = pixelGridRef.value;
    if (!grid) return;
    grid.innerHTML = '';
    const size = 100 / props.gridSize;
    for (let row = 0; row < props.gridSize; row++) {
      for (let col = 0; col < props.gridSize; col++) {
        const el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.backgroundColor = props.pixelColor;
        el.style.width = `${size}%`;
        el.style.height = `${size}%`;
        el.style.left = `${col * size}%`;
        el.style.top = `${row * size}%`;
        el.style.display = 'none';
        grid.appendChild(el);
      }
    }
  }

  onMounted(buildPixels);
  watch(() => [props.gridSize, props.pixelColor], buildPixels);

  function animatePixels(activate: boolean) {
    if (animating) return;
    animating = true;
    isActive.value = activate;

    const grid = pixelGridRef.value;
    if (!grid) { animating = false; return; }
    const pixels = Array.from(grid.children) as HTMLElement[];
    if (pixels.length === 0) { animating = false; return; }

    // Shuffle array for random stagger
    const shuffled = [...pixels].sort(() => Math.random() - 0.5);
    const totalDuration = props.animationStepDuration * 1000;
    const stagger = totalDuration / shuffled.length;

    // Phase 1: show pixels
    shuffled.forEach((px, i) => {
      setTimeout(() => { px.style.display = 'block'; }, i * stagger);
    });

    // Flip content at midpoint
    setTimeout(() => {
      showSecond.value = activate;
    }, totalDuration);

    // Phase 2: hide pixels
    const shuffled2 = [...pixels].sort(() => Math.random() - 0.5);
    shuffled2.forEach((px, i) => {
      setTimeout(() => { px.style.display = 'none'; }, totalDuration + i * stagger);
    });

    setTimeout(() => {
      animating = false;
    }, totalDuration * 2);
  }

  function handleEnter() {
    if (!isActive.value) animatePixels(true);
  }

  function handleLeave() {
    if (isActive.value && !props.once) animatePixels(false);
  }
</script>

<template>
  <div
    :class="cn('pixel-transition-wrap', $props.class)"
    @mouseenter="handleEnter"
    @mouseleave="handleLeave"
    tabindex="0"
    @focus="handleEnter"
    @blur="handleLeave"
  >
    <div :style="{ paddingTop: aspectRatio }" />
    <div
      class="absolute inset-0 flex items-center justify-center"
      :aria-hidden="isActive"
    >
      <slot name="first" />
    </div>
    <div
      class="absolute inset-0 flex items-center justify-center"
      :style="{ display: showSecond ? 'flex' : 'none', pointerEvents: showSecond ? 'none' : '' }"
      :aria-hidden="!isActive"
    >
      <slot name="second" />
    </div>
    <div ref="pixelGridRef" class="pointer-events-none absolute inset-0" />
  </div>
</template>

<style scoped>
  .pixel-transition-wrap {
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }
</style>
