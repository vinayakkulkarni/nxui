<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import { MorphEngine } from './morph-engine';
  import { MORPH_DEFAULT_ITEMS } from './morph-defaults';
  import type { MorphEngineOptions, MorphSliderProps } from './types';

  const props = withDefaults(defineProps<MorphSliderProps>(), {
    items: () => MORPH_DEFAULT_ITEMS,
    startIndex: 0,
    transition: 'melt',
    duration: 1.1,
    ease: 'power2.inOut',
    intensity: 0.55,
    scale: 2.4,
    aberration: 0.35,
    drift: 0.4,
    autoplay: false,
    autoplayDelay: 4,
    loop: true,
    radius: 16,
    overlayColor: '#000000',
    showCaptions: true,
    showControls: true,
    showIndicators: true,
    class: '',
  });

  const rootRef = ref<HTMLDivElement>();
  const stageRef = ref<HTMLDivElement>();
  const engine = shallowRef<MorphEngine | null>(null);
  const index = ref(props.startIndex);
  const hovering = ref(false);
  const visible = ref(true);
  const reducedMotion = usePreferredReducedMotion();

  function getOptions(): MorphEngineOptions {
    return {
      transition: props.transition,
      duration: props.duration,
      ease: props.ease,
      intensity: props.intensity,
      scale: props.scale,
      aberration: props.aberration,
      drift: props.drift,
      overlayColor: props.overlayColor,
      loop: props.loop,
    };
  }

  function setIndex(i: number) {
    index.value = i;
  }

  function createEngine() {
    const el = stageRef.value;
    if (!el) return;
    engine.value?.destroy();
    engine.value = new MorphEngine(el, {
      items: props.items,
      startIndex: props.startIndex,
      reducedMotion: reducedMotion.value === 'reduce',
      dprCap: 2,
      getOptions,
      onIndexChange: setIndex,
    });
    engine.value.setActive(visible.value);
    index.value = props.startIndex;
  }

  onMounted(createEngine);

  watch([() => props.items, () => props.startIndex], () => createEngine());

  watch(reducedMotion, (v) => engine.value?.setReducedMotion(v === 'reduce'));

  useIntersectionObserver(rootRef, (entries) => {
    const entry = entries[0];
    if (!entry) return;
    visible.value = entry.isIntersecting;
    engine.value?.setActive(entry.isIntersecting);
  });

  onBeforeUnmount(() => {
    engine.value?.destroy();
    engine.value = null;
  });

  function handleNext() {
    engine.value?.next();
  }

  function handlePrev() {
    engine.value?.prev();
  }

  function goToSlide(i: number) {
    if (!engine.value || i === index.value) return;
    engine.value.goTo(i > index.value ? 1 : -1);
  }

  watch(
    [() => props.autoplay, () => props.autoplayDelay, hovering, index, engine],
    (_v, _o, onCleanup) => {
      if (!props.autoplay || hovering.value || !engine.value) return;
      const id = setTimeout(
        () => engine.value?.next(),
        Math.max(props.autoplayDelay, 1) * 1000,
      );
      onCleanup(() => clearTimeout(id));
    },
  );

  let startX = 0;
  let width = 1;
  let active = false;

  useEventListener(stageRef, 'pointerdown', (e: PointerEvent) => {
    const el = stageRef.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    width = rect.width || 1;
    startX = e.clientX;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    engine.value?.setPointer(px, 1 - py);
    active = engine.value?.beginDrag() ?? false;
    if (active) {
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // pointer may already be released
      }
    }
  });

  useEventListener(stageRef, 'pointermove', (e: PointerEvent) => {
    if (!active) return;
    engine.value?.drag((e.clientX - startX) / width);
  });

  function onPointerUp() {
    if (!active) return;
    active = false;
    engine.value?.endDrag();
  }

  useEventListener(stageRef, 'pointerup', onPointerUp);
  useEventListener(stageRef, 'pointercancel', onPointerUp);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    }
  }

  function onEnter() {
    hovering.value = true;
  }

  function onLeave() {
    hovering.value = false;
  }

  const hasCaptions = computed(() => props.items.some((item) => item.caption));

  const rootStyle = computed(() => ({
    borderRadius: `${props.radius}px`,
    '--ms-swap': `${(props.duration * 0.66).toFixed(3)}s`,
    '--ms-dot': `${(props.duration * 0.45).toFixed(3)}s`,
  }));
</script>

