<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    useTemplateRef,
    watch,
  } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import {
    SHINY_TEXT_EASINGS,
    SHINY_TEXT_TRIGGERS,
    clamp,
    createShinyText,
  } from './shiny-text-engine';
  import type {
    ShinyTextEngine,
    ShinyTextProps,
    ShinyTextSettings,
  } from './types';

  const props = withDefaults(defineProps<ShinyTextProps>(), {
    text: undefined,
    color: '#b5b5b5',
    shineColor: '#ffffff',
    speed: 2,
    delay: 0,
    angle: 120,
    shineWidth: 40,
    softness: 0.8,
    bands: 1,
    glow: 0,
    direction: 'left',
    easing: 'smooth',
    trigger: 'loop',
    yoyo: false,
    followPointer: false,
    pauseOnHover: false,
    disabled: false,
    class: '',
  });

  const rootRef = useTemplateRef<HTMLElement>('root');
  const glowRef = useTemplateRef<HTMLElement>('glow');
  const motion = usePreferredReducedMotion();

  function settings(): ShinyTextSettings {
    return {
      color: props.color,
      shineColor: props.shineColor,
      speed: Math.max(0.1, props.speed),
      delay: Math.max(0, props.delay),
      angle: props.angle,
      shineWidth: clamp(props.shineWidth, 2, 200),
      softness: clamp(props.softness, 0, 1),
      bands: clamp(Math.round(props.bands), 1, 3),
      glow: clamp(props.glow, 0, 1),
      sign: props.direction === 'right' ? 1 : -1,
      ease: SHINY_TEXT_EASINGS[props.easing] ?? SHINY_TEXT_EASINGS.smooth,
      trigger: SHINY_TEXT_TRIGGERS.includes(props.trigger)
        ? props.trigger
        : 'loop',
      yoyo: props.yoyo,
      followPointer: props.followPointer,
      pauseOnHover: props.pauseOnHover,
      disabled: props.disabled,
    };
  }

  let engine: ShinyTextEngine | null = null;

  function start() {
    engine?.dispose();
    engine = null;
    const root = rootRef.value;
    if (!root) return;
    engine = createShinyText({
      root,
      glow: () => glowRef.value,
      reduced: motion.value === 'reduce',
      settings,
    });
  }

  onMounted(start);
  watch(motion, start);
  watch(props, () => engine?.sync(), { flush: 'post' });
  onBeforeUnmount(() => engine?.dispose());

  const flat = computed(
    () => `linear-gradient(${props.color}, ${props.color})`,
  );
</script>

<template>
  <span
    ref="root"
    :class="['shiny-text', props.class]"
    :style="{ backgroundImage: flat }"
  >
    <slot>{{ text }}</slot>
    <span
      v-if="glow > 0"
      ref="glow"
      class="shiny-text__glow"
      aria-hidden="true"
    >
      <slot>{{ text }}</slot>
    </span>
  </span>
</template>

<style scoped>
  .shiny-text {
    position: relative;
    display: inline-block;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .shiny-text__glow {
    position: absolute;
    inset: 0;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    filter: blur(0.14em);
    pointer-events: none;
    user-select: none;
  }
</style>
