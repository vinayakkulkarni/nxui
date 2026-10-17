<script setup lang="ts">
  import { computed, onMounted, onUpdated, ref, watch } from 'vue';
  import type { ComponentPublicInstance, CSSProperties } from 'vue';
  import {
    useDocumentVisibility,
    useEventListener,
    usePreferredReducedMotion,
  } from '@vueuse/core';
  import type { PeekRatingProps, PeekRatingState } from './types';

  const props = withDefaults(defineProps<PeekRatingProps>(), {
    modelValue: undefined,
    defaultValue: 0,
    count: 5,
    shape: 'star',
    icon: '',
    labels: () => [],
    activeColor: '#f5b400',
    idleColor: '#52525b',
    tipColor: '#27272a',
    tipTextColor: '#f5f5f5',
    size: 28,
    lift: 6,
    magnify: 1.15,
    riseDuration: 320,
    popScale: 1.3,
    showTip: true,
    allowClear: true,
    readOnly: false,
    disabled: false,
    ariaLabel: 'Rating',
    class: '',
  });

  const emit = defineEmits<{
    'update:modelValue': [value: number];
    change: [value: number];
    preview: [value: number | null];
  }>();

  const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const SHAPES = {
    star: 'lucide:star',
    heart: 'lucide:heart',
    bolt: 'lucide:zap',
  } as const;

  const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));

  const reduced = usePreferredReducedMotion();
  const inner = ref(props.defaultValue);
  const value = computed(() =>
    clamp(props.modelValue ?? inner.value, 0, props.count),
  );
  const interactive = computed(() => !props.readOnly && !props.disabled);
  const glyphName = computed(() => props.icon || SHAPES[props.shape]);
  const tipRoom = computed(() =>
    interactive.value && props.showTip ? Math.round(props.size * 0.9) : 0,
  );

  const rootRef = ref<HTMLDivElement | null>(null);
  const rowRef = ref<HTMLDivElement | null>(null);
  const tipEl = ref<HTMLSpanElement | null>(null);
  const starEls: Array<HTMLElement | null> = [];
  const liftEls: Array<HTMLElement | null> = [];
  const glyphEls: Array<HTMLElement | null> = [];
  const st: PeekRatingState = {
    hover: null,
    pressing: false,
    pointerId: null,
    settled: false,
    rect: null,
    rtl: false,
  };

  function asEl(el: Element | ComponentPublicInstance | null) {
    return el instanceof HTMLElement ? el : null;
  }
  function setStar(i: number) {
    return (el: Element | ComponentPublicInstance | null) => {
      starEls[i] = asEl(el);
    };
  }
  function setLift(i: number) {
    return (el: Element | ComponentPublicInstance | null) => {
      liftEls[i] = asEl(el);
    };
  }
  function setGlyph(i: number) {
    return (el: Element | ComponentPublicInstance | null) => {
      glyphEls[i] = asEl(el);
    };
  }

  function paint() {
    const { hover, settled, rtl } = st;
    const previewing = hover !== null && !settled;
    const shown = previewing && hover !== null ? hover + 1 : value.value;
    const still = reduced.value === 'reduce';

    for (let i = 0; i < props.count; i++) {
      const liftEl = liftEls[i];
      const glyphEl = glyphEls[i];
      if (!liftEl || !glyphEl) continue;
      const lifted = previewing && hover !== null && !still && i <= hover;
      liftEl.style.transform = lifted
        ? `translateY(${-props.lift}px) scale(${i === hover ? props.magnify : 1})`
        : 'translateY(0px) scale(1)';
      glyphEl.dataset.lit = String(i < shown);
    }

    const tip = tipEl.value;
    if (!tip) return;
    if (previewing && hover !== null && props.showTip) {
      const row = rowRef.value;
      const slot = row ? row.clientWidth / props.count : props.size;
      const visual = rtl ? props.count - 1 - hover : hover;
      const wasHidden = tip.dataset.show !== 'true';
      if (wasHidden) tip.style.transition = 'none';
      tip.textContent = props.labels[hover] ?? String(hover + 1);
      tip.style.transform = `translate(calc(${slot * (visual + 0.5)}px - 50%), 0)`;
      if (wasHidden) {
        void tip.offsetWidth;
        tip.style.transition = '';
      }
      tip.dataset.show = 'true';
    } else {
      tip.dataset.show = 'false';
    }
  }

  onMounted(paint);
  onUpdated(paint);

  function setHover(index: number | null) {
    if (index === st.hover) return;
    st.hover = index;
    if (index !== null) st.settled = false;
    paint();
    emit('preview', index === null ? null : index + 1);
  }

  function measure() {
    const row = rowRef.value;
    if (!row) return;
    st.rect = row.getBoundingClientRect();
    st.rtl = getComputedStyle(row).direction === 'rtl';
  }

  function indexAt(x: number, y: number) {
    const { rect, pressing, rtl } = st;
    if (!rect || !rect.width) return null;
    if (pressing && (y < rect.top - props.size || y > rect.bottom + props.size))
      return null;
    const index = clamp(
      Math.floor(((x - rect.left) / rect.width) * props.count),
      0,
      props.count - 1,
    );
    return rtl ? props.count - 1 - index : index;
  }

  function commit(next: number, pop = true) {
    if (props.modelValue === undefined) inner.value = next;
    emit('update:modelValue', next);
    emit('change', next);
    st.settled = true;
    paint();
    const glyph = glyphEls[next - 1];
    if (
      pop &&
      next > 0 &&
      props.popScale > 1 &&
      glyph &&
      typeof glyph.animate === 'function' &&
      reduced.value !== 'reduce'
    ) {
      glyph.getAnimations().forEach((a) => a.cancel());
      glyph.animate(
        [
          { transform: 'scale(1)', easing: EASE_OUT },
          {
            transform: `scale(${props.popScale})`,
            offset: 0.35,
            easing: EASE_OUT,
          },
          { transform: 'scale(1)' },
        ],
        { duration: 300 },
      );
    }
  }

  function onPointerEnter(e: PointerEvent) {
    if (!interactive.value || e.pointerType !== 'mouse') return;
    rootRef.value?.removeAttribute('data-instant');
    measure();
  }

  function onPointerDown(e: PointerEvent) {
    if (!interactive.value || e.button !== 0 || st.pointerId !== null) return;
    rootRef.value?.removeAttribute('data-instant');
    try {
      rowRef.value?.setPointerCapture(e.pointerId);
    } catch {
      // capture is best-effort
    }
    st.pointerId = e.pointerId;
    st.pressing = true;
    measure();
    setHover(indexAt(e.clientX, e.clientY));
  }

  function onPointerMove(e: PointerEvent) {
    if (!interactive.value) return;
    const { pressing, pointerId } = st;
    if (e.pointerType !== 'mouse' && !pressing) return;
    if (pressing && e.pointerId !== pointerId) return;
    if (!pressing && !st.rect) measure();
    setHover(indexAt(e.clientX, e.clientY));
  }

  function endPress(e: PointerEvent) {
    const { pressing, pointerId, hover } = st;
    if (!pressing || e.pointerId !== pointerId) return;
    st.pressing = false;
    st.pointerId = null;
    if (e.type === 'pointerup' && hover !== null) {
      const next = hover + 1;
      commit(props.allowClear && next === value.value ? 0 : next);
    }
    if (e.pointerType !== 'mouse') setHover(null);
  }

  function onPointerLeave() {
    if (!st.pressing) setHover(null);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!interactive.value || props.readOnly) return;
    const min = props.allowClear ? 0 : 1;
    let next: number;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = clamp(value.value + 1, min, props.count);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = clamp(value.value - 1, min, props.count);
        break;
      case 'Home':
        next = 1;
        break;
      case 'End':
        next = props.count;
        break;
      case 'Backspace':
      case 'Delete':
        if (!props.allowClear) return;
        next = 0;
        break;
      case ' ':
      case 'Enter': {
        const target = e.target;
        const index =
          target instanceof HTMLElement ? starEls.indexOf(target) : -1;
        if (index === -1) return;
        next = props.allowClear && index + 1 === value.value ? 0 : index + 1;
        break;
      }
      default:
        return;
    }
    e.preventDefault();
    rootRef.value?.setAttribute('data-instant', 'true');
    st.hover = null;
    commit(next, false);
    starEls[Math.max(next, 1) - 1]?.focus();
  }

  function reset() {
    st.pressing = false;
    st.pointerId = null;
    setHover(null);
  }
  useEventListener('blur', reset);
  const visibility = useDocumentVisibility();
  watch(visibility, (v) => {
    if (v === 'hidden') reset();
  });

  function starLabel(i: number) {
    const label = props.labels[i];
    return label
      ? `${i + 1} of ${props.count}, ${label}`
      : `${i + 1} of ${props.count}`;
  }
  function starTabIndex(i: number) {
    if (!interactive.value) return -1;
    const focusable = value.value === 0 ? i === 0 : value.value === i + 1;
    return focusable ? 0 : -1;
  }

  const rootStyle = computed<CSSProperties>(() => ({
    '--pr-active': props.activeColor,
    '--pr-idle': props.idleColor,
    '--pr-tip': props.tipColor,
    '--pr-tip-text': props.tipTextColor,
    '--pr-size': `${props.size}px`,
    '--pr-gap': `${Math.round(props.size * 0.22)}px`,
    '--pr-room': `${props.lift + tipRoom.value}px`,
    '--pr-rise': `${props.riseDuration}ms`,
  }));
