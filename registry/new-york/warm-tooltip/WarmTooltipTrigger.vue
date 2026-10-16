<script setup lang="ts">
  import {
    computed,
    inject,
    onBeforeUnmount,
    onMounted,
    ref,
    useId,
    watch,
  } from 'vue';
  import { useEventListener } from '@vueuse/core';
  import type { WarmTooltipPayload, WarmTooltipProps } from './types';
  import { HOLD_SLOP, SIZES, WARM_TOOLTIP_GROUP } from './warm-tooltip-utils';

  const props = withDefaults(defineProps<WarmTooltipProps>(), {
    content: '',
    shortcut: '',
    side: 'top',
    delay: undefined,
    warmWindow: undefined,
    surfaceColor: '#f5f5f5',
    inkColor: '#18181b',
    size: 'md',
    radius: 8,
    gap: 8,
    arrow: true,
    popDuration: 160,
    popScale: 0.94,
    popBlur: 4,
    showFuse: false,
    longPress: 500,
    disabled: false,
    class: '',
  });

  const group = inject(WARM_TOOLTIP_GROUP, null);
  const id = `wt-${useId()}`;
  const triggerRef = ref<HTMLElement | null>(null);
  const fuse = ref<'idle' | 'arming'>('idle');
  const pressing = ref(false);
  const pressed = ref(false);

  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let pressTimer: ReturnType<typeof setTimeout> | undefined;
  let press0: { x: number; y: number; id: number } | null = null;
  let suppressClick = false;

  const preset = computed(() => SIZES[props.size] ?? SIZES.md);
  const coldDelay = computed(() => props.delay ?? group?.delay.value ?? 400);
  const active = computed(() => group?.activeId.value === id);

  function payload(): WarmTooltipPayload | null {
    const trigger = triggerRef.value;
    if (!trigger) return null;
    return {
      id,
      trigger,
      content: props.content,
      shortcut: props.shortcut,
      side: props.side,
      gap: props.gap,
      arrow: props.arrow,
      surfaceColor: props.surfaceColor,
      inkColor: props.inkColor,
      radius: props.radius,
      font: preset.value.font,
      px: preset.value.px,
      py: preset.value.py,
      popDuration: props.popDuration,
      popScale: props.popScale,
      popBlur: props.popBlur,
      warmWindow: props.warmWindow ?? group?.warmWindow.value ?? 300,
    };
  }

  function open(mode: 'cold' | 'warm' | 'instant') {
    const p = payload();
    if (p && group) group.show(p, mode);
  }

  function hide(instant: boolean) {
    clearTimeout(openTimer);
    fuse.value = 'idle';
    group?.hide(id, instant);
  }

  function arm() {
    if (group?.isWarm()) {
      open('warm');
      return;
    }
    fuse.value = 'arming';
    openTimer = setTimeout(() => {
      fuse.value = 'idle';
      open('cold');
    }, coldDelay.value);
  }

  function cancelPress() {
    clearTimeout(pressTimer);
    if (!press0) return;
    press0 = null;
    pressed.value = false;
    pressing.value = false;
    fuse.value = 'idle';
  }

  function onPointerEnter(e: PointerEvent) {
    if (props.disabled) return;
    if (e.pointerType !== 'touch' && e.buttons === 0) arm();
  }

  function onPointerLeave(e: PointerEvent) {
    if (props.disabled) return;
    if (e.pointerType !== 'touch') hide(false);
  }

  function onPointerDown(e: PointerEvent) {
    if (props.disabled) return;
    if (e.pointerType === 'mouse') {
      hide(false);
      return;
    }
    const target = e.currentTarget;
    if (target instanceof HTMLElement) {
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // pointer already gone
      }
    }
    press0 = { x: e.clientX, y: e.clientY, id: e.pointerId };
    pressed.value = true;
    pressing.value = true;
    fuse.value = 'arming';
    pressTimer = setTimeout(() => {
      suppressClick = true;
      press0 = null;
      pressed.value = false;
      pressing.value = false;
      fuse.value = 'idle';
      open('cold');
    }, props.longPress);
  }

  function onPointerMove(e: PointerEvent) {
    const p = press0;
    if (
      p &&
      p.id === e.pointerId &&
      Math.hypot(e.clientX - p.x, e.clientY - p.y) > HOLD_SLOP
    ) {
      cancelPress();
    }
  }

  function onPointerEnd() {
    if (props.disabled) return;
    cancelPress();
  }

  function onContextMenu(e: MouseEvent) {
    if (press0) e.preventDefault();
  }

  function onClickCapture(e: MouseEvent) {
    if (!suppressClick) return;
    suppressClick = false;
    e.preventDefault();
    e.stopPropagation();
  }

  function onFocusIn(e: FocusEvent) {
    if (props.disabled) return;
    const target = e.target;
    if (target instanceof Element && target.matches(':focus-visible'))
      open('instant');
  }

  function onFocusOut() {
    if (props.disabled) return;
    hide(true);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (props.disabled) return;
    if (e.key === 'Escape') hide(true);
  }

  watch(
    () => props.disabled,
    (disabled) => {
      if (disabled) {
        cancelPress();
        hide(true);
      }
    },
  );

  useEventListener(
    () => (active.value ? document : null),
    'pointerdown',
    (e: PointerEvent) => {
      const target = e.target;
      if (
        triggerRef.value &&
        target instanceof Node &&
        !triggerRef.value.contains(target)
      ) {
        hide(false);
      }
    },
    { capture: true },
  );

  // The trigger only lends aria-describedby to its first element; its own focus ring stays untouched.
  let ownDescribedBy: string | null = null;
  function describedTarget(): Element | null {
    return triggerRef.value?.firstElementChild ?? null;
  }
  onMounted(() => {
    ownDescribedBy =
      describedTarget()?.getAttribute('aria-describedby') ?? null;
  });
  watch(active, (isActive) => {
    const el = describedTarget();
    if (!el || !group) return;
    if (isActive) el.setAttribute('aria-describedby', group.id);
    else if (ownDescribedBy)
      el.setAttribute('aria-describedby', ownDescribedBy);
    else el.removeAttribute('aria-describedby');
  });

  onBeforeUnmount(() => {
    clearTimeout(openTimer);
    clearTimeout(pressTimer);
  });

  const triggerStyle = computed(() => ({
    '--wt-surface': props.surfaceColor,
    '--wt-fuse-ms': `${pressed.value ? props.longPress : coldDelay.value}ms`,
  }));
