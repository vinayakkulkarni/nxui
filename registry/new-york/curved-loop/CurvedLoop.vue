<script setup lang="ts">
  import {
    computed,
    nextTick,
    onMounted,
    onUpdated,
    ref,
    shallowRef,
    useId,
    watch,
  } from 'vue';
  import {
    useEventListener,
    useIntersectionObserver,
    usePreferredReducedMotion,
    useRafFn,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    MAX_FLING,
    VIEW_WIDTH,
    edgeMask,
    getGeometry,
    wrapAngle,
    wrapOffset,
  } from './curved-loop-geometry';
  import type { CSSProperties } from 'vue';
  import type { CurvedLoopDirection, CurvedLoopProps } from './types';

  const props = withDefaults(defineProps<CurvedLoopProps>(), {
    marqueeText: '',
    speed: 2,
    curveAmount: 400,
    direction: 'left',
    interactive: true,
    pauseOnHover: false,
    color: 'currentColor',
    edgeFade: 0,
    shape: 'arc',
    fontSize: 96,
    fontWeight: 700,
    letterSpacing: 0,
    outline: false,
    separator: '',
    separatorColor: undefined,
    scrollBoost: 0,
    class: '',
  });

  const NBSP = '\u00A0';
  const MASK_SIZE = VIEW_WIDTH * 3;

  const pathId = `curve-${useId().replace(/[^\w-]/g, '')}`;
  const maskId = `${pathId}-outline`;

  const jacketRef = ref<HTMLDivElement | null>(null);
  const svgRef = ref<SVGSVGElement | null>(null);
  const measureRef = ref<SVGTextElement | null>(null);
  const pathRef = ref<SVGPathElement | null>(null);
  const textPaths = shallowRef<SVGTextPathElement[]>([]);

  const spacing = ref(0);
  const pathLength = ref(0);
  const dragging = ref(false);

  let offset = 0;
  let velocity = 0;
  let currentDirection: CurvedLoopDirection = props.direction;
  let hovering = false;
  let scrollDistance = 0;
  let scrollLevel = 0;
  let last = 0;
  const scrollPositions = new Map<EventTarget, number>();
  const drag = {
    active: false,
    x: 0,
    time: 0,
    scale: 1,
    velocity: 0,
    ring: false,
    radius: 0,
    angle: 0,
    cx: 0,
    cy: 0,
  };

  const reducedMotion = usePreferredReducedMotion();

  const body = computed(() => props.marqueeText.replace(/\s+$/, ''));
  const mark = computed(() => String(props.separator ?? '').trim());
  const text = computed(() =>
    mark.value
      ? `${body.value}${NBSP}${mark.value}${NBSP}`
      : `${body.value}${NBSP}`,
  );
  const bodyText = computed(() => `${body.value}${NBSP}`);

  const ring = computed(() => props.shape === 'circle');
  const geometry = computed(() =>
    getGeometry(props.shape, props.curveAmount, props.fontSize, spacing.value),
  );
  const ready = computed(() => spacing.value > 0);
  const copies = computed(() => {
    if (!ready.value) return 1;
    if (ring.value) return geometry.value.repeats + 1;
    return Math.ceil((pathLength.value || 1800) / spacing.value) + 2;
  });
  const mask = computed(() => edgeMask(props.edgeFade, geometry.value.span));
  const accent = computed(() => Boolean(mark.value && props.separatorColor));
  const plain = computed(() => text.value.repeat(copies.value));

  const jacketStyle = computed<CSSProperties>(() => {
    let cursor = 'auto';
    if (props.interactive) cursor = dragging.value ? 'grabbing' : 'grab';
    return {
      visibility: ready.value ? 'visible' : 'hidden',
      cursor,
      touchAction: props.interactive ? 'pan-y' : 'auto',
      maskImage: mask.value,
      WebkitMaskImage: mask.value,
    };
  });

  const svgStyle = computed(() => ({
    fontSize: `${props.fontSize}px`,
    fontWeight: props.fontWeight,
    letterSpacing: `${props.letterSpacing}px`,
    ...(ring.value
      ? {
          width: `${(geometry.value.span * 100).toFixed(3)}%`,
          aspectRatio: '1',
        }
      : {}),
  }));

  function applyOffset(): void {
    const value = `${offset}px`;
    for (const node of textPaths.value) node.setAttribute('startOffset', value);
  }

  function collectTextPaths(): void {
    textPaths.value = svgRef.value
      ? Array.from(svgRef.value.querySelectorAll('textPath'))
      : [];
    applyOffset();
  }

  function measure(): void {
    if (measureRef.value) {
      spacing.value = measureRef.value.getComputedTextLength();
    }
  }

  function measurePath(): void {
    if (pathRef.value) pathLength.value = pathRef.value.getTotalLength();
  }

  watch(
    [
      text,
      () => props.class,
      () => props.fontSize,
      () => props.fontWeight,
      () => props.letterSpacing,
    ],
    () => nextTick(measure),
  );

  watch(
    () => geometry.value.d,
    () => nextTick(measurePath),
  );

  watch(
    () => props.direction,
    (value) => {
      currentDirection = value;
    },
  );

  watch(spacing, (value) => {
    if (value > 0) offset = wrapOffset(offset, value);
  });

  useResizeObserver(svgRef, measure);

  onMounted(() => {
    measure();
    measurePath();
    collectTextPaths();
    const fonts = document.fonts;
    fonts?.ready.then(measure);
    useEventListener(fonts, 'loadingdone', measure);
  });

  onUpdated(collectTextPaths);

  function onScroll(event: Event): void {
    if (!props.scrollBoost) return;
    const target = event.target instanceof Element ? event.target : window;
    if (
      target instanceof Element &&
      jacketRef.value &&
      !target.contains(jacketRef.value)
    ) {
      return;
    }
    const position =
      target instanceof Element ? target.scrollTop : window.scrollY;
    const previous = scrollPositions.get(target);
    scrollPositions.set(target, position);
    if (previous !== undefined) scrollDistance += Math.abs(position - previous);
  }

  useEventListener('scroll', onScroll, { passive: true, capture: true });

  const { pause, resume } = useRafFn(
    ({ timestamp }) => {
      const dt = last ? Math.min((timestamp - last) / 1000, 0.05) : 0;
      last = timestamp;
      const rate = dt > 0 ? scrollDistance / dt : 0;
      scrollDistance = 0;
      scrollLevel +=
        (rate - scrollLevel) *
        (1 - Math.exp(-dt * (rate > scrollLevel ? 10 : 2.4)));
      if (drag.active) return;
      const sign = currentDirection === 'right' ? 1 : -1;
      const halted =
        reducedMotion.value === 'reduce' || (props.pauseOnHover && hovering);
      const target = halted ? 0 : sign * props.speed * 60;
      const extra = halted ? 0 : sign * scrollLevel * props.scrollBoost * 0.3;
      velocity += (target - velocity) * (1 - Math.exp(-dt * 3));
      const step = (velocity + extra) * dt;
      if (Math.abs(step) > 0.0001) {
        offset = wrapOffset(offset + step, spacing.value);
        applyOffset();
      }
    },
    { immediate: false },
  );

  const visible = ref(true);

  useIntersectionObserver(jacketRef, (entries) => {
    const entry = entries[entries.length - 1];
    if (entry) visible.value = entry.isIntersecting;
  });

  watch(
    [ready, visible],
    ([isReady, isVisible]) => {
      if (isReady && isVisible) {
        last = 0;
        scrollLevel = 0;
        resume();
      } else {
        pause();
      }
    },
    { immediate: true },
  );

  function onPointerDown(event: PointerEvent): void {
    if (!props.interactive || !ready.value) return;
    const rect = svgRef.value?.getBoundingClientRect();
    const width = rect?.width || VIEW_WIDTH;
    const cx = rect ? rect.left + rect.width / 2 : event.clientX;
    const cy = rect ? rect.top + rect.height / 2 : event.clientY;
    Object.assign(drag, {
      active: true,
      x: event.clientX,
      time: performance.now(),
      scale: VIEW_WIDTH / width,
      velocity: 0,
      ring: ring.value,
      radius: geometry.value.radius,
      angle: Math.atan2(event.clientY - cy, event.clientX - cx),
      cx,
      cy,
    });
    velocity = 0;
    dragging.value = true;
    jacketRef.value?.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event: PointerEvent): void {
    if (!drag.active) return;
    const now = performance.now();
    let delta = (event.clientX - drag.x) * drag.scale;
    if (drag.ring) {
      const angle = Math.atan2(
        event.clientY - drag.cy,
        event.clientX - drag.cx,
      );
      delta = wrapAngle(angle - drag.angle) * drag.radius;
      drag.angle = angle;
    }
    const dt = Math.max(now - drag.time, 1) / 1000;
    drag.x = event.clientX;
    drag.time = now;
    drag.velocity = drag.velocity * 0.5 + (delta / dt) * 0.5;
    offset = wrapOffset(offset + delta, spacing.value);
    applyOffset();
  }

  function endDrag(): void {
    if (!drag.active) return;
    drag.active = false;
    dragging.value = false;
    const fling =
      performance.now() - drag.time > 100
        ? 0
        : Math.max(-MAX_FLING, Math.min(MAX_FLING, drag.velocity));
    velocity = fling;
    if (Math.abs(fling) > 60) currentDirection = fling > 0 ? 'right' : 'left';
  }

  function onPointerEnter(): void {
    hovering = true;
  }

  function onPointerLeave(): void {
    hovering = false;
    endDrag();
  }
