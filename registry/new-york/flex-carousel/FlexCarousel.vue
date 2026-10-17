<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import FlexCarouselDigits from './FlexCarouselDigits.vue';
  import { BEND_PRESETS, DEFAULT_ITEMS } from './config';
  import { createFlexCarousel } from './create-flex-carousel';
  import type {
    FlexCarouselEngine,
    FlexCarouselItem,
    FlexCarouselProps,
    FlexCarouselSettings,
  } from './types';

  const props = withDefaults(defineProps<FlexCarouselProps>(), {
    items: () => DEFAULT_ITEMS,
    preset: 'liquid',
    intro: 'rise',
    cardHeight: 0.5,
    gap: 12,
    radius: 0,
    fit: 'natural',
    lensWidth: undefined,
    lensHeight: undefined,
    tilt: undefined,
    roundness: undefined,
    bend: undefined,
    reach: undefined,
    curl: undefined,
    dispersion: undefined,
    liquid: undefined,
    followCursor: undefined,
    squeeze: 0.2,
    focusOnClick: true,
    autoplay: false,
    interval: 4,
    captions: true,
    captureWheel: true,
    class: '',
  });

  const emit = defineEmits<{
    change: [index: number, item: FlexCarouselItem];
    select: [index: number, item: FlexCarouselItem];
  }>();

  const containerRef = ref<HTMLDivElement | null>(null);
  const stageRef = ref<HTMLDivElement | null>(null);
  const active = ref(0);
  const revealed = ref(false);
  const focusOpen = ref(false);

  const list = computed(() =>
    props.items.length ? props.items : DEFAULT_ITEMS,
  );
  const itemsKey = computed(() => list.value.map((item) => item.src).join('|'));

  const settings = computed<FlexCarouselSettings>(() => {
    const base = BEND_PRESETS[props.preset] ?? BEND_PRESETS.liquid;
    return {
      intro: props.intro,
      cardHeight: props.cardHeight,
      gap: props.gap,
      radius: props.radius,
      fit: props.fit,
      lensWidth: props.lensWidth ?? base.lensWidth,
      lensHeight: props.lensHeight ?? base.lensHeight,
      tilt: props.tilt ?? base.tilt,
      roundness: props.roundness ?? base.roundness,
      bend: props.bend ?? base.bend,
      reach: props.reach ?? base.reach,
      curl: props.curl ?? base.curl,
      dispersion: props.dispersion ?? base.dispersion,
      liquid: props.liquid ?? base.liquid,
      followCursor: props.followCursor ?? base.followCursor,
      squeeze: props.squeeze,
      focusOnClick: props.focusOnClick,
      autoplay: props.autoplay,
      interval: props.interval,
      captureWheel: props.captureWheel,
    };
  });

  const current = computed(() => list.value[active.value] ?? list.value[0]);
  const label = computed(() =>
    current.value
      ? current.value.title || current.value.alt || `Image ${active.value + 1}`
      : '',
  );
  const half = computed(
    () => `${Math.min(Math.max(props.cardHeight, 0.05), 1) * 50}%`,
  );
  const total = computed(() => String(list.value.length).padStart(2, '0'));

  let engine: FlexCarouselEngine | null = null;

  onMounted(() => {
    if (!containerRef.value || !stageRef.value) return;
    engine = createFlexCarousel(containerRef.value, stageRef.value, {
      getSettings: () => settings.value,
      getItems: () => list.value,
      onActive: (index) => {
        active.value = index;
        const item = list.value[index];
        if (item) emit('change', index, item);
      },
      onReveal: () => {
        revealed.value = true;
      },
      onFocusOpen: (open) => {
        focusOpen.value = open;
      },
      onSelect: (index) => {
        const item = list.value[index];
        if (item) emit('select', index, item);
      },
    });
  });

  watch(settings, () => engine?.wake());
  watch(itemsKey, () => engine?.setItems(list.value));

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });
</script>

<template>
  <div
    ref="containerRef"
    :class="['flex-carousel text-foreground', props.class]"
    :style="{ '--flex-carousel-half': half }"
    role="region"
    aria-roledescription="carousel"
    aria-label="Image carousel"
    tabindex="0"
  >
    <div ref="stageRef" class="flex-carousel__stage" />
    <div
      v-if="captions && current && revealed"
      class="flex-carousel__caption"
      aria-hidden="true"
    >
      <span :key="active" class="flex-carousel__title">
        {{ current.title || current.alt }}
        <span v-if="current.subtitle" class="flex-carousel__subtitle">
          {{ current.subtitle }}
        </span>
      </span>
      <span
        class="flex-carousel__count"
        :data-hidden="focusOpen ? '' : undefined"
      >
        <FlexCarouselDigits :value="active + 1" />
        <span class="flex-carousel__slash">/</span>
        <span>{{ total }}</span>
      </span>
    </div>
    <div class="flex-carousel__live" aria-live="polite" aria-atomic="true">
      {{ `${label}, ${active + 1} of ${list.length}` }}
    </div>
  </div>
</template>

<style scoped>
  .flex-carousel {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    cursor: grab;
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    overscroll-behavior: contain;
    outline: none;
  }

  .flex-carousel[data-hover='open'] {
    cursor: zoom-in;
  }

  .flex-carousel[data-hover='close'] {
    cursor: zoom-out;
  }

  .flex-carousel[data-dragging] {
    cursor: grabbing;
  }

  .flex-carousel:focus-visible {
    box-shadow: inset 0 0 0 2px rgba(128, 128, 140, 0.55);
  }

  .flex-carousel__stage {
    position: absolute;
    inset: 0;
  }

  .flex-carousel__caption {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(
      50% + var(--flex-carousel-half) * var(--flex-carousel-lift, 1) + 22px
    );
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 0 16px;
    pointer-events: none;
    text-align: center;
    animation: flex-carousel-reveal 900ms ease both;
  }

  .flex-carousel__title {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 100%;
    font-size: 15px;
    font-weight: 500;
    line-height: 1.35;
    animation: flex-carousel-title 520ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .flex-carousel__subtitle {
    font-weight: 400;
    opacity: 0.6;
  }

  .flex-carousel__count {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    opacity: 0.5;
    transition: opacity 400ms ease;
  }

  .flex-carousel__count[data-hidden] {
    opacity: 0;
  }

  .flex-carousel__slash {
    opacity: 0.6;
  }

  .flex-carousel__live {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @keyframes flex-carousel-title {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes flex-carousel-reveal {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .flex-carousel__caption,
    .flex-carousel__title {
      animation: none;
    }
  }
</style>