</script>

<template>
  <div
    ref="rootRef"
    :role="readOnly ? 'img' : 'radiogroup'"
    :aria-label="readOnly ? `${value} of ${count}` : ariaLabel"
    :aria-disabled="disabled || undefined"
    :class="['peek-rating', props.class]"
    :style="rootStyle"
    @keydown="onKeyDown"
  >
    <div
      ref="rowRef"
      class="peek-rating__row"
      @pointerenter="onPointerEnter"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="endPress"
      @pointercancel="endPress"
      @lostpointercapture="endPress"
      @pointerleave="onPointerLeave"
    >
      <span
        v-if="interactive && showTip"
        ref="tipEl"
        class="peek-rating__tip"
        aria-hidden="true"
      ></span>
      <component
        :is="readOnly ? 'span' : 'button'"
        v-for="(_, i) in count"
        :key="i"
        :ref="setStar(i)"
        :type="readOnly ? undefined : 'button'"
        class="peek-rating__star"
        :role="readOnly ? undefined : 'radio'"
        :aria-checked="readOnly ? undefined : value === i + 1"
        :aria-label="readOnly ? undefined : starLabel(i)"
        :aria-hidden="readOnly || undefined"
        :tabindex="starTabIndex(i)"
      >
        <span :ref="setLift(i)" class="peek-rating__lift">
          <span :ref="setGlyph(i)" class="peek-rating__glyph">
            <slot name="icon">
              <Icon :name="glyphName" mode="svg" />
            </slot>
          </span>
        </span>
      </component>
    </div>
  </div>
