<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    useId,
    watch,
  } from 'vue';
  import { usePreferredReducedMotion, useResizeObserver } from '@vueuse/core';
  import {
    SHADOW_OPACITY,
    createStrokeTextAnimator,
    getDashPattern,
    getWipeFrames,
  } from './stroke-text-animator';
  import type {
    StrokeTextAnimator,
    StrokeTextBox,
    StrokeTextProps,
  } from './types';

  const props = withDefaults(defineProps<StrokeTextProps>(), {
    text: 'Draw Attention',
    strokeColor: '#A78BFA',
    fillColor: 'currentColor',
    strokeWidth: 1.4,
    drawDuration: 1.6,
    fillDelay: 0.2,
    stagger: 0.05,
    ease: 'power2.out',
    trigger: 'mount',
    fillMode: 'wipe',
    wipeFrom: 'left',
    fontSize: 128,
    fontWeight: 800,
    fontFamily: 'inherit',
    letterSpacing: -4,
    reverse: false,
    strokeStyle: 'solid',
    dashLength: 10,
    marching: false,
    hoverRedraw: false,
    shadow: false,
    shadowColor: undefined,
    class: '',
  });

  const rootRef = ref<HTMLSpanElement>();
  const strokeTextRef = shallowRef<SVGTextElement | null>(null);
  const wipeRectRef = ref<SVGRectElement>();
  const shadowRef = ref<SVGFEDropShadowElement>();
  const box = shallowRef<StrokeTextBox | null>(null);

  const NO_REGION = {};
  const reducedPreference = usePreferredReducedMotion();

  const baseId = useId().replace(/[^\w-]/g, '');
  const wipeId = `stroke-text-wipe-${baseId}`;
  const revealId = `stroke-text-reveal-${baseId}`;
  const erodeId = `stroke-text-erode-${baseId}`;
  const shadowId = `stroke-text-shadow-${baseId}`;

  const characters = computed(() => Array.from(String(props.text ?? '')));
  const dash = computed(() => Math.max(props.fontSize * 7, 200));
  const pattern = computed(() =>
    getDashPattern(props.strokeStyle, props.dashLength, props.strokeWidth),
  );
  const dashArray = computed(() => pattern.value?.array ?? null);
  const dashPeriod = computed(() => pattern.value?.period ?? 0);
  const lift = computed(() => props.fontSize * 0.06);
  const softness = computed(() => props.fontSize * 0.016);
  const castShadow = computed(() => props.shadow && props.fillMode !== 'none');
  const strokeWidthValue = computed(() => Number(props.strokeWidth) || 1);

  const fontStyle = computed(() => ({
    fontFamily: props.fontFamily,
    fontSize: `${props.fontSize}px`,
    fontWeight: props.fontWeight,
    letterSpacing: `${props.letterSpacing}px`,
  }));

  const viewBox = computed(() =>
    box.value
      ? `${box.value.x} ${box.value.y} ${box.value.width} ${box.value.height}`
      : `0 ${-props.fontSize} 600 ${props.fontSize * 1.3}`,
  );
  const wipeStart = computed(() =>
    box.value ? getWipeFrames(box.value, props.wipeFrom).start : null,
  );
  const region = computed(() =>
    box.value
      ? {
          x: box.value.x - props.fontSize,
          y: box.value.y - props.fontSize,
          width: box.value.width + props.fontSize * 2,
          height: box.value.height + props.fontSize * 2,
        }
      : NO_REGION,
  );
  const rootStyle = computed(() => ({
    '--stroke-text-width': `${box.value ? box.value.width : 600}px`,
  }));

  function setStrokeText(el: unknown) {
    strokeTextRef.value = el instanceof SVGTextElement ? el : null;
  }

  function measure() {
    const el = strokeTextRef.value;
    if (!el) return;
    let bbox: DOMRect;
    try {
      bbox = el.getBBox();
    } catch {
      return;
    }
    if (!bbox.width) return;
    const pad = Math.max(strokeWidthValue.value, props.fontSize * 0.1);
    const next = {
      x: bbox.x - pad,
      y: bbox.y - pad,
      width: bbox.width + pad * 2,
      height: bbox.height + pad * 2,
    };
    const prev = box.value;
    if (
      prev &&
      Math.abs(prev.x - next.x) < 0.5 &&
      Math.abs(prev.width - next.width) < 0.5 &&
      Math.abs(prev.y - next.y) < 0.5 &&
      Math.abs(prev.height - next.height) < 0.5
    ) {
      return;
    }
    box.value = next;
  }

  useResizeObserver(rootRef, measure);

  let animator: StrokeTextAnimator | null = null;
  let mounted = false;

  function start() {
    animator?.destroy();
    animator = null;
    const root = rootRef.value;
    if (!mounted || !root || !box.value) return;
    const strokes = Array.from(
      root.querySelectorAll<SVGTSpanElement>('[data-stroke-char]'),
    );
    if (!strokes.length) return;
    animator = createStrokeTextAnimator({
      root,
      strokes,
      fills: Array.from(
        root.querySelectorAll<SVGTSpanElement>('[data-fill-char]'),
      ),
      outline: strokeTextRef.value,
      wipe: wipeRectRef.value ?? null,
      drop: shadowRef.value ?? null,
      box: box.value,
      dash: dash.value,
      dashPeriod: dashPeriod.value,
      drawDuration: props.drawDuration,
      fillDelay: props.fillDelay,
      stagger: props.stagger,
      ease: props.ease,
      trigger: props.trigger,
      fillMode: props.fillMode,
      wipeFrom: props.wipeFrom,
      reverse: props.reverse,
      marching: props.marching,
      hoverRedraw: props.hoverRedraw,
      lift: lift.value,
      fontSize: props.fontSize,
      reducedMotion: reducedPreference.value === 'reduce',
    });
  }

  function onPointerEnter() {
    animator?.pointerEnter();
  }

  watch(
    [
      characters,
      () => props.fontFamily,
      () => props.fontSize,
      () => props.fontWeight,
      () => props.letterSpacing,
      () => props.strokeWidth,
      dashArray,
    ],
    () => nextTick(measure),
    { flush: 'post' },
  );

  watch(
    [
      box,
      dash,
      () => props.drawDuration,
      () => props.fillDelay,
      () => props.stagger,
      () => props.ease,
      () => props.trigger,
      () => props.fillMode,
      () => props.wipeFrom,
      () => props.reverse,
      dashArray,
      dashPeriod,
      () => props.marching,
      () => props.hoverRedraw,
      castShadow,
      lift,
      characters,
      reducedPreference,
    ],
    start,
    { flush: 'post' },
  );

  onMounted(() => {
    mounted = true;
    measure();
    document.fonts?.ready
      ?.then(() => {
        if (mounted) measure();
      })
      .catch(() => {});
    start();
  });

  onBeforeUnmount(() => {
    mounted = false;
    animator?.destroy();
    animator = null;
  });
