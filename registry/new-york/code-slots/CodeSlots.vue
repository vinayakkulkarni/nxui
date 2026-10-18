<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
  import { animate, motionValue } from 'motion-v';
  import type { MotionValue } from 'motion-v';
  import { usePreferredReducedMotion } from '@vueuse/core';
  import {
    CHECK_DELAY,
    CHECK_RISE,
    EASE_OUT,
    SINK_DELAY,
    SINK_FADE,
    SINK_STEP,
    WASH_IN,
    WASH_OUT,
    clamp01,
    digitsOf,
    firstEmptyOf,
    isFull,
    toSlots,
  } from './code-slots';
  import type { CodeSlotsProps } from './types';

  const props = withDefaults(defineProps<CodeSlotsProps>(), {
    length: 6,
    modelValue: undefined,
    defaultValue: '',
    status: 'idle',
    mask: false,
    caret: true,
    disabled: false,
    autoFocus: false,
    accentColor: '#f5f5f5',
    inkColor: '#f5f5f5',
    slotColor: '#27272a',
    digitColor: '#18181b',
    dangerColor: '#ff3b30',
    slotSize: 44,
    gap: 8,
    radius: 12,
    bounce: 0.2,
    settle: 0.3,
    rise: 8,
    cascade: 20,
    ariaLabel: 'One-time code',
    class: '',
  });

  const emit = defineEmits<{
    'update:modelValue': [code: string];
    change: [code: string];
    complete: [code: string];
  }>();

  const uid = useId();
  const motion = usePreferredReducedMotion();
  const reduce = () => motion.value === 'reduce';

  const inputRef = ref<HTMLInputElement | null>(null);
  const rowRef = ref<HTMLDivElement | null>(null);

  const initialSlots = toSlots(
    props.modelValue ?? props.defaultValue,
    props.length,
  );
  const slots = ref<string[]>(initialSlots);
  const shown = ref<string[]>([]);
  const active = ref(firstEmptyOf(initialSlots));
  const focused = ref(false);
  const veiled = ref(props.status === 'success');

  const openMv = motionValue(props.status === 'success' ? 1 : 0);
  const checkMv = motionValue(props.status === 'success' ? 1 : 0);
  let mvs: MotionValue<number>[] = [];
  let drops: MotionValue<number>[] = [];
  let unsubs: (() => void)[] = [];
  const glide = new Set<number>();
  let target: number[] = [];
  let draining = false;
  let drainTimer: ReturnType<typeof setTimeout> | undefined;
  let prevStatus = props.status;
  let emitted = digitsOf(props.modelValue ?? props.defaultValue).slice(
    0,
    props.length,
  );

  const pitch = computed(() => props.slotSize + props.gap);
  const height = computed(() => Math.round(props.slotSize * 1.18));
  const washRadius = computed(() => Math.min(props.radius, props.slotSize / 2));
  const sink = computed(() => Math.round(height.value * 0.5));

  const rootStyle = computed(() => ({
    '--cs-accent': props.accentColor,
    '--cs-ink': props.inkColor,
    '--cs-slot': props.slotColor,
    '--cs-digit': props.digitColor,
    '--cs-danger': props.dangerColor,
    '--cs-size': `${props.slotSize}px`,
    '--cs-height': `${height.value}px`,
    '--cs-gap': `${props.gap}px`,
    '--cs-radius': `${washRadius.value}px`,
    '--cs-font': `${Math.round(props.slotSize * 0.5)}px`,
  }));

  const view = computed(() =>
    slots.value.length === props.length
      ? slots.value
      : Array.from({ length: props.length }, (_, i) => slots.value[i] ?? ''),
  );
  const filledCount = computed(() => view.value.filter(Boolean).length);
  const showCaret = computed(
    () =>
      props.caret &&
      focused.value &&
      !props.disabled &&
      !veiled.value &&
      props.status !== 'success' &&
      (props.status === 'error' || !view.value[active.value]),
  );
  const checkSize = computed(() => `${Math.round(props.slotSize * 0.6)}px`);

  // Keep the last non-empty character per slot so a draining digit stays visible while it sinks.
  watch(
    [view, () => props.mask],
    () => {
      const next = view.value.map((ch, i) => {
        const display = props.mask && ch ? '•' : ch;
        return display || shown.value[i] || '';
      });
      if (
        next.some((c, i) => c !== shown.value[i]) ||
        next.length !== shown.value.length
      )
        shown.value = next;
    },
    { immediate: true },
  );

  // ---- painting (motion values → inline styles) ----
  function slotEls() {
    return rowRef.value?.querySelectorAll<HTMLElement>('.code-slots__slot');
  }

  function paintSlot(i: number) {
    const el = slotEls()?.[i];
    const mv = mvs[i];
    const drop = drops[i];
    if (!el || !mv || !drop) return;
    const t = mv.get();
    const d = drop.get();
    const fill = el.querySelector<HTMLElement>('.code-slots__fill');
    if (fill) fill.style.transform = `scale(${Math.max(t, 0)})`;
    const digit = el.querySelector<HTMLElement>('.code-slots__digit');
    if (digit) {
      digit.style.transform = `translateY(${(1 - t) * props.rise + Math.max(d, 0) * sink.value}px)`;
      digit.style.opacity = String(clamp01(t) * (1 - clamp01(d / SINK_FADE)));
    }
  }

  const caretEl = ref<HTMLSpanElement | null>(null);
  function paintCaret() {
    const el = caretEl.value;
    if (!el) return;
    const a = active.value;
    const p = pitch.value;
    let x = a * p;
    for (let j = 0; j < mvs.length; j++) {
      if (!glide.has(j)) continue;
      const h = clamp01(mvs[j]!.get());
      const to = target[j];
      if (to === undefined || h === clamp01(to)) {
        glide.delete(j);
        continue;
      }
      x += j < a ? -(1 - h) * p : h * p;
    }
    x = Math.min(Math.max(x, 0), Math.max(0, mvs.length - 1) * p);
    el.style.transform = `translateX(${x}px)`;
  }

  const washEl = ref<HTMLSpanElement | null>(null);
  const checkEl = ref<HTMLSpanElement | null>(null);
  function paintWash() {
    const o = openMv.get();
    const c = checkMv.get();
    if (washEl.value)
      washEl.value.style.clipPath = `inset(0 ${(1 - clamp01(o)) * 50}% round ${washRadius.value}px)`;
    if (checkEl.value) {
      checkEl.value.style.transform = `translateY(${(1 - c) * CHECK_RISE}px) scale(${0.85 + 0.15 * Math.max(c, 0)})`;
      checkEl.value.style.opacity = String(clamp01(c));
    }
  }

  function paintAll() {
    for (let i = 0; i < mvs.length; i++) paintSlot(i);
    paintCaret();
    paintWash();
  }

  unsubs.push(openMv.on('change', paintWash), checkMv.on('change', paintWash));

  function buildValues(n: number) {
    unsubs.slice(2).forEach((u) => u());
    unsubs = unsubs.slice(0, 2);
    mvs.forEach((mv) => mv.stop());
    drops.forEach((d) => d.stop());
    const current = slots.value;
    const sunk = prevStatus === 'success' ? 1 : 0;
    mvs = Array.from({ length: n }, (_, i) => motionValue(current[i] ? 1 : 0));
    drops = Array.from({ length: n }, () => motionValue(sunk));
    mvs.forEach((mv, i) => {
      unsubs.push(
        mv.on('change', () => {
          paintSlot(i);
          paintCaret();
        }),
      );
    });
    drops.forEach((d, i) => {
      unsubs.push(d.on('change', () => paintSlot(i)));
    });
  }
  buildValues(props.length);

  // ---- motion helpers ----
  function drive(i: number, to: number, delayMs = 0) {
    const mv = mvs[i];
    if (!mv) return;
    target[i] = to;
    if (reduce()) {
      mv.jump(to);
      return;
    }
    animate(mv, to, {
      type: 'spring',
      duration: props.settle,
      bounce: props.bounce,
      delay: delayMs / 1000,
    });
  }
  function land(i: number, delayMs = 0) {
    const mv = mvs[i];
    if (mv && mv.get() > 0) mv.jump(0);
    drive(i, 1, delayMs);
  }
  function moveActive(next: number, crossed: number[]) {
    crossed.forEach((j) => glide.add(j));
    active.value = next;
    paintCaret();
  }
  function jumpActive(next: number) {
    glide.clear();
    active.value = next;
    paintCaret();
  }

  function commit(next: string[]) {
    const prev = slots.value;
    slots.value = next;
    const code = next.join('');
    emitted = code;
    emit('update:modelValue', code);
    emit('change', code);
    if (!isFull(prev) && isFull(next)) emit('complete', code);
  }

  function insert(raw: string, from = active.value) {
    const digits = digitsOf(raw);
    if (!digits) return;
    const next = [...slots.value];
    const crossed: number[] = [];
    const step = reduce() ? 0 : props.cascade;
    let i = from;
    for (const ch of digits) {
      if (i >= props.length) break;
      next[i] = ch;
      land(i, (i - from) * step);
      crossed.push(i);
      i += 1;
    }
    if (!crossed.length) return;
    commit(next);
    moveActive(Math.min(i, props.length - 1), crossed);
  }

  function clearSlot(i: number, stepBack = false) {
    if (!slots.value[i]) {
      if (stepBack) jumpActive(i);
      return;
    }
    const next = [...slots.value];
    next[i] = '';
    drive(i, 0);
    commit(next);
    if (stepBack) moveActive(i, [i]);
  }

  const locked = () => props.disabled || draining || props.status === 'success';

  function onKeyDown(e: KeyboardEvent) {
    if (locked() || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const a = active.value;
    if (/^\d$/.test(k)) {
      e.preventDefault();
      insert(k);
    } else if (k === 'Backspace') {
      e.preventDefault();
      if (slots.value[a]) clearSlot(a);
      else if (a > 0) clearSlot(a - 1, true);
    } else if (k === 'Delete') {
      e.preventDefault();
      clearSlot(a);
    } else if (k === 'ArrowLeft') {
      e.preventDefault();
      jumpActive(Math.max(a - 1, 0));
    } else if (k === 'ArrowRight') {
      e.preventDefault();
      jumpActive(Math.min(a + 1, props.length - 1));
    } else if (k === 'Home') {
      e.preventDefault();
      jumpActive(0);
    } else if (k === 'End') {
      e.preventDefault();
      jumpActive(props.length - 1);
    }
  }

  function onPaste(e: ClipboardEvent) {
    if (locked()) return;
    e.preventDefault();
    insert(e.clipboardData?.getData('text') ?? '');
  }

  function onInput(e: Event) {
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;
    const d = digitsOf(el.value);
    el.value = '';
    if (locked() || !d) return;
    insert(d, d.length === 1 ? active.value : 0);
  }

  function onRowMouseDown(e: MouseEvent) {
    if (props.disabled) return;
    e.preventDefault();
    const row = rowRef.value;
    if (row && !draining && props.status !== 'success') {
      const rect = row.getBoundingClientRect();
      const zoom = rect.width / (row.offsetWidth || rect.width) || 1;
      const i = Math.floor((e.clientX - rect.left) / zoom / pitch.value);
      jumpActive(Math.max(0, Math.min(i, firstEmptyOf(slots.value))));
    }
    inputRef.value?.focus();
  }

  function onFocus() {
    focused.value = true;
  }
  function onBlur() {
    focused.value = false;
  }

  // ---- external changes ----
  watch(
    () => props.length,
    (n) => {
      buildValues(n);
      glide.clear();
      target = [];
      const next = Array.from({ length: n }, (_, i) => slots.value[i] ?? '');
      slots.value = next;
      jumpActive(firstEmptyOf(next));
      const code = next.join('');
      if (code !== emitted) {
        emitted = code;
        emit('update:modelValue', code);
        emit('change', code);
      }
    },
  );

  watch([() => props.modelValue, () => props.length], ([value]) => {
    if (value === undefined) return;
    const clean = digitsOf(value).slice(0, props.length);
    if (clean === emitted) return;
    emitted = clean;
    const prev = slots.value;
    const next = toSlots(clean, props.length);
    const hidden = prevStatus === 'success';
    const landing: number[] = [];
    const leaving: number[] = [];
    next.forEach((ch, i) => {
      if (ch === prev[i]) return;
      (ch ? landing : leaving).push(i);
    });
    const step = reduce() || hidden ? 0 : props.cascade;
    landing.forEach((i, k) => land(i, k * step));
    leaving.reverse().forEach((i, k) => {
      if (hidden) {
        target[i] = 0;
        mvs[i]?.jump(0);
        drops[i]?.jump(0);
      } else drive(i, 0, k * step);
    });
    slots.value = next;
    moveActive(firstEmptyOf(next), [...landing, ...leaving]);
    if (!isFull(prev) && isFull(next)) emit('complete', clean);
  });

  function onStatus(status: CodeSlotsProps['status']) {
    const was = prevStatus;
    if (status === 'success') {
      veiled.value = true;
      if (reduce()) {
        openMv.jump(1);
        drops.forEach((d) => d.jump(1));
        checkMv.jump(1);
        return;
      }
      animate(openMv, 1, { duration: WASH_IN, ease: EASE_OUT });
      drops.forEach((d, k) => {
        animate(d, 1, {
          type: 'spring',
          duration: 0.3,
          bounce: 0,
          delay: SINK_DELAY + k * SINK_STEP,
        });
      });
      animate(checkMv, 1, {
        type: 'spring',
        duration: 0.35,
        bounce: props.bounce,
        delay: CHECK_DELAY,
      });
      return;
    }
    if (was === 'success') {
      if (reduce()) {
        openMv.jump(0);
        checkMv.jump(0);
        drops.forEach((d) => d.jump(0));
        veiled.value = false;
      } else {
        animate(checkMv, 0, { duration: 0.15, ease: EASE_OUT });
        void animate(openMv, 0, {
          duration: WASH_OUT,
          ease: EASE_OUT,
          delay: 0.06,
        }).then(() => {
          if (openMv.get() === 0) veiled.value = false;
        });
        drops.forEach((d) => {
          animate(d, 0, {
            type: 'spring',
            duration: 0.3,
            bounce: 0,
            delay: 0.1,
          });
        });
      }
    }
    if (status !== 'error') return;
    const filled = slots.value
      .map((c, i) => (c ? i : -1))
      .filter((i) => i >= 0);
    if (!filled.length) return;
    filled.reverse();
    draining = true;
    const step = reduce() ? 0 : props.cascade;
    filled.forEach((i, k) => drive(i, 0, k * step));
    moveActive(
      0,
      slots.value.map((_, j) => j),
    );
    clearTimeout(drainTimer);
    drainTimer = setTimeout(
      () => {
        draining = false;
        commit(Array.from({ length: props.length }, () => ''));
      },
      reduce() ? 300 : (filled.length - 1) * step + props.settle * 1000,
    );
  }

  watch(
    () => props.status,
    (status) => {
      onStatus(status);
      prevStatus = status;
    },
  );

  // Fresh digit elements need their styles before the browser paints them.
  watch([shown, slots, () => props.length, pitch, sink], paintAll, {
    flush: 'post',
  });

  onMounted(() => {
    paintAll();
    if (props.autoFocus) inputRef.value?.focus();
  });

  onBeforeUnmount(() => {
    clearTimeout(drainTimer);
    unsubs.forEach((u) => u());
    mvs.forEach((mv) => mv.stop());
    drops.forEach((d) => d.stop());
    openMv.stop();
    checkMv.stop();
  });

  defineExpose({ focus: () => inputRef.value?.focus() });
</script>

<template>
  <div :class="['code-slots', props.class]" :style="rootStyle">
    <div
      ref="rowRef"
      class="code-slots__row"
      :data-status="status"
      :data-focused="focused ? '' : undefined"
      :data-disabled="disabled ? '' : undefined"
      @mousedown="onRowMouseDown"
    >
      <input
        ref="inputRef"
        class="code-slots__input"
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        pattern="[0-9]*"
        value=""
        :maxlength="length"
        :aria-label="ariaLabel"
        :aria-invalid="status === 'error'"
        :aria-describedby="`${uid}-count`"
        :disabled="disabled"
        :readonly="status === 'success'"
        @keydown="onKeyDown"
        @paste="onPaste"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
      />
      <span
        v-for="(ch, i) in view"
        :key="i"
        class="code-slots__slot"
        :data-active="focused && i === active ? '' : undefined"
        :data-filled="ch ? '' : undefined"
        aria-hidden="true"
      >
        <span class="code-slots__fill" />
        <span v-if="shown[i]" class="code-slots__digit">{{ shown[i] }}</span>
      </span>
      <span ref="washEl" class="code-slots__wash" aria-hidden="true">
        <span ref="checkEl" class="code-slots__check">
          <Icon
            name="lucide:check"
            :style="{ width: checkSize, height: checkSize }"
          />
        </span>
      </span>
      <span
        ref="caretEl"
        class="code-slots__caret"
        aria-hidden="true"
        :data-show="showCaret ? '' : undefined"
      >
        <span :key="active" class="code-slots__caret-line" />
      </span>
    </div>
    <span :id="`${uid}-count`" class="code-slots__sr" aria-live="polite">
      {{
        status === 'success'
          ? 'Code accepted'
          : `${filledCount} of ${length} digits entered`
      }}
    </span>
  </div>
</template>

<style scoped>
  .code-slots {
    --cs-accent: #f5f5f5;
    --cs-ink: #f5f5f5;
    --cs-slot: #27272a;
    --cs-digit: #18181b;
    --cs-danger: #ff3b30;
    --cs-size: 44px;
    --cs-height: 52px;
    --cs-gap: 8px;
    --cs-radius: 12px;
    --cs-font: 22px;

    position: relative;
    display: inline-block;
  }

  .code-slots__row {
    position: relative;
    display: inline-flex;
    gap: var(--cs-gap);
    cursor: text;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 200ms ease;
  }

  .code-slots__row[data-disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .code-slots__input {
    position: absolute;
    inset: 0;
    z-index: 4;
    margin: 0;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: transparent;
    caret-color: transparent;
    font-size: 16px;
    opacity: 0;
    cursor: inherit;
    -webkit-appearance: none;
    appearance: none;
  }

  .code-slots__wash {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: grid;
    place-items: center;
    border-radius: var(--cs-radius);
    background: var(--cs-accent);
    color: var(--cs-digit);
    pointer-events: none;
    clip-path: inset(0 50% round var(--cs-radius));
  }

  .code-slots__check {
    display: grid;
    place-items: center;
    opacity: 0;
  }

  .code-slots__slot {
    position: relative;
    width: var(--cs-size);
    height: var(--cs-height);
    border-radius: var(--cs-radius);
    overflow: hidden;
    background: var(--cs-slot);
    transition: background-color 200ms ease;
    user-select: none;
    -webkit-user-select: none;
  }

  .code-slots__fill {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--cs-accent);
    transform: scale(0);
    transform-origin: center;
    transition: background-color 200ms ease;
  }

  .code-slots__slot[data-filled] .code-slots__fill {
    transform: scale(1);
  }

  @media (hover: hover) and (pointer: fine) {
    .code-slots__row[data-status='idle']:not([data-disabled]):hover
      .code-slots__slot:not([data-active]) {
      background: color-mix(in srgb, var(--cs-ink) 4%, var(--cs-slot));
    }
  }

  .code-slots__slot[data-active] {
    background: color-mix(in srgb, var(--cs-ink) 8%, var(--cs-slot));
  }

  .code-slots__row[data-status='error'] .code-slots__slot {
    background: color-mix(in srgb, var(--cs-danger) 20%, var(--cs-slot));
  }

  .code-slots__row[data-status='error'] .code-slots__fill {
    background: var(--cs-danger);
  }

  .code-slots__digit {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: grid;
    place-items: center;
    color: var(--cs-digit);
    font-family: inherit;
    font-size: var(--cs-font);
    font-weight: 600;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .code-slots__caret {
    position: absolute;
    z-index: 3;
    top: 25%;
    left: calc(var(--cs-size) / 2 - 0.75px);
    width: 1.5px;
    height: 50%;
    opacity: 0;
    pointer-events: none;
  }

  .code-slots__caret[data-show] {
    opacity: 1;
  }

  .code-slots__caret-line {
    display: block;
    width: 100%;
    height: 100%;
    background: var(--cs-ink);
    animation: code-slots-blink 1s linear infinite;
  }

  @keyframes code-slots-blink {
    0%,
    49.9% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0;
    }
  }

  .code-slots__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .code-slots__digit,
    .code-slots__check {
      transform: none !important;
      transition: opacity 150ms ease;
    }

    .code-slots__caret-line {
      animation: none;
    }

    .code-slots__wash {
      opacity: 0;
      transition: opacity 200ms ease;
    }

    .code-slots__row[data-status='success'] .code-slots__wash {
      opacity: 1;
    }
  }
</style>
