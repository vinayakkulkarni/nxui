<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    provide,
    ref,
    shallowRef,
    useId,
    watch,
  } from 'vue';
  import { useEventListener, usePreferredReducedMotion } from '@vueuse/core';
  import {
    AnimatePresence,
    animate,
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    useVelocity,
  } from 'motion-v';
  import type {
    WarmTooltipGroupContext,
    WarmTooltipGroupProps,
    WarmTooltipMode,
    WarmTooltipPayload,
    WarmTooltipState,
    WarmTooltipSwap,
  } from './types';
  import {
    EASE_OUT,
    FULL_LEAN_SPEED,
    GRACE,
    LAYER,
    LEAN_SPRING,
    ORIGIN,
    RISE,
    SIGN,
    SWAP,
    WARM_TOOLTIP_GROUP,
    anchorOf,
    clamp,
    horizontal,
    layoutOf,
  } from './warm-tooltip-utils';

  const props = withDefaults(defineProps<WarmTooltipGroupProps>(), {
    delay: 400,
    warmWindow: 300,
    travel: 320,
    lean: 0,
  });

  const emit = defineEmits<{
    warmChange: [warm: boolean];
  }>();

  const motionPref = usePreferredReducedMotion();
  const reduce = computed(() => motionPref.value === 'reduce');
  const id = `wt-${useId()}`;
  const current = shallowRef<WarmTooltipPayload | null>(null);
  const state = ref<WarmTooltipState>('closed');
  const swap = shallowRef<WarmTooltipSwap>({ dir: 0, across: false });

  let ctxState: WarmTooltipState = 'closed';
  let ctxCurrent: WarmTooltipPayload | null = null;
  let mode: WarmTooltipMode = 'cold';
  let instantOpen = false;
  let warmUntil = Number.NEGATIVE_INFINITY;
  let warm = false;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let leaveTimer: ReturnType<typeof setTimeout> | undefined;
  let warmTimer: ReturnType<typeof setTimeout> | undefined;

  const bubbleRef = ref<HTMLElement | null>(null);
  const boxRef = ref<HTMLElement | null>(null);
  const arrowRef = ref<HTMLElement | null>(null);

  const ax = useMotionValue(0);
  const ay = useMotionValue(0);
  const w = useMotionValue(0);
  const h = useMotionValue(0);
  const presence = useMotionValue(0);
  const vx = useVelocity(ax);
  const vy = useVelocity(ay);
  const speed = useTransform(() => {
    const a = vx.get();
    const b = vy.get();
    return ctxCurrent && !horizontal(ctxCurrent.side) ? b : a;
  });
  const leanTarget = useTransform(
    speed,
    [-FULL_LEAN_SPEED, 0, FULL_LEAN_SPEED],
    [1, 0, -1],
    {
      clamp: true,
    },
  );
  const leanUnit = useSpring(leanTarget, LEAN_SPRING);

  function render() {
    const c = ctxCurrent;
    const bubble = bubbleRef.value;
    if (!c || !bubble) return;
    const side = c.side;
    const x = ax.get();
    const y = ay.get();
    const width = w.get();
    const height = h.get();
    const { X, Y } = layoutOf(x, y, width, height, side);
    bubble.style.transform = `translate(${X}px, ${Y}px)`;
    bubble.style.width = `${width}px`;
    bubble.style.height = `${height}px`;
    const arrow = arrowRef.value;
    if (arrow) {
      const at = horizontal(side)
        ? clamp(x - X, 10, width - 10)
        : clamp(y - Y, 10, height - 10);
      arrow.style.left = horizontal(side) ? `${at}px` : '';
      arrow.style.top = horizontal(side) ? '' : `${at}px`;
    }
    const box = boxRef.value;
    if (!box) return;
    const p = presence.get();
    box.style.opacity = String(p);
    if (reduce.value) {
      box.style.transform = 'none';
      box.style.filter = 'none';
      return;
    }
    const leanDeg = props.lean;
    const scale = c.popScale + (1 - c.popScale) * p;
    const rise = (1 - p) * RISE * SIGN[side] * (side === 'left' ? -1 : 1);
    const rotate = leanUnit.get() * leanDeg * SIGN[side];
    const tx = horizontal(side) ? 0 : rise;
    const ty = horizontal(side) ? rise : 0;
    box.style.transform = `translate(${tx}px, ${ty}px) scale(${scale}) rotate(${rotate}deg)`;
    box.style.filter = `blur(${c.popBlur * (1 - p)}px)`;
  }

  const unsubs = [ax, ay, w, h, presence, leanUnit].map((mv) =>
    mv.on('change', render),
  );

  function isWarm(): boolean {
    return ctxState !== 'closed' || performance.now() < warmUntil;
  }

  function notify() {
    const next = isWarm();
    if (next === warm) return;
    warm = next;
    emit('warmChange', next);
  }

  function finishClose() {
    ctxState = 'closed';
    ctxCurrent = null;
    state.value = 'closed';
    current.value = null;
    notify();
  }

  function show(payload: WarmTooltipPayload, nextMode: WarmTooltipMode) {
    clearTimeout(closeTimer);
    clearTimeout(leaveTimer);
    const prev = ctxCurrent;
    const fresh = ctxState === 'closed';
    if (prev && prev.id !== payload.id) {
      const [px, py] = anchorOf(
        prev.trigger.getBoundingClientRect(),
        prev.side,
        prev.gap,
      );
      const [nx, ny] = anchorOf(
        payload.trigger.getBoundingClientRect(),
        payload.side,
        payload.gap,
      );
      const across = !horizontal(payload.side);
      swap.value = { dir: Math.sign(across ? ny - py : nx - px) || 1, across };
    } else {
      swap.value = { dir: 0, across: !horizontal(payload.side) };
    }
    mode = fresh ? nextMode : nextMode === 'instant' ? 'instant' : 'move';
    instantOpen = nextMode === 'instant';
    ctxCurrent = payload;
    ctxState = 'open';
    current.value = payload;
    state.value = 'open';
    notify();
    void nextTick(place);
  }

  function beginClose(instant: boolean) {
    const c = ctxCurrent;
    if (!c || ctxState !== 'open') return;
    ctxState = 'closing';
    state.value = 'closing';
    warmUntil = performance.now() + c.warmWindow;
    clearTimeout(warmTimer);
    warmTimer = setTimeout(notify, c.warmWindow + 1);
    if (instant) {
      presence.jump(0);
      finishClose();
      return;
    }
    const closeMs = Math.round(c.popDuration * 0.8);
    animate(presence, 0, { duration: closeMs / 1000, ease: EASE_OUT });
    closeTimer = setTimeout(finishClose, closeMs);
  }

  function hide(tooltipId: string, instant: boolean) {
    const c = ctxCurrent;
    if (!c || c.id !== tooltipId || ctxState !== 'open') return;
    clearTimeout(leaveTimer);
    if (instant || instantOpen) {
      beginClose(true);
      return;
    }
    leaveTimer = setTimeout(() => beginClose(false), GRACE);
  }

  function reset() {
    if (ctxCurrent) hide(ctxCurrent.id, true);
    warmUntil = Number.NEGATIVE_INFINITY;
    clearTimeout(warmTimer);
    notify();
  }

  /** Measures the new label and moves the bubble there (upstream's layout effect). */
  function place() {
    const c = ctxCurrent;
    const bubble = bubbleRef.value;
    if (!c || !bubble || ctxState !== 'open') return;
    const text = bubble.querySelector<HTMLElement>(
      `[data-layer="${c.id}"] .warm-tooltip__text`,
    );
    if (!text) return;
    const [tx, ty] = anchorOf(c.trigger.getBoundingClientRect(), c.side, c.gap);
    const tw = text.offsetWidth + c.px * 2;
    const th = text.offsetHeight + c.py * 2;
    if (mode === 'move' && !reduce.value && props.travel > 0) {
      const spring = {
        type: 'spring' as const,
        duration: props.travel / 1000,
        bounce: 0.1,
      };
      animate(ax, tx, spring);
      animate(ay, ty, spring);
      animate(w, tw, spring);
      animate(h, th, spring);
      animate(presence, 1, { duration: 0.12, ease: EASE_OUT });
      render();
      return;
    }
    ax.jump(tx);
    ay.jump(ty);
    w.jump(tw);
    h.jump(th);
    if (mode === 'cold') {
      presence.jump(0);
      animate(presence, 1, { duration: c.popDuration / 1000, ease: EASE_OUT });
    } else {
      presence.jump(1);
    }
    render();
  }

  let followRaf = 0;
  function follow() {
    if (state.value === 'closed') return;
    cancelAnimationFrame(followRaf);
    followRaf = requestAnimationFrame(() => {
      const c = ctxCurrent;
      if (!c) return;
      const [tx, ty] = anchorOf(
        c.trigger.getBoundingClientRect(),
        c.side,
        c.gap,
      );
      ax.jump(tx);
      ay.jump(ty);
    });
  }

  useEventListener('scroll', follow, { capture: true, passive: true });
  useEventListener('resize', follow);
  useEventListener(
    () => (typeof document === 'undefined' ? null : document),
    'visibilitychange',
    () => {
      if (document.visibilityState === 'hidden' && ctxCurrent)
        hide(ctxCurrent.id, true);
    },
  );

  watch(reduce, () => render());

  onBeforeUnmount(() => {
    clearTimeout(closeTimer);
    clearTimeout(leaveTimer);
    clearTimeout(warmTimer);
    cancelAnimationFrame(followRaf);
    for (const off of unsubs) off();
  });

  const context: WarmTooltipGroupContext = {
    id,
    delay: computed(() => props.delay),
    warmWindow: computed(() => props.warmWindow),
    activeId: computed(() => current.value?.id ?? null),
    isWarm,
    show,
    hide,
    reset,
  };
  provide(WARM_TOOLTIP_GROUP, context);

  defineExpose({ reset });

  const side = computed(() => current.value?.side ?? 'top');
  const bubbleStyle = computed(() => {
    const c = current.value;
    if (!c) return {};
    return {
      '--wt-surface': c.surfaceColor,
      '--wt-ink': c.inkColor,
      '--wt-radius': `${c.radius}px`,
      '--wt-font': `${c.font}px`,
      '--wt-origin': ORIGIN[c.side],
    };
  });
  const layerTransition = computed(() => ({
    duration: reduce.value ? 0 : SWAP,
    ease: EASE_OUT,
  }));
