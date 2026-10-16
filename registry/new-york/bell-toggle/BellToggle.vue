<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    useTemplateRef,
    watch,
  } from 'vue';
  import { animate, motionValue } from 'motion-v';
  import type { AnimationPlaybackControls } from 'motion-v';
  import { usePreferredReducedMotion, useResizeObserver } from '@vueuse/core';
  import type { BellToggleInput, BellToggleProps } from './types';
  import {
    BELL_BODY,
    SIZES,
    SPRING_UI,
    WOBBLE,
    liveAngle,
    passOffset,
    ringKeyframes,
  } from './bell-ring';

  const props = withDefaults(defineProps<BellToggleProps>(), {
    offLabel: 'Notify me',
    onLabel: "You'll be notified",
    icon: 'lucide:bell',
    label: undefined,
    color: '#f5f5f5',
    background: '#27272a',
    onColor: '#18181b',
    onBackground: '#f5f5f5',
    size: 'md',
    radius: 22,
    ringAmplitude: 17,
    ringPasses: 5,
    ringDecay: 1,
    ringDuration: 820,
    ringPivot: 16,
    crossfadeMs: 200,
    revealBounce: 0,
    count: 0,
    badge: true,
    badgeColor: '#ef4444',
    badgeTextColor: '#ffffff',
    waves: true,
    clapper: false,
    pressed: undefined,
    defaultPressed: false,
    disabled: false,
    class: '',
  });

  const emit = defineEmits<{
    'update:pressed': [pressed: boolean];
    change: [pressed: boolean];
  }>();

  const inner = ref(props.defaultPressed);
  const on = computed(() => props.pressed ?? inner.value);
  const reducedMotion = usePreferredReducedMotion();
  const reduce = computed(() => reducedMotion.value === 'reduce');

  const rootRef = useTemplateRef<HTMLSpanElement>('root');
  const glyphRef = useTemplateRef<HTMLSpanElement>('glyph');
  const clapperRef = useTemplateRef<HTMLSpanElement>('clapperEl');
  const waveLeft = useTemplateRef<SVGSVGElement>('waveLeft');
  const waveRight = useTemplateRef<SVGSVGElement>('waveRight');
  const offRef = useTemplateRef<HTMLSpanElement>('offFace');
  const onRef = useTemplateRef<HTMLSpanElement>('onFace');

  let lastInput: BellToggleInput = 'pointer';
  let pending: BellToggleInput | null = null;
  let spring: AnimationPlaybackControls | null = null;

  const preset = computed(() => SIZES[props.size] ?? SIZES.md);

  const t = motionValue(on.value ? 1 : 0);
  const wOff = motionValue(0);
  const wOn = motionValue(0);

  function paintClip() {
    const root = rootRef.value;
    if (!root) return;
    const a = wOff.get();
    const b = wOn.get();
    const clip = Math.max(a, b) - (a + (b - a) * t.get());
    root.style.setProperty('--bt-clip', `${clip}px`);
  }

  const unsubscribers = [
    t.on('change', paintClip),
    wOff.on('change', paintClip),
    wOn.on('change', paintClip),
  ];

  function measure() {
    if (offRef.value) wOff.set(offRef.value.offsetWidth);
    if (onRef.value) wOn.set(onRef.value.offsetWidth);
    paintClip();
  }

  useResizeObserver(offRef, measure);
  useResizeObserver(onRef, measure);

  onMounted(() => {
    measure();
    document.fonts?.ready.then(measure);
  });

  watch(
    [() => props.offLabel, () => props.onLabel, () => props.size],
    measure,
    {
      flush: 'post',
    },
  );

  function swing(amplitude: number, passes: number, duration: number) {
    const el = glyphRef.value;
    if (!el) return;
    el.getAnimations().forEach((a) => a.cancel());
    el.animate(
      ringKeyframes(liveAngle(el), amplitude, passes, props.ringDecay),
      {
        duration,
        easing: 'linear',
      },
    );
    const c = clapperRef.value;
    if (c) {
      c.getAnimations().forEach((a) => a.cancel());
      c.animate(
        ringKeyframes(liveAngle(c), amplitude * 1.6, passes, props.ringDecay),
        { duration, delay: 70, easing: 'linear' },
      );
    }
    if (!props.waves) return;
    for (let k = 0; k < passes; k++) {
      const side = k % 2 ? waveRight.value : waveLeft.value;
      if (!side) continue;
      const strength = Math.pow(1 - k / passes, props.ringDecay);
      side.animate(
        [
          { opacity: 0, transform: 'scale(0.55)' },
          { opacity: 0.9 * strength, offset: 0.3 },
          { opacity: 0, transform: 'scale(1.25)' },
        ],
        {
          duration: 380,
          delay: passOffset(k, passes) * duration,
          easing: 'ease-out',
        },
      );
    }
  }

  watch(
    on,
    (value) => {
      const pointer = pending === 'pointer' && !reduce.value;
      pending = null;
      spring?.stop();
      if (pointer) {
        spring = animate(t, value ? 1 : 0, {
          ...SPRING_UI,
          bounce: props.revealBounce,
        });
      } else {
        t.jump(value ? 1 : 0);
      }
      if (value && pointer) {
        swing(props.ringAmplitude, props.ringPasses, props.ringDuration);
      }
    },
    { flush: 'post' },
  );

  watch(
    () => props.count,
    (count, was) => {
      if (count > was && on.value && !reduce.value) {
        swing(
          props.ringAmplitude * WOBBLE.amplitude,
          WOBBLE.passes,
          WOBBLE.duration,
        );
      }
    },
  );

  onBeforeUnmount(() => {
    spring?.stop();
    unsubscribers.forEach((off) => off());
  });

  function toggle() {
    pending = lastInput;
    const next = !on.value;
    if (props.pressed === undefined) inner.value = next;
    emit('update:pressed', next);
    emit('change', next);
  }

  function press(e: PointerEvent) {
    lastInput = 'pointer';
    if (e.button === 0 && !props.disabled && rootRef.value) {
      rootRef.value.dataset.pressed = '';
    }
  }

  function release() {
    if (rootRef.value) delete rootRef.value.dataset.pressed;
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') lastInput = 'keyboard';
  }

  const showBadge = computed(() => props.badge && on.value && props.count > 0);
  const badgeText = computed(() =>
    props.count > 9 ? '9+' : String(props.count),
  );

  const rootStyle = computed(() => ({
    '--bt-color': props.color,
    '--bt-bg': props.background,
    '--bt-on-color': props.onColor,
    '--bt-on-bg': props.onBackground,
    '--bt-badge': props.badgeColor,
    '--bt-badge-ink': props.badgeTextColor,
    '--bt-radius': `${props.radius}px`,
    '--bt-fade': `${props.crossfadeMs}ms`,
    '--bt-pivot': `${props.ringPivot}%`,
    '--bt-h': `${preset.value[0]}px`,
    '--bt-fs': `${preset.value[1]}px`,
    '--bt-icon': `${preset.value[2]}px`,
    '--bt-px': `${preset.value[3]}px`,
    '--bt-gap': `${preset.value[4]}px`,
  }));
