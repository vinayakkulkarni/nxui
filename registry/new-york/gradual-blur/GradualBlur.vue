<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import { useEventListener, useRafFn } from '@vueuse/core';
  import type { CSSProperties } from 'vue';
  import { cn } from '~/lib/utils';
  import {
    DIRECTIONS,
    buildStack,
    clamp01,
    findScroller,
    toLength,
  } from './gradual-blur-stack';
  import type { GradualBlurPosition, GradualBlurProps } from './types';

  const props = withDefaults(defineProps<GradualBlurProps>(), {
    position: 'bottom',
    target: 'parent',
    height: '6rem',
    width: undefined,
    strength: 2,
    layers: 8,
    curve: 'linear',
    exponential: true,
    opacity: 1,
    saturation: 1,
    tint: 'transparent',
    autoHide: false,
    container: null,
    hoverIntensity: 1,
    duration: 0.3,
    easing: 'ease-out',
    zIndex: 1000,
    class: '',
  });

  const rootRef = ref<HTMLDivElement>();
  const mounted = ref(false);

  const edge = computed<GradualBlurPosition>(() =>
    props.position in DIRECTIONS ? props.position : 'bottom',
  );
  const vertical = computed(
    () => edge.value === 'top' || edge.value === 'bottom',
  );

  const stack = computed(() =>
    buildStack({
      layers: props.layers,
      curve: props.curve,
      strength: props.strength,
      exponential: props.exponential,
      saturation: props.saturation,
      duration: props.duration,
      easing: props.easing,
      edge: edge.value,
      opacity: props.opacity,
      tint: props.tint,
    }),
  );

  const rootStyle = computed<CSSProperties>(() => {
    const e = edge.value;
    const isVertical = vertical.value;
    const depth = toLength(
      isVertical ? props.height : (props.width ?? props.height),
    );
    const span =
      isVertical && props.width != null ? toLength(props.width) : null;
    const rounded = props.target !== 'page' && !span;
    const corner = (a: string, b: string) =>
      rounded && (e === a || e === b) ? 'inherit' : undefined;
    return {
      position: props.target === 'page' ? 'fixed' : 'absolute',
      zIndex: props.zIndex,
      borderTopLeftRadius: corner('top', 'left'),
      borderTopRightRadius: corner('top', 'right'),
      borderBottomLeftRadius: corner('bottom', 'left'),
      borderBottomRightRadius: corner('bottom', 'right'),
      top: e === 'bottom' ? undefined : 0,
      bottom: e === 'top' ? undefined : 0,
      left: e === 'right' ? undefined : 0,
      right: e === 'left' ? undefined : 0,
      height: isVertical ? depth : undefined,
      width: isVertical ? (span ?? undefined) : depth,
      marginInline: span ? 'auto' : undefined,
    };
  });

  // autoHide: fade the blur out as the scroller reaches this edge.
  watch(
    [
      mounted,
      () => props.autoHide,
      () => props.container,
      () => props.target,
      edge,
    ],
    (_, __, onCleanup) => {
      const root = rootRef.value;
      if (!mounted.value || !root) return;
      if (!props.autoHide) {
        root.style.removeProperty('--gradual-blur-reveal');
        return;
      }
      const isVertical = vertical.value;
      const scroller = findScroller(
        props.container,
        root,
        props.target === 'page',
        isVertical,
      );
      if (!scroller) return;
      const element = scroller instanceof HTMLElement ? scroller : null;
      const start = edge.value === 'top' || edge.value === 'left';

      const update = () => {
        const page = document.documentElement;
        let offset: number;
        let limit: number;
        if (element) {
          offset = isVertical ? element.scrollTop : element.scrollLeft;
          limit = isVertical
            ? element.scrollHeight - element.clientHeight
            : element.scrollWidth - element.clientWidth;
        } else {
          offset = isVertical ? window.scrollY : window.scrollX;
          limit = isVertical
            ? page.scrollHeight - window.innerHeight
            : page.scrollWidth - window.innerWidth;
        }
        const box = root.getBoundingClientRect();
        const reach = Math.max(isVertical ? box.height : box.width, 1);
        const room = start ? offset : limit - offset;
        root.style.setProperty(
          '--gradual-blur-reveal',
          clamp01(room / reach).toFixed(3),
        );
      };

      update();
      const source = element ?? window;
      source.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      const observer = element ? new ResizeObserver(update) : null;
      if (observer && element) {
        observer.observe(element);
        if (element.firstElementChild) {
          observer.observe(element.firstElementChild);
        }
      }
      onCleanup(() => {
        source.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
        observer?.disconnect();
      });
    },
    { flush: 'post' },
  );

  // hoverIntensity: scale the blur while the pointer is over the band.
  const hoverActive = computed(
    () => mounted.value && props.hoverIntensity !== 1,
  );
  let point: { x: number; y: number } | null = null;
  let inside = false;

  function setHover(value: string | null) {
    const root = rootRef.value;
    if (!root) return;
    if (value === null) root.style.removeProperty('--gradual-blur-hover');
    else root.style.setProperty('--gradual-blur-hover', value);
  }

  const { pause: stopCheck, resume: queueCheck } = useRafFn(
    () => {
      stopCheck();
      const root = rootRef.value;
      if (!point || !root) return;
      const box = root.getBoundingClientRect();
      const now =
        point.x >= box.left &&
        point.x <= box.right &&
        point.y >= box.top &&
        point.y <= box.bottom;
      if (now === inside) return;
      inside = now;
      setHover(inside ? String(Math.max(props.hoverIntensity, 0)) : '1');
    },
    { immediate: false },
  );

  function onPointerMove(event: PointerEvent) {
    if (!hoverActive.value) return;
    point = { x: event.clientX, y: event.clientY };
    queueCheck();
  }

  function onPointerLeave() {
    if (!hoverActive.value) return;
    point = null;
    inside = false;
    setHover('1');
  }

  useEventListener('pointermove', onPointerMove, { passive: true });
  useEventListener(
    () => (mounted.value ? document.documentElement : null),
    'pointerleave',
    onPointerLeave,
  );

  watch(hoverActive, (on) => {
    if (on) return;
    stopCheck();
    point = null;
    inside = false;
    setHover(null);
  });

  onMounted(() => {
    mounted.value = true;
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('gradual-blur', props.class)"
    :style="rootStyle"
    aria-hidden="true"
  >
    <div v-for="(layer, index) in stack.steps" :key="index" :style="layer" />
    <div v-if="stack.wash" :style="stack.wash" />
  </div>
</template>

<style scoped>
  .gradual-blur {
    pointer-events: none;
  }
</style>
