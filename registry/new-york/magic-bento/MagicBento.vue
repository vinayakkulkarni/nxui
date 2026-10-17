<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, watch } from 'vue';
  import type { Component, ComponentPublicInstance } from 'vue';
  import { cn } from '~/lib/utils';
  import MagicBentoAnalytics from './MagicBentoAnalytics.vue';
  import MagicBentoAutomation from './MagicBentoAutomation.vue';
  import MagicBentoCollaboration from './MagicBentoCollaboration.vue';
  import MagicBentoDashboard from './MagicBentoDashboard.vue';
  import MagicBentoIntegration from './MagicBentoIntegration.vue';
  import MagicBentoSecurity from './MagicBentoSecurity.vue';
  import {
    MAGIC_BENTO_DEFAULT_ITEMS,
    MAGIC_BENTO_INK,
    MAGIC_BENTO_THEMES,
    clamp,
    inkFor,
    isMagicBentoVisual,
    parseRgb,
  } from './magic-bento-data';
  import { useMagicBentoEngine } from './use-magic-bento-engine';
  import type {
    MagicBentoItem,
    MagicBentoProps,
    MagicBentoSettings,
    MagicBentoVisual,
  } from './types';

  const props = withDefaults(defineProps<MagicBentoProps>(), {
    items: () => MAGIC_BENTO_DEFAULT_ITEMS,
    columns: 4,
    rowHeight: 200,
    gap: 12,
    radius: 20,
    theme: 'dark',
    glowColor: undefined,
    textAutoHide: true,
    enableBorderGlow: true,
    enableSpotlight: true,
    spotlightRadius: 300,
    enableStars: false,
    particleCount: 24,
    enableTilt: false,
    enableMagnetism: false,
    clickEffect: true,
    intro: true,
    disableAnimations: false,
    onItemClick: undefined,
    class: '',
  });

  const VISUALS: Record<MagicBentoVisual, Component> = {
    analytics: MagicBentoAnalytics,
    dashboard: MagicBentoDashboard,
    collaboration: MagicBentoCollaboration,
    automation: MagicBentoAutomation,
    integration: MagicBentoIntegration,
    security: MagicBentoSecurity,
  };

  const rootRef = ref<HTMLElement | null>(null);
  const cells: (HTMLElement | null)[] = [];
  const cards: (HTMLElement | null)[] = [];
  const stars: (HTMLCanvasElement | null)[] = [];

  const ink = computed(() => MAGIC_BENTO_INK[props.theme]);
  const glow = computed(() => parseRgb(props.glowColor) ?? ink.value);

  const settings = computed<MagicBentoSettings>(() => ({
    columns: Math.max(1, Math.round(props.columns)),
    gap: Math.max(0, props.gap),
    enableBorderGlow: props.enableBorderGlow,
    enableSpotlight: props.enableSpotlight,
    spotlightRadius: Math.max(40, props.spotlightRadius),
    enableStars: props.enableStars,
    particleCount: clamp(Math.round(props.particleCount), 0, 120),
    enableTilt: props.enableTilt,
    enableMagnetism: props.enableMagnetism,
    clickEffect: props.clickEffect,
    intro: props.intro,
    disableAnimations: props.disableAnimations,
    glow: glow.value,
  }));

  const engine = useMagicBentoEngine(rootRef, cells, cards, stars, settings);

  const motionOn = computed(() =>
    engine.motion.value === null
      ? !props.disableAnimations
      : engine.motion.value,
  );

  const rootStyle = computed(() => {
    const corner = Math.max(0, props.radius);
    const spot = Math.max(40, props.spotlightRadius);
    const span = Math.max(1, engine.cols.value);
    return {
      ...MAGIC_BENTO_THEMES[props.theme],
      '--mb-glow-rgb': glow.value.join(', '),
      '--mb-accent-rgb': glow.value.join(', '),
      '--mb-accent-ink': inkFor(glow.value),
      '--mb-radius': `${corner}px`,
      '--mb-inner-radius': `${Math.round(clamp(corner * 0.5, 6, 12))}px`,
      '--mb-pad': `${Math.round(clamp(corner * 0.85, 14, 20))}px`,
      '--mb-spot-size': `${spot}px`,
      '--mb-border-size': `${Math.round(spot * 0.75)}px`,
      gridTemplateColumns: `repeat(${span}, minmax(0, 1fr))`,
      gridAutoRows:
        span === 1
          ? `minmax(${props.rowHeight}px, auto)`
          : `${props.rowHeight}px`,
      gap: `${Math.max(0, props.gap)}px`,
    };
  });

  function cellStyle(item: MagicBentoItem) {
    const span = Math.max(1, engine.cols.value);
    return {
      gridColumn: `span ${Math.min(span, Math.max(1, Math.round(item.colSpan ?? 1)))}`,
      gridRow: `span ${Math.max(1, Math.round(item.rowSpan ?? 1))}`,
    };
  }

  function element(el: Element | ComponentPublicInstance | null) {
    return el instanceof HTMLElement ? el : null;
  }

  function setCell(index: number) {
    return (el: Element | ComponentPublicInstance | null) => {
      cells[index] = element(el);
    };
  }

  function setCard(index: number) {
    return (el: Element | ComponentPublicInstance | null) => {
      cards[index] = element(el);
    };
  }

  function setStar(index: number) {
    return (el: Element | ComponentPublicInstance | null) => {
      stars[index] = el instanceof HTMLCanvasElement ? el : null;
    };
  }

  function builtin(item: MagicBentoItem) {
    return isMagicBentoVisual(item.visual) ? VISUALS[item.visual] : null;
  }

  function isClickable(item: MagicBentoItem) {
    return Boolean(item.href || item.onClick || props.onItemClick);
  }

  function onCardClick(item: MagicBentoItem, index: number, event: MouseEvent) {
    if (!isClickable(item)) return;
    item.onClick?.(event);
    props.onItemClick?.(item, index);
  }

  watch(
    () => props.items.length,
    (length) => {
      cells.length = length;
      cards.length = length;
      stars.length = length;
    },
    { immediate: true },
  );

  watch(
    [
      () => props.items,
      engine.cols,
      () => props.rowHeight,
      () => props.gap,
      () => props.radius,
      () => props.enableStars,
      () => props.enableSpotlight,
      () => props.enableBorderGlow,
    ],
    () => engine.sync(),
    { flush: 'post' },
  );

  onBeforeUnmount(() => engine.dispose());
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('magic-bento', props.class)"
    :data-autohide="textAutoHide ? '' : undefined"
    :data-motion="motionOn ? '' : undefined"
    :data-intro="motionOn && intro ? '' : undefined"
    :style="rootStyle"
    @click="engine.onClick"
    @keydown="engine.onKeydown"
  >
    <div
      v-for="(item, index) in items"
      :key="item.id ?? index"
      :ref="setCell(index)"
      class="magic-bento__cell"
      :style="cellStyle(item)"
    >
      <component
        :is="item.href ? 'a' : 'div'"
        :ref="setCard(index)"
        class="magic-bento__card"
        :data-clickable="isClickable(item) ? '' : undefined"
        :data-image="item.image ? '' : undefined"
        :href="item.href"
        :target="item.href ? item.target : undefined"
        :rel="item.href ? item.rel : undefined"
        :role="!item.href && isClickable(item) ? 'button' : undefined"
        :tabindex="!item.href && isClickable(item) ? 0 : undefined"
        :aria-label="!item.href && isClickable(item) ? item.title : undefined"
        @click="onCardClick(item, index, $event)"
      >
        <img
          v-if="item.image"
          class="magic-bento__image"
          :src="item.image"
          alt=""
          draggable="false"
        />
        <span v-if="item.image" class="magic-bento__scrim" />
        <span v-if="enableSpotlight" class="magic-bento__light" />
        <canvas
          v-if="enableStars"
          :ref="setStar(index)"
          class="magic-bento__stars"
          aria-hidden="true"
        />
        <div class="magic-bento__content">
          <slot v-if="item.content" :name="item.content" :item :index />
          <template v-else>
            <div v-if="item.icon || item.label" class="magic-bento__header">
              <span v-if="item.icon" class="magic-bento__icon">
                <Icon :name="item.icon" class="size-4" />
              </span>
              <span v-if="item.label" class="magic-bento__label">
                {{ item.label }}
              </span>
            </div>
            <div
              v-if="item.visual"
              class="magic-bento__visual"
              aria-hidden="true"
            >
              <component :is="builtin(item)" v-if="builtin(item)" />
              <slot v-else :name="item.visual" :item :index />
            </div>
            <div
              v-if="item.title || item.description"
              class="magic-bento__text"
            >
              <h3 v-if="item.title" class="magic-bento__title">
                {{ item.title }}
              </h3>
              <p v-if="item.description" class="magic-bento__description">
                {{ item.description }}
              </p>
            </div>
          </template>
        </div>
        <span class="magic-bento__rim" />
        <span class="magic-bento__border" />
      </component>
    </div>
  </div>
