<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import { animate, motionValue } from 'motion-v';
  import { readings, springBounce } from './spring-check';
  import type { SpringCheckProps, SpringCheckStrike } from './types';

  const VISUAL_DURATION = 0.2;
  // lucide:check geometry, reversed so the stroke draws left to right.
  const TICK_PATH = 'M4 12l5 5L20 6';
  const ORIGIN: Record<SpringCheckStrike, string> = {
    left: 'left center',
    center: 'center',
    right: 'right center',
    none: 'left center',
  };

  const props = withDefaults(defineProps<SpringCheckProps>(), {
    label: 'Ship the build',
    modelValue: undefined,
    defaultChecked: false,
    disabled: false,
    color: '#ffffff',
    fillColor: '#ffffff',
    checkColor: '#0b0b0f',
    boxSize: 28,
    boxRadius: 9,
    fontSize: 18,
    bounce: 0.2,
    strikeLag: 0.12,
    doneOpacity: 0.42,
    strike: 'left',
    ariaLabel: undefined,
    class: '',
  });

  const emit = defineEmits<{
    'update:modelValue': [checked: boolean];
    change: [checked: boolean];
  }>();

  const inner = ref(props.defaultChecked);
  const controlled = computed(() => props.modelValue !== undefined);
  const on = computed(() =>
    controlled.value ? props.modelValue === true : inner.value,
  );
  const reduced = usePreferredReducedMotion();

  const t = motionValue(on.value ? 1 : 0);
  const initial = readings(t.get(), props.doneOpacity, props.strikeLag);
  const rowRef = ref<HTMLButtonElement | null>(null);
  const boxRef = ref<HTMLSpanElement | null>(null);
  const fillRef = ref<HTMLSpanElement | null>(null);
  const tickRef = ref<SVGPathElement | null>(null);
  const wordRef = ref<HTMLSpanElement | null>(null);
  const ruleRef = ref<HTMLSpanElement | null>(null);
  let viaPointer = false;
  let instant = false;
  let controls: { stop: () => void } | null = null;

  function write(value: number) {
    const r = readings(value, props.doneOpacity, props.strikeLag);
    if (fillRef.value) fillRef.value.style.transform = r.fill;
    if (boxRef.value) boxRef.value.style.transform = r.box;
    if (tickRef.value) tickRef.value.style.strokeDashoffset = String(r.tick);
    if (wordRef.value) wordRef.value.style.opacity = String(r.word);
    if (ruleRef.value) ruleRef.value.style.transform = r.rule;
  }

  const unsubscribe = t.on('change', write);

  function run() {
    const target = on.value ? 1 : 0;
    controls?.stop();
    controls = null;
    if (reduced.value === 'reduce' || instant) {
      instant = false;
      t.jump(target);
      write(target);
      return;
    }
    if (t.get() === target && t.getVelocity() === 0) return;
    controls = animate(t, target, {
      type: 'spring',
      visualDuration: VISUAL_DURATION,
      bounce: springBounce(props.bounce),
    });
  }

  watch([on, reduced, () => props.bounce], run);
  watch(
    [() => props.doneOpacity, () => props.strikeLag, () => props.strike],
    () => write(t.get()),
    { flush: 'post' },
  );

  onMounted(() => write(t.get()));

  onBeforeUnmount(() => {
    controls?.stop();
    unsubscribe();
  });

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0 || props.disabled) return;
    viaPointer = true;
    if (reduced.value !== 'reduce' && rowRef.value)
      rowRef.value.dataset.pressed = '';
  }

  function onPointerUp() {
    if (rowRef.value) delete rowRef.value.dataset.pressed;
  }

  function onPointerCancel() {
    viaPointer = false;
    onPointerUp();
  }

  function toggle() {
    if (props.disabled) return;
    instant = !viaPointer;
    viaPointer = false;
    const next = !on.value;
    if (!controlled.value) inner.value = next;
    emit('update:modelValue', next);
    emit('change', next);
  }

  const cssVars = computed(() => {
    const ring = props.boxSize >= 24 ? 2 : 1.5;
    const gap = Math.min(16, Math.max(8, Math.round(props.boxSize * 0.43)));
    const ruleHeight = Math.max(1.5, Math.round(props.fontSize / 6) / 2);
    return {
      '--sc-ink': props.color,
      '--sc-fill': props.fillColor,
      '--sc-check': props.checkColor,
      '--sc-box': `${props.boxSize}px`,
      '--sc-radius': `${props.boxRadius}px`,
      '--sc-font': `${props.fontSize}px`,
      '--sc-ring': `${ring}px`,
      '--sc-gap': `${gap}px`,
      '--sc-row': `${Math.max(44, props.boxSize + 16)}px`,
      '--sc-rule': `${ruleHeight}px`,
      '--sc-origin': ORIGIN[props.strike],
    };
  });

  const boxStyle = { transform: initial.box };
  const fillStyle = { transform: initial.fill };
  const tickStyle = { strokeDashoffset: initial.tick };
  const wordStyle = { opacity: initial.word };
  const ruleStyle = { transform: initial.rule };
