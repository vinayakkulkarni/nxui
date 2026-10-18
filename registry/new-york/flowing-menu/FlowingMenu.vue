<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import { usePreferredReducedMotion, useResizeObserver } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import { clamp, createFlowingMenuEngine } from './flowing-menu-engine';
  import type {
    FlowingMenuEmits,
    FlowingMenuEngine,
    FlowingMenuItem,
    FlowingMenuProps,
    FlowingMenuSettings,
  } from './types';

  const props = withDefaults(defineProps<FlowingMenuProps>(), {
    items: () => [],
    speed: 60,
    direction: 'left',
    followCursor: 0.4,
    duration: 0.5,
    stretch: 0.6,
    magnet: 0.25,
    bandInset: 0,
    bandRadius: 0,
    carryContent: false,
    textColor: '#ffffff',
    bgColor: '#120F17',
    marqueeBgColor: '#ffffff',
    marqueeTextColor: '#120F17',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    dividers: true,
    dimInactive: false,
    align: 'center',
    showIndex: false,
    showArrow: false,
    imageShape: 'pill',
    intro: true,
    activeIndex: undefined,
    ariaLabel: 'Menu',
    class: '',
  });

  const emit = defineEmits<FlowingMenuEmits>();

  const rootRef = ref<HTMLElement>();
  const listRef = ref<HTMLUListElement>();
  const floatRef = ref<HTMLDivElement>();
  const copies = ref<number[]>([]);
  const slots = ref<[number, number]>([-1, -1]);
  const observed = shallowRef<HTMLElement[]>([]);
  const reducedMotion = usePreferredReducedMotion();
  let engine: FlowingMenuEngine | null = null;

  const settings = computed<FlowingMenuSettings>(() => ({
    speed: Math.max(0, props.speed),
    direction: ['left', 'right', 'alternate'].includes(props.direction)
      ? props.direction
      : 'left',
    followCursor: clamp(props.followCursor, 0, 1),
    duration: Math.max(0.1, props.duration),
    stretch: clamp(props.stretch, 0, 1),
    magnet: clamp(props.magnet, 0, 1),
    bandInset: Math.max(0, props.bandInset),
    bandRadius: Math.max(0, props.bandRadius),
    carryContent: props.carryContent,
    dimInactive: props.dimInactive,
    reduce: reducedMotion.value === 'reduce',
  }));

  const shape = computed(() =>
    ['pill', 'rounded', 'circle'].includes(props.imageShape)
      ? props.imageShape
      : 'pill',
  );
  const rootStyle = computed(() => ({
    backgroundColor: props.bgColor,
    color: props.textColor,
    '--flowing-menu-border': props.borderColor,
  }));
  const bandStyle = computed(() => ({
    backgroundColor: props.marqueeBgColor,
    color: props.marqueeTextColor,
  }));
  const floatItems = computed(() =>
    slots.value.map((index) => ({
      item: index >= 0 ? (props.items[index] ?? null) : null,
      copies: copies.value[index] ?? 3,
    })),
  );

  function imageStyle(url: string) {
    return { backgroundImage: `url(${url})` };
  }
  function pad(index: number) {
    return String(index + 1).padStart(2, '0');
  }

  function sync() {
    if (!engine) return;
    const targets = engine.collect();
    const current = observed.value;
    const same =
      targets.length === current.length &&
      targets.every((node, index) => node === current[index]);
    if (!same) observed.value = targets;
  }

  function onPointerMove(event: PointerEvent) {
    engine?.pointerMove(event);
  }
  function onPointerLeave(event: PointerEvent) {
    engine?.pointerLeave(event);
  }
  function onLinkPointerDown(event: PointerEvent, index: number) {
    if (event.pointerType !== 'touch' || !engine) return;
    engine.stopIntro();
    engine.goTo(index, engine.halfOf(event.clientY, index));
  }
  function onLinkFocus(event: FocusEvent, index: number) {
    const target = event.currentTarget;
    if (!(target instanceof Element) || !target.matches(':focus-visible')) {
      return;
    }
    engine?.stopIntro();
    engine?.goTo(index, 'top');
  }
  function onLinkBlur(event: FocusEvent) {
    const next = event.relatedTarget;
    if (next instanceof Node && listRef.value?.contains(next)) return;
    engine?.release('bottom');
  }
  function onLinkClick(
    event: MouseEvent,
    item: FlowingMenuItem,
    index: number,
  ) {
    emit('item-click', item, index, event);
  }

  onMounted(() => {
    engine = createFlowingMenuEngine(
      {
        root: () => rootRef.value,
        list: () => listRef.value,
        float: () => floatRef.value,
      },
      () => settings.value,
      {
        onCopies: (next) => {
          copies.value = next;
        },
        onSlots: (next) => {
          slots.value = next;
        },
      },
    );
    sync();
    engine.measure();
    if (props.intro && !settings.value.reduce) engine.playIntro();
  });

  onUpdated(() => {
    sync();
    engine?.paint();
  });

  useResizeObserver(observed, () => engine?.measure());

  watch([() => props.items, () => props.bandInset], async () => {
    await nextTick();
    sync();
    engine?.measure();
  });
  watch(settings, () => engine?.paint());

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });
</script>

