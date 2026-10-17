<script setup lang="ts">
  import {
    computed,
    nextTick,
    onMounted,
    shallowRef,
    useId,
    useTemplateRef,
    watch,
  } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
  } from '@vueuse/core';
  import {
    CX,
    CY,
    MAX_BOOST,
    MAX_FLING,
    VIEW_H,
    VIEW_W,
    buildFade,
    buildPath,
    circleRadius,
    clamp,
    createScaleTween,
    glideTween,
    inkOn,
    tint,
    tweenValue,
    wrap,
  } from './text-loop-geometry';
  import type { TextLoopMetrics, TextLoopPaint, TextLoopProps } from './types';

  const props = withDefaults(defineProps<TextLoopProps>(), {
    text: 'Vue ✦ nxui',
    shape: 'wave',
    path: undefined,
    speed: 90,
    direction: 'forward',
    separator: '✦',
    curviness: 90,
    tilt: 0,
    fontSize: 46,
    fontWeight: 800,
    letterSpacing: 2,
    uppercase: true,
    color: undefined,
    ribbon: true,
    ribbonColor: '#5227FF',
    ribbonWidth: 86,
    edgeFade: 0,
    pauseOnHover: true,
    cross: false,
    crossColor: undefined,
    crossAngle: 16,
    draggable: false,
    scrollBoost: 0,
    outline: false,
    outlineWidth: 1.5,
    class: '',
  });

  const rootRef = useTemplateRef<HTMLDivElement>('root');
  const svgRef = useTemplateRef<SVGSVGElement>('svg');
  const pathRef = useTemplateRef<SVGPathElement>('mainPath');
  const crossPathRef = useTemplateRef<SVGPathElement>('crossPath');
  const measureRef = useTemplateRef<SVGTextElement>('measure');
  const headRef = useTemplateRef<SVGTextPathElement>('head');
  const tailRef = useTemplateRef<SVGTextPathElement>('tail');
  const crossHeadRef = useTemplateRef<SVGTextPathElement>('crossHead');
  const crossTailRef = useTemplateRef<SVGTextPathElement>('crossTail');

  const metrics = shallowRef<TextLoopMetrics>({
    length: 0,
    reps: 1,
    crossLength: 0,
    crossReps: 1,
  });

  const pathId = `text-loop-${useId().replace(/[^\w-]/g, '')}`;
  const crossId = `${pathId}-cross`;
  const fadeId = `${pathId}-fade`;
  const maskId = `${pathId}-mask`;
  const shadowId = `${pathId}-shadow`;
  const underId = `${pathId}-under`;

  const custom = computed(() => Boolean(props.path));
  const d = computed(
    () =>
      props.path || buildPath(props.shape, props.curviness, props.ribbonWidth),
  );
  const crossD = computed(() => {
    if (!props.cross) return '';
    if (props.path) return props.path;
    const mirrored =
      props.shape === 'wave' ||
      props.shape === 'arch' ||
      props.shape === 'circle';
    return buildPath(props.shape, props.curviness, props.ribbonWidth, mirrored);
  });
  const fade = computed(() => buildFade(props.edgeFade));
  const fill = computed(
    () => props.color || (props.ribbon ? '#ffffff' : 'currentColor'),
  );

  const mainAngle = computed(
    () => props.tilt + (props.cross ? props.crossAngle / 2 : 0),
  );
  const crossAngleDeg = computed(
    () => props.tilt - (props.cross ? props.crossAngle / 2 : 0),
  );
  const mainTransform = computed(() =>
    mainAngle.value ? `rotate(${mainAngle.value} ${CX} ${CY})` : undefined,
  );
  const crossTransform = computed(() =>
    crossAngleDeg.value
      ? `rotate(${crossAngleDeg.value} ${CX} ${CY})`
      : undefined,
  );
  const crossTape = computed(
    () => props.crossColor || tint(props.ribbonColor, 0.62),
  );
  const crossFill = computed(() =>
    props.ribbon ? inkOn(crossTape.value) : props.crossColor || 'currentColor',
  );
  const crossDim = computed(() =>
    !props.ribbon && !props.crossColor ? 0.45 : 1,
  );

  const unit = computed(() => {
    const base = props.uppercase ? props.text.toUpperCase() : props.text;
    const gap = props.separator
      ? `\u00A0${props.separator}\u00A0`
      : '\u00A0\u00A0\u00A0';
    return `${base}${gap}`;
  });

  const textStyle = computed(() => ({
    fontSize: `${props.fontSize}px`,
    fontWeight: props.fontWeight,
    letterSpacing: `${props.letterSpacing}px`,
  }));

  const loopText = computed(() => unit.value.repeat(metrics.value.reps));
  const crossText = computed(() => unit.value.repeat(metrics.value.crossReps));
  const fitLength = computed(() => metrics.value.length || undefined);
  const crossFit = computed(() => metrics.value.crossLength || undefined);

  function paint(ink: string, opacity: number): TextLoopPaint {
    return props.outline
      ? {
          fill: 'none',
          stroke: ink,
          'stroke-opacity': opacity,
          'stroke-width': props.outlineWidth,
          'stroke-linejoin': 'round',
        }
      : { fill: ink, 'fill-opacity': opacity };
  }
  const mainPaint = computed(() => paint(fill.value, 1));
  const crossPaint = computed(() => paint(crossFill.value, crossDim.value));

  // ---- measurement -------------------------------------------------------
  function measure() {
    const pathEl = pathRef.value;
    const measureEl = measureRef.value;
    if (!pathEl || !measureEl) return;
    let length = 0;
    let unitWidth = 0;
    let crossLength = 0;
    try {
      length = pathEl.getTotalLength();
      unitWidth = measureEl.getComputedTextLength();
      crossLength = crossPathRef.value
        ? crossPathRef.value.getTotalLength()
        : 0;
    } catch {
      return;
    }
    if (!length) return;
    const repsFor = (total: number) =>
      unitWidth > 0 ? Math.max(1, Math.round(total / unitWidth)) : 1;
    const prev = metrics.value;
    const next: TextLoopMetrics = {
      length,
      reps: repsFor(length),
      crossLength,
      crossReps: repsFor(crossLength),
    };
    if (
      prev.length === next.length &&
      prev.reps === next.reps &&
      prev.crossLength === next.crossLength &&
      prev.crossReps === next.crossReps
    ) {
      return;
    }
    metrics.value = next;
  }

  // ---- motion state ------------------------------------------------------
  const reducedMotion = usePreferredReducedMotion();
  const reduced = computed(() => reducedMotion.value === 'reduce');
  const hover = createScaleTween();
  let progress = 0;
  let travel = 0;
  let fling = 0;
  let boost = 0;
  let scrollVelocity = 0;
  let scrollAt = 0;
  let scrollPos = 0;
  let scrollSource: EventTarget | null = null;
  let dragging = false;
  let pointerId: number | null = null;
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;
  let velocity = 0;
  let center = { x: 0, y: 0 };

  const sign = computed(() => (props.direction === 'reverse' ? -1 : 1));
  const base = computed(() =>
    reduced.value ? 0 : Math.max(0, props.speed) * sign.value,
  );
  const boosting = computed(() => props.scrollBoost > 0 && !reduced.value);
  const hoverScale = () => tweenValue(hover, performance.now());

  function apply() {
    const { length, crossLength } = metrics.value;
    const head = headRef.value;
    const tail = tailRef.value;
    if (!head || !tail || !length) return;
    const offset = wrap(travel, length);
    progress = offset / length;
    head.setAttribute('startOffset', String(offset));
    tail.setAttribute('startOffset', String(offset - length));
    const crossHead = crossHeadRef.value;
    const crossTail = crossTailRef.value;
    if (props.cross && crossHead && crossTail && crossLength > 0) {
      const crossOffset = wrap(-travel, crossLength);
      crossHead.setAttribute('startOffset', String(crossOffset));
      crossTail.setAttribute('startOffset', String(crossOffset - crossLength));
    }
  }

  const ticker = useRafFn(
    ({ delta }) => {
      if (dragging) return;
      const dt = Math.min(0.05, delta / 1000);
      fling *= Math.exp(-dt / 0.55);
      if (boosting.value) {
        if (performance.now() - scrollAt > 90) {
          scrollVelocity *= Math.exp(-dt / 0.12);
        }
        const target = clamp(
          scrollVelocity * props.scrollBoost * 0.35 * sign.value,
          -MAX_BOOST,
          MAX_BOOST,
        );
        boost += (target - boost) * (1 - Math.exp(-dt / 0.18));
      }
      const v = base.value * hoverScale() + fling + boost;
      if (Math.abs(v) < 0.01) return;
      travel += v * dt;
      apply();
    },
    { immediate: false },
  );

  const visible = shallowRef(false);
  useIntersectionObserver(rootRef, ([entry]) => {
    visible.value = Boolean(entry?.isIntersecting);
  });

  watch(
    [visible, reduced, () => metrics.value.length],
    ([isVisible, isReduced, length]) => {
      if (isVisible && !isReduced && length > 0) ticker.resume();
      else ticker.pause();
    },
  );

  // ---- interactions --------------------------------------------------------
  useEventListener(rootRef, 'pointerenter', (event: PointerEvent) => {
    if (!props.pauseOnHover || event.pointerType === 'touch') return;
    glideTween(hover, true, performance.now());
  });
  useEventListener(rootRef, 'pointerleave', () => {
    if (!props.pauseOnHover) return;
    glideTween(hover, false, performance.now());
  });

  function onDown(event: PointerEvent) {
    if (!props.draggable) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const root = rootRef.value;
    const svg = svgRef.value;
    if (!root || !svg) return;
    dragging = true;
    pointerId = event.pointerId;
    root.setPointerCapture?.(event.pointerId);
    lastX = event.clientX;
    lastY = event.clientY;
    lastT = performance.now();
    velocity = base.value * hoverScale() + fling + boost;
    const rect = svg.getBoundingClientRect();
    center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    root.style.cursor = 'grabbing';
  }

  function onMove(event: PointerEvent) {
    if (!dragging || event.pointerId !== pointerId) return;
    const svg = svgRef.value;
    if (!svg) return;
    const now = performance.now();
    let delta: number;
    if (!custom.value && props.shape === 'circle') {
      let turn =
        Math.atan2(event.clientY - center.y, event.clientX - center.x) -
        Math.atan2(lastY - center.y, lastX - center.x);
      if (turn > Math.PI) turn -= Math.PI * 2;
      if (turn < -Math.PI) turn += Math.PI * 2;
      delta = turn * circleRadius(props.curviness, props.ribbonWidth);
    } else {
      const angle = (mainAngle.value * Math.PI) / 180;
      const scale = VIEW_W / (svg.getBoundingClientRect().width || VIEW_W);
      delta =
        ((event.clientX - lastX) * Math.cos(angle) +
          (event.clientY - lastY) * Math.sin(angle)) *
        scale;
    }
    travel += delta;
    apply();
    const dt = Math.max(1, now - lastT) / 1000;
    velocity = velocity * 0.6 + (delta / dt) * 0.4;
    lastX = event.clientX;
    lastY = event.clientY;
    lastT = now;
  }

  function onUp(event: PointerEvent) {
    if (!dragging || event.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    if (rootRef.value) rootRef.value.style.cursor = '';
    if (reduced.value) return;
    const release =
      performance.now() - lastT > 90
        ? 0
        : clamp(velocity, -MAX_FLING, MAX_FLING);
    fling = release - (base.value * hoverScale() + boost);
  }

  useEventListener(rootRef, 'pointerdown', onDown);
  useEventListener(rootRef, 'pointermove', onMove);
  useEventListener(rootRef, 'pointerup', onUp);
  useEventListener(rootRef, 'pointercancel', onUp);

  function onScroll(event: Event) {
    if (!boosting.value) return;
    const root = rootRef.value;
    const source = event.target;
    if (!root || !source) return;
    const isPage =
      source === document ||
      source === document.documentElement ||
      source === document.body;
    if (!isPage && !(source instanceof Node && source.contains(root))) return;
    const pos = isPage
      ? window.scrollY
      : source instanceof Element
        ? source.scrollTop
        : 0;
    const now = performance.now();
    if (source !== scrollSource || now - scrollAt > 200) {
      scrollSource = source;
      scrollPos = pos;
      scrollAt = now;
      return;
    }
    const instant = (pos - scrollPos) / (Math.max(8, now - scrollAt) / 1000);
    scrollVelocity = scrollVelocity * 0.5 + instant * 0.5;
    scrollPos = pos;
    scrollAt = now;
  }
  useEventListener('scroll', onScroll, { capture: true, passive: true });

  // Upstream rebuilds its effect on these changes, which drops any
  // in-flight hover pause, throw or scroll push.
  watch(
    () => props.pauseOnHover,
    () => {
      Object.assign(hover, createScaleTween());
    },
  );
  watch(
    () => props.scrollBoost,
    () => {
      boost = 0;
      scrollVelocity = 0;
    },
  );
  watch(
    () => props.draggable,
    (on) => {
      if (on || !dragging) return;
      dragging = false;
      pointerId = null;
      if (rootRef.value) rootRef.value.style.cursor = '';
    },
  );

  onMounted(() => {
    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    apply();
  });

  watch(
    [
      d,
      crossD,
      unit,
      () => props.fontSize,
      () => props.fontWeight,
      () => props.letterSpacing,
    ],
    () => {
      measure();
      document.fonts?.ready.then(measure).catch(() => {});
    },
    { flush: 'post' },
  );

  watch(
    [() => metrics.value.length, () => props.cross],
    ([length], [prevLength]) => {
      if (length && length !== prevLength) travel = progress * length;
      void nextTick(apply);
    },
    { flush: 'post' },
  );
</script>

<template>
  <div
    ref="root"
    :class="[
      'text-loop',
      { 'text-loop--draggable': props.draggable },
      props.class,
    ]"
  >
    <svg
      ref="svg"
      class="text-loop-svg"
      :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="props.text"
    >
      <defs>
        <linearGradient
          v-if="fade.length > 0"
          :id="fadeId"
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <stop
            v-for="(stop, i) in fade"
            :key="i"
            :offset="stop.offset"
            stop-color="#ffffff"
            :stop-opacity="stop.opacity"
          />
        </linearGradient>
        <mask
          v-if="fade.length > 0"
          :id="maskId"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          :width="VIEW_W"
          :height="VIEW_H"
        >
          <rect :width="VIEW_W" :height="VIEW_H" :fill="`url(#${fadeId})`" />
        </mask>
        <template v-if="props.cross && props.ribbon">
          <filter
            :id="shadowId"
            filterUnits="userSpaceOnUse"
            :x="-VIEW_W"
            :y="-VIEW_H"
            :width="VIEW_W * 3"
            :height="VIEW_H * 3"
          >
            <feGaussianBlur
              :stdDeviation="Math.max(4, props.ribbonWidth * 0.11)"
            />
          </filter>
          <mask
            :id="underId"
            maskUnits="userSpaceOnUse"
            :x="-VIEW_W"
            :y="-VIEW_H"
            :width="VIEW_W * 3"
            :height="VIEW_H * 3"
          >
            <g :transform="crossTransform">
              <path
                :d="crossD"
                fill="none"
                stroke="#ffffff"
                :stroke-width="props.ribbonWidth"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </mask>
        </template>
      </defs>

      <text
        ref="measure"
        class="text-loop-measure"
        :style="textStyle"
        aria-hidden="true"
        v-text="unit"
      />

      <g :mask="fade.length > 0 ? `url(#${maskId})` : undefined">
        <g v-if="props.cross" :transform="crossTransform">
          <path
            :id="crossId"
            ref="crossPath"
            :d="crossD"
            fill="none"
            :stroke="props.ribbon ? crossTape : 'none'"
            :stroke-width="props.ribbon ? props.ribbonWidth : 0"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <text
            class="text-loop-text"
            :style="textStyle"
            v-bind="crossPaint"
            dominant-baseline="central"
            aria-hidden="true"
            :textLength="crossFit"
            lengthAdjust="spacing"
          >
            <textPath
              ref="crossHead"
              :href="`#${crossId}`"
              v-text="crossText"
            />
          </text>
          <text
            class="text-loop-text"
            :style="textStyle"
            v-bind="crossPaint"
            dominant-baseline="central"
            aria-hidden="true"
            :textLength="crossFit"
            lengthAdjust="spacing"
          >
            <textPath
              ref="crossTail"
              :href="`#${crossId}`"
              v-text="crossText"
            />
          </text>
        </g>

        <g v-if="props.cross && props.ribbon" :mask="`url(#${underId})`">
          <g
            :filter="`url(#${shadowId})`"
            :transform="`translate(0 ${Math.max(4, props.ribbonWidth * 0.08)})`"
          >
            <g :transform="mainTransform">
              <path
                :d="d"
                fill="none"
                stroke="#000000"
                :stroke-opacity="0.42"
                :stroke-width="props.ribbonWidth"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </g>
        </g>

        <g :transform="mainTransform">
          <path
            :id="pathId"
            ref="mainPath"
            :d="d"
            fill="none"
            :stroke="props.ribbon ? props.ribbonColor : 'none'"
            :stroke-width="props.ribbon ? props.ribbonWidth : 0"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <text
            class="text-loop-text"
            :style="textStyle"
            v-bind="mainPaint"
            dominant-baseline="central"
            aria-hidden="true"
            :textLength="fitLength"
            lengthAdjust="spacing"
          >
            <textPath ref="head" :href="`#${pathId}`" v-text="loopText" />
          </text>
          <text
            class="text-loop-text"
            :style="textStyle"
            v-bind="mainPaint"
            dominant-baseline="central"
            aria-hidden="true"
            :textLength="fitLength"
            lengthAdjust="spacing"
          >
            <textPath ref="tail" :href="`#${pathId}`" v-text="loopText" />
          </text>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
  .text-loop {
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  .text-loop--draggable {
    cursor: grab;
    touch-action: pan-y;
  }

  .text-loop-svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .text-loop-text {
    user-select: none;
  }

  .text-loop-measure {
    visibility: hidden;
    pointer-events: none;
  }
</style>
