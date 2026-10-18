<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    useSlots,
    watch,
    watchEffect,
  } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { cn } from '~/lib/utils';
  import {
    TAU,
    clamp,
    decimalsOf,
    inkFor,
    readColor,
    rubber,
  } from './elastic-slider';
  import type {
    ElasticSliderDrag,
    ElasticSliderMotion,
    ElasticSliderProps,
  } from './types';

  const props = withDefaults(defineProps<ElasticSliderProps>(), {
    modelValue: undefined,
    defaultValue: 50,
    startingValue: 0,
    maxValue: 100,
    isStepped: false,
    stepSize: 1,
    orientation: 'horizontal',
    leftIcon: 'lucide:volume-1',
    rightIcon: 'lucide:volume-2',
    iconPlacement: 'outside',
    valuePosition: 'top',
    formatValue: undefined,
    ticks: false,
    thumb: false,
    fillFrom: undefined,
    thickness: 6,
    activeThickness: 12,
    radius: undefined,
    restOpacity: 0.7,
    growOnHover: true,
    maxStretch: 50,
    bounce: 0.5,
    jumpToClick: true,
    wheel: false,
    trackColor: 'color-mix(in srgb, currentColor 18%, transparent)',
    rangeColor: 'currentColor',
    iconColor: 'currentColor',
    contentColor: 'currentColor',
    fillContentColor: 'auto',
    thumbColor: '#ffffff',
    disabled: false,
    ariaLabel: 'Slider',
    class: '',
  });

  const emit = defineEmits<{
    'update:modelValue': [value: number];
    change: [value: number];
    'change-end': [value: number];
  }>();

  const slots = useSlots();
  const reducedMotion = usePreferredReducedMotion();

  const rootRef = ref<HTMLElement | null>(null);
  const hitRef = ref<HTMLElement | null>(null);
  const bodyRef = ref<HTMLElement | null>(null);
  const trackRef = ref<HTMLElement | null>(null);
  const rangeRef = ref<HTMLElement | null>(null);
  const thumbRef = ref<HTMLElement | null>(null);
  const bubbleRef = ref<HTMLElement | null>(null);
  const startIconRef = ref<HTMLElement | null>(null);
  const endIconRef = ref<HTMLElement | null>(null);

  const motion: ElasticSliderMotion = {
    p: 0,
    vp: 0,
    target: 0,
    s: 0,
    vs: 0,
    side: 1,
    held: false,
    a: 0,
    va: 0,
    goal: 0,
    length: 0,
    dragging: false,
    hovered: false,
    focused: false,
    raf: 0,
    last: 0,
    ready: false,
  };
  let drag: ElasticSliderDrag | null = null;
  let wheelTimer: ReturnType<typeof setTimeout> | undefined;

  const inner = ref(props.defaultValue);
  const controlled = computed(() => props.modelValue !== undefined);

  const settings = computed(() => {
    const lo = Math.min(props.startingValue, props.maxValue);
    const hi = Math.max(props.startingValue, props.maxValue);
    const span = hi - lo || 1;
    return {
      lo,
      hi,
      span,
      step: props.isStepped && props.stepSize > 0 ? props.stepSize : 0,
      vertical: props.orientation === 'vertical',
      origin: clamp(((props.fillFrom ?? lo) - lo) / span, 0, 1),
      thickness: Math.max(1, props.thickness),
      activeThickness: Math.max(1, props.activeThickness),
      radius: props.radius,
      restOpacity: clamp(props.restOpacity, 0, 1),
      growOnHover: props.growOnHover,
      maxStretch: Math.max(0, props.maxStretch),
      bounce: clamp(props.bounce, 0, 0.95),
      jumpToClick: props.jumpToClick,
    };
  });

  const current = computed(() =>
    clamp(
      props.modelValue ?? inner.value,
      settings.value.lo,
      settings.value.hi,
    ),
  );
  let committed = current.value;

  const label = computed(() => {
    if (props.formatValue) return props.formatValue(current.value);
    const step = settings.value.step;
    return step
      ? current.value.toFixed(decimalsOf(step))
      : String(Math.round(current.value));
  });

  const place = computed(() =>
    ['top', 'bubble', 'inside', 'none'].includes(props.valuePosition)
      ? props.valuePosition
      : 'top',
  );
  const inside = computed(() => props.iconPlacement === 'inside');
  const hasLeft = computed(() => Boolean(slots['left-icon'] || props.leftIcon));
  const hasRight = computed(() =>
    Boolean(slots['right-icon'] || props.rightIcon),
  );
  const insideStart = computed(() => inside.value && hasLeft.value);
  const insideEndIcon = computed(
    () => place.value !== 'inside' && inside.value && hasRight.value,
  );
  const hasContent = computed(
    () => insideStart.value || place.value === 'inside' || insideEndIcon.value,
  );

  const marks = computed(() => {
    const { lo, hi, span, step } = settings.value;
    const count = step ? Math.round((hi - lo) / step) : 0;
    let values: number[] = [];
    if (Array.isArray(props.ticks)) values = props.ticks;
    else if (props.ticks) {
      values =
        count > 0 && count <= 40
          ? Array.from({ length: count + 1 }, (_, index) => lo + index * step)
          : Array.from(
              { length: 11 },
              (_, index) => lo + (index / 10) * (hi - lo),
            );
    }
    return values
      .map((tick) => (tick - lo) / span)
      .filter((fraction) => fraction > 0.001 && fraction < 0.999);
  });

  function markStyle(fraction: number) {
    return settings.value.vertical
      ? { bottom: `${fraction * 100}%` }
      : { left: `${fraction * 100}%` };
  }

  const thumbSize = computed(() => clamp(props.activeThickness + 6, 16, 28));

  const rootStyle = computed(() => ({
    '--elastic-slider-track': props.trackColor,
    '--elastic-slider-range': props.rangeColor,
    '--elastic-slider-icon': props.iconColor,
    '--elastic-slider-content': props.contentColor,
    ...(props.fillContentColor !== 'auto'
      ? { '--elastic-slider-fill-content': props.fillContentColor }
      : {}),
    '--elastic-slider-thumb': props.thumbColor,
    '--elastic-slider-thumb-size': `${thumbSize.value}px`,
    '--elastic-slider-hit': `${Math.max(34, props.thickness, props.activeThickness)}px`,
    '--elastic-slider-pad': `${Math.max(8, Math.round(props.thickness * 0.32))}px`,
    '--elastic-slider-bubble-offset': `${(props.thumb ? thumbSize.value * 1.12 : props.activeThickness) / 2 + 8}px`,
    ...(props.radius !== undefined
      ? { '--elastic-slider-radius': `${props.radius}px` }
      : {}),
  }));

  function snap(raw: number) {
    const s = settings.value;
    let next = clamp(raw, s.lo, s.hi);
    if (s.step) {
      next = clamp(
        s.lo + Math.round((next - s.lo) / s.step) * s.step,
        s.lo,
        s.hi,
      );
    }
    return Number(next.toFixed(10));
  }

  function paint() {
    const m = motion;
    const s = settings.value;
    const track = trackRef.value;
    const range = rangeRef.value;
    if (!track || !range) return;
    const thick = s.thickness + (s.activeThickness - s.thickness) * m.a;
    track.style.width = s.vertical ? `${thick.toFixed(2)}px` : '';
    track.style.height = s.vertical ? '' : `${thick.toFixed(2)}px`;
    track.style.setProperty(
      '--elastic-slider-reveal',
      clamp((thick - 14) / 10, 0, 1).toFixed(3),
    );
    const length = Math.max(1, m.length);
    const along = 1 + m.s / length;
    const across = 1 - 0.22 * clamp(m.s / Math.max(1, s.maxStretch), -1, 1);
    const atEnd = m.side > 0;
    if (s.vertical) track.style.transformOrigin = atEnd ? '50% 100%' : '50% 0%';
    else track.style.transformOrigin = atEnd ? '0% 50%' : '100% 50%';
    const scaleX = s.vertical ? across : along;
    const scaleY = s.vertical ? along : across;
    track.style.transform = `scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`;
    track.style.setProperty(
      '--elastic-slider-unscale',
      `scale(${(1 / scaleX).toFixed(4)}, ${(1 / scaleY).toFixed(4)})`,
    );
    const p = clamp(m.p, 0, 1);
    const from = (Math.min(s.origin, p) * 100).toFixed(3);
    const to = ((1 - Math.max(s.origin, p)) * 100).toFixed(3);
    const round = (s.radius ?? thick / 2).toFixed(2);
    range.style.clipPath = s.vertical
      ? `inset(${to}% 0 ${from}% 0 round ${round}px)`
      : `inset(0 ${to}% 0 ${from}% round ${round}px)`;
    const position = atEnd
      ? p * length * along
      : length - (1 - p) * length * along;
    const shift = s.vertical
      ? `translate3d(0, ${(-position).toFixed(2)}px, 0)`
      : `translate3d(${position.toFixed(2)}px, 0, 0)`;
    if (thumbRef.value) {
      thumbRef.value.style.transform = `${shift} scale(${(1 + 0.12 * m.a).toFixed(3)})`;
    }
    if (bubbleRef.value) {
      const center = s.vertical ? 'translate(0, 50%)' : 'translate(-50%, 0)';
      bubbleRef.value.style.transform = `${shift} ${center} scale(${(0.7 + 0.3 * m.a).toFixed(3)})`;
      bubbleRef.value.style.opacity = clamp(m.a * 1.4 - 0.2, 0, 1).toFixed(3);
    }
    const startShift = atEnd ? 0 : m.s;
    const endShift = atEnd ? m.s : 0;
    const iconScale = (1 + 0.08 * m.a).toFixed(3);
    if (startIconRef.value) {
      startIconRef.value.style.transform = s.vertical
        ? `translate3d(0, ${startShift.toFixed(2)}px, 0) scale(${iconScale})`
        : `translate3d(${(-startShift).toFixed(2)}px, 0, 0) scale(${iconScale})`;
    }
    if (endIconRef.value) {
      endIconRef.value.style.transform = s.vertical
        ? `translate3d(0, ${(-endShift).toFixed(2)}px, 0) scale(${iconScale})`
        : `translate3d(${endShift.toFixed(2)}px, 0, 0) scale(${iconScale})`;
    }
    if (bodyRef.value) {
      bodyRef.value.style.opacity =
        s.restOpacity < 1
          ? (s.restOpacity + (1 - s.restOpacity) * m.a).toFixed(3)
          : '';
    }
  }

  function frame(now: number) {
    const m = motion;
    m.raf = 0;
    const s = settings.value;
    const elapsed = clamp((now - m.last) / 1000, 0, 1 / 20);
    m.last = now;
    if (reducedMotion.value === 'reduce') {
      m.p = m.target;
      m.vp = 0;
      if (!m.held) {
        m.s = 0;
        m.vs = 0;
      }
      m.a = m.goal;
      m.va = 0;
    } else {
      const steps = Math.max(1, Math.ceil(elapsed / (1 / 240)));
      const dt = elapsed / steps;
      const fillOmega = TAU / (m.dragging ? 0.09 : 0.3);
      const fillZeta = m.dragging ? 1 : 0.86;
      const stretchOmega = TAU / 0.42;
      const stretchZeta = 1 - 0.9 * s.bounce;
      const activeOmega = TAU / 0.32;
      for (let i = 0; i < steps; i++) {
        m.vp +=
          (-fillOmega * fillOmega * (m.p - m.target) -
            2 * fillZeta * fillOmega * m.vp) *
          dt;
        m.p += m.vp * dt;
        if (!m.held) {
          m.vs +=
            (-stretchOmega * stretchOmega * m.s -
              2 * stretchZeta * stretchOmega * m.vs) *
            dt;
          m.s += m.vs * dt;
        }
        m.va +=
          (-activeOmega * activeOmega * (m.a - m.goal) -
            2 * 0.9 * activeOmega * m.va) *
          dt;
        m.a += m.va * dt;
      }
    }
    const settled =
      Math.abs(m.p - m.target) < 0.0004 &&
      Math.abs(m.vp) < 0.002 &&
      (m.held || (Math.abs(m.s) < 0.05 && Math.abs(m.vs) < 0.5)) &&
      Math.abs(m.a - m.goal) < 0.002 &&
      Math.abs(m.va) < 0.005;
    if (settled) {
      m.p = m.target;
      m.vp = 0;
      m.a = m.goal;
      m.va = 0;
      if (!m.held) {
        m.s = 0;
        m.vs = 0;
      }
    }
    paint();
    if (!settled || m.dragging) m.raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (motion.raf || typeof window === 'undefined') return;
    motion.last = performance.now();
    motion.raf = requestAnimationFrame(frame);
  }

  function autoInk() {
    const root = rootRef.value;
    const range = rangeRef.value;
    if (!root || !range || props.fillContentColor !== 'auto') return;
    root.style.setProperty(
      '--elastic-slider-fill-content',
      inkFor(readColor(getComputedStyle(range).backgroundColor)),
    );
  }

  function refreshGoal() {
    const m = motion;
    m.goal =
      (m.hovered && settings.value.growOnHover) || m.dragging || m.focused
        ? 1
        : 0;
    kick();
  }

  function pulse(side: number) {
    const icon = (side > 0 ? endIconRef : startIconRef).value
      ?.firstElementChild;
    if (!icon || reducedMotion.value === 'reduce') return;
    icon.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.35)' },
        { transform: 'scale(1)' },
      ],
      { duration: 280, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
    );
  }

  function bump(side: number) {
    const m = motion;
    const s = settings.value;
    if (!s.maxStretch || m.held || Math.abs(m.vs) > 40 || Math.abs(m.s) > 2) {
      return;
    }
    m.side = side;
    m.vs = s.maxStretch * 5.5;
    pulse(side);
    kick();
  }

  function commit(next: number) {
    const s = settings.value;
    motion.target = (next - s.lo) / s.span;
    kick();
    if (next === committed) return;
    committed = next;
    if (!controlled.value) inner.value = next;
    emit('update:modelValue', next);
    emit('change', next);
  }

  function alongOf(event: PointerEvent) {
    const rect = hitRef.value?.getBoundingClientRect();
    if (!rect) return 0;
    return settings.value.vertical
      ? rect.bottom - event.clientY
      : event.clientX - rect.left;
  }

  function follow(event: PointerEvent) {
    const d = drag;
    if (!d) return;
    const m = motion;
    const s = settings.value;
    const length = Math.max(1, m.length);
    const position = alongOf(event);
    const fraction =
      d.from === null
        ? position / length
        : d.from + (position - d.origin) / length;
    let over = 0;
    if (fraction < 0) over = -fraction * length;
    else if (fraction > 1) over = (fraction - 1) * length;
    if (over > 0 && s.maxStretch > 0) {
      const side = fraction < 0 ? -1 : 1;
      if (!m.held || m.side !== side) pulse(side);
      m.held = true;
      m.side = side;
      m.s = rubber(over, s.maxStretch);
      m.vs = 0;
    } else if (m.held) {
      m.held = false;
    }
    commit(snap(s.lo + clamp(fraction, 0, 1) * s.span));
  }

  function onPointerDown(event: PointerEvent) {
    const hit = hitRef.value;
    if (props.disabled || event.button !== 0 || !hit) return;
    hit.setPointerCapture(event.pointerId);
    const s = settings.value;
    drag = {
      id: event.pointerId,
      origin: alongOf(event),
      from: s.jumpToClick ? null : motion.target,
    };
    motion.dragging = true;
    hit.setAttribute('data-dragging', '');
    refreshGoal();
    if (s.jumpToClick) {
      commit(
        snap(
          s.lo +
            clamp(alongOf(event) / Math.max(1, motion.length), 0, 1) * s.span,
        ),
      );
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (!drag || drag.id !== event.pointerId) return;
    follow(event);
  }

  function release() {
    if (!drag) return;
    drag = null;
    motion.dragging = false;
    motion.held = false;
    hitRef.value?.removeAttribute('data-dragging');
    refreshGoal();
    emit('change-end', committed);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (props.disabled) return;
    const s = settings.value;
    const unit = s.step || s.span / 100;
    const large = Math.max(unit, s.span / 10);
    const now = committed;
    const keys: Record<string, number> = {
      ArrowRight: now + unit,
      ArrowUp: now + unit,
      ArrowLeft: now - unit,
      ArrowDown: now - unit,
      PageUp: now + large,
      PageDown: now - large,
      Home: s.lo,
      End: s.hi,
    };
    const wanted = keys[event.key];
    if (wanted === undefined) return;
    event.preventDefault();
    const next = snap(wanted);
    if (next === now) {
      if (wanted !== now) bump(wanted > now ? 1 : -1);
      return;
    }
    commit(next);
    emit('change-end', next);
  }

  function onFocus(event: FocusEvent) {
    const target = event.currentTarget;
    motion.focused =
      target instanceof HTMLElement && target.matches(':focus-visible');
    refreshGoal();
  }

  function onBlur() {
    motion.focused = false;
    refreshGoal();
  }

  function onEnter() {
    motion.hovered = true;
    autoInk();
    refreshGoal();
  }

  function onLeave() {
    motion.hovered = false;
    refreshGoal();
  }

  function onWheel(event: WheelEvent) {
    if (!props.wheel || props.disabled) return;
    event.preventDefault();
    const s = settings.value;
    const delta =
      Math.abs(event.deltaY) >= Math.abs(event.deltaX)
        ? -event.deltaY
        : event.deltaX;
    if (!delta) return;
    const amount = s.step ? Math.sign(delta) * s.step : (delta * s.span) / 800;
    const next = snap(committed + amount);
    if (next === committed) {
      bump(Math.sign(delta));
      return;
    }
    commit(next);
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => emit('change-end', committed), 200);
  }

  function measure() {
    const hit = hitRef.value;
    if (!hit) return;
    motion.length = settings.value.vertical
      ? hit.clientHeight
      : hit.clientWidth;
    paint();
  }

  useEventListener(hitRef, 'wheel', onWheel, { passive: false });
  useResizeObserver(hitRef, measure);

  watch([current, () => settings.value.lo, () => settings.value.span], () => {
    committed = current.value;
    const fraction = (current.value - settings.value.lo) / settings.value.span;
    if (!motion.dragging) motion.target = fraction;
    if (!motion.ready) return;
    kick();
  });

  watch(() => props.orientation, measure, { flush: 'post' });
  watch(() => props.growOnHover, refreshGoal);

  // Repaint (and re-pick the fill ink) whenever a visual prop changes.
  watchEffect(
    () => {
      void props.rangeColor;
      void props.fillContentColor;
      void settings.value;
      autoInk();
      paint();
    },
    { flush: 'post' },
  );

  onMounted(() => {
    const fraction = (current.value - settings.value.lo) / settings.value.span;
    motion.target = fraction;
    motion.p = fraction;
    motion.ready = true;
    measure();
    autoInk();
    paint();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(motion.raf);
    clearTimeout(wheelTimer);
  });
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('elastic-slider', props.class)"
    :style="rootStyle"
    :data-orientation="settings.vertical ? 'vertical' : 'horizontal'"
    :data-disabled="props.disabled ? '' : undefined"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
  >
    <span
      v-if="place === 'top'"
      class="elastic-slider__value"
      aria-hidden="true"
    >
      {{ label }}
    </span>
    <div ref="bodyRef" class="elastic-slider__body">
      <span
        v-if="!inside && hasLeft"
        ref="startIconRef"
        class="elastic-slider__icon"
        aria-hidden="true"
      >
        <span class="elastic-slider__icon-inner">
          <slot name="left-icon">
            <Icon :name="props.leftIcon ?? ''" class="size-5" :size="20" />
          </slot>
        </span>
      </span>
      <div
        ref="hitRef"
        class="elastic-slider__hit"
        role="slider"
        :tabindex="props.disabled ? -1 : 0"
        :aria-label="props.ariaLabel"
        :aria-valuemin="settings.lo"
        :aria-valuemax="settings.hi"
        :aria-valuenow="current"
        :aria-valuetext="label"
        :aria-orientation="settings.vertical ? 'vertical' : 'horizontal'"
        :aria-disabled="props.disabled || undefined"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="release"
        @pointercancel="release"
        @lostpointercapture="release"
        @keydown="onKeyDown"
        @focus="onFocus"
        @blur="onBlur"
      >
        <div ref="trackRef" class="elastic-slider__track">
          <span
            v-for="fraction in marks"
            :key="`t${fraction}`"
            class="elastic-slider__tick"
            :style="markStyle(fraction)"
          ></span>
          <span v-if="hasContent" class="elastic-slider__content">
            <span>
              <slot v-if="insideStart" name="left-icon">
                <Icon :name="props.leftIcon ?? ''" class="size-5" :size="20" />
              </slot>
            </span>
            <span>
              <span v-if="place === 'inside'">{{ label }}</span>
              <slot v-else-if="insideEndIcon" name="right-icon">
                <Icon :name="props.rightIcon ?? ''" class="size-5" :size="20" />
              </slot>
            </span>
          </span>
          <div ref="rangeRef" class="elastic-slider__range">
            <span
              v-for="fraction in marks"
              :key="`f${fraction}`"
              class="elastic-slider__tick elastic-slider__tick--fill"
              :style="markStyle(fraction)"
            ></span>
            <span
              v-if="hasContent"
              class="elastic-slider__content elastic-slider__content--fill"
            >
              <span>
                <slot v-if="insideStart" name="left-icon">
                  <Icon
                    :name="props.leftIcon ?? ''"
                    class="size-5"
                    :size="20"
                  />
                </slot>
              </span>
              <span>
                <span v-if="place === 'inside'">{{ label }}</span>
                <slot v-else-if="insideEndIcon" name="right-icon">
                  <Icon
                    :name="props.rightIcon ?? ''"
                    class="size-5"
                    :size="20"
                  />
                </slot>
              </span>
            </span>
          </div>
        </div>
        <span
          v-if="props.thumb"
          ref="thumbRef"
          class="elastic-slider__thumb"
          aria-hidden="true"
        ></span>
        <span
          v-if="place === 'bubble'"
          ref="bubbleRef"
          class="elastic-slider__bubble"
          aria-hidden="true"
        >
          <span class="elastic-slider__bubble-text">{{ label }}</span>
        </span>
      </div>
      <span
        v-if="!inside && hasRight"
        ref="endIconRef"
        class="elastic-slider__icon"
        aria-hidden="true"
      >
        <span class="elastic-slider__icon-inner">
          <slot name="right-icon">
            <Icon :name="props.rightIcon ?? ''" class="size-5" :size="20" />
          </slot>
        </span>
      </span>
    </div>
  </div>
