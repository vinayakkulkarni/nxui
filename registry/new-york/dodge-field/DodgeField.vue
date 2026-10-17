<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    useEventListener,
    usePreferredReducedMotion,
    useResizeObserver,
  } from '@vueuse/core';
  import { animate, useMotionValue } from 'motion-v';
  import type {
    DodgeFieldAxis,
    DodgeFieldProps,
    DodgeFieldState,
    DodgeFieldWall,
  } from './types';

  const COUNT_LINE = 0.55;
  const DEAD_ZONE = 6;
  const CAUGHT_HOLD_MS = 760;
  const INSET = 12;

  const props = withDefaults(defineProps<DodgeFieldProps>(), {
    taunts: () => ['Catch me', 'Nope', 'Too slow', 'Almost', 'Okay, okay'],
    notice: '',
    inkColor: 'var(--foreground)',
    contrastColor: 'var(--background)',
    fieldHeight: 240,
    reach: 72,
    radius: 120,
    falloff: 2,
    fleeDuration: 130,
    returnDuration: 620,
    returnBounce: 0.1,
    axis: 'both',
    wall: 'clamp',
    patience: 4,
    disabled: false,
    class: undefined,
  });

  const emit = defineEmits<{
    dodge: [count: number];
    relent: [];
    catch: [];
  }>();

  defineSlots<{
    default?: (state: DodgeFieldState) => unknown;
  }>();

  const fieldRef = ref<HTMLDivElement | null>(null);
  const moverRef = ref<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const reduceMotion = usePreferredReducedMotion();
  const reduce = computed(() => reduceMotion.value === 'reduce');
  const mounted = ref(false);
  const fine = ref(true);
  const inside = ref(false);
  const dodges = ref(0);
  const caught = ref(false);
  const gave = computed(() => dodges.value >= Math.max(1, props.patience));
  const still = computed(
    () => gave.value || caught.value || props.disabled || reduce.value,
  );

  let pointer: { x: number; y: number } | null = null;
  let bearing = { x: 1, y: 0 };
  let armed = true;
  let room = { x: 0, y: 0 };
  let raf = 0;
  let hold: ReturnType<typeof setTimeout> | undefined;

  function wallIt(t: number, span: number, wall: DodgeFieldWall) {
    if (wall === 'bounce') {
      if (t > span) return Math.max(-span, 2 * span - t);
      if (t < -span) return Math.min(span, -2 * span - t);
      return t;
    }
    return Math.min(span, Math.max(-span, t));
  }

  function bearingOf(dx: number, dy: number, d: number, axis: DodgeFieldAxis) {
    if (axis === 'x') return { x: Math.sign(dx) || 1, y: 0 };
    if (axis === 'y') return { x: 0, y: Math.sign(dy) || 1 };
    return { x: dx / d, y: dy / d };
  }

  function applyTransform() {
    const mover = moverRef.value;
    if (mover) mover.style.transform = `translate(${x.get()}px, ${y.get()}px)`;
  }
  const offX = x.on('change', applyTransform);
  const offY = y.on('change', applyTransform);

  function measure() {
    const field = fieldRef.value;
    const mover = moverRef.value;
    if (!field || !mover) return;
    room = {
      x: Math.max(0, (field.clientWidth - mover.offsetWidth) / 2 - INSET),
      y: Math.max(0, (field.clientHeight - mover.offsetHeight) / 2 - INSET),
    };
  }
  useResizeObserver(fieldRef, measure);
  useResizeObserver(moverRef, measure);

  function frame() {
    raf = 0;
    const field = fieldRef.value;
    if (!field) return;
    const rect = field.getBoundingClientRect();
    const zoom = rect.width / (field.offsetWidth || rect.width) || 1;
    const dx = pointer
      ? (pointer.x - (rect.left + rect.width / 2)) / zoom
      : Infinity;
    const dy = pointer
      ? (pointer.y - (rect.top + rect.height / 2)) / zoom
      : Infinity;
    const d = Math.hypot(dx, dy);
    const isInside = d <= props.radius;
    if (!isInside && !inside.value) return;
    if (!still.value) {
      if (d < props.radius * COUNT_LINE) {
        if (armed) {
          armed = false;
          dodges.value += 1;
        }
      } else if (d > props.radius) {
        armed = true;
      }
    }
    if (Number.isFinite(d) && d > DEAD_ZONE)
      bearing = bearingOf(dx, dy, d, props.axis);
    const flee =
      isInside && !still.value ? (1 - d / props.radius) ** props.falloff : 0;
    const tx = wallIt(-bearing.x * flee * props.reach, room.x, props.wall);
    const ty = wallIt(-bearing.y * flee * props.reach, room.y, props.wall);
    if (reduce.value) {
      x.jump(0);
      y.jump(0);
      applyTransform();
    } else {
      const cfg =
        flee > 0
          ? {
              type: 'spring' as const,
              duration: props.fleeDuration / 1000,
              bounce: 0,
            }
          : {
              type: 'spring' as const,
              duration: props.returnDuration / 1000,
              bounce: props.returnBounce,
            };
      animate(x, tx, cfg);
      animate(y, ty, cfg);
    }
    if (isInside !== inside.value) inside.value = isInside;
  }

  function tick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function onMove(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    pointer = { x: event.clientX, y: event.clientY };
    tick();
  }

  function onLeave() {
    pointer = null;
    tick();
  }

  const listening = computed(
    () => mounted.value && fine.value && !props.disabled,
  );
  const windowTarget = computed(() => (listening.value ? window : undefined));
  const documentTarget = computed(() =>
    listening.value ? document : undefined,
  );
  useEventListener(windowTarget, 'pointermove', onMove, { passive: true });
  useEventListener(windowTarget, 'scroll', tick, {
    passive: true,
    capture: true,
  });
  useEventListener(windowTarget, 'blur', onLeave);
  useEventListener(documentTarget, 'pointerleave', onLeave);

  let query: MediaQueryList | undefined;
  function syncFine() {
    if (query) fine.value = query.matches;
  }

  onMounted(() => {
    query = window.matchMedia('(hover: hover) and (pointer: fine)');
    syncFine();
    query.addEventListener('change', syncFine);
    mounted.value = true;
    measure();
  });

  watch(listening, (on) => {
    if (on) return;
    cancelAnimationFrame(raf);
    raf = 0;
  });
  watch(still, () => {
    if (mounted.value) tick();
  });
  watch(dodges, (count) => {
    if (count) emit('dodge', count);
  });
  watch(gave, (value) => {
    if (value) emit('relent');
  });

  onBeforeUnmount(() => {
    query?.removeEventListener('change', syncFine);
    cancelAnimationFrame(raf);
    clearTimeout(hold);
    offX();
    offY();
    x.stop();
    y.stop();
  });

  function handleClick() {
    caught.value = true;
    emit('catch');
    clearTimeout(hold);
    hold = setTimeout(() => {
      caught.value = false;
      dodges.value = 0;
      armed = false;
    }, CAUGHT_HOLD_MS);
  }

  const state = computed<DodgeFieldState>(() => ({
    dodges: dodges.value,
    gave: gave.value,
    caught: caught.value,
    fleeing: inside.value && !still.value,
  }));
  const index = computed(() =>
    gave.value || caught.value
      ? props.taunts.length - 1
      : Math.min(dodges.value, Math.max(0, props.taunts.length - 2)),
  );
  const fieldStyle = computed(() => ({
    '--df-ink': props.inkColor,
    '--df-contrast': props.contrastColor,
    '--df-height': `${props.fieldHeight}px`,
  }));
