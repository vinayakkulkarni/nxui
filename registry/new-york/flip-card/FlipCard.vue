<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { animate, useMotionValue, useSpring } from 'motion-v';
  import type {
    FlipCardEmits,
    FlipCardGrip,
    FlipCardProps,
    FlipCardSlots,
  } from './types';

  const props = withDefaults(defineProps<FlipCardProps>(), {
    flipped: undefined,
    defaultFlipped: false,
    axis: 'y',
    flipOnClick: true,
    draggable: true,
    dragDistance: 0,
    tilt: true,
    tiltMax: 12,
    glare: true,
    glareOpacity: 0.22,
    hoverScale: 1.03,
    perspective: 1100,
    stiffness: 170,
    damping: 20,
    width: 300,
    height: 400,
    radius: 22,
    background: '#27272a',
    color: '#f5f5f5',
    shadow: true,
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    disabled: false,
    ariaLabel: 'Flip card',
    class: '',
  });

  const emit = defineEmits<FlipCardEmits>();
  defineSlots<FlipCardSlots>();

  const SLOP = { fine: 4, coarse: 8 };
  const TILT_SPRING = { stiffness: 240, damping: 24, mass: 0.6 };
  const LIFT_SPRING = { stiffness: 320, damping: 26 };
  const FLING = 0.16;
  const HISTORY_MS = 90;

  const clamp = (v: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, v));
  const snapTo = (deg: number) => Math.round(deg / 180) * 180;
  const isBack = (deg: number) => Math.abs(Math.round(deg / 180)) % 2 === 1;

  const motionPref = usePreferredReducedMotion();
  const reduce = computed(() => motionPref.value === 'reduce');
  const controlled = computed(() => props.flipped !== undefined);
  const inner = ref(props.defaultFlipped);
  const dragging = ref(false);
  const shown = computed(() =>
    props.flipped !== undefined ? props.flipped : inner.value,
  );

  const rootRef = ref<HTMLDivElement | null>(null);
  const rotorRef = ref<HTMLDivElement | null>(null);
  const shadowRef = ref<HTMLSpanElement | null>(null);

  let shownNow = shown.value;
  let grip: FlipCardGrip | null = null;
  let spin: ReturnType<typeof animate> | null = null;
  let target = shown.value ? 180 : 0;

  const turn = useMotionValue(target);
  const tiltX = useSpring(0, TILT_SPRING);
  const tiltY = useSpring(0, TILT_SPRING);
  const lift = useSpring(1, LIFT_SPRING);
  const sheen = useSpring(0, LIFT_SPRING);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);

  function render(): void {
    const rotor = rotorRef.value;
    if (rotor) {
      if (reduce.value) {
        rotor.style.transform = '';
        rotor.style.removeProperty('--fc-gx');
        rotor.style.removeProperty('--fc-gy');
        rotor.style.removeProperty('--fc-sheen');
      } else {
        const t = turn.get();
        const p = props.perspective;
        rotor.style.transform =
          props.axis === 'x'
            ? `perspective(${p}px) scale(${lift.get()}) rotateY(${tiltY.get()}deg) rotateX(${t + tiltX.get()}deg)`
            : `perspective(${p}px) scale(${lift.get()}) rotateX(${tiltX.get()}deg) rotateY(${t + tiltY.get()}deg)`;
        rotor.style.setProperty('--fc-gx', `${gx.get()}%`);
        rotor.style.setProperty('--fc-gy', `${gy.get()}%`);
        rotor.style.setProperty('--fc-sheen', `${sheen.get()}`);
      }
    }
    const shade = shadowRef.value;
    if (shade) {
      const facing = Math.abs(Math.cos((turn.get() * Math.PI) / 180));
      const spread = 0.08 + 0.92 * facing;
      shade.style.transform =
        props.axis === 'x' ? `scaleY(${spread})` : `scaleX(${spread})`;
      shade.style.opacity = `${0.1 + 0.9 * facing * facing}`;
    }
  }

  const unsubs = [turn, tiltX, tiltY, lift, sheen, gx, gy].map((mv) =>
    mv.on('change', render),
  );

  function settle(to: number, velocity: number, instant: boolean): void {
    spin?.stop();
    target = to;
    if (instant || reduce.value) turn.jump(to);
    else
      spin = animate(turn, to, {
        type: 'spring',
        stiffness: props.stiffness,
        damping: props.damping,
        velocity,
        restDelta: 0.05,
      });
    const next = isBack(to);
    if (next === shownNow) return;
    shownNow = next;
    if (!controlled.value) inner.value = next;
    emit('update:flipped', next);
    emit('flipChange', next);
  }

  function flip(instant: boolean): void {
    const base = snapTo(turn.get());
    settle(isBack(base) ? base - 180 : base + 180, 0, instant);
  }

  function rest(): void {
    tiltX.set(0);
    tiltY.set(0);
    sheen.set(0);
    lift.set(1);
  }

  watch(shown, (value) => {
    shownNow = value;
  });

  watch(
    () => props.flipped,
    (value) => {
      if (value === undefined || isBack(target) === value) return;
      const base = target;
      spin?.stop();
      target = isBack(base) ? base - 180 : base + 180;
      if (reduce.value) turn.jump(target);
      else
        spin = animate(turn, target, {
          type: 'spring',
          stiffness: props.stiffness,
          damping: props.damping,
          restDelta: 0.05,
        });
    },
  );

  watch(
    () => props.disabled,
    (value) => {
      if (value) rest();
    },
  );

  watch(
    [() => props.axis, () => props.perspective, () => props.shadow, reduce],
    render,
    { flush: 'post' },
  );

  function onPointerDown(e: PointerEvent): void {
    if (props.disabled || e.button !== 0 || grip) return;
    const el = e.currentTarget;
    if (el instanceof HTMLElement) {
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // pointer already released
      }
    }
    spin?.stop();
    grip = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      base: turn.get(),
      moved: false,
      slop: e.pointerType === 'touch' ? SLOP.coarse : SLOP.fine,
      hist: [],
    };
    if (!reduce.value) lift.set(props.hoverScale);
  }

  function onPointerMove(e: PointerEvent): void {
    const g = grip;
    if (g && g.id === e.pointerId) {
      const d = props.axis === 'x' ? e.clientY - g.y : e.clientX - g.x;
      if (!g.moved) {
        if (Math.abs(d) < g.slop || !props.draggable || reduce.value) return;
        g.moved = true;
        dragging.value = true;
        tiltX.set(0);
        tiltY.set(0);
        sheen.set(0);
      }
      const span =
        props.dragDistance > 0
          ? props.dragDistance
          : props.axis === 'x'
            ? props.height
            : props.width;
      const deg = g.base + (props.axis === 'x' ? -1 : 1) * (d / span) * 180;
      turn.set(deg);
      const now = performance.now();
      g.hist.push({ t: now, v: deg });
      while (g.hist.length > 2 && now - (g.hist[0]?.t ?? now) > HISTORY_MS)
        g.hist.shift();
      return;
    }
    if (
      !props.tilt ||
      reduce.value ||
      props.disabled ||
      e.pointerType === 'touch'
    )
      return;
    const el = e.currentTarget;
    if (!(el instanceof HTMLElement)) return;
    const r = el.getBoundingClientRect();
    const px = clamp((e.clientX - r.left) / r.width, 0, 1);
    const py = clamp((e.clientY - r.top) / r.height, 0, 1);
    tiltX.set((0.5 - py) * 2 * props.tiltMax);
    tiltY.set((px - 0.5) * 2 * props.tiltMax);
    gx.set(px * 100);
    gy.set(py * 100);
    sheen.set(1);
  }

  function release(e: PointerEvent, cancelled: boolean): void {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    grip = null;
    const el = e.currentTarget;
    if (el instanceof HTMLElement) {
      try {
        if (el.hasPointerCapture(e.pointerId))
          el.releasePointerCapture(e.pointerId);
      } catch {
        // capture already gone
      }
    }
    dragging.value = false;
    if (e.pointerType === 'touch' || !rootRef.value?.matches(':hover')) rest();
    if (!g.moved) {
      if (!cancelled && props.flipOnClick) flip(false);
      else settle(target, 0, false);
      return;
    }
    const here = turn.get();
    let velocity = 0;
    const a = g.hist[0];
    const b = g.hist[g.hist.length - 1];
    if (!cancelled && a && b && b.t > a.t && performance.now() - b.t < 60)
      velocity = ((b.v - a.v) / (b.t - a.t)) * 1000;
    const to = cancelled
      ? snapTo(g.base)
      : clamp(
          snapTo(here + velocity * FLING),
          snapTo(here) - 180,
          snapTo(here) + 180,
        );
    settle(to, velocity, false);
  }

  function onPointerUp(e: PointerEvent): void {
    release(e, false);
  }

  function onPointerCancel(e: PointerEvent): void {
    release(e, true);
  }

  function onPointerEnter(e: PointerEvent): void {
    if (!reduce.value && !props.disabled && e.pointerType !== 'touch')
      lift.set(props.hoverScale);
  }

  function onPointerLeave(): void {
    if (!grip) rest();
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (props.disabled || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    if (!e.repeat) flip(true);
  }

  function onClick(e: MouseEvent): void {
    if (!props.disabled && e.detail === 0) flip(true);
  }

  onMounted(render);

  onBeforeUnmount(() => {
    spin?.stop();
    unsubs.forEach((off) => off());
  });

  const rootStyle = computed(() => ({
    '--fc-w': `${props.width}px`,
    '--fc-h': `${props.height}px`,
    '--fc-radius': `${props.radius}px`,
    '--fc-bg': props.background,
    '--fc-ink': props.color,
    '--fc-shadow': props.shadowColor,
    '--fc-shadow-o': `${props.shadowOpacity}`,
    '--fc-glare': `${props.glareOpacity}`,
  }));
</script>

<template>
  <div
    ref="rootRef"
    role="button"
    :tabindex="disabled ? -1 : 0"
    :aria-pressed="shown"
    :aria-label="ariaLabel"
    :aria-disabled="disabled || undefined"
    :class="['flip-card', props.class]"
    :data-axis="axis"
    :data-draggable="draggable && !disabled && !reduce ? '' : undefined"
    :data-dragging="dragging ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :data-fade="reduce ? (shown ? 'back' : 'front') : undefined"
    :style="rootStyle"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @lostpointercapture="onPointerCancel"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @keydown="onKeyDown"
    @click="onClick"
    @dragstart.prevent
  >
    <span
      v-if="shadow"
      ref="shadowRef"
      class="flip-card__shadow"
      aria-hidden="true"
    />
    <div ref="rotorRef" class="flip-card__rotor">
      <div
        class="flip-card__face flip-card__face--front"
        :aria-hidden="shown"
        :inert="shown"
      >
        <slot name="front" />
        <span v-if="glare" class="flip-card__glare" aria-hidden="true" />
      </div>
      <div
        class="flip-card__face flip-card__face--back"
        :aria-hidden="!shown"
        :inert="!shown"
      >
        <slot name="back" />
        <span v-if="glare" class="flip-card__glare" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .flip-card {
    position: relative;
    display: inline-block;
    width: var(--fc-w);
    max-width: 100%;
    height: var(--fc-h);
    border-radius: var(--fc-radius);
    outline: none;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: pan-y;
  }

  .flip-card:focus-visible {
    outline: 2px solid var(--ring, currentColor);
    outline-offset: 4px;
  }

  .flip-card[data-axis='x'] {
    touch-action: pan-x;
  }

  .flip-card[data-draggable] {
    cursor: grab;
  }

  .flip-card[data-dragging] {
    cursor: grabbing;
  }

  .flip-card[data-disabled] {
    cursor: default;
    opacity: 0.6;
  }

  .flip-card__shadow {
    position: absolute;
    inset: 12% 9% -5%;
    border-radius: var(--fc-radius);
    background: color-mix(
      in srgb,
      var(--fc-shadow) calc(var(--fc-shadow-o) * 100%),
      transparent
    );
    filter: blur(22px);
    pointer-events: none;
  }

  .flip-card__rotor {
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
  }

  .flip-card__face {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: var(--fc-radius);
    background: var(--fc-bg);
    color: var(--fc-ink);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  .flip-card__face :deep(img) {
    -webkit-user-drag: none;
  }

  .flip-card__face--back {
    transform: rotateY(180deg);
  }

  .flip-card[data-axis='x'] .flip-card__face--back {
    transform: rotateX(180deg);
  }

  .flip-card__glare {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle farthest-side at var(--fc-gx, 50%) var(--fc-gy, 50%),
      rgba(255, 255, 255, var(--fc-glare)) 0%,
      rgba(255, 255, 255, calc(var(--fc-glare) * 0.76)) 12%,
      rgba(255, 255, 255, calc(var(--fc-glare) * 0.5)) 26%,
      rgba(255, 255, 255, calc(var(--fc-glare) * 0.28)) 42%,
      rgba(255, 255, 255, calc(var(--fc-glare) * 0.12)) 60%,
      rgba(255, 255, 255, calc(var(--fc-glare) * 0.04)) 78%,
      rgba(255, 255, 255, 0) 100%
    );
    opacity: var(--fc-sheen, 0);
    pointer-events: none;
  }

  .flip-card[data-fade] .flip-card__face {
    transform: none;
    opacity: 0;
    backface-visibility: visible;
    -webkit-backface-visibility: visible;
    transition: opacity 200ms ease;
  }

  .flip-card[data-fade='front'] .flip-card__face--front,
  .flip-card[data-fade='back'] .flip-card__face--back {
    opacity: 1;
  }
</style>