</template>

<style scoped>
  .magic-bento {
    --mb-spring: cubic-bezier(0.34, 1.4, 0.64, 1);
    position: relative;
    box-sizing: border-box;
    display: grid;
    grid-auto-flow: row dense;
    width: 100%;
    color: var(--mb-ink);
    font-feature-settings: 'tnum' 0;
    -webkit-tap-highlight-color: transparent;
  }

  @supports (transition-timing-function: linear(0, 1)) {
    .magic-bento {
      --mb-spring: linear(
        0,
        0.0603,
        0.2033,
        0.3821,
        0.5633,
        0.7258,
        0.8584,
        0.9574,
        1.0242,
        1.0634,
        1.0809,
        1.0828,
        1.0747,
        1.0613,
        1.046,
        1.0313,
        1.0186,
        1.0085,
        1.0012,
        0.9965,
        0.994,
        0.9931,
        0.9933,
        0.9941,
        0.9953,
        0.9966,
        0.9978,
        0.9988,
        1
      );
    }
  }

  .magic-bento__cell {
    position: relative;
    min-width: 0;
    min-height: 0;
    --mb-delay: 0ms;
  }

  .magic-bento[data-intro] .magic-bento__cell {
    opacity: 0;
    transform: translate3d(0, 16px, 0) scale(0.97);
  }

  .magic-bento[data-intro] .magic-bento__cell[data-state='in'] {
    opacity: 1;
    transform: none;
    transition:
      opacity 420ms cubic-bezier(0.22, 1, 0.36, 1) var(--mb-delay),
      transform 760ms var(--mb-spring) var(--mb-delay);
  }

  .magic-bento__card {
    position: relative;
    box-sizing: border-box;
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    overflow: hidden;
    border-radius: var(--mb-radius);
    background: var(--mb-surface);
    box-shadow: var(--mb-shadow);
    color: var(--mb-ink);
    text-decoration: none;
    isolation: isolate;
    outline: none;
    transform: perspective(900px)
      translate3d(var(--mb-tx, 0px), var(--mb-ty, 0px), 0)
      rotateX(var(--mb-rx, 0deg)) rotateY(var(--mb-ry, 0deg))
      scale(var(--mb-press, 1));
    user-select: none;
    -webkit-user-select: none;
  }

  .magic-bento__card[data-clickable] {
    cursor: pointer;
  }

  .magic-bento__card:focus-visible {
    box-shadow:
      var(--mb-shadow),
      0 0 0 2px var(--mb-focus);
  }

  .magic-bento__image {
    position: absolute;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
  }

  .magic-bento__scrim {
    position: absolute;
    inset: 0;
    z-index: 0;
    background: linear-gradient(
      to top,
      rgba(10, 9, 13, 0.82) 0%,
      rgba(10, 9, 13, 0.7) 14%,
      rgba(10, 9, 13, 0.46) 30%,
      rgba(10, 9, 13, 0.2) 46%,
      rgba(10, 9, 13, 0.05) 60%,
      rgba(10, 9, 13, 0) 72%
    );
    pointer-events: none;
  }

  .magic-bento__light {
    position: absolute;
    inset: 0;
    z-index: 1;
    border-radius: inherit;
    background: radial-gradient(
      var(--mb-spot-size) circle at var(--mb-x, -999px) var(--mb-y, -999px),
      rgba(
          var(--mb-glow-rgb),
          calc(var(--mb-spot-alpha) * var(--mb-hot, 0) * 1)
        )
        0%,
      rgba(
          var(--mb-glow-rgb),
          calc(var(--mb-spot-alpha) * var(--mb-hot, 0) * 0.973)
        )
        15%,
      rgba(
          var(--mb-glow-rgb),
          calc(var(--mb-spot-alpha) * var(--mb-hot, 0) * 0.837)
        )
        30%,
      rgba(
          var(--mb-glow-rgb),
          calc(var(--mb-spot-alpha) * var(--mb-hot, 0) * 0.593)
        )
        45%,
      rgba(
          var(--mb-glow-rgb),
          calc(var(--mb-spot-alpha) * var(--mb-hot, 0) * 0.317)
        )
        60%,
      rgba(
          var(--mb-glow-rgb),
          calc(var(--mb-spot-alpha) * var(--mb-hot, 0) * 0.104)
        )
        75%,
      rgba(
          var(--mb-glow-rgb),
          calc(var(--mb-spot-alpha) * var(--mb-hot, 0) * 0.009)
        )
        90%,
      rgba(var(--mb-glow-rgb), 0) 100%
    );
    pointer-events: none;
  }

  .magic-bento__stars {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .magic-bento__rim {
    position: absolute;
    inset: 0;
    z-index: 3;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 1px var(--mb-edge),
      inset 0 1px 0 var(--mb-highlight);
    pointer-events: none;
  }

  .magic-bento__border {
    position: absolute;
    inset: 0;
    z-index: 4;
    box-sizing: border-box;
    padding: 1px;
    border-radius: inherit;
    background:
      radial-gradient(
        var(--mb-border-size) circle at var(--mb-x, -999px) var(--mb-y, -999px),
        rgba(
            var(--mb-glow-rgb),
            calc(var(--mb-glow-alpha) * var(--mb-near, 0) * 1)
          )
          0%,
        rgba(
            var(--mb-glow-rgb),
            calc(var(--mb-glow-alpha) * var(--mb-near, 0) * 0.973)
          )
          15%,
        rgba(
            var(--mb-glow-rgb),
            calc(var(--mb-glow-alpha) * var(--mb-near, 0) * 0.837)
          )
          30%,
        rgba(
            var(--mb-glow-rgb),
            calc(var(--mb-glow-alpha) * var(--mb-near, 0) * 0.593)
          )
          45%,
        rgba(
            var(--mb-glow-rgb),
            calc(var(--mb-glow-alpha) * var(--mb-near, 0) * 0.317)
          )
          60%,
        rgba(
            var(--mb-glow-rgb),
            calc(var(--mb-glow-alpha) * var(--mb-near, 0) * 0.104)
          )
          75%,
        rgba(
            var(--mb-glow-rgb),
            calc(var(--mb-glow-alpha) * var(--mb-near, 0) * 0.009)
          )
          90%,
        rgba(var(--mb-glow-rgb), 0) 100%
      ),
      radial-gradient(
        circle at var(--mb-wx, -999px) var(--mb-wy, -999px),
        rgba(var(--mb-glow-rgb), 0) calc(var(--mb-wr, 0px) - 110px),
        rgba(
            var(--mb-glow-rgb),
            calc(var(--mb-glow-alpha) * var(--mb-wa, 0) * 0.1)
          )
          calc(var(--mb-wr, 0px) - 80px),
        rgba(
            var(--mb-glow-rgb),
            calc(var(--mb-glow-alpha) * var(--mb-wa, 0) * 0.32)
          )
          calc(var(--mb-wr, 0px) - 52px),
        rgba(
            var(--mb-glow-rgb),
            calc(var(--mb-glow-alpha) * var(--mb-wa, 0) * 0.68)
          )
          calc(var(--mb-wr, 0px) - 28px),
        rgba(
            var(--mb-glow-rgb),
            calc(var(--mb-glow-alpha) * var(--mb-wa, 0) * 0.94)
          )
          calc(var(--mb-wr, 0px) - 10px),
        rgba(var(--mb-glow-rgb), calc(var(--mb-glow-alpha) * var(--mb-wa, 0)))
          calc(var(--mb-wr, 0px) - 3px),
        rgba(var(--mb-glow-rgb), 0) var(--mb-wr, 0px)
      );
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#000 0 0) content-box exclude,
      linear-gradient(#000 0 0);
    pointer-events: none;
  }

  .magic-bento__content {
    position: relative;
    z-index: 2;
    box-sizing: border-box;
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    gap: 12px;
    padding: var(--mb-pad);
  }

  .magic-bento__header {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 8px;
    color: var(--mb-muted);
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
  }

  .magic-bento__icon {
    display: grid;
    width: 16px;
    height: 16px;
    flex: none;
    place-items: center;
    color: var(--mb-ink);
  }

  .magic-bento__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .magic-bento__visual {
    position: relative;
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    container-type: size;
  }

  .magic-bento__text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: auto;
  }

  .magic-bento__title {
    margin: 0;
    color: var(--mb-ink);
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 20px;
  }

  .magic-bento__description {
    margin: 0;
    color: var(--mb-muted);
    font-size: 13px;
    line-height: 1.45;
  }

  .magic-bento[data-autohide] .magic-bento__title,
  .magic-bento[data-autohide] .magic-bento__description {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
  }

  .magic-bento[data-autohide] .magic-bento__title {
    -webkit-line-clamp: 1;
    line-clamp: 1;
  }

  .magic-bento[data-autohide] .magic-bento__description {
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .magic-bento__card[data-image] .magic-bento__header,
  .magic-bento__card[data-image] .magic-bento__description {
    color: rgba(244, 244, 245, 0.72);
  }

  .magic-bento__card[data-image] .magic-bento__title,
  .magic-bento__card[data-image] .magic-bento__icon {
    color: #f4f4f5;
  }
</style>