</script>

<template>
  <div
    ref="fieldRef"
    :class="['dodge-field', props.class]"
    :data-coarse="fine ? undefined : ''"
    :data-flat="reduce ? '' : undefined"
    :style="fieldStyle"
  >
    <div
      ref="moverRef"
      class="dodge-field__mover"
      :data-fled="state.fleeing ? 'true' : 'false'"
      :data-relented="gave ? 'true' : 'false'"
      :data-caught="caught ? 'true' : 'false'"
      @click="handleClick"
    >
      <slot v-bind="state">
        <button type="button" class="dodge-field__pill" :aria-label="taunts[0]">
          <span class="dodge-field__labels">
            <span
              v-for="(taunt, i) in taunts"
              :key="`${taunt}-${i}`"
              class="dodge-field__label"
              :data-active="i === index ? 'true' : 'false'"
              aria-hidden="true"
            >
              {{ taunt }}
            </span>
          </span>
        </button>
      </slot>
    </div>
    <p v-if="!fine && notice" class="dodge-field__notice">{{ notice }}</p>
  </div>
</template>

<style scoped>
  .dodge-field {
    --df-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
    height: var(--df-height);
  }

  .dodge-field__mover {
    display: inline-grid;
    will-change: transform;
  }

  .dodge-field__pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 52px;
    margin: 0;
    padding: 0 28px;
    border: 0;
    border-radius: 999px;
    background: color-mix(in srgb, var(--df-ink) 8%, transparent);
    color: color-mix(in srgb, var(--df-ink) 72%, transparent);
    font-family: inherit;
    font-size: 18px;
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.012em;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition:
      transform 160ms var(--df-ease-out),
      background-color 220ms ease,
      color 220ms ease;
  }

  .dodge-field__pill:active {
    transform: scale(0.97);
  }

  .dodge-field__pill:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--df-ink) 60%, transparent);
    outline-offset: 3px;
  }

  @media (hover: hover) and (pointer: fine) {
    .dodge-field__pill:hover {
      color: color-mix(in srgb, var(--df-ink) 90%, transparent);
    }
  }

  .dodge-field__mover[data-relented='true'] .dodge-field__pill {
    color: var(--df-ink);
  }

  .dodge-field__mover[data-caught='true'] .dodge-field__pill {
    background: var(--df-ink);
    color: var(--df-contrast);
  }

  .dodge-field__labels {
    display: grid;
  }

  .dodge-field__label {
    grid-area: 1 / 1;
    white-space: nowrap;
    transition:
      opacity 200ms ease,
      filter 200ms ease;
  }

  .dodge-field__label[data-active='false'] {
    opacity: 0;
    filter: blur(2px);
  }

  .dodge-field__notice {
    position: absolute;
    inset: auto 0 12px;
    margin: 0;
    color: color-mix(in srgb, var(--df-ink) 55%, transparent);
    font-size: 12px;
    text-align: center;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .dodge-field__pill {
      transition:
        background-color 220ms ease,
        color 220ms ease;
    }

    .dodge-field__pill:active {
      transform: none;
    }

    .dodge-field .dodge-field__label {
      filter: none;
    }
  }
</style>
