<script setup lang="ts">
  import {
    computed,
    onMounted,
    onUpdated,
    ref,
    useSlots,
    useTemplateRef,
    watch,
  } from 'vue';
  import type { CSSProperties } from 'vue';
  import { useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    CAROUSEL_DEFAULT_ITEMS,
    CAROUSEL_EFFECTS,
    CAROUSEL_THEMES,
    clamp,
    edgeMask,
    pose,
  } from './carousel-math';
  import { useCarouselEngine } from './use-carousel-engine';
  import CarouselControls from './CarouselControls.vue';
  import type {
    CarouselCard,
    CarouselControlsProps,
    CarouselEffect,
    CarouselEntry,
    CarouselProps,
    CarouselSettings,
  } from './types';

  const props = withDefaults(defineProps<CarouselProps>(), {
    items: () => CAROUSEL_DEFAULT_ITEMS,
    baseWidth: 300,
    aspectRatio: 1.25,
    peek: 0,
    gap: 16,
    radius: 12,
    frame: true,
    effect: 'tilt',
    indicator: 'dots',
    arrows: false,
    autoplay: false,
    autoplayDelay: 3000,
    pauseOnHover: false,
    loop: false,
    draggable: true,
    round: false,
    initialIndex: 0,
    theme: 'dark',
    class: '',
  });

  const emit = defineEmits<{ change: [index: number] }>();

  defineSlots<{
    item?: (props: {
      item: CarouselEntry;
      index: number;
      active: boolean;
    }) => unknown;
  }>();

  const slots = useSlots();

  const rootRef = useTemplateRef<HTMLElement>('rootEl');
  const stageRef = useTemplateRef<HTMLElement>('stageEl');
  const viewportRef = useTemplateRef<HTMLElement>('viewportEl');
  const slideEls: Array<HTMLElement | null> = [];
  const shadeEls: Array<HTMLElement | null> = [];
  const fillEls: Array<HTMLElement | null> = [];

  const count = computed(() => props.items.length);
  const mode = computed<CarouselEffect>(() =>
    CAROUSEL_EFFECTS.includes(props.effect) ? props.effect : 'tilt',
  );
  const stacked = computed(
    () => mode.value === 'fade' || mode.value === 'cube',
  );
  const ratio = computed(() => clamp(props.aspectRatio, 0.3, 4));
  const maxWidth = computed<number | string>(() =>
    typeof props.baseWidth === 'number' && props.round && props.frame
      ? 20 + (props.baseWidth - 20) * Math.min(1, 1 / ratio.value)
      : props.baseWidth,
  );

  const width = ref(
    typeof maxWidth.value === 'number'
      ? maxWidth.value - (props.frame ? 20 : 0)
      : 300,
  );
  const active = ref(
    clamp(Math.round(props.initialIndex), 0, Math.max(0, count.value - 1)),
  );

  const side = computed(() =>
    stacked.value || (props.round && props.frame)
      ? 0
      : clamp(props.peek, 0, width.value * 0.2),
  );
  const slot = computed(() => Math.max(40, width.value - side.value * 2));
  const diameter = computed(() =>
    props.frame ? slot.value : Math.min(slot.value, slot.value / ratio.value),
  );
  const cardWidth = computed(() => (props.round ? diameter.value : slot.value));
  const cardHeight = computed(() =>
    props.round ? diameter.value : slot.value / ratio.value,
  );
  const clipped = computed(() => !props.frame && !stacked.value);
  const bleed = computed(() =>
    clipped.value ? Math.round(Math.min(48, cardWidth.value * 0.12)) : 0,
  );
  const inset = computed(
    () => bleed.value + (width.value - cardWidth.value) / 2,
  );

  const settings = computed<CarouselSettings>(() => ({
    count: count.value,
    mode: mode.value,
    width: width.value,
    bleed: bleed.value,
    inset: inset.value,
    cardWidth: cardWidth.value,
    span: cardWidth.value + Math.max(0, props.gap),
    loop: props.loop && count.value > 1,
    autoplay: props.autoplay && count.value > 1,
    autoplayDelay: Math.max(600, props.autoplayDelay),
    pauseOnHover: props.pauseOnHover,
    draggable: props.draggable && count.value > 1,
    bars: props.indicator === 'bars',
    shade: props.theme === 'light' ? 0.3 : 0.6,
  }));

  const engine = useCarouselEngine({
    root: rootRef,
    viewport: viewportRef,
    settings,
    slides: slideEls,
    shades: shadeEls,
    fills: fillEls,
    active,
  });

  useResizeObserver(stageRef, (entries) => {
    const box = entries[entries.length - 1]?.contentRect;
    if (box) width.value = Math.max(1, Math.round(box.width));
  });

  onMounted(() => engine.sync());
  onUpdated(() => engine.sync());

  watch(active, (current) => emit('change', current));

  const cards = computed<CarouselCard[]>(() =>
    props.items.map((item, index) =>
      typeof item === 'string'
        ? { image: item, key: index }
        : { ...item, key: item.id ?? index },
    ),
  );

  const compact = computed(() => props.round && cardWidth.value < 240);
  const hasControls = computed(
    () => count.value > 1 && (props.indicator !== 'none' || props.arrows),
  );
  const inside = computed(() => props.frame && !props.round);
  const atStart = computed(() => !settings.value.loop && active.value === 0);
  const atEnd = computed(
    () => !settings.value.loop && active.value === count.value - 1,
  );

  const rootStyle = computed<CSSProperties>(() => ({
    ...CAROUSEL_THEMES[props.theme],
    '--carousel-radius': `${props.round ? 9999 : Math.max(0, props.radius)}px`,
    '--carousel-scale': String(clamp(cardWidth.value / 300, 0.86, 1)),
    width: typeof maxWidth.value === 'number' ? '100%' : String(maxWidth.value),
    maxWidth:
      typeof maxWidth.value === 'number' ? `${maxWidth.value}px` : undefined,
  }));

  const viewportStyle = computed<CSSProperties>(() => {
    const mask = clipped.value ? edgeMask(inset.value) : undefined;
    return {
      height: `${cardHeight.value}px`,
      marginInline: bleed.value ? `${-bleed.value}px` : undefined,
      perspective:
        mode.value === 'cube'
          ? `${Math.round(cardWidth.value * 2.6)}px`
          : mode.value === 'tilt'
            ? '1000px'
            : undefined,
      overflowX: clipped.value ? 'clip' : 'visible',
      maskImage: mask,
      WebkitMaskImage: mask,
    };
  });

  const slideStyles = computed<CSSProperties[]>(() =>
    cards.value.map((_, index) => {
      const initial = pose(index, active.value, settings.value);
      return {
        left: `${inset.value}px`,
        width: `${cardWidth.value}px`,
        height: `${cardHeight.value}px`,
        transform: initial.transform,
        opacity: initial.opacity,
        visibility: initial.visible ? 'visible' : 'hidden',
        zIndex: initial.layer,
        '--carousel-focus': String(initial.focus),
      };
    }),
  );

  function shadeOpacity(index: number): number {
    return pose(index, active.value, settings.value).shade;
  }

  const controlProps = computed<CarouselControlsProps>(() => ({
    count: count.value,
    active: active.value,
    indicator: props.indicator,
    arrows: props.arrows,
    autoplay: settings.value.autoplay,
    loop: settings.value.loop,
    atStart: atStart.value,
    atEnd: atEnd.value,
    width: cardWidth.value,
    bindFill,
  }));

  function asElement(el: unknown): HTMLElement | null {
    return el instanceof HTMLElement ? el : null;
  }

  function bindSlide(el: unknown, index: number): void {
    slideEls[index] = asElement(el);
  }

  function bindShade(el: unknown, index: number): void {
    shadeEls[index] = asElement(el);
  }

  function bindFill(el: unknown, index: number): void {
    fillEls[index] = asElement(el);
  }

  function onSlideClick(index: number): void {
    if (index !== active.value) engine.goTo(index);
  }

  function goTo(index: number): void {
    engine.goTo(index);
  }

  function prev(): void {
    engine.step(-1);
  }

  function next(): void {
    engine.step(1);
  }