<template>
  <nav
    ref="rootRef"
    :class="cn('flowing-menu', props.class)"
    :style="rootStyle"
    :aria-label="ariaLabel"
    :data-align="align === 'left' ? 'left' : 'center'"
    :data-shape="shape"
  >
    <ul
      ref="listRef"
      class="flowing-menu__list"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
    >
      <li
        v-for="(item, index) in items"
        :key="`${item.text}-${index}`"
        class="flowing-menu__item"
      >
        <span
          v-if="dividers && index > 0"
          class="flowing-menu__divider"
          data-intro-rule=""
          aria-hidden="true"
        />
        <component
          :is="item.link ? 'a' : 'button'"
          class="flowing-menu__link"
          :href="item.link"
          :type="item.link ? undefined : 'button'"
          :aria-current="index === activeIndex ? 'page' : undefined"
          @pointerdown="onLinkPointerDown($event, index)"
          @focus="onLinkFocus($event, index)"
          @blur="onLinkBlur"
          @click="onLinkClick($event, item, index)"
        >
          <span
            class="flowing-menu__index"
            data-intro-fade=""
            aria-hidden="true"
          >
            {{ showIndex ? pad(index) : null }}
          </span>
          <span class="flowing-menu__label">
            <span class="flowing-menu__label-text" data-intro-line="">
              {{ item.text }}
            </span>
            <span
              v-if="index === activeIndex"
              class="flowing-menu__dot"
              aria-hidden="true"
            />
          </span>
          <span class="flowing-menu__end" data-intro-fade="" aria-hidden="true">
            <span v-if="item.meta" class="flowing-menu__meta">
              {{ item.meta }}
            </span>
            <span v-if="showArrow" class="flowing-menu__arrow">
              <Icon name="lucide:arrow-up-right" class="size-5.5" />
            </span>
          </span>
        </component>
        <div class="flowing-menu__band" aria-hidden="true" :style="bandStyle">
          <div class="flowing-menu__track">
            <div
              v-for="copy in copies[index] ?? 3"
              :key="copy"
              class="flowing-menu__part"
            >
              <span class="flowing-menu__part-text">
                {{ item.marquee ?? item.text }}
              </span>
              <span
                v-if="item.image"
                class="flowing-menu__image"
                :style="imageStyle(item.image)"
              />
            </div>
          </div>
        </div>
      </li>
    </ul>
    <div
      v-if="carryContent"
      ref="floatRef"
      class="flowing-menu__float"
      aria-hidden="true"
      :style="bandStyle"
    >
      <div
        v-for="(layer, slot) in floatItems"
        :key="slot"
        class="flowing-menu__float-layer"
      >
        <div class="flowing-menu__track">
          <template v-if="layer.item">
            <div
              v-for="copy in layer.copies"
              :key="copy"
              class="flowing-menu__part"
            >
              <span class="flowing-menu__part-text">
                {{ layer.item.marquee ?? layer.item.text }}
              </span>
              <span
                v-if="layer.item.image"
                class="flowing-menu__image"
                :style="imageStyle(layer.item.image)"
              />
            </div>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
  .flowing-menu {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .flowing-menu__list {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .flowing-menu__item {
    position: relative;
    flex: 1 1 0;
    min-height: 56px;
    overflow: hidden;
    container-type: size;
  }

  .flowing-menu__divider {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 1px;
    background: var(--flowing-menu-border, rgba(255, 255, 255, 0.14));
    transform-origin: left center;
    pointer-events: none;
  }

  .flowing-menu__link {
    position: relative;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 16px;
    width: 100%;
    height: 100%;
    padding: 0 clamp(16px, 4cqw, 40px);
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    text-decoration: none;
    outline: none;
    cursor: pointer;
    transition: opacity 0.45s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .flowing-menu[data-align='left'] .flowing-menu__link {
    grid-template-columns: auto 1fr auto;
  }

  .flowing-menu__item[data-dimmed] .flowing-menu__link {
    opacity: 0.32;
  }

  .flowing-menu__link:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: -4px;
  }

  .flowing-menu__index {
    justify-self: start;
    min-width: 1.6em;
    font-size: clamp(11px, 12cqh, 15px);
    font-variant-numeric: tabular-nums;
    opacity: 0.5;
  }

  .flowing-menu__label {
    display: flex;
    align-items: center;
    gap: 0.28em;
    justify-self: center;
    overflow: hidden;
    padding: 0.06em 0;
    font-size: clamp(16px, 40cqh, 140px);
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -0.035em;
    white-space: nowrap;
  }

  .flowing-menu[data-align='left'] .flowing-menu__label {
    justify-self: start;
  }

  .flowing-menu__label-text {
    display: block;
  }

  .flowing-menu__dot {
    display: block;
    width: 0.2em;
    height: 0.2em;
    flex-shrink: 0;
    border-radius: 999px;
    background: currentColor;
  }

  .flowing-menu__end {
    display: flex;
    align-items: center;
    justify-self: end;
    gap: 14px;
  }

  .flowing-menu__meta {
    font-size: clamp(11px, 12cqh, 15px);
    font-variant-numeric: tabular-nums;
    opacity: 0.5;
  }

  .flowing-menu__arrow {
    display: grid;
    place-items: center;
    opacity: 0.55;
  }

  .flowing-menu__band {
    position: absolute;
    inset: 0;
    z-index: 1;
    overflow: hidden;
    visibility: hidden;
    pointer-events: none;
    clip-path: inset(50% 0 50% 0);
  }

  .flowing-menu__track {
    display: flex;
    align-items: center;
    width: max-content;
    height: 100%;
    will-change: transform;
  }

  .flowing-menu__part {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    height: 100%;
  }

  .flowing-menu__part-text {
    padding: 0 0.4em;
    font-size: clamp(14px, calc(38cqh * var(--flowing-menu-band, 1)), 130px);
    font-weight: 400;
    line-height: 1.1;
    letter-spacing: -0.025em;
    white-space: nowrap;
  }

  .flowing-menu__image {
    display: block;
    flex-shrink: 0;
    height: calc(56cqh * var(--flowing-menu-band, 1));
    aspect-ratio: 2.2 / 1;
    margin: 0 calc(3.5cqh * var(--flowing-menu-band, 1));
    border-radius: 999px;
    background-position: center;
    background-size: cover;
  }

  .flowing-menu[data-shape='rounded'] .flowing-menu__image {
    aspect-ratio: 3 / 2;
    border-radius: calc(10cqh * var(--flowing-menu-band, 1));
  }

  .flowing-menu[data-shape='circle'] .flowing-menu__image {
    aspect-ratio: 1;
    border-radius: 999px;
  }

  .flowing-menu__float {
    position: absolute;
    inset: 0;
    z-index: 1;
    overflow: hidden;
    visibility: hidden;
    pointer-events: none;
    clip-path: inset(50% 0 50% 0);
  }

  .flowing-menu__float-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 25%;
    container-type: size;
    will-change: transform, opacity;
  }
</style>
