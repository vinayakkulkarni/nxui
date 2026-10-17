<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { DEPTH_CAROUSEL_ITEMS } from './defaults';
  import { clamp, resolveEase, wrapIndex } from './depth-ease';
  import type { ComponentPublicInstance } from 'vue';
  import type {
    DepthCarouselDrag,
    DepthCarouselEmits,
    DepthCarouselItem,
    DepthCarouselProps,
    DepthCarouselSlide,
  } from './types';

  const props = withDefaults(defineProps<DepthCarouselProps>(), {
    items: () => DEPTH_CAROUSEL_ITEMS,
    cardWidth: 300,
    cardHeight: 380,
    radius: 18,
    tint: '#05060a',
    depth: 220,
    spread: 90,
    tilt: 22,
    tiltDirection: 'right',
    perspective: 1400,
    visibleCards: 4,
    falloff: 0.2,
    blur: 6,
    duration: 700,
    ease: 'power3.out',
    autoplay: false,
    autoplayDelay: 3200,
    loop: true,
    showControls: true,
    showIndicators: true,
    class: '',
  });

  const emit = defineEmits<DepthCarouselEmits>();

  const normalizeItem = (it: DepthCarouselItem): DepthCarouselSlide =>
    typeof it === 'string' ? { image: it, alt: '' } : it;

  const data = computed(() =>
    (Array.isArray(props.items) ? props.items : []).map(normalizeItem),
  );
  const count = computed(() => data.value.length);
  const easeFn = computed(() => resolveEase(props.ease));

  const motionPref = usePreferredReducedMotion();
  const reduce = computed(() => motionPref.value === 'reduce');

  const rootRef = ref<HTMLDivElement | null>(null);
  const cardEls: (HTMLElement | null)[] = [];
  const overlayEls: (HTMLElement | null)[] = [];
  const active = ref(0);

  let pos = 0;
  let focusIndex = 0;
  let scale = 1;
  let tweenRaf = 0;
  let drag: DepthCarouselDrag | null = null;
  let wheelTimer: ReturnType<typeof setTimeout> | null = null;
  let autoTimer: ReturnType<typeof setInterval> | null = null;
  let hovered = false;
  let focused = false;

  function toElement(
    el: Element | ComponentPublicInstance | null,
  ): HTMLElement | null {
    return el instanceof HTMLElement ? el : null;
  }

  function setCard(el: Element | ComponentPublicInstance | null, i: number) {
    cardEls[i] = toElement(el);
  }

  function setOverlay(el: Element | ComponentPublicInstance | null, i: number) {
    overlayEls[i] = toElement(el);
  }

  function layout(p: number): void {
    const n = count.value;
    if (!n) return;
    const dir = props.tiltDirection === 'left' ? -1 : 1;
    const sc = scale;
    for (let i = 0; i < n; i++) {
      const el = cardEls[i];
      if (!el) continue;

      let d = i - p;
      if (props.loop && n > 1) {
        d = wrapIndex(d, n);
        if (d > n / 2) d -= n;
      }

      const back = Math.max(0, d);
      const az = Math.abs(d);
      const shown = az <= props.visibleCards + 0.5;

      const tz = -props.depth * d;
      const tx = dir * props.spread * d;
      const ry = dir * props.tilt * clamp(d, 0, 1);

      let opacity = d < 0 ? Math.max(0, 1 + d) : 1;
      if (!shown) opacity = 0;

      const brightness = Math.max(0.15, 1 - back * props.falloff);
      const blurPx =
        props.blur > 0
          ? Math.min(
              props.blur,
              (back / Math.max(1, props.visibleCards)) * props.blur,
            )
          : 0;
      const zi = Math.round(2000 - d * 20);

      el.style.transform = `translate(-50%, -50%) scale(${sc}) translateX(${tx.toFixed(2)}px) translateZ(${tz.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.filter = `brightness(${brightness.toFixed(3)}) blur(${blurPx.toFixed(2)}px)`;
      el.style.zIndex = String(zi);
      el.style.pointerEvents = shown && opacity > 0.05 ? 'auto' : 'none';

      const ov = overlayEls[i];
      if (ov) {
        ov.style.opacity = clamp(back * props.falloff * 1.25, 0, 0.86).toFixed(
          3,
        );
      }
    }
  }

  function killTween(): void {
    if (tweenRaf) cancelAnimationFrame(tweenRaf);
    tweenRaf = 0;
  }

  function finishTween(): void {
    const n = count.value;
    if (n > 0) pos = wrapIndex(pos, n);
    layout(pos);
  }

  function tweenTo(target: number, animate: boolean): void {
    killTween();
    const from = pos;
    const dur = animate && !reduce.value ? props.duration : 0;
    if (dur <= 0) {
      pos = target;
      layout(pos);
      finishTween();
      return;
    }
    const ease = easeFn.value;
    const start = performance.now();
    const step = (now: number) => {
      const t = clamp((now - start) / dur, 0, 1);
      pos = from + (target - from) * ease(t);
      layout(pos);
      if (t < 1) {
        tweenRaf = requestAnimationFrame(step);
      } else {
        tweenRaf = 0;
        finishTween();
      }
    };
    tweenRaf = requestAnimationFrame(step);
  }

  function notify(idx: number): void {
    active.value = idx;
    const item = data.value[idx];
    if (item) emit('change', idx, item);
  }

  function setFocus(rawIndex: number, animate = true): void {
    const n = count.value;
    if (!n) return;
    const idx = props.loop ? wrapIndex(rawIndex, n) : clamp(rawIndex, 0, n - 1);
    let delta = idx - pos;
    if (props.loop && n > 1) {
      delta = wrapIndex(delta, n);
      if (delta > n / 2) delta -= n;
    }
    tweenTo(pos + delta, animate);
    if (idx !== focusIndex) {
      focusIndex = idx;
      notify(idx);
    }
  }

  function navigateBy(step: number): void {
    setFocus(focusIndex + step, true);
  }

  const stepPx = () => Math.max(props.cardWidth * 0.55 * scale, 40);

  function onPointerDown(e: PointerEvent): void {
    if (count.value < 2) return;
    killTween();
    drag = {
      x: e.clientX,
      startPos: pos,
      lastX: e.clientX,
      lastT: performance.now(),
      v: 0,
      moved: false,
      id: e.pointerId,
    };
  }

  function onPointerMove(e: PointerEvent): void {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 4) {
      drag.moved = true;
      rootRef.value?.setPointerCapture(drag.id);
    }
    if (!drag.moved) return;
    const now = performance.now();
    const dt = Math.max(now - drag.lastT, 1);
    drag.v = (e.clientX - drag.lastX) / dt;
    drag.lastX = e.clientX;
    drag.lastT = now;
    pos = drag.startPos - dx / stepPx();
    layout(pos);
  }

  function onPointerEnd(): void {
    const d = drag;
    if (!d) return;
    drag = null;
    if (!d.moved) return;
    const projected = pos - (d.v * 180) / stepPx();
    setFocus(Math.round(projected), true);
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateBy(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigateBy(1);
    }
  }

  function onCardClick(index: number): void {
    if (drag?.moved) return;
    setFocus(index, true);
  }

  function onPrev(): void {
    navigateBy(-1);
  }

  function onNext(): void {
    navigateBy(1);
  }

  function onWheel(e: WheelEvent): void {
    if (count.value < 2) return;
    e.preventDefault();
    killTween();
    const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const delta = e.deltaMode === 1 ? raw * 24 : raw;
    pos += clamp(delta / (props.cardWidth * 0.9), -0.6, 0.6);
    layout(pos);
    if (wheelTimer) clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => setFocus(Math.round(pos), true), 130);
  }

  function stopAutoplay(): void {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }

  function startAutoplay(): void {
    stopAutoplay();
    if (!props.autoplay || reduce.value || count.value < 2) return;
    autoTimer = setInterval(
      () => {
        if (!hovered && !focused) navigateBy(1);
      },
      Math.max(props.autoplayDelay, 600),
    );
  }

  function onEnter(): void {
    hovered = true;
  }
  function onLeave(): void {
    hovered = false;
  }
  function onFocusIn(): void {
    focused = true;
  }
  function onFocusOut(): void {
    focused = false;
  }

  useEventListener(rootRef, 'wheel', onWheel, { passive: false });

  useResizeObserver(rootRef, (entries) => {
    const w = entries[0]?.contentRect.width ?? 0;
    const needed = props.cardWidth + Math.abs(props.spread) * 2 + 120;
    scale = clamp(w / needed, 0.4, 1);
    layout(pos);
  });

  watch(
    [
      () => props.depth,
      () => props.spread,
      () => props.tilt,
      () => props.tiltDirection,
      () => props.visibleCards,
      () => props.falloff,
      () => props.blur,
      () => props.cardWidth,
      () => props.cardHeight,
      () => props.radius,
      () => props.loop,
      count,
    ],
    () => {
      cardEls.length = count.value;
      overlayEls.length = count.value;
      layout(pos);
    },
    { flush: 'post' },
  );

  watch(
    [() => props.autoplay, () => props.autoplayDelay, count, reduce],
    startAutoplay,
  );

  onMounted(() => {
    layout(pos);
    startAutoplay();
  });

  onBeforeUnmount(() => {
    killTween();
    if (wheelTimer) clearTimeout(wheelTimer);
    stopAutoplay();
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="[
      'depth-carousel relative flex size-full min-h-80 cursor-grab touch-pan-y items-center justify-center rounded-xl outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:cursor-grabbing',
      props.class,
    ]"
    :style="{ '--dc-perspective': `${perspective}px` }"
    role="group"
    aria-roledescription="carousel"
    aria-label="Depth carousel"
    tabindex="0"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerEnd"
    @pointercancel="onPointerEnd"
    @keydown="onKeydown"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <div class="depth-carousel__stage">
      <div
        v-for="(item, i) in data"
        :key="i"
        :ref="(el) => setCard(el, i)"
        class="depth-carousel__card"
        :style="{
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          borderRadius: `${radius}px`,
        }"
        aria-roledescription="slide"
        :aria-label="`${i + 1} of ${count}`"
        :aria-hidden="active !== i"
        @click="onCardClick(i)"
      >
        <img
          class="depth-carousel__img"
          :src="item.image"
          :alt="item.alt || ''"
          draggable="false"
        />
        <span
          :ref="(el) => setOverlay(el, i)"
          class="depth-carousel__tint"
          :style="{ background: tint }"
        />
      </div>
    </div>

    <template v-if="showControls && count > 1">
      <button
        type="button"
        class="absolute top-1/2 left-4 z-3000 grid size-10.5 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-border bg-background/55 text-foreground backdrop-blur-sm transition-[background-color,border-color,scale] duration-200 hover:border-foreground/40 hover:bg-background/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-94 motion-reduce:transition-none"
        aria-label="Previous slide"
        @click="onPrev"
      >
        <Icon name="lucide:chevron-left" class="size-5" />
      </button>
      <button
        type="button"
        class="absolute top-1/2 right-4 z-3000 grid size-10.5 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-border bg-background/55 text-foreground backdrop-blur-sm transition-[background-color,border-color,scale] duration-200 hover:border-foreground/40 hover:bg-background/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-94 motion-reduce:transition-none"
        aria-label="Next slide"
        @click="onNext"
      >
        <Icon name="lucide:chevron-right" class="size-5" />
      </button>
    </template>

    <div
      v-if="showIndicators && count > 1"
      class="absolute bottom-4 left-1/2 z-3000 flex -translate-x-1/2 gap-2 rounded-full bg-background/40 px-3 py-2 backdrop-blur-sm"
      role="tablist"
      aria-label="Slides"
    >
      <button
        v-for="(_, i) in data"
        :key="i"
        type="button"
        role="tab"
        :aria-selected="active === i"
        :aria-label="`Go to slide ${i + 1}`"
        :class="[
          'h-1.75 cursor-pointer rounded-full p-0 transition-[width,background-color] duration-250 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none',
          active === i ? 'w-5 bg-foreground' : 'w-1.75 bg-foreground/32',
        ]"
        @click="setFocus(i, true)"
      />
    </div>
  </div>
</template>

<style scoped>
  .depth-carousel {
    perspective: var(--dc-perspective, 1400px);
    perspective-origin: 50% 50%;
    -webkit-user-select: none;
  }

  .depth-carousel__stage {
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
  }

  .depth-carousel__card {
    position: absolute;
    top: 50%;
    left: 50%;
    transform-origin: center center;
    overflow: hidden;
    background: #0b0d12;
    box-shadow:
      0 30px 60px -20px rgba(0, 0, 0, 0.65),
      0 8px 20px -10px rgba(0, 0, 0, 0.5);
    will-change: transform, opacity, filter;
    cursor: pointer;
    transform: translate(-50%, -50%);
  }

  .depth-carousel__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
    -webkit-user-drag: none;
  }

  .depth-carousel__tint {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    mix-blend-mode: multiply;
  }

  @media (prefers-reduced-motion: reduce) {
    .depth-carousel__card {
      will-change: auto;
    }
  }
</style>