</template>

<style scoped>
  .peek-rating {
    --pr-active: #f5b400;
    --pr-idle: #52525b;
    --pr-tip: #27272a;
    --pr-tip-text: #f5f5f5;
    --pr-size: 28px;
    --pr-gap: 6px;
    --pr-room: 31px;
    --pr-rise: 320ms;
    --pr-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    display: inline-flex;
    font-family: inherit;
    color: inherit;
  }

  .peek-rating[aria-disabled='true'] {
    opacity: 0.5;
    pointer-events: none;
  }

  .peek-rating__row {
    position: relative;
    display: inline-flex;
    align-items: flex-end;
    padding-top: var(--pr-room);
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  .peek-rating__star {
    display: grid;
    place-items: center;
    width: calc(var(--pr-size) + var(--pr-gap));
    height: calc(var(--pr-size) + 8px);
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    outline: none;
    touch-action: manipulation;
  }

  @media (hover: hover) and (pointer: fine) {
    .peek-rating__star {
      cursor: pointer;
    }
  }

  @media (pointer: coarse) {
    .peek-rating__star {
      min-width: 44px;
      min-height: 44px;
    }
  }

  .peek-rating__star:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--pr-active) 70%, transparent);
    outline-offset: 2px;
    border-radius: 6px;
  }

  .peek-rating__lift {
    display: block;
    transform: translateY(0) scale(1);
    transform-origin: 50% 100%;
    transition: transform var(--pr-rise) var(--pr-ease-out);
  }

  .peek-rating__glyph {
    display: block;
    width: var(--pr-size);
    height: var(--pr-size);
    color: var(--pr-idle);
    transition: color 160ms ease;
  }

  .peek-rating__glyph :deep(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }

  .peek-rating__glyph :deep(svg *) {
    fill: currentColor;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linejoin: round;
  }

  .peek-rating__glyph[data-lit='true'] {
    color: var(--pr-active);
  }

  .peek-rating__tip {
    position: absolute;
    top: 0;
    left: 0;
    display: inline-flex;
    align-items: center;
    height: calc(var(--pr-size) * 0.6);
    padding: 0 calc(var(--pr-size) * 0.3);
    border-radius: 999px;
    background: var(--pr-tip);
    color: var(--pr-tip-text);
    font-size: calc(var(--pr-size) * 0.38);
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.01em;
    white-space: nowrap;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
    opacity: 0;
    pointer-events: none;
    transition:
      transform var(--pr-rise) var(--pr-ease-out),
      opacity 180ms ease;
  }

  .peek-rating__tip[data-show='true'] {
    opacity: 1;
  }

  .peek-rating[data-instant='true'] .peek-rating__lift,
  .peek-rating[data-instant='true'] .peek-rating__glyph,
  .peek-rating[data-instant='true'] .peek-rating__tip {
    transition-duration: 0ms;
  }

  @media (prefers-reduced-motion: reduce) {
    .peek-rating__lift {
      transition: none;
    }

    .peek-rating__tip {
      transition: opacity 180ms ease;
    }
  }
</style>