<template>
  <div
    ref="rootRef"
    :class="['morph-slider', props.class]"
    :style="rootStyle"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <div
      ref="stageRef"
      class="morph-slider-stage"
      role="group"
      aria-roledescription="carousel"
      aria-label="Image morph slider"
      tabindex="0"
      @keydown="onKeyDown"
    />

    <div
      v-if="showCaptions && hasCaptions"
      class="morph-slider-caption"
      aria-live="polite"
    >
      <template v-for="(item, i) in items" :key="i">
        <span
          v-if="item.caption"
          :aria-hidden="i === index ? undefined : true"
          :class="['morph-slider-caption-text', { 'is-active': i === index }]"
        >
          {{ item.caption }}
        </span>
      </template>
    </div>

    <div v-if="showControls" class="morph-slider-controls">
      <button
        type="button"
        class="morph-slider-btn"
        aria-label="Previous slide"
        @click="handlePrev"
      >
        <Icon name="lucide:chevron-left" class="size-4.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="morph-slider-btn"
        aria-label="Next slide"
        @click="handleNext"
      >
        <Icon name="lucide:chevron-right" class="size-4.5" aria-hidden="true" />
      </button>
    </div>

    <div
      v-if="showIndicators"
      class="morph-slider-indicators"
      role="tablist"
      aria-label="Slides"
    >
      <button
        v-for="(_item, i) in items"
        :key="i"
        type="button"
        role="tab"
        :aria-selected="i === index"
        :aria-label="`Go to slide ${i + 1}`"
        :class="['morph-slider-dot', { 'is-active': i === index }]"
        @click="goToSlide(i)"
      />
    </div>
  </div>
</template>

<style scoped>
  .morph-slider {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #0c0c0e;
    user-select: none;
    -webkit-user-select: none;
    touch-action: pan-y;
  }

  .morph-slider-stage {
    position: absolute;
    inset: 0;
    cursor: grab;
    outline: none;
  }

  .morph-slider-stage:active {
    cursor: grabbing;
  }

  .morph-slider-stage:focus-visible {
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.7);
  }

  .morph-slider-caption {
    position: absolute;
    left: 22px;
    bottom: 22px;
    z-index: 2;
    max-width: 70%;
    pointer-events: none;
    display: grid;
  }

  .morph-slider-caption-text {
    grid-area: 1 / 1;
    justify-self: start;
    display: inline-block;
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: #fff;
    background: rgba(10, 10, 12, 0.42);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    opacity: 0;
    transform: translateY(12px);
    filter: blur(6px);
    transition:
      opacity var(--ms-swap) cubic-bezier(0.16, 1, 0.3, 1),
      transform var(--ms-swap) cubic-bezier(0.16, 1, 0.3, 1),
      filter var(--ms-swap) cubic-bezier(0.16, 1, 0.3, 1);
  }

  .morph-slider-caption-text.is-active {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }

  .morph-slider-controls {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    z-index: 3;
    display: flex;
    justify-content: space-between;
    padding: 0 16px;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .morph-slider-btn {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 50%;
    color: #fff;
    background: rgba(12, 12, 14, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    cursor: pointer;
    transition:
      transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
      background 0.25s ease,
      border-color 0.25s ease;
  }

  .morph-slider-btn:hover {
    background: rgba(24, 24, 28, 0.6);
    border-color: rgba(255, 255, 255, 0.5);
    transform: scale(1.06);
  }

  .morph-slider-btn:active {
    transform: scale(0.96);
  }

  .morph-slider-btn:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
  }

  .morph-slider-indicators {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 18px;
    z-index: 3;
    display: flex;
    gap: 8px;
    justify-content: center;
    align-items: center;
  }

  .morph-slider-dot {
    width: 8px;
    height: 8px;
    padding: 0;
    border: none;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.35);
    cursor: pointer;
    transition:
      width var(--ms-dot) cubic-bezier(0.16, 1, 0.3, 1),
      background var(--ms-dot) ease;
  }

  .morph-slider-dot.is-active {
    width: 22px;
    background: rgba(255, 255, 255, 0.95);
  }

  .morph-slider-dot:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
  }

  @media (max-width: 420px) {
    .morph-slider-btn {
      width: 34px;
      height: 34px;
    }

    .morph-slider-caption-text {
      font-size: 13px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .morph-slider-caption-text,
    .morph-slider-btn,
    .morph-slider-dot {
      animation: none;
      transition: none;
    }
  }
</style>