</script>

<template>
  <slot />
  <Teleport to="body">
    <span
      v-if="state !== 'closed' && current"
      :id="id"
      ref="bubbleRef"
      role="tooltip"
      class="warm-tooltip"
      :data-side="side"
      :style="bubbleStyle"
    >
      <span ref="boxRef" class="warm-tooltip__box">
        <AnimatePresence :initial="false" :custom="swap">
          <motion.span
            :key="current.id"
            class="warm-tooltip__layer"
            :data-layer="current.id"
            :custom="swap"
            :variants="LAYER"
            initial="enter"
            animate="show"
            exit="exit"
            :transition="layerTransition"
          >
            <span class="warm-tooltip__text">
              {{ current.content }}
              <kbd v-if="current.shortcut" class="warm-tooltip__kbd">{{
                current.shortcut
              }}</kbd>
            </span>
          </motion.span>
        </AnimatePresence>
        <span
          v-if="current.arrow"
          ref="arrowRef"
          class="warm-tooltip__arrow"
          :data-side="side"
          aria-hidden="true"
        />
      </span>
    </span>
  </Teleport>
</template>

<style scoped>
  .warm-tooltip {
    --wt-surface: #f5f5f5;
    --wt-ink: #18181b;
    --wt-radius: 8px;
    --wt-font: 12.5px;
    --wt-origin: center bottom;

    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
    display: block;
    pointer-events: none;
    font-family: inherit;
  }

  .warm-tooltip__box {
    position: absolute;
    inset: 0;
    border-radius: var(--wt-radius);
    background: var(--wt-surface);
    color: var(--wt-ink);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.12),
      0 8px 24px -8px rgba(0, 0, 0, 0.45);
    transform-origin: var(--wt-origin);
  }

  .warm-tooltip__layer {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .warm-tooltip__text {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: var(--wt-font);
    font-weight: 500;
    line-height: 1.2;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }

  .warm-tooltip__kbd {
    display: inline-flex;
    align-items: center;
    height: 1.55em;
    padding: 0 0.45em;
    border-radius: 0.4em;
    background: color-mix(in srgb, var(--wt-ink) 9%, transparent);
    box-shadow: inset 0 -1px 0
      color-mix(in srgb, var(--wt-ink) 12%, transparent);
    color: color-mix(in srgb, var(--wt-ink) 72%, transparent);
    font-family: inherit;
    font-size: 0.86em;
    font-weight: 500;
    letter-spacing: 0.02em;
    font-variant-numeric: tabular-nums;
  }

  .warm-tooltip__arrow {
    position: absolute;
    width: 8px;
    height: 8px;
    margin: -4px;
    border-radius: 2px;
    background: var(--wt-surface);
    transform: rotate(45deg);
  }

  .warm-tooltip__arrow[data-side='top'] {
    bottom: 1px;
  }

  .warm-tooltip__arrow[data-side='bottom'] {
    top: 1px;
  }

  .warm-tooltip__arrow[data-side='left'] {
    right: 1px;
  }

  .warm-tooltip__arrow[data-side='right'] {
    left: 1px;
  }

  @media (prefers-contrast: more) {
    .warm-tooltip__box {
      box-shadow: inset 0 0 0 1px
        color-mix(in srgb, var(--wt-ink) 40%, transparent);
    }
  }
</style>
