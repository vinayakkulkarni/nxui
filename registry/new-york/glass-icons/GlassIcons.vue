<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    ref,
    shallowRef,
    useId,
    watch,
  } from 'vue';
  import type { ComponentPublicInstance } from 'vue';
  import { cn } from '~/lib/utils';
  import { createGlassIconsEngine } from './glass-icons-engine';
  import {
    GLASS_ICONS_GRADIENTS,
    GLASS_ICONS_HOVERS,
    GLASS_ICONS_LABELS,
    GLASS_ICONS_PLATES,
    GLASS_ICONS_THEMES,
    buildMaps,
    clamp,
    isDarkColor,
    supportsLiquid,
  } from './glass-icons-math';
  import type {
    GlassIconsEngine,
    GlassIconsItem,
    GlassIconsMaps,
    GlassIconsProps,
    GlassIconsSettings,
  } from './types';

  const props = withDefaults(defineProps<GlassIconsProps>(), {
    items: () => [],
    size: 82,
    gap: 66,
    columns: 3,
    roundness: 0.6,
    refraction: 0.8,
    bevel: 0.6,
    dispersion: 0,
    frost: 0.2,
    shine: 0.85,
    tint: '#dfdfdf',
    tintOpacity: 0.2,
    iconColor: undefined,
    plate: 'tilt',
    tilt: 30,
    spread: 0.5,
    hover: 'press',
    parallax: 1,
    labels: 'hover',
    intro: true,
    theme: 'dark',
    class: '',
  });

  defineSlots<{
    icon?: (scope: { item: GlassIconsItem; index: number }) => unknown;
  }>();

  const filterId = `glass-icons-${useId().replace(/[^a-z0-9-]/gi, '')}`;
  const rootRef = ref<HTMLDivElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const plateEls: (HTMLElement | null)[] = [];
  const glassEls: (HTMLElement | null)[] = [];
  const faceEls: (HTMLElement | null)[] = [];
  const labelEls: (HTMLElement | null)[] = [];
  const gpu = ref(false);
  const liquid = ref(false);
  const maps = shallowRef<GlassIconsMaps | null>(null);
  let engine: GlassIconsEngine | null = null;

  const tile = computed(() => Math.max(24, Math.round(props.size)));
  const radius = computed(() =>
    Math.round((tile.value / 2) * clamp(props.roundness, 0, 1)),
  );
  const edge = computed(() =>
    Math.max(2, Math.round(tile.value * 0.26 * clamp(props.bevel, 0, 1))),
  );
  const plateMode = computed(() =>
    GLASS_ICONS_PLATES.includes(props.plate) ? props.plate : 'tilt',
  );
  const hoverMode = computed(() =>
    GLASS_ICONS_HOVERS.includes(props.hover) ? props.hover : 'lift',
  );
  const labelMode = computed(() =>
    GLASS_ICONS_LABELS.includes(props.labels) ? props.labels : 'hover',
  );
  const ink = computed(
    () =>
      props.iconColor ||
      (props.theme === 'light' && plateMode.value === 'none'
        ? '#27272a'
        : '#ffffff'),
  );
  const colors = computed(() =>
    props.items.map(
      (item) =>
        GLASS_ICONS_GRADIENTS[item.color ?? 'blue'] ??
        item.color ??
        GLASS_ICONS_GRADIENTS.blue!,
    ),
  );

  const settings = computed<GlassIconsSettings>(() => ({
    count: props.items.length,
    tile: tile.value,
    radius: radius.value,
    edge: edge.value,
    strength: tile.value * 0.3 * clamp(props.refraction, 0, 1.5),
    split:
      tile.value *
      0.07 *
      clamp(props.dispersion, 0, 1) *
      clamp(props.refraction, 0, 1.5),
    soft: 1 + clamp(props.frost, 0, 1) * tile.value * 0.15,
    shine: clamp(props.shine, 0, 1),
    shade: props.theme === 'light' ? 0.22 : 0.35,
    tint: props.tint,
    tintOpacity: clamp(props.tintOpacity, 0, 1),
    plate: plateMode.value,
    hover: hoverMode.value,
    labels: labelMode.value,
    tilt: props.tilt,
    spread: clamp(props.spread, 0, 1),
    parallax: clamp(props.parallax, 0, 1),
    intro: props.intro,
    colors: colors.value,
    colorKey: colors.value.join('|'),
  }));

  const clearGlass = computed(() => plateMode.value === 'none');
  const useFilter = computed(
    () => clearGlass.value && liquid.value && maps.value !== null,
  );
  const glassFilter = computed(() =>
    useFilter.value
      ? `url(#${filterId}) saturate(1.35) brightness(1.04)`
      : `blur(${(2 + clamp(props.frost, 0, 1) * 10).toFixed(1)}px) saturate(1.4)`,
  );
  const glassStyle = computed(() => ({
    backdropFilter: glassFilter.value,
    WebkitBackdropFilter: glassFilter.value,
  }));
  const blur = computed(() => clamp(props.frost, 0, 1) * tile.value * 0.06);
  const filterScale = computed(() => {
    const { strength, split } = settings.value;
    return {
      red: -strength * 2 - split * 2,
      green: -strength * 2,
      blue: -strength * 2 + split * 2,
    };
  });

  const rootStyle = computed<Record<string, string>>(() => {
    const gap = Math.max(0, props.gap);
    return {
      ...(GLASS_ICONS_THEMES[props.theme] ?? GLASS_ICONS_THEMES.dark),
      '--glass-icons-size': `${tile.value}px`,
      '--glass-icons-radius': `${radius.value}px`,
      '--glass-icons-gap': `${gap}px`,
      '--glass-icons-row-gap': `${gap + (labelMode.value === 'always' ? 26 : 0)}px`,
      '--glass-icons-columns': String(
        props.columns > 0
          ? Math.round(props.columns)
          : Math.max(1, props.items.length),
      ),
      '--glass-icons-tint': `color-mix(in srgb, ${props.tint} ${Math.round(clamp(props.tintOpacity, 0, 1) * 100)}%, transparent)`,
      '--glass-icons-ink': ink.value,
      '--glass-icons-glyph-shadow': isDarkColor(ink.value)
        ? 'rgba(255, 255, 255, 0.35)'
        : 'rgba(0, 0, 0, 0.28)',
      '--glass-icons-tilt': `${props.tilt}deg`,
      '--glass-icons-spread': String(clamp(props.spread, 0, 1)),
      '--glass-icons-shine': String(clamp(props.shine, 0, 1)),
    };
  });

  function bind(list: (HTMLElement | null)[], index: number) {
    return (el: Element | ComponentPublicInstance | null) => {
      list[index] = el instanceof HTMLElement ? el : null;
    };
  }

  function linkAttrs(item: GlassIconsItem) {
    if (!item.href) return { type: 'button' };
    return {
      href: item.href,
      target: item.target,
      rel: item.target === '_blank' ? 'noreferrer' : undefined,
    };
  }

  function onEnter(index: number, event: PointerEvent) {
    if (event.pointerType !== 'touch') engine?.hover(index, true);
  }

  function onMove(index: number, event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    const rect = target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    engine?.aim(index, clamp(x, -1, 1), clamp(y, -1, 1));
  }

  function onLeave(index: number) {
    engine?.hover(index, false);
  }

  function onPress(index: number, on: boolean) {
    engine?.press(index, on);
  }

  function onFocus(index: number, event: FocusEvent) {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    let visible = false;
    try {
      visible = target.matches(':focus-visible');
    } catch {
      visible = false;
    }
    if (visible) engine?.hover(index, true);
  }

  function onClick(item: GlassIconsItem, event: MouseEvent) {
    item.onClick?.(event);
  }

  function setGpu(enabled: boolean) {
    gpu.value = enabled;
  }

  onMounted(() => {
    liquid.value = supportsLiquid();
    maps.value = buildMaps(tile.value, radius.value, edge.value);
    const root = rootRef.value;
    const canvas = canvasRef.value;
    if (!root || !canvas) return;
    engine = createGlassIconsEngine({
      root,
      canvas,
      getSettings: () => settings.value,
      plates: plateEls,
      glasses: glassEls,
      faces: faceEls,
      labels: labelEls,
      onGpu: setGpu,
    });
  });

  watch([tile, radius, edge], ([t, r, e]) => {
    maps.value = buildMaps(t, r, e);
  });

  watch(settings, () => engine?.sync(), { flush: 'post' });

  onUpdated(() => engine?.sync());

  onBeforeUnmount(() => {
    engine?.destroy();
    engine = null;
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="
      cn(
        'glass-icons',
        intro && 'is-intro',
        `glass-icons--labels-${labelMode}`,
        props.class,
      )
    "
    :style="rootStyle"
  >
    <svg
      v-if="useFilter && maps"
      class="glass-icons-defs"
      aria-hidden="true"
      focusable="false"
    >
      <filter
        :id="filterId"
        color-interpolation-filters="sRGB"
        x="0"
        y="0"
        width="100%"
        height="100%"
      >
        <feImage
          :href="maps.refractionUrl"
          x="0"
          y="0"
          :width="tile"
          :height="tile"
          preserveAspectRatio="none"
          result="map"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="map"
          :scale="filterScale.red"
          xChannelSelector="R"
          yChannelSelector="G"
          result="shiftRed"
        />
        <feColorMatrix
          in="shiftRed"
          type="matrix"
          values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="red"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="map"
          :scale="filterScale.green"
          xChannelSelector="R"
          yChannelSelector="G"
          result="shiftGreen"
        />
        <feColorMatrix
          in="shiftGreen"
          type="matrix"
          values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="green"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="map"
          :scale="filterScale.blue"
          xChannelSelector="R"
          yChannelSelector="G"
          result="shiftBlue"
        />
        <feColorMatrix
          in="shiftBlue"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
          result="blue"
        />
        <feBlend in="red" in2="green" mode="screen" result="redGreen" />
        <feBlend in="redGreen" in2="blue" mode="screen" result="glass" />
        <feGaussianBlur
          v-if="blur > 0"
          in="glass"
          :stdDeviation="blur.toFixed(2)"
        />
      </filter>
    </svg>

    <canvas ref="canvasRef" class="glass-icons-canvas" aria-hidden="true" />

    <component
      :is="item.href ? 'a' : 'button'"
      v-for="(item, index) in items"
      :key="item.id ?? index"
      :class="cn('glass-icon', item.className)"
      data-glass-icon=""
      :aria-label="item.label"
      v-bind="linkAttrs(item)"
      @click="onClick(item, $event)"
      @pointerenter="onEnter(index, $event)"
      @pointermove="onMove(index, $event)"
      @pointerleave="onLeave(index)"
      @pointerdown="onPress(index, true)"
      @pointerup="onPress(index, false)"
      @pointercancel="onPress(index, false)"
      @focus="onFocus(index, $event)"
      @blur="onLeave(index)"
    >
      <span
        v-if="!gpu && plateMode !== 'none'"
        :ref="bind(plateEls, index)"
        :class="['glass-icon-plate', `glass-icon-plate--${plateMode}`]"
        :style="{ background: colors[index] }"
      />
      <span
        :ref="bind(glassEls, index)"
        class="glass-icon-glass"
        :style="glassStyle"
      >
        <span
          v-if="!gpu && maps"
          class="glass-icon-shade"
          :style="{ backgroundImage: `url(${maps.shadeUrl})` }"
        />
        <span
          v-if="!gpu && maps"
          class="glass-icon-shine"
          :style="{ backgroundImage: `url(${maps.shineUrl})` }"
        />
      </span>
      <span :ref="bind(faceEls, index)" class="glass-icon-face">
        <span class="glass-icon-glyph" aria-hidden="true">
          <slot name="icon" :item="item" :index="index">
            <Icon v-if="item.icon" :name="item.icon" />
          </slot>
        </span>
      </span>
      <span
        v-if="labelMode !== 'none' && item.label"
        :ref="bind(labelEls, index)"
        class="glass-icon-label"
      >
        {{ item.label }}
      </span>
    </component>
  </div>
</template>

<style scoped>
  .glass-icons {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--glass-icons-row-gap) var(--glass-icons-gap);
    box-sizing: border-box;
    max-width: calc(
      var(--glass-icons-columns) * var(--glass-icons-size) +
        (var(--glass-icons-columns) - 1) * var(--glass-icons-gap)
    );
    margin: 0 auto;
    isolation: isolate;
  }

  .glass-icons-defs {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .glass-icons-canvas {
    position: absolute;
    z-index: 1;
    display: block;
    pointer-events: none;
  }

  .glass-icon {
    position: relative;
    flex: none;
    width: var(--glass-icons-size);
    height: var(--glass-icons-size);
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-decoration: none;
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }

  .glass-icon-plate {
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: var(--glass-icons-radius);
    will-change: transform, opacity;
  }

  .glass-icon-plate--tilt {
    transform: rotate(var(--glass-icons-tilt));
    transform-origin: 100% 100%;
  }

  .glass-icon-plate--offset {
    transform: translate(
      calc(var(--glass-icons-spread) * 26%),
      calc(var(--glass-icons-spread) * -26%)
    );
  }

  .glass-icon-plate--circle {
    inset: 9%;
    border-radius: 50%;
    transform: translate(
      calc(var(--glass-icons-spread) * 29%),
      calc(var(--glass-icons-spread) * -29%)
    );
  }

  .glass-icon-glass {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    border-radius: var(--glass-icons-radius);
    background: linear-gradient(
      var(--glass-icons-tint),
      var(--glass-icons-tint)
    );
    box-shadow: 0 12px 24px -14px var(--glass-icons-drop);
    will-change: transform, opacity;
  }

  .glass-icon-shade,
  .glass-icon-shine {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-size: 100% 100%;
    pointer-events: none;
  }

  .glass-icon-shade {
    opacity: var(--glass-icons-shade);
  }

  .glass-icon-shine {
    opacity: var(--glass-icons-shine);
  }

  .glass-icon-face {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: grid;
    place-items: center;
    border-radius: var(--glass-icons-radius);
    pointer-events: none;
    will-change: transform, opacity;
  }

  .glass-icon:focus-visible .glass-icon-face {
    outline: 2px solid var(--glass-icons-label);
    outline-offset: 4px;
  }

  .glass-icon-glyph {
    display: grid;
    place-items: center;
    width: 40%;
    height: 40%;
    color: var(--glass-icons-ink);
    filter: drop-shadow(0 1px 3px var(--glass-icons-glyph-shadow));
  }

  .glass-icon-glyph > :deep(svg),
  .glass-icon-glyph > :deep(.iconify),
  .glass-icon-glyph > :deep(span) {
    width: 100%;
    height: 100%;
  }

  .glass-icon-label {
    position: absolute;
    top: calc(100% + 10px);
    left: 50%;
    z-index: 2;
    color: var(--glass-icons-label);
    font-size: 13px;
    font-weight: 500;
    line-height: 1.2;
    white-space: nowrap;
    pointer-events: none;
    transform: translateX(-50%);
    transition:
      opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .glass-icons--labels-hover .glass-icon-label {
    opacity: 0;
    transform: translate(-50%, -4px);
  }

  .glass-icons--labels-hover .glass-icon:focus-visible .glass-icon-label {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  .glass-icons.is-intro .glass-icon-plate,
  .glass-icons.is-intro .glass-icon-glass,
  .glass-icons.is-intro .glass-icon-face,
  .glass-icons.is-intro.glass-icons--labels-always .glass-icon-label {
    opacity: 0;
  }

  @media (hover: hover) {
    .glass-icons--labels-hover .glass-icon:hover .glass-icon-label {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .glass-icon-label {
      transition: none;
    }
  }
</style>
