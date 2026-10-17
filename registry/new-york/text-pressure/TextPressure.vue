<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
    useStyleTag,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    MAX_RIPPLES,
    RIPPLE_LIFE,
    ROBOTO_FLEX_URL,
    clamp01,
    dist,
    getIdlePressure,
    getRipplePressure,
  } from './text-pressure-math';
  import type { ComponentPublicInstance, CSSProperties } from 'vue';
  import type {
    TextPressureApplied,
    TextPressurePoint,
    TextPressureProps,
    TextPressureRipple,
  } from './types';

  const props = withDefaults(defineProps<TextPressureProps>(), {
    text: 'Compressa',
    fontFamily: 'Roboto Flex',
    fontUrl: ROBOTO_FLEX_URL,
    width: true,
    weight: true,
    italic: true,
    alpha: false,
    flex: true,
    stroke: false,
    scale: false,
    radius: 0.5,
    smoothing: 0.5,
    idle: 'none',
    idleSpeed: 1,
    clickRipple: true,
    textColor: 'currentColor',
    pressureColor: '',
    strokeColor: '#FF0000',
    strokeWidth: 3,
    minFontSize: 24,
    class: '',
  });

  const containerRef = ref<HTMLDivElement | null>(null);
  const titleRef = ref<HTMLHeadingElement | null>(null);
  const spans: (HTMLSpanElement | null)[] = [];
  const fontSize = ref(props.minFontSize);
  const scaleY = ref(1);
  const visible = ref(true);
  const reducedMotion = usePreferredReducedMotion();

  const chars = computed(() => Array.from(props.text));

  useStyleTag(computed(() => `@import url('${props.fontUrl}');`));

  const mouse: TextPressurePoint = { x: 0, y: 0 };
  const cursor = { x: 0, y: 0, seen: false };
  const ripples: TextPressureRipple[] = [];
  let applied: (TextPressureApplied | null)[] = [];
  let last = 0;
  let idleFrames = 0;
  let clock = 0;
  let engage = props.idle === 'wave' || props.idle === 'pulse' ? 0 : 1;

  function setSpanRef(
    index: number,
    el: Element | ComponentPublicInstance | null,
  ): void {
    spans[index] = el instanceof HTMLSpanElement ? el : null;
  }

  function tick(now: number): boolean {
    const container = containerRef.value;
    const title = titleRef.value;
    if (!container || !title) return false;
    const elapsed = last ? Math.min(now - last, 64) : 1000 / 60;
    last = now;

    const idleMode =
      (props.idle === 'wave' || props.idle === 'pulse') &&
      reducedMotion.value !== 'reduce'
        ? props.idle
        : 'none';
    const lag = 1000 * props.smoothing * props.smoothing;
    const follow = lag > 1 ? 1 - Math.exp(-elapsed / lag) : 1;
    mouse.x += (cursor.x - mouse.x) * follow;
    mouse.y += (cursor.y - mouse.y) * follow;

    let present = 1;
    if (idleMode !== 'none') {
      const box = container.getBoundingClientRect();
      const inside =
        cursor.x >= box.left &&
        cursor.x <= box.right &&
        cursor.y >= box.top &&
        cursor.y <= box.bottom;
      present = cursor.seen && inside ? 1 : 0;
    }
    engage += (present - engage) * (1 - Math.exp(-elapsed / 320));
    if (Math.abs(present - engage) < 0.002) engage = present;
    const idling = idleMode !== 'none' && engage < 1;
    if (idling) clock += (elapsed / 1000) * props.idleSpeed;

    while (ripples.length && now - ripples[0]!.start > RIPPLE_LIFE * 1000) {
      ripples.shift();
    }

    const titleRect = title.getBoundingClientRect();
    const maxDist = Math.max(titleRect.width * props.radius, 1);
    const spread = Math.max(props.radius * 2, 0.2);
    const centers = spans.map((span) => {
      if (!span) return null;
      const rect = span.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    });

    let changed = false;
    spans.forEach((span, i) => {
      const center = centers[i];
      if (!span || !center) return;

      let pressure = clamp01(1 - dist(mouse, center) / maxDist);
      if (idling) {
        const position =
          (center.x - titleRect.left) / Math.max(titleRect.width, 1);
        const resting = getIdlePressure(idleMode, position, clock, spread);
        pressure = resting + (pressure - resting) * engage;
      }
      if (ripples.length) {
        const swell = getRipplePressure(ripples, center, now, titleRect.width);
        pressure = 1 - (1 - pressure) * (1 - swell);
      }

      const wdth = props.width ? Math.floor(5 + 200 * pressure) : 100;
      const wght = props.weight ? Math.floor(100 + 900 * pressure) : 400;
      const italVal = props.italic ? pressure.toFixed(2) : '0';
      const alphaVal = props.alpha ? pressure.toFixed(2) : '';
      const tint = Math.round((1 - (1 - pressure) * (1 - pressure)) * 100);
      const color = props.pressureColor
        ? `color-mix(in oklab, ${props.pressureColor} ${tint}%, ${props.textColor})`
        : '';
      const settings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`;
      const previous = applied[i];

      if (
        !previous ||
        previous.span !== span ||
        previous.settings !== settings ||
        previous.alphaVal !== alphaVal ||
        previous.color !== color
      ) {
        span.style.fontVariationSettings = settings;
        span.style.opacity = alphaVal;
        span.style.color = color;
        applied[i] = { span, settings, alphaVal, color };
        changed = true;
      }
    });

    const moving =
      Math.abs(cursor.x - mouse.x) > 0.1 || Math.abs(cursor.y - mouse.y) > 0.1;
    const animating =
      moving || idling || engage !== present || ripples.length > 0;
    idleFrames = animating ? 0 : idleFrames + 1;
    return animating || (changed && idleFrames < 60);
  }

  const { pause, resume, isActive } = useRafFn(
    ({ timestamp }) => {
      if (!tick(timestamp)) {
        last = 0;
        pause();
      }
    },
    { immediate: false },
  );

  function wake(): void {
    if (!isActive.value && visible.value) resume();
  }

  function track(x: number, y: number): void {
    cursor.x = x;
    cursor.y = y;
    cursor.seen = true;
    wake();
  }

  function onMouseMove(event: MouseEvent): void {
    track(event.clientX, event.clientY);
  }

  function onTouch(event: TouchEvent): void {
    const touch = event.touches[0];
    if (touch) track(touch.clientX, touch.clientY);
  }

  function onLeave(): void {
    cursor.seen = false;
    wake();
  }

  function onPress(event: PointerEvent): void {
    if (!props.clickRipple) return;
    ripples.push({
      x: event.clientX,
      y: event.clientY,
      start: performance.now(),
    });
    if (ripples.length > MAX_RIPPLES) ripples.shift();
    wake();
  }

  useEventListener('mousemove', onMouseMove);
  useEventListener('touchstart', onTouch, { passive: true });
  useEventListener('touchmove', onTouch, { passive: true });
  useEventListener('touchend', onLeave);
  useEventListener('touchcancel', onLeave);
  useEventListener('scroll', wake, { passive: true, capture: true });

  useIntersectionObserver(containerRef, (entries) => {
    const entry = entries[entries.length - 1];
    if (!entry) return;
    visible.value = entry.isIntersecting;
    if (entry.isIntersecting) wake();
    else pause();
  });

  function resize(): void {
    const container = containerRef.value;
    if (!container) return;
    const { width: containerW, height: containerH } =
      container.getBoundingClientRect();
    const count = chars.value.length;
    const next = Math.max(
      count ? containerW / (count / 2) : props.minFontSize,
      props.minFontSize,
    );
    fontSize.value = next;
    scaleY.value = props.scale && containerH > 0 ? containerH / next : 1;
  }

  useResizeObserver(containerRef, resize);

  watch(
    [() => chars.value.length, () => props.minFontSize, () => props.scale],
    resize,
  );

  watch(props, wake);

  watch([fontSize, scaleY, chars], () => {
    applied = [];
    wake();
  });

  onMounted(() => {
    useEventListener(document.documentElement, 'mouseleave', onLeave);
    useEventListener(document.fonts, 'loadingdone', wake);
    const container = containerRef.value;
    if (container) {
      const { left, top, width, height } = container.getBoundingClientRect();
      mouse.x = left + width / 2;
      mouse.y = top + height / 2;
      cursor.x = mouse.x;
      cursor.y = mouse.y;
    }
    resize();
    wake();
  });

  const titleStyle = computed<CSSProperties>(() => ({
    fontFamily: props.fontFamily,
    fontSize: `${fontSize.value}px`,
    transform: `scale(1, ${scaleY.value})`,
    color: props.textColor,
    '--text-pressure-stroke-width': `${props.strokeWidth}px`,
    '--text-pressure-stroke-color': props.strokeColor,
  }));
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('relative size-full bg-transparent', props.class)"
    @pointerdown="onPress"
  >
    <h1
      ref="titleRef"
      :aria-label="text"
      :class="
        cn(
          'm-0 w-full origin-top text-center leading-none font-thin whitespace-nowrap uppercase select-none',
          flex && 'flex justify-between',
          stroke && 'is-stroke',
        )
      "
      :style="titleStyle"
    >
      <span
        v-for="(char, i) in chars"
        :key="i"
        :ref="(el) => setSpanRef(i, el)"
        :data-char="char"
        aria-hidden="true"
        class="inline-block"
      >
        {{ char }}
      </span>
    </h1>
  </div>
</template>

<style scoped>
  .is-stroke span {
    position: relative;
  }

  .is-stroke span::after {
    content: attr(data-char);
    position: absolute;
    left: 0;
    top: 0;
    color: transparent;
    z-index: -1;
    -webkit-text-stroke-width: var(--text-pressure-stroke-width);
    -webkit-text-stroke-color: var(--text-pressure-stroke-color);
  }
</style>