</script>

<template>
  <span
    ref="root"
    :class="['bell-toggle', props.class]"
    :data-on="on ? 'true' : 'false'"
    :data-disabled="disabled ? '' : undefined"
    :style="rootStyle"
  >
    <button
      type="button"
      class="bell-toggle__button"
      :aria-pressed="on"
      :aria-label="label ?? offLabel"
      :disabled="disabled"
      @pointerdown="press"
      @pointerup="release"
      @pointercancel="release"
      @pointerleave="release"
      @keydown="handleKey"
      @click="toggle"
    >
      <span class="bell-toggle__bell" aria-hidden="true">
        <span ref="glyph" class="bell-toggle__glyph">
          <svg
            v-if="clapper"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path :d="BELL_BODY" />
            <path d="M12 2.5V4" />
          </svg>
          <slot v-else name="icon">
            <Icon :name="icon" class="size-full" />
          </slot>
        </span>
        <span v-if="clapper" ref="clapperEl" class="bell-toggle__clapper">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="20.4" r="1.7" fill="currentColor" />
          </svg>
        </span>
        <template v-if="waves">
          <svg
            ref="waveLeft"
            class="bell-toggle__wave bell-toggle__wave--left"
            viewBox="0 0 14 14"
          >
            <path d="M14 8a6 6 0 0 0-6 6" />
            <path d="M14 4A10 10 0 0 0 4 14" />
          </svg>
          <svg
            ref="waveRight"
            class="bell-toggle__wave bell-toggle__wave--right"
            viewBox="0 0 14 14"
          >
            <path d="M0 8a6 6 0 0 1 6 6" />
            <path d="M0 4a10 10 0 0 1 10 10" />
          </svg>
        </template>
        <span
          v-if="badge"
          class="bell-toggle__badge"
          :data-show="showBadge ? '' : undefined"
        >
          <span :key="count" class="bell-toggle__digit">{{ badgeText }}</span>
        </span>
      </span>
      <span class="bell-toggle__say" aria-hidden="true">
        <span ref="offFace" class="bell-toggle__face bell-toggle__face--off">
          {{ offLabel }}
        </span>
        <span ref="onFace" class="bell-toggle__face bell-toggle__face--on">
          {{ onLabel }}
        </span>
      </span>
    </button>
  </span>
</template>

