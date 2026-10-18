<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { useEventListener, useIntersectionObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { createShuffleEngine } from './shuffle-engine';
  import { parseEase } from './shuffle-tween';
  import type { ShuffleEngine, ShuffleProps } from './types';

  const props = withDefaults(defineProps<ShuffleProps>(), {
    effect: 'slide',
    shuffleDirection: 'right',
    duration: 0.35,
    maxDelay: 0,
    ease: 'power3.out',
    threshold: 0.1,
    rootMargin: '-100px',
    tag: 'p',
    textAlign: 'center',
    shuffleTimes: 1,
    animationMode: 'evenodd',
    loop: false,
    loopDelay: 0,
    stagger: 0.03,
    scrambleCharset: '',
    colorFrom: '',
    colorTo: '',
    triggerOnce: true,
    respectReducedMotion: true,
    triggerOnHover: true,
    hoverRadius: 0,
    motionBlur: false,
    color: '',
    accentColor: '',
    class: '',
  });

  const BASE_CLASS =
    "inline-block font-['Press_Start_2P',ui-monospace,monospace] text-[4rem]/none wrap-break-word whitespace-normal uppercase";

  const emit = defineEmits<{ shuffleComplete: [] }>();

  const root = ref<HTMLElement | null>(null);
  const ready = ref(false);
  const fontsLoaded = ref(false);
  const inView = ref(false);
  let engine: ShuffleEngine | null = null;
  let fired = false;

  function usesFont(el: HTMLElement, faces: readonly FontFace[]) {
    const family = window.getComputedStyle(el).fontFamily.toLowerCase();
    return faces.some((face) =>
      family.includes(face.family.replace(/["']/g, '').toLowerCase()),
    );
  }

  const rootStyle = computed(() => ({
    textAlign: props.textAlign,
    ...(props.color ? { color: props.color } : {}),
  }));

  function prefersReducedMotion() {
    return (
      props.respectReducedMotion &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  function destroy() {
    engine?.destroy();
    engine = null;
  }

  function trigger() {
    if (!engine || (props.triggerOnce && fired)) return;
    fired = true;
    engine.start();
    ready.value = true;
  }

  function rebuild() {
    destroy();
    const el = root.value;
    if (!el || !props.text || !fontsLoaded.value) return;
    if (prefersReducedMotion()) {
      el.textContent = props.text;
      ready.value = true;
      emit('shuffleComplete');
      return;
    }
    ready.value = false;
    fired = false;
    engine = createShuffleEngine(el, {
      text: props.text,
      effect: props.effect,
      shuffleDirection: props.shuffleDirection,
      duration: props.duration,
      maxDelay: props.maxDelay,
      ease: parseEase(props.ease),
      shuffleTimes: props.shuffleTimes,
      animationMode: props.animationMode,
      loop: props.loop,
      loopDelay: props.loopDelay,
      stagger: props.stagger,
      scrambleCharset: props.scrambleCharset,
      colorFrom: props.colorFrom,
      colorTo: props.colorTo,
      triggerOnHover: props.triggerOnHover,
      hoverRadius: props.hoverRadius,
      motionBlur: props.motionBlur,
      accentColor: props.accentColor,
      onComplete: () => emit('shuffleComplete'),
    });
    if (inView.value) trigger();
  }

  useIntersectionObserver(
    root,
    ([entry]) => {
      inView.value = entry?.isIntersecting ?? false;
      if (!inView.value) {
        if (!props.triggerOnce) fired = false;
        return;
      }
      trigger();
    },
    {
      threshold: props.threshold,
      rootMargin: `0px 0px ${props.rootMargin} 0px`,
    },
  );

  onMounted(() => {
    if (document.fonts.status === 'loaded') fontsLoaded.value = true;
    else void document.fonts.ready.then(() => (fontsLoaded.value = true));
    // Web fonts that arrive after the first split change every glyph width.
    useEventListener(
      document.fonts,
      'loadingdone',
      (event: FontFaceSetLoadEvent) => {
        if (engine && root.value && usesFont(root.value, event.fontfaces)) {
          rebuild();
        }
      },
    );
  });

  watch(
    [
      fontsLoaded,
      () => props.text,
      () => props.effect,
      () => props.shuffleDirection,
      () => props.duration,
      () => props.maxDelay,
      () => props.ease,
      () => props.shuffleTimes,
      () => props.animationMode,
      () => props.loop,
      () => props.loopDelay,
      () => props.stagger,
      () => props.scrambleCharset,
      () => props.colorFrom,
      () => props.colorTo,
      () => props.triggerOnce,
      () => props.respectReducedMotion,
      () => props.triggerOnHover,
      () => props.hoverRadius,
      () => props.motionBlur,
      () => props.color,
      () => props.accentColor,
    ],
    rebuild,
    { flush: 'post' },
  );

  onBeforeUnmount(destroy);
</script>

<template>
  <component
    :is="tag"
    ref="root"
    :class="cn(BASE_CLASS, ready ? 'visible' : 'invisible', props.class)"
    :style="rootStyle"
  >
    {{ text }}
  </component>
</template>