</script>

<template>
  <div
    ref="rootEl"
    :class="
      cn(
        'carousel-container',
        frame && 'has-frame',
        round && 'is-round',
        props.class,
      )
    "
    :style="rootStyle"
    role="region"
    aria-roledescription="carousel"
    aria-label="Carousel"
    tabindex="0"
  >
    <div ref="stageEl" class="carousel-stage">
      <div
        ref="viewportEl"
        class="carousel-viewport"
        :data-draggable="settings.draggable ? 'true' : undefined"
        :aria-live="settings.autoplay ? 'off' : 'polite'"
        :style="viewportStyle"
      >
        <div
          v-for="(card, index) in cards"
          :key="card.key"
          :ref="(el) => bindSlide(el, index)"
          class="carousel-slide"
          :style="slideStyles[index]"
          :data-current="index === active ? 'true' : undefined"
          role="group"
          aria-roledescription="slide"
          :aria-label="`${index + 1} of ${count}`"
          @click="onSlideClick(index)"
        >
          <div
            v-if="slots.item"
            :class="['carousel-card', 'is-custom', round && 'is-round']"
          >
            <slot
              name="item"
              :item="items[index]!"
              :index="index"
              :active="index === active"
            />
            <span class="carousel-card-rim" />
          </div>
          <div
            v-else
            :class="[
              'carousel-card',
              card.image && 'has-image',
              round && 'is-round',
            ]"
          >
            <img
              v-if="card.image"
              class="carousel-image"
              :src="card.image"
              :alt="card.alt ?? ''"
              draggable="false"
              decoding="async"
            />
            <span
              v-if="card.image && (card.title || card.description)"
              class="carousel-scrim"
            />
            <span v-if="card.icon" class="carousel-icon">
              <Icon :name="card.icon" class="size-4" />
            </span>
            <div v-if="card.title || card.description" class="carousel-text">
              <div v-if="card.title" class="carousel-title">
                {{ card.title }}
              </div>
              <p
                v-if="card.description && !compact"
                class="carousel-description"
              >
                {{ card.description }}
              </p>
            </div>
            <span class="carousel-card-rim" />
          </div>
          <span
            v-if="mode === 'cube'"
            :ref="(el) => bindShade(el, index)"
            class="carousel-shade"
            :style="{ opacity: shadeOpacity(index) }"
          />
        </div>
      </div>

      <CarouselControls
        v-if="inside && hasControls"
        v-bind="controlProps"
        @prev="prev"
        @next="next"
        @go="goTo"
      />
      <span v-if="frame" class="carousel-frame-rim" />
    </div>

    <CarouselControls
      v-if="!inside && hasControls"
      v-bind="controlProps"
      @prev="prev"
      @next="next"
      @go="goTo"
    />
  </div>
