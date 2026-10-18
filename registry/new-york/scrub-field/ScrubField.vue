<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    useId,
    useTemplateRef,
    watch,
  } from 'vue';
  import { animate, motionValue } from 'motion-v';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import type {
    ScrubFieldDrag,
    ScrubFieldModifiers,
    ScrubFieldProps,
  } from './types';
  import {
    LEAN,
    SIZES,
    SPRING_UI,
    clamp,
    decimalsOf,
    onColor,
  } from './scrub-field-math';

  const props = withDefaults(defineProps<ScrubFieldProps>(), {
    label: 'Radius',
    suffix: 'px',
    modelValue: undefined,
    defaultValue: 24,
    min: 0,
    max: 100,
    step: 1,
    size: 'md',
    sensitivity: 2,
    rubberReach: 8,
    returnDuration: 300,
    coarseMultiplier: 10,
    fineMultiplier: 0.1,
    showDelta: true,
    showDirty: false,
    showFill: true,
    accent: '#f5f5f5',
    chipColor: '#27272a',
    disabled: false,
    class: '',
  });

  const emit = defineEmits<{
    'update:modelValue': [value: number];
    change: [value: number];
    commit: [value: number];
  }>();

  const id = useId();
  const reducedMotion = usePreferredReducedMotion();
  const reduce = computed(() => reducedMotion.value === 'reduce');

  const chipRef = useTemplateRef<HTMLDivElement>('chip');
  const inputRef = useTemplateRef<HTMLInputElement>('input');
  const ghostRef = useTemplateRef<HTMLSpanElement>('ghost');
  const fillRef = useTemplateRef<HTMLSpanElement>('fill');

  const startValue =
    props.modelValue !== undefined ? props.modelValue : props.defaultValue;
  const value = ref<number>(startValue);
  const dragging = ref(false);
  const draft = ref<string | null>(null);

  let drag: ScrubFieldDrag | null = null;
  let current = startValue;
  let typing = false;
  let moved = false;
  let escListener: ((e: KeyboardEvent) => void) | null = null;

  const display = motionValue(startValue);

  const baseDecimals = computed(() => decimalsOf(props.step));
  const fineDecimals = computed(() =>
    Math.min(6, baseDecimals.value + decimalsOf(props.fineMultiplier)),
  );
  const preset = computed(() => SIZES[props.size] ?? SIZES.md);

  function fmt(v: number): string {
    const scaled = v * 10 ** baseDecimals.value;
    return v.toFixed(
      Math.abs(scaled - Math.round(scaled)) < 1e-6
        ? baseDecimals.value
        : fineDecimals.value,
    );
  }
  function signed(d: number): string {
    return (d < 0 ? '−' : '+') + fmt(Math.abs(d));
  }

  const initialText = fmt(startValue);

  const reach = computed(
    () =>
      (props.rubberReach / 100) *
      Math.max(props.max - props.min, Number.EPSILON),
  );
  function bend(raw: number): number {
    const r = reach.value;
    return r ? Math.sign(raw) * r * Math.log1p(Math.abs(raw) / r) : 0;
  }
  function unbend(over: number): number {
    const r = reach.value;
    return r ? Math.sign(over) * r * Math.expm1(Math.abs(over) / r) : 0;
  }
  function toShown(raw: number): number {
    const c = clamp(raw, props.min, props.max);
    return c + bend(raw - c);
  }
  function toRaw(shown: number): number {
    const c = clamp(shown, props.min, props.max);
    return c + unbend(shown - c);
  }
  function multiplierOf(e: ScrubFieldModifiers): number {
    if (e.shiftKey) return props.coarseMultiplier;
    return e.altKey ? props.fineMultiplier : 1;
  }

  function commit(next: number) {
    const rounded = clamp(
      Number(next.toFixed(fineDecimals.value)),
      props.min,
      props.max,
    );
    if (rounded === current) return;
    current = rounded;
    value.value = rounded;
    emit('update:modelValue', rounded);
    emit('change', rounded);
  }

  function paint(d: number) {
    if (!typing && inputRef.value) inputRef.value.value = fmt(d);
    const chip = chipRef.value;
    if (chip) {
      chip.dataset.over = d < props.min || d > props.max ? 'true' : 'false';
      const lean =
        reduce.value || !reach.value
          ? 0
          : clamp((d - clamp(d, props.min, props.max)) / reach.value, -1, 1) *
            LEAN;
      chip.style.transform = `translateX(${lean}px)`;
    }
    if (fillRef.value) {
      const fill =
        (clamp(d, props.min, props.max) - props.min) /
        Math.max(props.max - props.min, Number.EPSILON);
      fillRef.value.style.transform = `scaleX(${fill})`;
    }
  }

  const unsubscribe = display.on('change', paint);

  const initialFill = computed(
    () =>
      `scaleX(${
        (clamp(value.value, props.min, props.max) - props.min) /
        Math.max(props.max - props.min, Number.EPSILON)
      })`,
  );

  function adopt(next: number) {
    current = next;
    value.value = next;
    display.jump(next);
    if (!typing && inputRef.value) inputRef.value.value = fmt(next);
  }

  watch(
    () => props.modelValue,
    (v) => {
      if (v !== undefined && !drag && v !== current) {
        adopt(clamp(v, props.min, props.max));
      }
    },
  );
  watch(
    () => props.defaultValue,
    (v) => {
      if (props.modelValue === undefined && !drag) {
        adopt(clamp(v, props.min, props.max));
      }
    },
  );
  watch([baseDecimals, fineDecimals], () => {
    if (!typing && inputRef.value) inputRef.value.value = fmt(current);
  });
  watch(
    [() => props.min, () => props.max, () => props.showFill],
    () => paint(display.get()),
    { flush: 'post' },
  );

  onMounted(() => paint(display.get()));

  function removeEsc() {
    if (escListener) {
      window.removeEventListener('keydown', escListener);
      escListener = null;
    }
  }

  function handlePointerDown(e: PointerEvent) {
    if (props.disabled || drag || e.button !== 0 || typing) return;
    if (e.pointerType !== 'touch') e.preventDefault();
    display.stop();
    moved = false;
    drag = {
      id: e.pointerId,
      x: e.clientX,
      raw: toRaw(display.get()),
      mult: multiplierOf(e),
      moved: false,
      before: current,
      slack: e.pointerType === 'touch' ? 8 : 3,
      left: chipRef.value ? chipRef.value.getBoundingClientRect().left : 0,
    };
    const target = e.currentTarget;
    if (target instanceof HTMLElement) {
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // capture is best-effort
      }
    }
    removeEsc();
    escListener = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') end(true);
    };
    window.addEventListener('keydown', escListener);
  }

  function handlePointerMove(e: PointerEvent) {
    const g = drag;
    if (!g || e.pointerId !== g.id) return;
    if (!g.moved) {
      if (Math.abs(e.clientX - g.x) < g.slack) return;
      g.moved = true;
      moved = true;
      g.x = e.clientX;
      dragging.value = true;
      document.documentElement.style.cursor = 'ew-resize';
    }
    const m = multiplierOf(e);
    if (m !== g.mult) {
      g.mult = m;
      g.raw = toRaw(display.get());
      g.x = e.clientX;
    }
    const raw =
      g.raw +
      Math.round((e.clientX - g.x) / props.sensitivity) * props.step * m;
    const shown = toShown(raw);
    display.set(shown);
    commit(clamp(raw, props.min, props.max));
    if (ghostRef.value) {
      ghostRef.value.style.translate = `calc(${e.clientX - g.left}px - 50%) -100%`;
      ghostRef.value.textContent = signed(shown - g.before);
    }
  }

  function end(cancel = false) {
    const g = drag;
    if (!g) return;
    drag = null;
    dragging.value = false;
    document.documentElement.style.cursor = '';
    removeEsc();
    if (cancel) {
      commit(g.before);
      display.jump(g.before);
      return;
    }
    if (!g.moved) {
      inputRef.value?.focus();
      return;
    }
    const bound = clamp(display.get(), props.min, props.max);
    if (display.get() !== bound) {
      if (reduce.value) display.jump(bound);
      else {
        animate(display, bound, {
          ...SPRING_UI,
          duration: props.returnDuration / 1000,
        });
      }
    }
    if (current !== g.before) emit('commit', current);
  }

  function handlePointerUp() {
    end();
  }
  function handlePointerCancel() {
    end(true);
  }
  function handleLostCapture() {
    end();
  }

  function handleLabelClick(e: MouseEvent) {
    if (moved) e.preventDefault();
  }

  function leaveTyping() {
    typing = false;
    draft.value = null;
    if (inputRef.value) inputRef.value.value = fmt(current);
  }

  function handleKeyDown(e: KeyboardEvent) {
    const d = draft.value;
    const typedNumber = d !== null && d.trim() !== '' ? Number(d) : NaN;
    const from = Number.isNaN(typedNumber) ? current : typedNumber;
    const deltas: Record<string, number> = {
      ArrowUp: props.step * multiplierOf(e),
      ArrowDown: -props.step * multiplierOf(e),
      PageUp: props.step * props.coarseMultiplier,
      PageDown: -props.step * props.coarseMultiplier,
    };
    const delta = deltas[e.key];
    const target = e.currentTarget;
    if (delta !== undefined || e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      leaveTyping();
      let next = props.max;
      if (delta !== undefined) next = from + delta;
      else if (e.key === 'Home') next = props.min;
      commit(next);
      display.jump(current);
      if (inputRef.value) inputRef.value.value = fmt(current);
      emit('commit', current);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (target instanceof HTMLInputElement) target.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      leaveTyping();
      if (target instanceof HTMLInputElement) target.blur();
    }
  }

  function handleFocus(e: FocusEvent) {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    typing = true;
    draft.value = target.value;
    target.select();
  }

  function handleInput(e: Event) {
    const target = e.target;
    if (target instanceof HTMLInputElement) draft.value = target.value;
  }

  function handleBlur() {
    const d = draft.value;
    const n = d === null ? NaN : Number.parseFloat(d.replace(/[^\d.-]/g, ''));
    if (!Number.isNaN(n)) {
      commit(n);
      emit('commit', current);
    }
    leaveTyping();
    display.jump(current);
  }

  onBeforeUnmount(() => {
    unsubscribe();
    display.stop();
    if (drag) document.documentElement.style.cursor = '';
    removeEsc();
  });

  const dirty = computed(
    () => props.showDirty && value.value !== props.defaultValue,
  );
  const valueText = computed(
    () => `${fmt(value.value)}${props.suffix ? ` ${props.suffix}` : ''}`,
  );
  const chipStyle = computed(() => ({
    '--sf-accent': props.accent,
    '--sf-chip': props.chipColor,
    '--sf-ghost-ink': onColor(props.accent),
    '--sf-h': `${preset.value.height}px`,
    '--sf-fs': `${preset.value.font}px`,
    '--sf-r': `${preset.value.radius}px`,
    '--sf-w': `${preset.value.width}px`,
  }));