</script>

<template>
  <div
    ref="jacketRef"
    :class="cn('flex size-full items-center justify-center', props.class)"
    :style="jacketStyle"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="endDrag"
    @pointercancel="endDrag"
    @lostpointercapture="endDrag"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
  >
    <svg
      ref="svgRef"
      class="block aspect-100/12 w-full overflow-visible fill-current leading-none uppercase select-none"
      :viewBox="geometry.viewBox"
      :style="svgStyle"
      role="img"
      :aria-label="marqueeText"
    >
      <text
        ref="measureRef"
        xml:space="preserve"
        style="visibility: hidden; opacity: 0; pointer-events: none"
        v-text="text"
      />
      <defs>
        <path
          :id="pathId"
          ref="pathRef"
          :d="geometry.d"
          fill="none"
          stroke="transparent"
        />
        <mask
          v-if="ready && outline"
          :id="maskId"
          mask-units="userSpaceOnUse"
          :x="-VIEW_WIDTH"
          :y="-VIEW_WIDTH"
          :width="MASK_SIZE"
          :height="MASK_SIZE"
        >
          <rect
            :x="-VIEW_WIDTH"
            :y="-VIEW_WIDTH"
            :width="MASK_SIZE"
            :height="MASK_SIZE"
            fill="#fff"
          />
          <text xml:space="preserve" fill="#000">
            <textPath
              :href="`#${pathId}`"
              xml:space="preserve"
              v-text="plain"
            />
          </text>
        </mask>
      </defs>
      <template v-if="ready">
        <text
          v-if="outline"
          xml:space="preserve"
          fill="none"
          :stroke="color"
          :stroke-width="fontSize * 0.05"
          stroke-linejoin="round"
          :mask="`url(#${maskId})`"
        >
          <textPath v-if="accent" :href="`#${pathId}`" xml:space="preserve">
            <template v-for="i in copies" :key="i">
              <tspan v-text="bodyText" />
              <tspan stroke="none" v-text="mark" />
              <tspan v-text="NBSP" />
            </template>
          </textPath>
          <textPath
            v-else
            :href="`#${pathId}`"
            xml:space="preserve"
            v-text="plain"
          />
        </text>
        <text v-else xml:space="preserve" :fill="color">
          <textPath v-if="accent" :href="`#${pathId}`" xml:space="preserve">
            <template v-for="i in copies" :key="i">
              <tspan v-text="bodyText" />
              <tspan :fill="separatorColor" v-text="mark" />
              <tspan v-text="NBSP" />
            </template>
          </textPath>
          <textPath
            v-else
            :href="`#${pathId}`"
            xml:space="preserve"
            v-text="plain"
          />
        </text>
        <text
          v-if="outline && accent"
          xml:space="preserve"
          fill="none"
          aria-hidden="true"
        >
          <textPath :href="`#${pathId}`" xml:space="preserve">
            <template v-for="i in copies" :key="i">
              <tspan v-text="bodyText" />
              <tspan :fill="separatorColor" v-text="mark" />
              <tspan v-text="NBSP" />
            </template>
          </textPath>
        </text>
      </template>
    </svg>
  </div>
</template>
