<script setup lang="ts">
  import { computed, ref } from 'vue';
  import type { CSSProperties } from 'vue';
  import { cn } from '~/lib/utils';
  import ScrollBasedVelocityRow from './ScrollBasedVelocityRow.vue';
  import { DEFAULT_VELOCITY_MAPPING, FADE_MASK } from './velocity-math';
  import type { ScrollBasedVelocityProps } from './types';

  const props = withDefaults(defineProps<ScrollBasedVelocityProps>(), {
    texts: () => [],
    velocity: 100,
    scrollContainer: null,
    textClass: '',
    damping: 50,
    stiffness: 400,
    numCopies: 6,
    velocityMapping: () => DEFAULT_VELOCITY_MAPPING,
    parallaxClass: '',
    scrollerClass: '',
    parallaxStyle: undefined,
    scrollerStyle: undefined,
    separator: '',
    pauseOnHover: false,
    fadeEdges: false,
    skewWithVelocity: 0,
    scaleWithVelocity: 0,
    outlineAlternate: false,
    gap: 0,
    fontSize: undefined,
    fontWeight: undefined,
    color: undefined,
    draggable: false,
    class: '',
  });

  const hovered = ref(false);

  const maskStyle = computed<CSSProperties | undefined>(() =>
    props.fadeEdges
      ? { WebkitMaskImage: FADE_MASK, maskImage: FADE_MASK }
      : undefined,
  );

  function onEnter() {
    hovered.value = true;
  }

  function onLeave() {
    hovered.value = false;
  }
</script>

<template>
  <section
    :class="cn('w-full', props.class)"
    :style="maskStyle"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
  >
    <ScrollBasedVelocityRow
      v-for="(text, index) in texts"
      :key="index"
      :text="text"
      :base-velocity="index % 2 !== 0 ? -velocity : velocity"
      :scroll-container="scrollContainer"
      :text-class="textClass"
      :damping="damping"
      :stiffness="stiffness"
      :num-copies="numCopies"
      :velocity-mapping="velocityMapping"
      :parallax-class="parallaxClass"
      :scroller-class="scrollerClass"
      :parallax-style="parallaxStyle"
      :scroller-style="scrollerStyle"
      :separator="separator"
      :pause-on-hover="pauseOnHover"
      :hovered="hovered"
      :skew-with-velocity="skewWithVelocity"
      :scale-with-velocity="scaleWithVelocity"
      :outline="outlineAlternate && index % 2 !== 0"
      :gap="gap"
      :font-size="fontSize"
      :font-weight="fontWeight"
      :color="color"
      :draggable="draggable"
    />
  </section>
</template>