</script>

<template>
  <span
    ref="rootRef"
    :class="[
      'stroke-text',
      props.trigger === 'hover' && 'stroke-text--hover',
      props.class,
    ]"
    :style="rootStyle"
    role="img"
    :aria-label="String(props.text ?? '')"
    @pointerenter="onPointerEnter"
  >
    <svg
      class="stroke-text__svg"
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      :style="box ? undefined : { visibility: 'hidden' }"
    >
      <defs>
        <clipPath
          v-if="props.fillMode === 'wipe' && wipeStart"
          :id="wipeId"
          clipPathUnits="userSpaceOnUse"
        >
          <rect
            ref="wipeRectRef"
            :x="wipeStart.x"
            :y="wipeStart.y"
            :width="wipeStart.width"
            :height="wipeStart.height"
          />
        </clipPath>

        <filter
          v-if="dashArray"
          :id="erodeId"
          filterUnits="userSpaceOnUse"
          v-bind="region"
        >
          <feMorphology
            operator="erode"
            :radius="strokeWidthValue / 2 + 0.75"
          />
        </filter>

        <mask
          v-if="dashArray"
          :id="revealId"
          maskUnits="userSpaceOnUse"
          v-bind="region"
        >
          <text
            x="0"
            y="0"
            fill="none"
            stroke="#fff"
            :stroke-width="strokeWidthValue + 2"
            stroke-linejoin="round"
            stroke-linecap="round"
            :style="fontStyle"
          >
            <tspan
              v-for="(char, index) in characters"
              :key="`m-${index}`"
              data-stroke-char
              v-text="char"
            />
          </text>
          <text
            x="0"
            y="0"
            fill="#000"
            stroke="none"
            :filter="`url(#${erodeId})`"
            :style="fontStyle"
          >
            <tspan
              v-for="(char, index) in characters"
              :key="`e-${index}`"
              v-text="char"
            />
          </text>
        </mask>

        <filter
          v-if="castShadow"
          :id="shadowId"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
          v-bind="region"
        >
          <feDropShadow
            ref="shadowRef"
            :dx="lift"
            :dy="lift"
            :stdDeviation="softness"
            :flood-color="props.shadowColor || props.strokeColor"
            :flood-opacity="SHADOW_OPACITY"
          />
        </filter>
      </defs>

      <text
        v-if="!dashArray"
        :ref="setStrokeText"
        class="stroke-text__stroke"
        x="0"
        y="0"
        fill="none"
        :stroke="props.strokeColor"
        :stroke-width="props.strokeWidth"
        stroke-linejoin="round"
        stroke-linecap="round"
        :style="fontStyle"
      >
        <tspan
          v-for="(char, index) in characters"
          :key="`s-${index}`"
          data-stroke-char
          v-text="char"
        />
      </text>

      <g :filter="castShadow ? `url(#${shadowId})` : undefined">
        <text
          class="stroke-text__fill"
          x="0"
          y="0"
          :fill="props.fillColor"
          stroke="none"
          :style="fontStyle"
          :clip-path="
            props.fillMode === 'wipe' && wipeStart
              ? `url(#${wipeId})`
              : undefined
          "
        >
          <tspan
            v-for="(char, index) in characters"
            :key="`f-${index}`"
            data-fill-char
            v-text="char"
          />
        </text>
      </g>

      <text
        v-if="dashArray"
        :ref="setStrokeText"
        class="stroke-text__stroke"
        x="0"
        y="0"
        fill="none"
        :stroke="props.strokeColor"
        :stroke-width="props.strokeWidth"
        stroke-linejoin="round"
        stroke-linecap="round"
        :stroke-dasharray="dashArray"
        :mask="`url(#${revealId})`"
        :style="fontStyle"
      >
        <tspan
          v-for="(char, index) in characters"
          :key="`p-${index}`"
          v-text="char"
        />
      </text>
    </svg>
  </span>
</template>

<style scoped>
  .stroke-text {
    display: block;
    width: 100%;
    line-height: 0;
  }

  .stroke-text--hover {
    cursor: pointer;
  }

  .stroke-text__svg {
    display: block;
    width: 100%;
    max-width: var(--stroke-text-width, 600px);
    height: auto;
    margin: 0 auto;
    overflow: visible;
  }

  .stroke-text__stroke,
  .stroke-text__fill {
    user-select: none;
  }
</style>