</template>

<style scoped>
  .carousel-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    max-width: 100%;
    box-sizing: border-box;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }

  .carousel-container.has-frame {
    gap: 16px;
  }

  .carousel-stage {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    align-self: stretch;
    gap: 12px;
    box-sizing: border-box;
    border-radius: var(--carousel-radius);
  }

  .carousel-container:focus-visible .carousel-stage {
    outline: 2px solid var(--carousel-ink);
    outline-offset: 4px;
  }

  .carousel-container.has-frame .carousel-stage {
    padding: 10px;
    border-radius: calc(var(--carousel-radius) + 10px);
    background: var(--carousel-frame);
    box-shadow: var(--carousel-frame-shadow);
    overflow: hidden;
    -webkit-backdrop-filter: blur(20px) saturate(1.6);
    backdrop-filter: blur(20px) saturate(1.6);
  }

  .carousel-container.has-frame.is-round .carousel-stage {
    border-radius: 50%;
  }

  .carousel-frame-rim {
    position: absolute;
    inset: 0;
    z-index: 30;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px var(--carousel-frame-edge),
      inset 0 1px 0 var(--carousel-frame-highlight);
    pointer-events: none;
  }

  .carousel-viewport {
    position: relative;
    align-self: stretch;
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
  }

  .carousel-viewport[data-draggable='true'] {
    cursor: grab;
  }

  .carousel-viewport[data-dragging='true'] {
    cursor: grabbing;
  }

  .carousel-slide {
    position: absolute;
    top: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    will-change: transform, opacity;
  }

  .carousel-slide:not([data-current]) {
    cursor: pointer;
  }

  .carousel-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
    height: 100%;
    padding: calc(20px * var(--carousel-scale, 1));
    box-sizing: border-box;
    border-radius: var(--carousel-radius);
    background: var(--carousel-tile);
    box-shadow: var(--carousel-tile-shadow);
    color: var(--carousel-ink);
    overflow: hidden;
    transition: filter 0.25s ease;
  }

  .carousel-card-rim {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px var(--carousel-tile-edge),
      inset 0 1px 0 var(--carousel-tile-highlight);
    pointer-events: none;
  }

  .carousel-card.is-custom {
    display: block;
    padding: 0;
  }

  .carousel-card.is-round {
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 14%;
    text-align: center;
  }

  .carousel-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
  }

  .carousel-scrim {
    position: absolute;
    inset: 0;
    opacity: var(--carousel-focus, 1);
    pointer-events: none;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.62) 0%,
      rgba(0, 0, 0, 0.6) 8%,
      rgba(0, 0, 0, 0.54) 17%,
      rgba(0, 0, 0, 0.45) 26%,
      rgba(0, 0, 0, 0.34) 36%,
      rgba(0, 0, 0, 0.22) 46%,
      rgba(0, 0, 0, 0.11) 56%,
      rgba(0, 0, 0, 0.04) 64%,
      rgba(0, 0, 0, 0) 72%
    );
  }

  .carousel-card.is-round .carousel-scrim {
    background: rgba(0, 0, 0, 0.3);
  }

  .carousel-icon {
    position: relative;
    display: grid;
    place-items: center;
    flex: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--carousel-badge);
    color: var(--carousel-ink);
  }

  .carousel-card.has-image .carousel-icon {
    background: rgba(255, 255, 255, 0.18);
    color: #ffffff;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .carousel-text {
    position: relative;
    margin-top: auto;
    opacity: var(--carousel-focus, 1);
  }

  .carousel-card.is-round .carousel-text {
    margin-top: 0;
  }

  .carousel-title {
    font-size: calc(18px * var(--carousel-scale, 1));
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: -0.01em;
  }

  .carousel-description {
    margin: 4px 0 0;
    font-size: calc(14px * var(--carousel-scale, 1));
    line-height: 1.45;
    color: var(--carousel-muted);
  }

  .carousel-card.has-image .carousel-title {
    color: #ffffff;
  }

  .carousel-card.has-image .carousel-description {
    color: rgba(255, 255, 255, 0.78);
  }

  .carousel-shade {
    position: absolute;
    inset: 0;
    border-radius: var(--carousel-radius);
    background: #000000;
    pointer-events: none;
  }

  @media (hover: hover) {
    .carousel-slide:hover .carousel-card {
      filter: var(--carousel-hover);
    }
  }
</style>