</script>

<template>
  <div
    ref="chip"
    :class="['scrub-field', props.class]"
    :data-dirty="dirty ? 'true' : 'false'"
    :data-dragging="dragging ? 'true' : 'false'"
    :data-typing="draft !== null ? 'true' : 'false'"
    :data-disabled="disabled ? 'true' : 'false'"
    :aria-disabled="disabled || undefined"
    :style="chipStyle"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerCancel"
    @lostpointercapture="handleLostCapture"
  >
    <span v-if="showFill" class="scrub-field__track" aria-hidden="true">
      <span
        ref="fill"
        class="scrub-field__fill"
        :style="{ transform: initialFill }"
      />
    </span>
    <label :for="id" class="scrub-field__handle" @click="handleLabelClick">
      {{ label }}
    </label>
    <input
      :id="id"
      ref="input"
      class="scrub-field__input"
      type="text"
      inputmode="decimal"
      role="spinbutton"
      :aria-valuenow="value"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuetext="valueText"
      :value.attr="initialText"
      :disabled="disabled"
      @focus="handleFocus"
      @input="handleInput"
      @keydown="handleKeyDown"
      @blur="handleBlur"
    />
    <span v-if="suffix" class="scrub-field__suffix" aria-hidden="true">
      {{ suffix }}
    </span>
    <span
      v-if="showDelta"
      ref="ghost"
      class="scrub-field__ghost"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
  .scrub-field {
    --sf-ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    position: relative;
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    width: var(--sf-w);
    height: var(--sf-h);
    padding: 0 8px 0 4px;
    border-radius: var(--sf-r);
    background: var(--sf-chip);
    font-family: inherit;
    font-size: var(--sf-fs);
    line-height: 1;
    box-shadow: 0 0 0 1px transparent;
    cursor: ew-resize;
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color 200ms ease,
      box-shadow 200ms ease;
  }

  .scrub-field[data-dirty='true'] {
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--sf-accent) 55%, transparent);
    transition-duration: 0ms;
  }

  .scrub-field[data-typing='true'] {
    background: color-mix(in srgb, currentColor 7%, var(--sf-chip));
    cursor: text;
  }

  .scrub-field:focus-within {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--sf-accent) 70%, transparent);
  }

  .scrub-field__track {
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    overflow: hidden;
    pointer-events: none;
  }

  .scrub-field__fill {
    position: absolute;
    inset: 0;
    background: color-mix(in srgb, var(--sf-accent) 16%, transparent);
    transform-origin: left center;
  }

  .scrub-field[data-disabled='true'] {
    opacity: 0.5;
    cursor: default;
  }

  .scrub-field__handle {
    display: inline-flex;
    align-items: center;
    height: 100%;
    padding: 0 6px;
    border-radius: calc(var(--sf-r) - 2px);
    color: color-mix(in srgb, currentColor 55%, transparent);
    font-weight: 500;
    white-space: nowrap;
    cursor: inherit;
    transition:
      color 120ms ease,
      transform 160ms var(--sf-ease-out);
  }

  @media (hover: hover) and (pointer: fine) {
    .scrub-field:not([data-disabled='true']):hover .scrub-field__handle {
      color: color-mix(in srgb, currentColor 85%, transparent);
    }
  }

  .scrub-field:not([data-disabled='true']):not([data-typing='true']):active
    .scrub-field__handle,
  .scrub-field[data-dragging='true'] .scrub-field__handle {
    transform: scale(0.96);
    color: currentColor;
  }

  .scrub-field__input {
    flex: 1;
    width: 100%;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    text-align: right;
    cursor: inherit;
    transition: color 120ms ease;
  }

  .scrub-field[data-typing='true'] .scrub-field__input {
    cursor: text;
  }

  .scrub-field[data-over='true'] .scrub-field__input {
    color: color-mix(in srgb, currentColor 55%, transparent);
  }

  .scrub-field__suffix {
    color: color-mix(in srgb, currentColor 45%, transparent);
    font-weight: 500;
  }

  .scrub-field__ghost {
    position: absolute;
    top: -6px;
    left: 0;
    translate: 0 -100%;
    transform-origin: 50% 100%;
    padding: 2px 6px;
    border-radius: 999px;
    background: var(--sf-accent);
    color: var(--sf-ghost-ink);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.4;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    scale: 0.95;
    transition:
      opacity 125ms var(--sf-ease-out),
      scale 125ms var(--sf-ease-out);
  }

  .scrub-field[data-dragging='true'] .scrub-field__ghost {
    opacity: 1;
    scale: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .scrub-field .scrub-field__handle {
      transform: none;
      transition: color 120ms ease;
    }

    .scrub-field .scrub-field__ghost {
      scale: 1;
      transition: opacity 200ms ease;
    }
  }
</style>