</template>

<style scoped>
  /* Root size lives in a layer so Tailwind width/height utilities override it. */
  @layer components {
    .elastic-slider {
      width: 12rem;
    }

    .elastic-slider[data-orientation='vertical'] {
      width: auto;
      height: 12rem;
    }
  }

  .elastic-slider {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: inherit;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .elastic-slider[data-disabled] {
    opacity: 0.45;
    pointer-events: none;
  }

  .elastic-slider__value {
    font-size: 12px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    opacity: 0.6;
  }

  .elastic-slider__body {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 0;
  }

  .elastic-slider[data-orientation='vertical'] .elastic-slider__body {
    flex-direction: column-reverse;
    width: auto;
    height: 100%;
  }

  .elastic-slider__icon {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    color: var(--elastic-slider-icon, currentColor);
    will-change: transform;
  }

  .elastic-slider__icon-inner {
    display: grid;
    place-items: center;
  }

  .elastic-slider__hit {
    position: relative;
    display: flex;
    flex: 1;
    align-items: center;
    min-width: 0;
    height: var(--elastic-slider-hit, 34px);
    outline: none;
    cursor: grab;
    touch-action: none;
  }

  .elastic-slider[data-orientation='vertical'] .elastic-slider__hit {
    flex-direction: column;
    justify-content: flex-end;
    width: var(--elastic-slider-hit, 34px);
    height: auto;
    min-height: 0;
  }

  .elastic-slider__hit[data-dragging] {
    cursor: grabbing;
  }

  .elastic-slider__hit:focus-visible .elastic-slider__track {
    outline: 2px solid currentColor;
    outline-offset: 3px;
  }

  .elastic-slider__track {
    position: relative;
    flex-shrink: 0;
    width: 100%;
    height: 6px;
    overflow: hidden;
    border-radius: var(--elastic-slider-radius, 999px);
    background: var(--elastic-slider-track);
    will-change: transform;
  }

  .elastic-slider[data-orientation='vertical'] .elastic-slider__track {
    width: 6px;
    height: 100%;
  }

  .elastic-slider__range {
    position: absolute;
    inset: 0;
    background: var(--elastic-slider-range);
    clip-path: inset(0 100% 0 0);
  }

  .elastic-slider__content {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--elastic-slider-pad, 12px);
    color: var(--elastic-slider-content);
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    opacity: var(--elastic-slider-reveal, 1);
    pointer-events: none;
  }

  .elastic-slider__content > span {
    display: grid;
    place-items: center;
    transform: var(--elastic-slider-unscale, none);
  }

  .elastic-slider[data-orientation='vertical'] .elastic-slider__content {
    flex-direction: column-reverse;
    padding: var(--elastic-slider-pad, 12px) 0;
  }

  .elastic-slider__content--fill {
    color: var(--elastic-slider-fill-content);
  }

  .elastic-slider__tick {
    position: absolute;
    top: 50%;
    width: 3px;
    height: 3px;
    margin: -1.5px 0 0 -1.5px;
    border-radius: 999px;
    background: var(--elastic-slider-content);
    opacity: 0.4;
  }

  .elastic-slider[data-orientation='vertical'] .elastic-slider__tick {
    top: auto;
    left: 50%;
    margin: 0 0 -1.5px -1.5px;
  }

  .elastic-slider__tick--fill {
    background: var(--elastic-slider-fill-content);
    opacity: 0.5;
  }

  .elastic-slider__thumb {
    position: absolute;
    top: 50%;
    left: 0;
    width: var(--elastic-slider-thumb-size, 18px);
    height: var(--elastic-slider-thumb-size, 18px);
    margin-top: calc(var(--elastic-slider-thumb-size, 18px) / -2);
    margin-left: calc(var(--elastic-slider-thumb-size, 18px) / -2);
    border-radius: 999px;
    background: var(--elastic-slider-thumb, #ffffff);
    box-shadow:
      0 1px 4px rgba(0, 0, 0, 0.28),
      0 0 0 0.5px rgba(0, 0, 0, 0.12);
    pointer-events: none;
    will-change: transform;
  }

  .elastic-slider[data-orientation='vertical'] .elastic-slider__thumb {
    top: auto;
    bottom: 0;
    left: 50%;
    margin-top: 0;
    margin-bottom: calc(var(--elastic-slider-thumb-size, 18px) / -2);
  }

  .elastic-slider__bubble {
    position: absolute;
    bottom: calc(50% + var(--elastic-slider-bubble-offset, 14px));
    left: 0;
    padding: 5px 8px;
    border-radius: 8px;
    background: var(--elastic-slider-range);
    font-size: 12px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
    white-space: nowrap;
    opacity: 0;
    transform-origin: 50% 100%;
    pointer-events: none;
    will-change: transform, opacity;
  }

  .elastic-slider[data-orientation='vertical'] .elastic-slider__bubble {
    bottom: 0;
    left: calc(50% + var(--elastic-slider-bubble-offset, 14px));
    transform-origin: 0% 50%;
  }

  .elastic-slider__bubble-text {
    color: var(--elastic-slider-fill-content);
  }
</style>
