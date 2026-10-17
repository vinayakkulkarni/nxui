<script setup lang="ts">
  import {
    Comment,
    Fragment,
    computed,
    isVNode,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    ref,
    shallowRef,
    useSlots,
    watch,
  } from 'vue';
  import type { VNode } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import CardSwapCard from './CardSwapCard.vue';
  import {
    CARD_SWAP_DEFAULT_ITEMS,
    CARD_SWAP_THEMES,
  } from './card-swap-presets';
  import { clamp, createCardSwapEngine, stackBounds } from './card-swap-engine';
  import type {
    CardSwapEngine,
    CardSwapEntry,
    CardSwapProps,
    CardSwapSettings,
  } from './types';

  const props = withDefaults(defineProps<CardSwapProps>(), {
    items: () => CARD_SWAP_DEFAULT_ITEMS,
    width: 460,
    height: 340,
    cardDistance: 60,
    verticalDistance: 70,
    depth: 90,
    skewAmount: 6,
    visibleCards: 4,
    delay: 4000,
    autoplay: true,
    pauseOnHover: true,
    draggable: true,
    speed: 1,
    bounce: 0.35,
    parallax: 0.5,
    hoverSpread: 0.12,
    dim: 0.5,
    cardRadius: 18,
    intro: true,
    theme: 'dark',
    class: '',
  });

  const emit = defineEmits<{
    change: [index: number];
    'card-click': [index: number];
  }>();

  const slots = useSlots();
  const rootRef = ref<HTMLDivElement>();
  const stageRef = ref<HTMLDivElement>();
  const engine = shallowRef<CardSwapEngine | null>(null);
  const renderedCount = ref(0);
  const motionPreference = usePreferredReducedMotion();
  const visibility = useDocumentVisibility();

  function flatten(nodes: VNode[]): VNode[] {
    return nodes.flatMap((node) => {
      if (node.type === Fragment && Array.isArray(node.children)) {
        return flatten(node.children.filter(isVNode));
      }
      return node.type === Comment ? [] : [node];
    });
  }

  function cardList(): CardSwapEntry[] {
    const custom = slots.default ? flatten(slots.default()) : [];
    if (custom.length) return custom.map((node) => ({ node }));
    const list = props.items.length ? props.items : CARD_SWAP_DEFAULT_ITEMS;
    return list.map((item) => ({ item }));
  }

  const count = computed(() =>
    slots.default ? renderedCount.value : props.items.length || 4,
  );
  const cardWidth = computed(() => Math.max(40, Number(props.width) || 460));
  const cardHeight = computed(() => Math.max(40, Number(props.height) || 340));
  const visible = computed(() =>
    clamp(Math.round(props.visibleCards), 1, Math.max(1, count.value)),
  );

  const bounds = computed(() =>
    stackBounds({
      width: cardWidth.value,
      height: cardHeight.value,
      cardDistance: props.cardDistance,
      verticalDistance: props.verticalDistance,
      depth: Math.max(0, props.depth),
      skewAmount: props.skewAmount,
      visible: visible.value,
      hoverSpread: props.hoverSpread,
    }),
  );

  const settings = computed<CardSwapSettings>(() => ({
    width: cardWidth.value,
    height: cardHeight.value,
    dx: props.cardDistance,
    dy: props.verticalDistance,
    dz: Math.max(0, props.depth),
    skew: props.skewAmount,
    visible: visible.value,
    delay: props.delay,
    autoplay: props.autoplay,
    pauseOnHover: props.pauseOnHover,
    draggable: props.draggable,
    speed: clamp(props.speed, 0.1, 4),
    bounce: clamp(props.bounce, 0, 1),
    parallax: clamp(props.parallax, 0, 1),
    hoverSpread: Math.max(0, props.hoverSpread),
    dim: clamp(props.dim, 0, 1),
    bounds: bounds.value,
  }));

  const rootStyle = computed(() => ({
    ...CARD_SWAP_THEMES[props.theme],
    '--swap-w': `${cardWidth.value}px`,
    '--swap-h': `${cardHeight.value}px`,
    '--swap-ox': `${bounds.value.originX}px`,
    '--swap-oy': `${bounds.value.originY}px`,
    '--swap-stage-w': `${bounds.value.width}px`,
    '--swap-stage-h': `${bounds.value.height}px`,
    '--swap-ratio': `${bounds.value.width} / ${bounds.value.height}`,
    '--swap-radius': `${Math.max(0, props.cardRadius)}px`,
  }));

  function slotEl(index: number): HTMLElement | null {
    return (
      stageRef.value?.querySelector<HTMLElement>(
        `:scope > [data-swap-index="${index}"]`,
      ) ?? null
    );
  }

  function shadeEl(index: number): HTMLElement | null {
    return (
      slotEl(index)?.querySelector<HTMLElement>(':scope > .card-swap-shade') ??
      null
    );
  }

  function domCount(): number {
    return (
      stageRef.value?.querySelectorAll(':scope > [data-swap-index]').length ?? 0
    );
  }

  let engineCount = -1;

  function build() {
    const root = rootRef.value;
    const stage = stageRef.value;
    engine.value?.destroy();
    engine.value = null;
    engineCount = domCount();
    renderedCount.value = engineCount;
    if (!root || !stage || !engineCount) return;
    engine.value = createCardSwapEngine({
      root,
      stage,
      count: engineCount,
      intro: props.intro,
      reduce: motionPreference.value === 'reduce',
      getSlot: slotEl,
      getShade: shadeEl,
      getSettings: () => settings.value,
      onChange: handleChange,
      onCardClick: handleCardClick,
    });
  }

  function handleChange(index: number) {
    emit('change', index);
  }

  function handleCardClick(index: number) {
    emit('card-click', index);
  }

  function sync() {
    if (domCount() !== engineCount) build();
    else engine.value?.refresh();
  }

  onMounted(build);
  onUpdated(sync);
  onBeforeUnmount(() => {
    engine.value?.destroy();
    engine.value = null;
  });

  watch(settings, () => engine.value?.refresh(), { flush: 'post' });
  watch(visibility, () => engine.value?.onVisibility());

  useResizeObserver(rootRef, () => engine.value?.fit());
  useIntersectionObserver(rootRef, (entries) => {
    engine.value?.setInView(
      entries[entries.length - 1]?.isIntersecting ?? true,
    );
  });
  useEventListener(rootRef, 'pointermove', (event: PointerEvent) =>
    engine.value?.onMove(event),
  );
  useEventListener(rootRef, 'pointerleave', (event: PointerEvent) =>
    engine.value?.onLeave(event),
  );
  useEventListener(rootRef, 'pointerdown', (event: PointerEvent) =>
    engine.value?.onDown(event),
  );
  useEventListener(rootRef, 'pointerup', (event: PointerEvent) =>
    engine.value?.onUp(event),
  );
  useEventListener(rootRef, 'pointercancel', (event: PointerEvent) =>
    engine.value?.onUp(event),
  );
  useEventListener(rootRef, 'click', (event: MouseEvent) =>
    engine.value?.onClick(event),
  );

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      engine.value?.next();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      engine.value?.prev();
    }
  }

  defineExpose({
    next: () => engine.value?.next(),
    prev: () => engine.value?.prev(),
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('card-swap', props.class)"
    :style="rootStyle"
    tabindex="0"
    role="region"
    aria-roledescription="carousel"
    aria-label="Card stack"
    @keydown="onKeyDown"
  >
    <div class="card-swap-sizer" aria-hidden="true">
      <span />
    </div>
    <div ref="stageRef" class="card-swap-stage">
      <div
        v-for="(card, index) in cardList()"
        :key="index"
        class="card-swap-slot"
        :data-swap-index="index"
      >
        <component :is="card.node" v-if="card.node" />
        <CardSwapCard v-else-if="card.item">
          <div class="card-swap-item">
            <div
              v-if="card.item.icon || card.item.title"
              class="card-swap-head"
            >
              <span v-if="card.item.icon" class="card-swap-icon">
                <Icon :name="card.item.icon" class="size-3.5" />
              </span>
              <span v-if="card.item.title" class="card-swap-title">
                {{ card.item.title }}
              </span>
            </div>
            <div v-if="card.item.image" class="card-swap-media">
              <img
                :src="card.item.image"
                :alt="card.item.alt ?? card.item.title ?? ''"
                draggable="false"
              />
            </div>
          </div>
        </CardSwapCard>
        <span class="card-swap-shade" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .card-swap {
    position: relative;
    width: 100%;
    height: 100%;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }

  .card-swap-sizer {
    max-height: 100%;
    overflow: hidden;
    pointer-events: none;
  }

  .card-swap-sizer > span {
    display: block;
    width: 100%;
    max-width: var(--swap-stage-w);
    aspect-ratio: var(--swap-ratio);
  }

  .card-swap-stage {
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--swap-stage-w);
    height: var(--swap-stage-h);
    perspective: 900px;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .card-swap-slot {
    position: absolute;
    top: var(--swap-oy);
    left: var(--swap-ox);
    width: var(--swap-w);
    height: var(--swap-h);
    margin: calc(var(--swap-h) / -2) 0 0 calc(var(--swap-w) / -2);
    border-radius: var(--swap-radius);
    overflow: hidden;
    isolation: isolate;
    box-shadow: var(--swap-shadow);
    pointer-events: auto;
    user-select: none;
    -webkit-user-select: none;
    touch-action: pan-y;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  .card-swap:focus-visible .card-swap-slot[data-front] {
    outline: 2px solid var(--swap-ink);
    outline-offset: 3px;
  }

  .card-swap-shade {
    position: absolute;
    inset: 0;
    z-index: 3;
    border-radius: inherit;
    background: var(--swap-shade);
    opacity: 0;
    pointer-events: none;
  }

  .card-swap-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 100%;
    padding: 6px;
    box-sizing: border-box;
  }

  .card-swap-head {
    display: flex;
    flex: none;
    align-items: center;
    gap: 10px;
    min-width: 0;
    height: 30px;
    padding: 0 6px;
  }

  .card-swap-icon {
    display: grid;
    flex: none;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--swap-badge);
  }

  .card-swap-title {
    overflow: hidden;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
    letter-spacing: -0.01em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-swap-media {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    border-radius: max(0px, calc(var(--swap-radius) - 6px));
    background: var(--swap-badge);
  }

  .card-swap-media img {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    user-select: none;
    -webkit-user-drag: none;
  }

  .card-swap-media::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 1px var(--swap-media-edge);
    pointer-events: none;
  }
</style>