</script>

<template>
  <span
    ref="triggerRef"
    :class="['warm-tooltip__trigger', props.class]"
    :data-pressing="pressing ? '' : undefined"
    :style="triggerStyle"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerEnd"
    @pointercancel="onPointerEnd"
    @contextmenu="onContextMenu"
    @click.capture="onClickCapture"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @keydown="onKeyDown"
  >
    <slot :described-by="active ? group?.id : undefined" />
    <span
      v-if="showFuse"
      class="warm-tooltip__fuse"
      :data-side="side"
      :data-fuse="fuse"
      aria-hidden="true"
    />
  </span>
</template>

<style scoped>
  .warm-tooltip__trigger {
    --wt-surface: #f5f5f5;
    --wt-fuse-ms: 400ms;
    --wt-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    position: relative;
    display: inline-flex;
    vertical-align: middle;
    touch-action: manipulation;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  .warm-tooltip__trigger[data-pressing] {
    user-select: none;
    -webkit-user-select: none;
  }

  .warm-tooltip__fuse {
    position: absolute;
    left: 4px;
    right: 4px;
    height: 2px;
    border-radius: 1px;
    background: var(--wt-surface);
    opacity: 0;
    transform: scaleX(0);
    transform-origin: left center;
    pointer-events: none;
    transition:
      transform 125ms var(--wt-ease-out),
      opacity 125ms var(--wt-ease-out);
  }

  .warm-tooltip__fuse[data-side='top'] {
    top: -4px;
  }

  .warm-tooltip__fuse[data-side='bottom'] {
    bottom: -4px;
  }

  .warm-tooltip__fuse[data-side='left'],
  .warm-tooltip__fuse[data-side='right'] {
    top: 4px;
    bottom: 4px;
    left: auto;
    right: auto;
    width: 2px;
    height: auto;
    transform: scaleY(0);
    transform-origin: center top;
  }

  .warm-tooltip__fuse[data-side='left'] {
    left: -4px;
  }

  .warm-tooltip__fuse[data-side='right'] {
    right: -4px;
  }

  .warm-tooltip__fuse[data-fuse='arming'] {
    opacity: 1;
    transform: scaleX(1);
    transition:
      transform var(--wt-fuse-ms) linear,
      opacity 80ms var(--wt-ease-out);
  }

  .warm-tooltip__fuse[data-side='left'][data-fuse='arming'],
  .warm-tooltip__fuse[data-side='right'][data-fuse='arming'] {
    transform: scaleY(1);
  }
</style>