</script>

<template>
  <button
    ref="rowRef"
    type="button"
    role="checkbox"
    :aria-checked="on"
    :aria-label="ariaLabel"
    :disabled="disabled"
    :class="['spring-check', props.class]"
    :style="cssVars"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @pointerleave="onPointerCancel"
    @click="toggle"
  >
    <span class="spring-check__press">
      <span ref="boxRef" class="spring-check__box" :style="boxStyle">
        <span class="spring-check__ring" aria-hidden="true" />
        <span ref="fillRef" class="spring-check__fill" :style="fillStyle" />
        <svg class="spring-check__tick" viewBox="0 0 24 24" aria-hidden="true">
          <path
            ref="tickRef"
            :d="TICK_PATH"
            path-length="1"
            stroke-dasharray="1"
            :style="tickStyle"
          />
        </svg>
      </span>
    </span>
    <span class="spring-check__label">
      <span ref="wordRef" class="spring-check__word" :style="wordStyle">
        <slot>{{ label }}</slot>
      </span>
      <span
        v-if="strike !== 'none'"
        ref="ruleRef"
        class="spring-check__rule"
        aria-hidden="true"
        :style="ruleStyle"
      />
    </span>
  </button>
</template>

<style scoped>
  .spring-check {
    --sc-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    display: inline-flex;
    align-items: center;
    gap: var(--sc-gap);
    min-height: var(--sc-row);
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--sc-ink);
    font-family: inherit;
    font-size: var(--sc-font);
    font-weight: 500;
    line-height: 1.2;
    letter-spacing: -0.01em;
    text-align: left;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    outline: none;
  }

  .spring-check:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spring-check__press {
    flex: none;
    width: var(--sc-box);
    height: var(--sc-box);
    border-radius: var(--sc-radius);
    transition: transform 160ms var(--sc-ease-out);
  }

  .spring-check[data-pressed] .spring-check__press {
    transform: scale(0.95);
  }

  .spring-check:focus-visible .spring-check__press {
    outline: 2px solid color-mix(in srgb, var(--sc-ink) 45%, transparent);
    outline-offset: 3px;
  }

  .spring-check__box {
    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    overflow: hidden;
    transform-origin: center;
  }

  .spring-check__ring {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 var(--sc-ring) var(--sc-ink);
    opacity: 0.28;
    transition: opacity 120ms ease;
  }

  @media (hover: hover) and (pointer: fine) {
    .spring-check:not(:disabled):hover .spring-check__ring {
      opacity: 0.5;
    }
  }

  .spring-check__fill {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--sc-fill);
    transform-origin: center;
  }

  .spring-check__tick {
    position: relative;
    width: 68%;
    height: 68%;
    overflow: visible;
    fill: none;
    stroke: var(--sc-check);
    stroke-width: 2.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .spring-check__label {
    position: relative;
    display: inline-block;
  }

  .spring-check__word {
    display: inline-block;
  }

  .spring-check__rule {
    position: absolute;
    left: 0;
    right: 0;
    top: 46%;
    height: var(--sc-rule);
    border-radius: 2px;
    background: currentColor;
    transform-origin: var(--sc-origin);
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .spring-check__press {
      transition: none;
    }
  }
</style>