<style scoped>
  .bell-toggle {
    --bt-clip: 0px;
    --bt-press: 0.97;
    --bt-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    position: relative;
    display: inline-grid;
    grid-template-columns: max-content;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    transition: transform 160ms var(--bt-ease-out);
  }

  .bell-toggle[data-pressed] {
    transform: scale(var(--bt-press));
  }

  .bell-toggle[data-disabled] {
    opacity: 0.55;
  }

  .bell-toggle[data-disabled][data-pressed] {
    transform: none;
  }

  .bell-toggle__button {
    grid-area: 1 / 1;
    display: inline-flex;
    align-items: center;
    gap: var(--bt-gap);
    height: var(--bt-h);
    margin: 0;
    padding: 0 var(--bt-px);
    border: 0;
    border-radius: var(--bt-radius);
    background: var(--bt-bg);
    color: var(--bt-color);
    font: inherit;
    font-size: var(--bt-fs);
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0.01em;
    white-space: nowrap;
    cursor: pointer;
    outline: none;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    clip-path: inset(0 var(--bt-clip) 0 0 round var(--bt-radius));
    transition:
      background-color var(--bt-fade) ease,
      color var(--bt-fade) ease;
  }

  .bell-toggle__button:focus-visible {
    box-shadow: inset 0 0 0 2px
      color-mix(in srgb, currentColor 70%, transparent);
  }

  .bell-toggle__button:disabled {
    cursor: default;
  }

  .bell-toggle[data-on='true'] .bell-toggle__button {
    background: var(--bt-on-bg);
    color: var(--bt-on-color);
  }

  @media (hover: hover) and (pointer: fine) {
    .bell-toggle__button:enabled:hover {
      background: color-mix(in srgb, var(--bt-color) 6%, var(--bt-bg));
    }

    .bell-toggle[data-on='true'] .bell-toggle__button:enabled:hover {
      background: color-mix(in srgb, var(--bt-on-color) 6%, var(--bt-on-bg));
    }
  }

  .bell-toggle__bell {
    position: relative;
    display: inline-grid;
    flex: none;
    width: var(--bt-icon);
    height: var(--bt-icon);
  }

  .bell-toggle__glyph {
    display: inline-grid;
    place-items: center;
    grid-area: 1 / 1;
    width: var(--bt-icon);
    height: var(--bt-icon);
    transform-origin: 50% var(--bt-pivot);
  }

  .bell-toggle__glyph svg {
    width: 100%;
    height: 100%;
  }

  .bell-toggle__clapper {
    position: absolute;
    inset: 0;
    transform-origin: 50% var(--bt-pivot);
    pointer-events: none;
  }

  .bell-toggle__clapper svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .bell-toggle__wave {
    position: absolute;
    top: -3px;
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    opacity: 0;
    pointer-events: none;
  }

  .bell-toggle__wave--left {
    right: calc(100% - 2px);
    transform-origin: 100% 100%;
  }

  .bell-toggle__wave--right {
    left: calc(100% - 2px);
    transform-origin: 0% 100%;
  }

  .bell-toggle__badge {
    position: absolute;
    top: -6px;
    right: -7px;
    display: grid;
    place-items: center;
    min-width: 14px;
    height: 14px;
    padding: 0 3px;
    box-sizing: border-box;
    border-radius: 7px;
    background: var(--bt-badge);
    color: var(--bt-badge-ink);
    font-size: 9.5px;
    font-weight: 600;
    line-height: 1;
    opacity: 0;
    transform: translateY(5px) scale(0.6);
    pointer-events: none;
    transition:
      transform 180ms var(--bt-ease-out),
      opacity 140ms ease;
  }

  .bell-toggle__badge[data-show] {
    opacity: 1;
    transform: translateY(0) scale(1);
    transition:
      transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1),
      opacity 120ms ease;
  }

  .bell-toggle__digit {
    display: block;
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity 200ms ease,
      transform 200ms var(--bt-ease-out);
  }

  @starting-style {
    .bell-toggle__digit {
      opacity: 0;
      transform: translateY(5px);
    }
  }

  .bell-toggle__say {
    display: inline-grid;
    grid-template-columns: max-content;
    height: 18px;
    line-height: 18px;
  }

  .bell-toggle__face {
    grid-area: 1 / 1;
    justify-self: start;
    opacity: 0;
    filter: blur(2px);
    transition:
      opacity var(--bt-fade) ease,
      filter var(--bt-fade) ease;
  }

  .bell-toggle[data-on='false'] .bell-toggle__face--off,
  .bell-toggle[data-on='true'] .bell-toggle__face--on {
    opacity: 1;
    filter: blur(0);
  }

  @media (prefers-reduced-motion: reduce) {
    .bell-toggle[data-pressed] {
      transform: none;
    }

    .bell-toggle__face {
      filter: none !important;
      transition: opacity var(--bt-fade) ease;
    }

    .bell-toggle__badge,
    .bell-toggle__badge[data-show] {
      transition: opacity 140ms ease;
      transform: none;
    }

    .bell-toggle__digit {
      transition: opacity 200ms ease;
      transform: none;
    }
  }
</style>
